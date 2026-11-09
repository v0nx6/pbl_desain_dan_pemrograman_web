import type { NextResponse } from "next/server";
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
import {
  firebaseAdminAuth,
  firebaseAdminConfigured,
} from "@/lib/firebase/admin";
import { firebaseLoginSchema } from "@/lib/validation";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    assertSameOrigin(request);
    rateLimit(`firebase-login:${clientKey(request)}`, 10, 15 * 60 * 1000);

    if (!firebaseAdminConfigured) {
      throw new ApiError(
        503,
        "Masuk dengan Google belum diatur. Hubungi admin toko.",
      );
    }

    const body = parseWith(firebaseLoginSchema, await readJson(request));

    let decoded;
    try {
      decoded = await firebaseAdminAuth().verifyIdToken(body.idToken, true);
    } catch {
      throw new ApiError(
        401,
        "Sesi Google sudah habis. Coba masuk lagi.",
      );
    }

    if (!decoded.email || !decoded.email_verified) {
      throw new ApiError(401, "Email Google belum terverifikasi.");
    }

    if (decoded.firebase.sign_in_provider !== "google.com") {
      throw new ApiError(401, "Metode masuk ini tidak didukung.");
    }

    const email = decoded.email.toLowerCase();
    const name = (decoded.name?.trim() || "Pelanggan").slice(0, 80);

    let user = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
    });

    if (!user) {
      const byEmail = await prisma.user.findUnique({ where: { email } });

      if (byEmail) {
        if (byEmail.firebaseUid) {
          throw new ApiError(
            409,
            "Email ini sudah terhubung ke akun Google lain.",
          );
        }

        user = await prisma.user.update({
          where: { id: byEmail.id },
          data: { firebaseUid: decoded.uid },
        });
      } else {
        user = await prisma.user.create({
          data: {
            email,
            name,
            firebaseUid: decoded.uid,
            passwordHash: null,
          },
        });
      }
    }

    await createSession(user.id);

    return noStoreJson({
      ok: true,
      needsProfile: !user.phone || !user.addressLine,
      role: user.role,
    });
  } catch (error) {
    return apiError(error);
  }
}
