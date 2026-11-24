import "server-only";

import { Prisma } from "@prisma/client";
import type { OrderStatus, PaymentStatus } from "@prisma/client";
import type { z } from "zod";
import { ApiError } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { sendOrderEmail } from "@/lib/mail";
import {
  createSnapTransaction,
  fetchMidtransStatus,
  midtransOutcome,
  type MidtransStatus,
} from "@/lib/midtrans";
import {
  calculateShipping,
  generateOrderNumber,
  generatePaymentReference,
  orderWithItems,
  toOrderDetail,
} from "@/lib/orders";
import {
  normalizeVoucherCode,
  voucherDiscount,
  voucherProblem,
} from "@/lib/vouchers";
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

        let discount = 0;
        let voucherCode: string | null = null;

        if (input.voucherCode?.trim()) {
          const code = normalizeVoucherCode(input.voucherCode);
          const voucher = await tx.voucher.findUnique({ where: { code } });

          if (!voucher) {
            throw new ApiError(400, "Kode voucher tidak ditemukan.");
          }

          const problem = voucherProblem(voucher, subtotal);
          if (problem) throw new ApiError(400, problem);

          const claimed = await tx.voucher.updateMany({
            where: {
              id: voucher.id,
              active: true,
              ...(voucher.maxUses !== null
                ? { usedCount: { lt: voucher.maxUses } }
                : {}),
            },
            data: { usedCount: { increment: 1 } },
          });

          if (claimed.count !== 1) {
            throw new ApiError(
              409,
              "Kode voucher baru saja habis dipakai. Coba lagi tanpa voucher.",
            );
          }

          discount = voucherDiscount(voucher, subtotal);
          voucherCode = voucher.code;
        }

        const shippingCost =
          input.fulfillmentType === "PICKUP"
            ? 0
            : calculateShipping(subtotal);
        const total = subtotal + shippingCost - discount;
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
            discount,
            voucherCode,
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
          include: {
            ...orderWithItems,
            user: { select: { name: true, email: true } },
          },
        });
      });

      const detail = toOrderDetail(created);
      await sendOrderEmail(detail, "created");
      return detail;
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

    const detail = toOrderDetail(updated);
    await sendOrderEmail(detail, "cancel");
    return detail;
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

  const detail = toOrderDetail(updated);
  await sendOrderEmail(detail, action);
  return detail;
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
      include: {
        ...orderWithItems,
        user: { select: { name: true, email: true } },
      },
    });
  });

  const detail = toOrderDetail(updated);
  await sendOrderEmail(detail, "cancel");
  return detail;
}

const midtransInclude = {
  ...orderWithItems,
  user: { select: { name: true, email: true } },
};

export async function createSnapPayment(orderId: string) {
  const row = await prisma.order.findUnique({
    where: { id: orderId },
    include: midtransInclude,
  });

  if (!row) throw new ApiError(404, "Pesanan tidak ditemukan.");
  if (row.paymentMethod !== "MIDTRANS") {
    throw new ApiError(400, "Pesanan ini tidak memakai pembayaran online.");
  }
  if (row.status !== "PENDING_PAYMENT") {
    throw new ApiError(409, "Pesanan ini sudah tidak menunggu pembayaran.");
  }

  if (row.snapToken && row.snapRedirectUrl) {
    return { token: row.snapToken, redirectUrl: row.snapRedirectUrl };
  }

  try {
    const snap = await createSnapTransaction(toOrderDetail(row));
    await prisma.order.update({
      where: { id: row.id },
      data: {
        midtransOrderId: row.number,
        snapToken: snap.token,
        snapRedirectUrl: snap.redirectUrl,
      },
    });
    return snap;
  } catch (error) {
    console.error("Gagal membuat transaksi Midtrans:", error);
    throw new ApiError(
      502,
      "Pembayaran online belum bisa dibuka. Coba lagi atau hubungi admin.",
    );
  }
}

async function orderByMidtransId(orderId: string) {
  return prisma.order.findFirst({
    where: {
      OR: [{ midtransOrderId: orderId }, { number: orderId }],
    },
    include: midtransInclude,
  });
}

export async function applyMidtransStatus(
  payload: MidtransStatus,
): Promise<void> {
  if (!payload.order_id) return;

  const order = await orderByMidtransId(payload.order_id);
  if (!order) {
    console.warn(`Notifikasi Midtrans untuk pesanan tak dikenal: ${payload.order_id}`);
    return;
  }

  const channel = payload.payment_type ?? order.paymentChannel;
  const outcome = midtransOutcome(payload);

  if (outcome === "paid") {
    const result = await prisma.order.updateMany({
      where: {
        id: order.id,
        status: { in: ["PENDING_PAYMENT", "AWAITING_VERIFICATION"] },
      },
      data: {
        status: "PAID",
        paymentStatus: "VERIFIED",
        paidAt: new Date(),
        paymentChannel: channel,
      },
    });

    if (result.count === 1) {
      const updated = await prisma.order.findUniqueOrThrow({
        where: { id: order.id },
        include: midtransInclude,
      });
      await sendOrderEmail(toOrderDetail(updated), "verify");
    }
    return;
  }

  if (outcome === "failed") {
    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({
        where: { id: order.id },
        select: { status: true },
      });

      if (!current || current.status !== "PENDING_PAYMENT") return null;

      await restoreStock(tx, order.id);
      const result = await tx.order.updateMany({
        where: { id: order.id, status: "PENDING_PAYMENT" },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          stockRestored: true,
          paymentChannel: channel,
          adminNote: "Pembayaran Midtrans kedaluwarsa atau dibatalkan.",
        },
      });

      if (result.count !== 1) return null;

      return tx.order.findUniqueOrThrow({
        where: { id: order.id },
        include: midtransInclude,
      });
    });

    if (updated) {
      await sendOrderEmail(toOrderDetail(updated), "cancel");
    }
    return;
  }

  if (channel && channel !== order.paymentChannel) {
    await prisma.order.updateMany({
      where: { id: order.id },
      data: { paymentChannel: channel },
    });
  }
}

export async function syncMidtransPayment(orderId: string) {
  const row = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      number: true,
      paymentMethod: true,
      midtransOrderId: true,
    },
  });

  if (!row) throw new ApiError(404, "Pesanan tidak ditemukan.");
  if (row.paymentMethod !== "MIDTRANS") {
    throw new ApiError(400, "Pesanan ini tidak memakai pembayaran online.");
  }

  let payload: MidtransStatus;
  try {
    payload = await fetchMidtransStatus(row.midtransOrderId ?? row.number);
  } catch (error) {
    console.error("Gagal membaca status Midtrans:", error);
    throw new ApiError(
      502,
      "Status pembayaran belum bisa dicek. Coba lagi sebentar lagi.",
    );
  }

  await applyMidtransStatus(payload);

  const updated = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: midtransInclude,
  });

  return toOrderDetail(updated);
}

export async function saveOrderShipping(
  orderId: string,
  input: { courier?: string; trackingNumber?: string },
) {
  const row = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true },
  });

  if (!row) throw new ApiError(404, "Pesanan tidak ditemukan.");

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      courier: input.courier?.trim() || null,
      trackingNumber: input.trackingNumber?.trim() || null,
    },
    include: midtransInclude,
  });

  return toOrderDetail(updated);
}
