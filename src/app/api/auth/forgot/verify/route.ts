import type { NextResponse } from "next/server";
import {
  apiError,
  assertSameOrigin,
  clientKey,
  noStoreJson,
  parseWith,
  rateLimit,
  readJson,
} from "@/lib/api-helpers";
import { verifyPasswordOtp } from "@/lib/password-reset";
import { forgotPasswordVerifySchema } from "@/lib/validation";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    assertSameOrigin(request);
    rateLimit(`forgot-verify:${clientKey(request)}`, 12, 15 * 60 * 1000);

    const body = parseWith(
      forgotPasswordVerifySchema,
      await readJson(request),
    );

    await verifyPasswordOtp(body.email, body.code);

    return noStoreJson({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
