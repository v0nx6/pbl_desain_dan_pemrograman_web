import "server-only";

import { Prisma } from "@prisma/client";
import type { OrderStatus, PaymentStatus } from "@prisma/client";
import type { z } from "zod";
import { ApiError } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import {
  calculateShipping,
  generateOrderNumber,
  generatePaymentReference,
  orderWithItems,
  toOrderDetail,
} from "@/lib/orders";
import type { orderCreateSchema } from "@/lib/validation";

type OrderInput = z.infer<typeof orderCreateSchema>;

export type OrderAction =
  | "verify"
  | "reject"
  | "process"
  | "ship"
  | "complete"
  | "cancel";

type Pickup = {
  from: OrderStatus[];
  to: OrderStatus;
  paymentStatus?: PaymentStatus;
};

const actions: Record<OrderAction, Pickup> = {
  verify: {
    from: ["AWAITING_VERIFICATION"],
    to: "PAID",
    paymentStatus: "VERIFIED",
  },
  reject: {
    from: ["AWAITING_VERIFICATION"],
    to: "PENDING_PAYMENT",
    paymentStatus: "REJECTED",
  },
  process: { from: ["PAID"], to: "PROCESSING" },
  ship: { from: ["PROCESSING"], to: "SHIPPED" },
  complete: { from: ["SHIPPED"], to: "COMPLETED" },
  cancel: {
    from: [
      "PENDING_PAYMENT",
      "AWAITING_VERIFICATION",
      "PAID",
      "PROCESSING",
    ],
    to: "CANCELLED",
  },
};

function isOrderNumberConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    String(error.meta?.target ?? "").includes("number")
  );
}

export async function createOrder(userId: string, input: OrderInput) {
  const merged = new Map<string, { slug: string; size: string; qty: number }>();

  for (const item of input.items) {
    const key = `${item.slug}::${item.size}`;
    const current = merged.get(key);
    merged.set(key, {
      slug: item.slug,
      size: item.size,
      qty: Math.min(99, (current?.qty ?? 0) + item.qty),
    });
  }

  const items = [...merged.values()];
  const slugs = [...new Set(items.map((item) => item.slug))];

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const created = await prisma.$transaction(async (tx) => {
        const products = await tx.product.findMany({
          where: { slug: { in: slugs }, active: true },
          include: { variants: true },
        });

        const bySlug = new Map(products.map((product) => [product.slug, product]));
        const orderItems: {
          productId: string;
          name: string;
          size: string;
          price: number;
          qty: number;
          lineTotal: number;
        }[] = [];
        let subtotal = 0;

        for (const item of items) {
          const product = bySlug.get(item.slug);
          if (!product) {
            throw new ApiError(
              400,
              "Ada produk di keranjang yang sudah tidak dijual.",
            );
          }

          const variant = product.variants.find(
            (entry) => entry.size === item.size,
          );
          if (!variant) {
            throw new ApiError(
              400,
              `Ukuran ${item.size} tidak tersedia untuk ${product.name}.`,
            );
          }

          const reserved = await tx.productVariant.updateMany({
            where: { id: variant.id, stock: { gte: item.qty } },
            data: { stock: { decrement: item.qty } },
          });

          if (reserved.count !== 1) {
            throw new ApiError(
              409,
              `Stok ${product.name} ukuran ${item.size} tidak cukup.`,
            );
          }

          const lineTotal = product.price * item.qty;
          subtotal += lineTotal;
          orderItems.push({
            productId: product.id,
            name: product.name,
            size: item.size,
            price: product.price,
            qty: item.qty,
            lineTotal,
          });
        }

        const shippingCost =
          input.fulfillmentType === "PICKUP"
            ? 0
            : calculateShipping(subtotal);
        const total = subtotal + shippingCost;
        const number = generateOrderNumber();
        const bankName =
          input.paymentMethod === "BANK_TRANSFER"
            ? (input.bankName ?? null)
            : null;
        const paymentReference = generatePaymentReference(
          input.paymentMethod,
          number,
          total,
          bankName,
        );

        return tx.order.create({
          data: {
            number,
            userId,
            status:
              input.paymentMethod === "COD"
                ? "PROCESSING"
                : "PENDING_PAYMENT",
            paymentMethod: input.paymentMethod,
            bankName,
            fulfillmentType: input.fulfillmentType,
            subtotal,
            shippingCost,
            total,
            recipientName: input.recipientName,
            phone: input.phone,
            addressLine: input.addressLine?.trim() || "",
            city: input.city?.trim() || "",
            postalCode: input.postalCode?.trim() || "",
            note: input.note?.trim() || null,
            paymentReference,
            items: { create: orderItems },
          },
          include: orderWithItems,
        });
      });

      return toOrderDetail(created);
    } catch (error) {
      if (isOrderNumberConflict(error) && attempt < 4) continue;
      throw error;
    }
  }

  throw new ApiError(500, "Gagal membuat nomor pesanan. Coba lagi.");
}

async function restoreStock(
  tx: Prisma.TransactionClient,
  orderId: string,
): Promise<void> {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order || order.stockRestored) return;

  for (const item of order.items) {
    if (!item.productId) continue;
    await tx.productVariant.updateMany({
      where: { productId: item.productId, size: item.size },
      data: { stock: { increment: item.qty } },
    });
  }
}

export async function transitionOrder(
  orderId: string,
  action: OrderAction,
  note: string | undefined,
) {
  const pickup = actions[action];

  if (action === "cancel") {
    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({
        where: { id: orderId },
        select: { id: true, status: true },
      });
      if (!current) throw new ApiError(404, "Pesanan tidak ditemukan.");
      if (!pickup.from.includes(current.status)) {
        throw new ApiError(
          409,
          "Pesanan ini tidak bisa dibatalkan pada status sekarang.",
        );
      }

      await restoreStock(tx, orderId);
      const result = await tx.order.updateMany({
        where: { id: orderId, status: current.status },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          stockRestored: true,
          adminNote: note?.trim() || "Pesanan dibatalkan oleh admin.",
        },
      });

      if (result.count !== 1) {
        throw new ApiError(409, "Status pesanan baru saja berubah. Muat ulang.");
      }

      return tx.order.findUniqueOrThrow({
        where: { id: orderId },
        include: { ...orderWithItems, user: { select: { name: true, email: true } } },
      });
    });

    return toOrderDetail(updated);
  }

  const data: Prisma.OrderUpdateManyMutationInput = {
    status: pickup.to,
    adminNote: note?.trim() || null,
  };

  if (action === "verify") {
    data.paymentStatus = "VERIFIED";
    data.paidAt = new Date();
  }
  if (action === "reject") {
    data.paymentStatus = "REJECTED";
    data.adminNote =
      note?.trim() ||
      "Bukti pembayaran belum cocok. Silakan unggah ulang bukti transfer.";
  }
  if (action === "ship") data.shippedAt = new Date();
  if (action === "complete") {
    data.completedAt = new Date();

    const current = await prisma.order.findUnique({
      where: { id: orderId },
      select: { paymentMethod: true, paidAt: true },
    });

    if (current?.paymentMethod === "COD") {
      data.paymentStatus = "VERIFIED";
      data.paidAt = current.paidAt ?? new Date();
    }
  }

  const result = await prisma.order.updateMany({
    where: { id: orderId, status: { in: pickup.from } },
    data,
  });

  if (result.count !== 1) {
    throw new ApiError(
      409,
      "Status pesanan tidak cocok. Muat ulang lalu coba lagi.",
    );
  }

  const updated = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { ...orderWithItems, user: { select: { name: true, email: true } } },
  });

  return toOrderDetail(updated);
}

export async function cancelOwnOrder(orderId: string, userId: string) {
  const updated = await prisma.$transaction(async (tx) => {
    const current = await tx.order.findFirst({
      where: { id: orderId, userId },
      select: { id: true, status: true },
    });

    if (!current) throw new ApiError(404, "Pesanan tidak ditemukan.");
    if (
      current.status !== "PENDING_PAYMENT" &&
      current.status !== "AWAITING_VERIFICATION"
    ) {
      throw new ApiError(
        409,
        "Pesanan yang sudah dibayar tidak bisa dibatalkan sendiri. Hubungi admin.",
      );
    }

    await restoreStock(tx, orderId);
    const result = await tx.order.updateMany({
      where: { id: orderId, status: current.status },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        stockRestored: true,
      },
    });

    if (result.count !== 1) {
      throw new ApiError(409, "Status pesanan baru saja berubah. Muat ulang.");
    }

    return tx.order.findUniqueOrThrow({
      where: { id: orderId },
      include: orderWithItems,
    });
  });

  return toOrderDetail(updated);
}
