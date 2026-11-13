import type { NextResponse } from "next/server";
import {
  ApiError,
  apiError,
  assertSameOrigin,
  noStoreJson,
  parseWith,
  rateLimit,
  requireUser,
} from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { deleteStored, saveUpload } from "@/lib/storage";
import { reviewCreateSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

const MAX_PHOTOS = 3;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const savedPaths: string[] = [];

  try {
    assertSameOrigin(request);
    const user = await requireUser();
    rateLimit(`review:${user.id}`, 6, 10 * 60 * 1000);

    const { id } = await context.params;
    const product = await prisma.product.findFirst({
      where: { id, active: true },
      select: { id: true },
    });

    if (!product) {
      throw new ApiError(404, "Produk tidak ditemukan.");
    }

    const existing = await prisma.review.findUnique({
      where: { productId_userId: { productId: product.id, userId: user.id } },
      select: { id: true },
    });

    if (existing) {
      throw new ApiError(409, "Kamu sudah menulis ulasan untuk produk ini.");
    }

    const form = await request.formData();
    const body = parseWith(reviewCreateSchema, {
      rating: form.get("rating"),
      comment: form.get("comment"),
    });

    const files = form
      .getAll("photos")
      .filter((value): value is File => value instanceof File && value.size > 0);

    if (files.length > MAX_PHOTOS) {
      throw new ApiError(400, "Maksimal 3 foto untuk satu ulasan.");
    }

    for (const file of files) {
      if (!ALLOWED_TYPES.has(file.type)) {
        throw new ApiError(400, "Foto ulasan harus JPG, PNG, atau WEBP.");
      }
      if (file.size > MAX_PHOTO_BYTES) {
        throw new ApiError(400, "Ukuran tiap foto maksimal 5 MB.");
      }
    }

    const saved: { path: string; mime: string; name: string }[] = [];
    for (const file of files) {
      saved.push(await saveUpload(file, "reviews", MAX_PHOTO_BYTES));
    }
    savedPaths.push(...saved.map((photo) => photo.path));

    const review = await prisma.review.create({
      data: {
        productId: product.id,
        userId: user.id,
        rating: body.rating,
        comment: body.comment,
        photos: {
          create: saved.map((photo, index) => ({
            path: photo.path,
            mime: photo.mime,
            name: photo.name,
            sortOrder: index,
          })),
        },
      },
      include: { photos: true },
    });

    return noStoreJson(
      {
        review: {
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt.toISOString(),
          photos: review.photos.map((photo) => ({
            id: photo.id,
            name: photo.name,
          })),
        },
      },
      201,
    );
  } catch (error) {
    await Promise.all(savedPaths.map((saved) => deleteStored(saved)));
    return apiError(error);
  }
}
