import { Prisma } from "@prisma/client";
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
import { listVouchers, toVoucherView } from "@/lib/vouchers";
import { voucherInputSchema } from "@/lib/validation";

export async function GET(): Promise<NextResponse> {
  try {
    await requireAdmin();
    const vouchers = await listVouchers();
    return noStoreJson({ vouchers });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    await requireAdmin();
    assertSameOrigin(request);
    const body = parseWith(voucherInputSchema, await readJson(request));

    try {
      const voucher = await prisma.voucher.create({
        data: {
          code: body.code,
          type: body.type,
          value: body.value,
          minSpend: body.minSpend,
          maxUses: body.maxUses ?? null,
          expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
          active: body.active,
        },
      });

      return noStoreJson({ voucher: toVoucherView(voucher) }, 201);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ApiError(409, "Kode voucher itu sudah dipakai.");
      }
      throw error;
    }
  } catch (error) {
    return apiError(error);
  }
}
