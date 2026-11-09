import type { NextResponse } from "next/server";
import {
  ApiError,
  apiError,
  assertSameOrigin,
  noStoreJson,
  parseWith,
  readJson,
  requireUser,
} from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { passwordChangeSchema } from "@/lib/validation";

export async function PATCH(request: Request): Promise<NextResponse> {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const body = parseWith(passwordChangeSchema, await readJson(request));

    const row = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });

    if (!row) {
      throw new ApiError(404, "Akun tidak ditemukan.");
    }

    if (row.passwordHash) {
      const matches = await verifyPassword(
        body.currentPassword,
        row.passwordHash,
      );
      if (!matches) {
        throw new ApiError(401, "Kata sandi saat ini tidak cocok.");
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(body.newPassword) },
    });

    return noStoreJson({ ok: true, created: !row.passwordHash });
  } catch (error) {
    return apiError(error);
  }
}
