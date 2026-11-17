import type { Prisma } from "@prisma/client";
import type { z } from "zod";
import { prismaCollection } from "@/lib/catalog";
import type { productSchema } from "@/lib/validation";

type ProductInput = z.infer<typeof productSchema>;

type VariantCreate = {
  size: string;
  stock: number;
  chestCm: number | null;
  lengthCm: number | null;
  waistCm: number | null;
  sortOrder: number;
};

type ImageCreate = {
  path: string;
  alt: string | null;
  sortOrder: number;
};

export function toProductData(
  body: ProductInput,
): Omit<Prisma.ProductCreateInput, "variants" | "images"> & {
  variants: { create: VariantCreate[] };
  images: { create: ImageCreate[] };
} {
  return {
    slug: body.slug,
    name: body.name,
    description: body.description,
    material: body.material,
    price: body.price,
    collections: body.collections.map(prismaCollection),
    productType: body.productType === "couple" ? "COUPLE" : "SINGLE",
    bestSeller: body.bestSeller,
    isNew: body.isNew,
    tone: body.tone,
    image: body.image?.trim() || null,
    imageAlt: body.imageAlt?.trim() || null,
    tryOnCategory: body.tryOnCategory,
    tryOnPhotoType: body.tryOnPhotoType ?? null,
    active: body.active,
    variants: {
      create: body.variants.map((variant, index) => ({
        size: variant.size,
        stock: variant.stock,
        chestCm: variant.chestCm ?? null,
        lengthCm: variant.lengthCm ?? null,
        waistCm: variant.waistCm ?? null,
        sortOrder: index,
      })),
    },
    images: {
      create: body.images.map((image, index) => ({
        path: image.path.trim(),
        alt: image.alt?.trim() || null,
        sortOrder: index,
      })),
    },
  };
}
