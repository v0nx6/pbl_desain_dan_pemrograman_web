import type { NextResponse } from "next/server";
import {
  ApiError,
  apiError,
  assertSameOrigin,
  noStoreJson,
  parseWith,
  readJson,
  requireAdmin,
} from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { toVoucherView } from "@/lib/vouchers";
import { voucherUpdateSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(
  request: Request,
  { params }: Params,
): Promise<NextResponse> {
  try {
    await requireAdmin();
    assertSameOrigin(request);
    const { id } = await params;
    const body = parseWith(voucherUpdateSchema, await readJson(request));

    const existing = await prisma.voucher.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new ApiError(404, "Voucher tidak ditemukan.");

    const voucher = await prisma.voucher.update({
      where: { id },
      data: { active: body.active },
    });

    return noStoreJson({ voucher: toVoucherView(voucher) });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: Params,
): Promise<NextResponse> {
  try {
    await requireAdmin();
    assertSameOrigin(request);
    const { id } = await params;

    const existing = await prisma.voucher.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new ApiError(404, "Voucher tidak ditemukan.");

    await prisma.voucher.delete({ where: { id } });
    return noStoreJson({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
