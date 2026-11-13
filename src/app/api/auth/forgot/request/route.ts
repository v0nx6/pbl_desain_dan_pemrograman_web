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
import { requestPasswordReset } from "@/lib/password-reset";
import { forgotPasswordRequestSchema } from "@/lib/validation";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    assertSameOrigin(request);
    rateLimit(`forgot-request:${clientKey(request)}`, 6, 15 * 60 * 1000);

    const body = parseWith(
      forgotPasswordRequestSchema,
      await readJson(request),
    );
    const email = body.email.trim().toLowerCase();
    rateLimit(`forgot-email:${email}`, 3, 15 * 60 * 1000);

    const result = await requestPasswordReset(email);

    return noStoreJson({
      ok: true,
      message:
        "Kalau email ini terdaftar, kode OTP sudah dikirim. Cek inbox dan folder spam.",
      ...(result.developmentCode && process.env.NODE_ENV === "development"
        ? { developmentCode: result.developmentCode }
        : {}),
    });
  } catch (error) {
    return apiError(error);
  }
}
