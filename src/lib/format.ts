import type {
  BankName,
  FulfillmentType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/lib/types";

const idr = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const date = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeZone: "Asia/Jakarta",
});

const dateTime = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

export function formatIDR(value: number | null): string {
  if (value === null) return "Rp -";
  return idr.format(value);
}

export function formatDate(value: string | Date | null): string {
  if (!value) return "-";
  return date.format(new Date(value));
}

export function formatDateTime(value: string | Date | null): string {
  if (!value) return "-";
  return dateTime.format(new Date(value));
}

export function lineKey(slug: string, size: string): string {
  return `${slug}::${size}`;
}

export const orderStatusLabels: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Menunggu pembayaran",
  AWAITING_VERIFICATION: "Menunggu verifikasi",
  PAID: "Lunas",
  PROCESSING: "Diproses",
  SHIPPED: "Dikirim",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  QRIS: "QRIS",
  BANK_TRANSFER: "Transfer bank",
  COD: "Bayar di tempat",
};

export const bankLabels: Record<BankName, string> = {
  BCA: "BCA",
  MANDIRI: "Mandiri",
  BNI: "BNI",
  BRI: "BRI",
};

export const fulfillmentLabels: Record<FulfillmentType, string> = {
  PICKUP: "Ambil di toko",
  COURIER: "Kirim lewat kurir",
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  UNPAID: "Belum dibayar",
  PROOF_UPLOADED: "Bukti diunggah",
  VERIFIED: "Terverifikasi",
  REJECTED: "Bukti ditolak",
};

export const orderStatusStyles: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "text-amber-700",
  AWAITING_VERIFICATION: "text-amber-700",
  PAID: "text-sage-700",
  PROCESSING: "text-sage-700",
  SHIPPED: "text-sage-700",
  COMPLETED: "text-sage-700",
  CANCELLED: "text-espresso-500",
};
