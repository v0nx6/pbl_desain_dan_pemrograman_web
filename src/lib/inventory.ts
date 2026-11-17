import "server-only";

import { prisma } from "@/lib/db";

export const LOW_STOCK_THRESHOLD = 3;

export type LowStockVariant = {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  size: string;
  stock: number;
};

export async function getLowStockVariants(
  limit = 12,
): Promise<LowStockVariant[]> {
  const rows = await prisma.productVariant.findMany({
    where: {
      stock: { lte: LOW_STOCK_THRESHOLD },
      product: { active: true },
    },
    select: {
      id: true,
      size: true,
      stock: true,
      product: {
        select: { id: true, name: true, slug: true },
      },
    },
    orderBy: [{ stock: "asc" }, { sortOrder: "asc" }],
    take: limit,
  });

  return rows.map((row) => ({
    id: row.id,
    productId: row.product.id,
    productName: row.product.name,
    productSlug: row.product.slug,
    size: row.size,
    stock: row.stock,
  }));
}
