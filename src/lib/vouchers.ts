import "server-only";

import type { Voucher } from "@prisma/client";
import { ApiError } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { formatIDR } from "@/lib/format";
import type { VoucherPreview, VoucherView } from "@/lib/types";

export function normalizeVoucherCode(code: string): string {
  return code.trim().toUpperCase();
}

export function voucherDiscount(voucher: Voucher, subtotal: number): number {
  if (subtotal <= 0) return 0;
  if (voucher.type === "PERCENT") {
    return Math.min(subtotal, Math.floor((subtotal * voucher.value) / 100));
  }
  return Math.min(subtotal, voucher.value);
}

export function voucherProblem(
  voucher: Voucher,
  subtotal: number,
  now = new Date(),
): string | null {
  if (!voucher.active) return "Kode voucher sedang tidak aktif.";
  if (voucher.expiresAt && voucher.expiresAt.getTime() <= now.getTime()) {
    return "Kode voucher sudah kedaluwarsa.";
  }
  if (voucher.maxUses !== null && voucher.usedCount >= voucher.maxUses) {
    return "Kode voucher sudah habis dipakai.";
  }
  if (subtotal < voucher.minSpend) {
    return `Voucher berlaku mulai ${formatIDR(voucher.minSpend)}.`;
  }
  return null;
}

export function describeVoucher(voucher: Voucher): string {
  const base =
    voucher.type === "PERCENT"
      ? `Potongan ${voucher.value}%`
      : `Potongan ${formatIDR(voucher.value)}`;
  return voucher.minSpend > 0
    ? `${base}, minimal belanja ${formatIDR(voucher.minSpend)}.`
    : base;
}

export async function previewVoucher(
  code: string,
  subtotal: number,
): Promise<VoucherPreview> {
  const voucher = await prisma.voucher.findUnique({
    where: { code: normalizeVoucherCode(code) },
  });

  if (!voucher) {
    throw new ApiError(404, "Kode voucher tidak ditemukan.");
  }

  const problem = voucherProblem(voucher, subtotal);
  if (problem) throw new ApiError(400, problem);

  return {
    code: voucher.code,
    discount: voucherDiscount(voucher, subtotal),
    description: describeVoucher(voucher),
  };
}

export function toVoucherView(row: Voucher): VoucherView {
  return {
    id: row.id,
    code: row.code,
    type: row.type,
    value: row.value,
    minSpend: row.minSpend,
    maxUses: row.maxUses,
    usedCount: row.usedCount,
    active: row.active,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listVouchers(): Promise<VoucherView[]> {
  const rows = await prisma.voucher.findMany({
    orderBy: [{ active: "desc" }, { createdAt: "desc" }],
    take: 200,
  });

  return rows.map(toVoucherView);
}
