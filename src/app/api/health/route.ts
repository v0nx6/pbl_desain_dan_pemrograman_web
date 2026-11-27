import { NextResponse } from "next/server";
import { storageDriver } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      ok: true,
      service: "boutique-nc",
      storage: storageDriver,
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
