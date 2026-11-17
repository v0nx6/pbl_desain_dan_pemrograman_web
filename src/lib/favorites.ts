import "server-only";

import { mapProduct, productWithVariants } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import type { Product } from "@/lib/types";

export async function getFavoriteProductIds(
  userId?: string,
): Promise<string[]> {
  if (!userId) return [];

  const rows = await prisma.favorite.findMany({
    where: { userId },
    select: { productId: true },
  });

  return rows.map((row) => row.productId);
}

export async function getFavoriteProducts(userId: string): Promise<Product[]> {
  const rows = await prisma.favorite.findMany({
    where: { userId, product: { active: true } },
    include: { product: { include: productWithVariants } },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((row) => mapProduct(row.product));
}

export async function isProductFavorite(
  userId: string,
  productId: string,
): Promise<boolean> {
  const row = await prisma.favorite.findUnique({
    where: { userId_productId: { userId, productId } },
    select: { id: true },
  });

  return Boolean(row);
}
