import { NextResponse } from "next/server";
import {
  ApiError,
  apiError,
  assertSameOrigin,
  clientKey,
  noStoreJson,
  parseWith,
  rateLimit,
  readJson,
} from "@/lib/api-helpers";
import { createSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    assertSameOrigin(request);
    rateLimit(`login:${clientKey(request)}`, 10, 15 * 60 * 1000);

    const body = parseWith(loginSchema, await readJson(request));
    const email = body.email.trim().toLowerCase();
    rateLimit(`login-email:${email}`, 10, 15 * 60 * 1000);

    const user = await prisma.user.findUnique({ where: { email } });
    if (
      !user?.passwordHash ||
      !(await verifyPassword(body.password, user.passwordHash))
    ) {
      throw new ApiError(401, "Email atau kata sandi tidak cocok.");
    }

    await createSession(user.id);
    return noStoreJson({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
