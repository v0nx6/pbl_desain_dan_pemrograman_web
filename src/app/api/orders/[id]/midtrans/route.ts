import type { NextResponse } from "next/server";
import {
  ApiError,
  apiError,
  assertSameOrigin,
  noStoreJson,
  requireUser,
} from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { createSnapPayment } from "@/lib/order-service";

type Params = { params: Promise<{ id: string }> };

export async function POST(
  request: Request,
  { params }: Params,
): Promise<NextResponse> {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const { id } = await params;

    const order = await prisma.order.findFirst({
      where: user.role === "ADMIN" ? { id } : { id, userId: user.id },
      select: { id: true },
    });

    if (!order) throw new ApiError(404, "Pesanan tidak ditemukan.");

    const payment = await createSnapPayment(order.id);
    return noStoreJson(payment);
  } catch (error) {
    return apiError(error);
  }
}
