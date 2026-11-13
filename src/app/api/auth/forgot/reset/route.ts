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
import { resetPasswordWithCookie } from "@/lib/password-reset";
import { passwordResetSchema } from "@/lib/validation";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    assertSameOrigin(request);
    rateLimit(`forgot-reset:${clientKey(request)}`, 10, 15 * 60 * 1000);

    const body = parseWith(passwordResetSchema, await readJson(request));
    await resetPasswordWithCookie(body.password);

    return noStoreJson({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
