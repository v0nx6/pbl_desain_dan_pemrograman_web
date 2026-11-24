import type { NextResponse } from "next/server";
import {
  apiError,
  assertSameOrigin,
  noStoreJson,
  parseWith,
  readJson,
  requireAdmin,
} from "@/lib/api-helpers";
import { saveOrderShipping } from "@/lib/order-service";
import { orderShippingSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(
  request: Request,
  { params }: Params,
): Promise<NextResponse> {
  try {
    await requireAdmin();
    assertSameOrigin(request);
    const { id } = await params;
    const body = parseWith(orderShippingSchema, await readJson(request));
    const order = await saveOrderShipping(id, body);
    return noStoreJson({ order });
  } catch (error) {
    return apiError(error);
  }
}
