import { NextResponse } from "next/server";
import { apiError, requireAdmin } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import {
  formatDate,
  fulfillmentLabels,
  orderStatusLabels,
  paymentMethodLabels,
} from "@/lib/format";

export const dynamic = "force-dynamic";

const VERIFIED_STATUSES = [
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "COMPLETED",
] as const;

function cell(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

export async function GET(): Promise<NextResponse> {
  try {
    await requireAdmin();

    const orders = await prisma.order.findMany({
      where: { status: { in: [...VERIFIED_STATUSES] } },
      include: { user: { select: { name: true, email: true } } },
      orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
    });

    const header = [
      "Nomor pesanan",
      "Tanggal",
      "Pelanggan",
      "Email",
      "Metode pembayaran",
      "Cara terima",
      "Status",
      "Subtotal",
      "Ongkos kirim",
      "Total",
    ];

    const lines = [
      header.map(cell).join(","),
      ...orders.map((order) =>
        [
          order.number,
          formatDate(order.paidAt ?? order.createdAt),
          order.user.name,
          order.user.email,
          paymentMethodLabels[order.paymentMethod] +
            (order.bankName ? ` ${order.bankName}` : ""),
          fulfillmentLabels[order.fulfillmentType],
          orderStatusLabels[order.status],
          order.subtotal,
          order.shippingCost,
          order.total,
        ]
          .map(cell)
          .join(","),
      ),
    ];

    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const csv = `\uFEFF${lines.join("\r\n")}\r\n`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="riwayat-pendapatan-${stamp}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
