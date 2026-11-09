import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/types";

export const SESSION_COOKIE = "boutique_session";
const SESSION_DAYS = 30;

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    select: {
      id: true,
      expiresAt: true,
      user: {
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
          passwordHash: true,
        },
      },
    },
  });

  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  const { passwordHash, ...user } = session.user;
  return { ...user, hasPassword: Boolean(passwordHash) };
});

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      tokenHash: hashSessionToken(token),
      userId,
      expiresAt,
    },
  });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.session
      .deleteMany({ where: { tokenHash: hashSessionToken(token) } })
      .catch(() => {});
  }

  jar.delete(SESSION_COOKIE);
}

export async function requirePageUser(nextPath: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/masuk?next=${encodeURIComponent(nextPath)}`);
  }
  return user;
}

export async function requireAdminPage(nextPath: string): Promise<SessionUser> {
  const user = await requirePageUser(nextPath);
  if (user.role !== "ADMIN") {
    redirect("/akun");
  }
  return user;
}
