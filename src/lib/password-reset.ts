import "server-only";

import { createHash, randomBytes, randomInt } from "node:crypto";
import { cookies } from "next/headers";
import { ApiError } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { sendPasswordOtp } from "@/lib/mail";
import { hashPassword, verifyPassword } from "@/lib/password";

export const RESET_COOKIE = "boutique_reset";

const OTP_TTL_MS = 10 * 60 * 1000;
const RESET_TTL_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function setResetCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(RESET_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: RESET_TTL_MS / 1000,
  });
}

export async function requestPasswordReset(
  rawEmail: string,
): Promise<{ sent: boolean }> {
  const email = normalizeEmail(rawEmail);
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    return { sent: false };
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");

  await prisma.passwordReset.deleteMany({
    where: { email, usedAt: null },
  });

  const row = await prisma.passwordReset.create({
    data: {
      email,
      codeHash: await hashPassword(`${email}:${code}`),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });

  try {
    await sendPasswordOtp(email, code);
  } catch (error) {
    await prisma.passwordReset.delete({ where: { id: row.id } }).catch(() => {});
    throw error;
  }

  return { sent: true };
}

export async function verifyPasswordOtp(
  rawEmail: string,
  code: string,
): Promise<{ ok: true }> {
  const email = normalizeEmail(rawEmail);
  const row = await prisma.passwordReset.findFirst({
    where: {
      email,
      usedAt: null,
      verifiedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!row) {
    throw new ApiError(
      400,
      "Kode OTP sudah kedaluwarsa. Minta kode baru lalu coba lagi.",
    );
  }

  if (row.attempts >= MAX_ATTEMPTS) {
    await prisma.passwordReset.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    });
    throw new ApiError(429, "Terlalu banyak percobaan. Minta kode baru.");
  }

  const matches = await verifyPassword(`${email}:${code}`, row.codeHash);
  if (!matches) {
    await prisma.passwordReset.update({
      where: { id: row.id },
      data: { attempts: { increment: 1 } },
    });
    throw new ApiError(
      400,
      "Kode OTP tidak cocok. Periksa lagi lalu coba.",
    );
  }

  const token = randomBytes(32).toString("base64url");

  await prisma.passwordReset.update({
    where: { id: row.id },
    data: {
      verifiedAt: new Date(),
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + RESET_TTL_MS),
      attempts: 0,
    },
  });

  await setResetCookie(token);
  return { ok: true };
}

export async function resetPasswordWithCookie(
  password: string,
): Promise<{ ok: true }> {
  const jar = await cookies();
  const token = jar.get(RESET_COOKIE)?.value;

  if (!token) {
    throw new ApiError(401, "Sesi reset sudah habis. Mulai dari awal lagi.");
  }

  const row = await prisma.passwordReset.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  if (
    !row ||
    !row.verifiedAt ||
    row.usedAt ||
    row.expiresAt.getTime() <= Date.now()
  ) {
    jar.delete(RESET_COOKIE);
    throw new ApiError(401, "Sesi reset sudah habis. Mulai dari awal lagi.");
  }

  const user = await prisma.user.findUnique({
    where: { email: row.email },
    select: { id: true },
  });

  if (!user) {
    throw new ApiError(404, "Akun untuk email ini tidak ditemukan.");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(password) },
    }),
    prisma.session.deleteMany({ where: { userId: user.id } }),
    prisma.passwordReset.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    }),
  ]);

  jar.delete(RESET_COOKIE);
  return { ok: true };
}
