import { NextResponse } from "next/server";
import { ApiError, apiError, readJson } from "@/lib/api-helpers";
import { applyMidtransStatus } from "@/lib/order-service";
import { verifyMidtransSignature, type MidtransStatus } from "@/lib/midtrans";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const payload = (await readJson(request)) as MidtransStatus;

    if (!verifyMidtransSignature(payload)) {
      throw new ApiError(401, "Tanda tangan notifikasi tidak valid.");
    }

    await applyMidtransStatus(payload);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
