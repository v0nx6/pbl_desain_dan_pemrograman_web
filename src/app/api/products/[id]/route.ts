import type { NextResponse } from "next/server";
import {
  ApiError,
  apiError,
  assertSameOrigin,
  noStoreJson,
  parseWith,
  readJson,
  requireAdmin,
} from "@/lib/api-helpers";
import { mapProduct, productWithVariants } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { toProductData } from "@/lib/product-input";
import { deleteProductImage } from "@/lib/storage";
import { productSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(
  request: Request,
  { params }: Params,
): Promise<NextResponse> {
  try {
    await requireAdmin();
    assertSameOrigin(request);
    const { id } = await params;

    const body = parseWith(productSchema, await readJson(request));
    const current = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        image: true,
        images: { select: { path: true } },
      },
    });
    if (!current) throw new ApiError(404, "Produk tidak ditemukan.");

    const duplicate = await prisma.product.findFirst({
      where: { slug: body.slug, id: { not: id } },
      select: { id: true },
    });
    if (duplicate) {
      throw new ApiError(409, "Slug produk sudah dipakai. Pilih slug lain.");
    }

    const data = toProductData(body);
    const { variants, images, ...rest } = data;

    const updated = await prisma.$transaction(async (tx) => {
      await tx.productVariant.deleteMany({ where: { productId: id } });
      await tx.productImage.deleteMany({ where: { productId: id } });
      return tx.product.update({
        where: { id },
        data: {
          ...rest,
          variants: { create: variants.create },
          images: { create: images.create },
        },
        include: productWithVariants,
      });
    });

    const keep = new Set(body.images.map((image) => image.path.trim()));
    const removed = [
      ...current.images.map((image) => image.path),
      ...(current.image ? [current.image] : []),
    ].filter((path) => !keep.has(path) && path !== updated.image);

    for (const path of new Set(removed)) {
      const usedInGallery = await prisma.productImage.count({
        where: { path },
      });
      const usedAsPrimary = await prisma.product.count({
        where: { image: path },
      });
      if (usedInGallery === 0 && usedAsPrimary === 0) {
        await deleteProductImage(path);
      }
    }

    return noStoreJson({ product: mapProduct(updated) });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: Params,
): Promise<NextResponse> {
  try {
    await requireAdmin();
    assertSameOrigin(request);
    const { id } = await params;

    const updated = await prisma.product.updateMany({
      where: { id },
      data: { active: false },
    });

    if (updated.count !== 1) {
      throw new ApiError(404, "Produk tidak ditemukan.");
    }

    return noStoreJson({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
