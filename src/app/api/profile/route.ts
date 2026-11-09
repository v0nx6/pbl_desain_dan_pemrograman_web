import { randomUUID } from "node:crypto";
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
import { destroySession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generatedMapUrl } from "@/lib/maps";
import { hashPassword, verifyPassword } from "@/lib/password";
import {
  deleteAccountSchema,
  profileUpdateSchema,
} from "@/lib/validation";

function clean(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function PATCH(request: Request): Promise<NextResponse> {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const body = parseWith(profileUpdateSchema, await readJson(request));
    const email = body.email.trim().toLowerCase();

    const duplicate = await prisma.user.findFirst({
      where: { email, id: { not: user.id } },
      select: { id: true },
    });
    if (duplicate) {
      throw new ApiError(409, "Email itu sudah dipakai akun lain.");
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: body.name.trim(),
        email,
        phone: clean(body.phone),
        addressLine: clean(body.addressLine),
        city: clean(body.city),
        postalCode: clean(body.postalCode),
        mapUrl: generatedMapUrl(
          body.addressLine,
          body.city,
          body.postalCode,
        ),
        addressNote: clean(body.addressNote),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        addressLine: true,
        city: true,
        postalCode: true,
        mapUrl: true,
        addressNote: true,
      },
    });

    return noStoreJson({ user: updated });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request): Promise<NextResponse> {
  try {
    assertSameOrigin(request);
    const user = await requireUser();

    if (user.role === "ADMIN") {
      throw new ApiError(
        403,
        "Akun admin tidak bisa dihapus. Hubungi pemilik toko.",
      );
    }

    const body = parseWith(deleteAccountSchema, await readJson(request));
    const row = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });

    if (!row?.passwordHash) {
      throw new ApiError(
        409,
        "Buat kata sandi dulu sebelum menghapus akun ini.",
      );
    }

    if (!(await verifyPassword(body.password, row.passwordHash))) {
      throw new ApiError(401, "Kata sandi tidak cocok.");
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          name: "Akun dihapus",
          email: `deleted-${user.id}@deleted.invalid`,
          passwordHash: await hashPassword(randomUUID()),
          phone: null,
          addressLine: null,
          city: null,
          postalCode: null,
          mapUrl: null,
          addressNote: null,
        },
      }),
      prisma.session.deleteMany({ where: { userId: user.id } }),
    ]);

    await destroySession();
    return noStoreJson({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
