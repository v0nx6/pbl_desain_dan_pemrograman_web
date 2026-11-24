import type { NextResponse } from "next/server";
import {
  apiError,
  assertSameOrigin,
  clientKey,
  noStoreJson,
  parseWith,
  rateLimit,
  readJson,
  requireUser,
} from "@/lib/api-helpers";
import { previewVoucher } from "@/lib/vouchers";
import { voucherValidateSchema } from "@/lib/validation";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    assertSameOrigin(request);
    await requireUser();
    rateLimit(`voucher:${clientKey(request)}`, 30, 10 * 60 * 1000);

    const body = parseWith(voucherValidateSchema, await readJson(request));
    const voucher = await previewVoucher(body.code, body.subtotal);

    return noStoreJson({ voucher });
  } catch (error) {
    return apiError(error);
  }
}
