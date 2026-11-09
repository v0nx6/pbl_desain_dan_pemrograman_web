import "server-only";

import type {
  Order,
  OrderItem,
  PaymentStatus,
  Prisma,
  User,
} from "@prisma/client";
import { createHash, randomBytes } from "node:crypto";
import type {
  BankName,
  OrderDetail,
  OrderItemView,
  OrderSummary,
  PaymentMethod,
} from "@/lib/types";

export const SHIPPING_FLAT = 25000;
export const FREE_SHIPPING_MIN = 1000000;

export function calculateShipping(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING_FLAT;
}

export function generateOrderNumber(): string {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  const suffix = randomBytes(3).toString("hex").toUpperCase().slice(0, 4);
  return `ORD-${stamp}-${suffix}`;
}

export function generatePaymentReference(
  method: PaymentMethod,
  number: string,
  total: number,
  bankName?: BankName | null,
): string {
  if (method === "QRIS") {
    return `DEMO-QRIS|${number}|${total}|BUKAN-PEMBAYARAN-NYATA`;
  }

  if (method === "COD") {
    return `COD|${number}|BAYAR-DI-TEMPAT`;
  }

  const digest = createHash("sha256").update(number).digest("hex");
  const numeric = BigInt(`0x${digest.slice(0, 12)}`) % BigInt(1000000000000);
  return `${bankName ?? "BANK"}-8808${numeric.toString().padStart(12, "0")}`;
}

type OrderWithItems = Order & {
  items: OrderItem[];
  user?: Pick<User, "name" | "email">;
};

export function canUploadProof(order: {
  status: Order["status"];
  paymentStatus: PaymentStatus;
  paymentMethod: Order["paymentMethod"];
}): boolean {
  if (order.paymentMethod === "COD") return false;

  return (
    order.status === "PENDING_PAYMENT" ||
    order.status === "AWAITING_VERIFICATION" ||
    order.paymentStatus === "REJECTED"
  );
}

export function canCustomerCancel(order: {
  status: Order["status"];
}): boolean {
  return (
    order.status === "PENDING_PAYMENT" ||
    order.status === "AWAITING_VERIFICATION"
  );
}

function mapItems(items: OrderItem[]): OrderItemView[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    size: item.size,
    price: item.price,
    qty: item.qty,
    lineTotal: item.lineTotal,
  }));
}

export function toOrderSummary(order: OrderWithItems): OrderSummary {
  const itemCount = order.items.reduce((total, item) => total + item.qty, 0);
  const firstItemName =
    order.items.length > 0 ? order.items[0].name : "Tanpa item";

  return {
    id: order.id,
    number: order.number,
    status: order.status,
    paymentMethod: order.paymentMethod,
    bankName: order.bankName,
    fulfillmentType: order.fulfillmentType,
    paymentStatus: order.paymentStatus,
    total: order.total,
    createdAt: order.createdAt.toISOString(),
    itemCount,
    firstItemName:
      order.items.length > 1
        ? `${firstItemName} +${order.items.length - 1} lainnya`
        : firstItemName,
    customerName: order.user?.name,
    customerEmail: order.user?.email,
  };
}

export function toOrderDetail(order: OrderWithItems): OrderDetail {
  return {
    ...toOrderSummary(order),
    subtotal: order.subtotal,
    shippingCost: order.shippingCost,
    recipientName: order.recipientName,
    phone: order.phone,
    addressLine: order.addressLine,
    city: order.city,
    postalCode: order.postalCode,
    note: order.note,
    paymentReference: order.paymentReference,
    proofName: order.proofName,
    proofUploadedAt: order.proofUploadedAt?.toISOString() ?? null,
    adminNote: order.adminNote,
    paidAt: order.paidAt?.toISOString() ?? null,
    shippedAt: order.shippedAt?.toISOString() ?? null,
    completedAt: order.completedAt?.toISOString() ?? null,
    cancelledAt: order.cancelledAt?.toISOString() ?? null,
    items: mapItems(order.items),
    canUploadProof: canUploadProof(order),
    canCancel: canCustomerCancel(order),
  };
}

export const orderWithItems = {
  items: { orderBy: { createdAt: "asc" } },
} satisfies Prisma.OrderInclude;
