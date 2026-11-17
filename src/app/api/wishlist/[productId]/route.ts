import type { NextResponse } from "next/server";
import {
  ApiError,
  apiError,
  assertSameOrigin,
  noStoreJson,
  rateLimit,
  requireUser,
} from "@/lib/api-helpers";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ productId: string }> };

export async function POST(
  request: Request,
  { params }: Params,
): Promise<NextResponse> {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    rateLimit(`wishlist:${user.id}`, 60, 10 * 60 * 1000);

    const { productId } = await params;
    const product = await prisma.product.findFirst({
      where: { id: productId, active: true },
      select: { id: true },
    });

    if (!product) {
      throw new ApiError(404, "Produk tidak ditemukan.");
    }

    const existing = await prisma.favorite.findUnique({
      where: { userId_productId: { userId: user.id, productId } },
      select: { id: true },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return noStoreJson({ saved: false });
    }

    await prisma.favorite.create({
      data: { userId: user.id, productId },
    });

    return noStoreJson({ saved: true }, 201);
  } catch (error) {
    return apiError(error);
  }
}
