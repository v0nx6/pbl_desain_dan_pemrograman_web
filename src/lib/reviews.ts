import "server-only";

import { prisma } from "@/lib/db";
import type { ReviewSummary, ReviewView } from "@/lib/types";

function photoUrl(storedPath: string): string {
  return `/api/review-photo/${storedPath.split("/").pop()}`;
}

export async function getProductReviews(
  productId: string,
  viewerId?: string,
): Promise<{
  reviews: ReviewView[];
  summary: ReviewSummary;
  hasReviewed: boolean;
}> {
  const rows = await prisma.review.findMany({
    where: { productId },
    include: {
      user: { select: { name: true } },
      photos: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const reviews: ReviewView[] = rows.map((row) => ({
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    authorName: row.user.name,
    createdAt: row.createdAt.toISOString(),
    isMine: row.userId === viewerId,
    photos: row.photos.map((photo) => ({
      id: photo.id,
      url: photoUrl(photo.path),
      name: photo.name,
    })),
  }));

  const count = rows.length;
  const total = rows.reduce((sum, row) => sum + row.rating, 0);

  return {
    reviews,
    summary: {
      average: count > 0 ? total / count : 0,
      count,
    },
    hasReviewed: viewerId
      ? rows.some((row) => row.userId === viewerId)
      : false,
  };
}
