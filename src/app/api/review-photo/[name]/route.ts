import { NextResponse } from "next/server";
import { ApiError, apiError } from "@/lib/api-helpers";
import { isStoredReviewImage, readStored } from "@/lib/storage";

type Params = { params: Promise<{ name: string }> };

export async function GET(
  _request: Request,
  { params }: Params,
): Promise<NextResponse> {
  try {
    const { name } = await params;
    if (!isStoredReviewImage(name)) {
      throw new ApiError(404, "Foto ulasan tidak ditemukan.");
    }

    const buffer = await readStored(`reviews/${name}`);
    const extension = name.split(".").pop()?.toLowerCase();
    const type =
      extension === "png"
        ? "image/png"
        : extension === "webp"
          ? "image/webp"
          : "image/jpeg";

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    if (error instanceof ApiError) return apiError(error);
    return apiError(new ApiError(404, "Foto ulasan tidak ditemukan."));
  }
}
