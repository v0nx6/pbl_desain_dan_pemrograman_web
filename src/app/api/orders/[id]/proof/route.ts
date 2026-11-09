import { NextResponse } from "next/server";
import {
  ApiError,
  apiError,
  assertSameOrigin,
  noStoreJson,
  requireUser,
} from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { orderWithItems, toOrderDetail } from "@/lib/orders";
import { canUploadProof } from "@/lib/orders";
import { readStored, saveUpload } from "@/lib/storage";

type Params = { params: Promise<{ id: string }> };

const MAX_PROOF_BYTES = 5 * 1024 * 1024;

export async function POST(
  request: Request,
  { params }: Params,
): Promise<NextResponse> {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const { id } = await params;

    const order = await prisma.order.findFirst({
      where: { id, userId: user.id },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
      },
    });

    if (!order) throw new ApiError(404, "Pesanan tidak ditemukan.");
    if (!canUploadProof(order)) {
      throw new ApiError(
        409,
        "Bukti pembayaran tidak bisa diunggah pada status pesanan ini.",
      );
    }

    const form = await request.formData();
    const file = form.get("proof");
    if (!(file instanceof File)) {
      throw new ApiError(400, "Pilih file bukti pembayaran dulu.");
    }

    let saved: Awaited<ReturnType<typeof saveUpload>>;
    try {
      saved = await saveUpload(file, "proofs", MAX_PROOF_BYTES);
    } catch (error) {
      throw new ApiError(
        400,
        error instanceof Error ? error.message : "File tidak bisa dibaca.",
      );
    }

    const result = await prisma.order.updateMany({
      where: {
        id,
        userId: user.id,
        status: { in: ["PENDING_PAYMENT", "AWAITING_VERIFICATION"] },
      },
      data: {
        status: "AWAITING_VERIFICATION",
        paymentStatus: "PROOF_UPLOADED",
        proofPath: saved.path,
        proofMime: saved.mime,
        proofName: saved.name,
        proofUploadedAt: new Date(),
        adminNote: null,
      },
    });

    if (result.count !== 1) {
      throw new ApiError(
        409,
        "Status pesanan baru saja berubah. Muat ulang halaman ini.",
      );
    }

    const updated = await prisma.order.findUniqueOrThrow({
      where: { id },
      include: orderWithItems,
    });

    return noStoreJson({ order: toOrderDetail(updated) });
  } catch (error) {
    return apiError(error);
  }
}

export async function GET(
  _request: Request,
  { params }: Params,
): Promise<NextResponse> {
  try {
    const user = await requireUser();
    const { id } = await params;

    const order = await prisma.order.findFirst({
      where:
        user.role === "ADMIN"
          ? { id }
          : { id, userId: user.id },
      select: { proofPath: true, proofMime: true },
    });

    if (!order?.proofPath) {
      throw new ApiError(404, "Bukti pembayaran belum ada.");
    }

    const buffer = await readStored(order.proofPath);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": order.proofMime ?? "application/octet-stream",
        "Cache-Control": "private, no-store",
        "Content-Disposition": "inline",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
