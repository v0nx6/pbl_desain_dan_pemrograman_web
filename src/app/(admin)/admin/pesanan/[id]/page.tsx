/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminOrderActions } from "@/components/admin/order-actions";
import { PaymentStatusText, StatusText } from "@/components/ui/status";
import { requireAdminPage } from "@/lib/auth";
import {
  bankLabels,
  formatDateTime,
  formatIDR,
  fulfillmentLabels,
  paymentMethodLabels,
} from "@/lib/format";
import { getOrderForAdmin } from "@/lib/order-queries";

export const metadata = { title: "Detail pesanan admin" };

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAdminPage(`/admin/pesanan/${id}`);
  const order = await getOrderForAdmin(id);

  if (!order) notFound();

  return (
    <div>
      <nav aria-label="Remah roti" className="text-sm text-espresso-500">
        <Link href="/admin?view=pesanan" className="hover:text-clay-500">
          Pesanan
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-espresso-900">{order.number}</span>
      </nav>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-3xl leading-tight break-words sm:text-4xl">
            {order.number}
          </h1>
          <p className="mt-2 text-sm text-espresso-500">
            Dibuat {formatDateTime(order.createdAt)}
          </p>
        </div>
        <div className="text-right">
          <StatusText status={order.status} />
          <p className="mt-1 text-sm">{formatIDR(order.total)}</p>
          <p className="mt-1 text-xs text-espresso-500">
            Bayar: <PaymentStatusText status={order.paymentStatus} />
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <section className="rounded-3xl bg-ivory-50 p-5 sm:p-6">
            <h2 className="font-display text-2xl">Pelanggan</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-espresso-500">Nama</dt>
                <dd>{order.customerName ?? "[Nama pelanggan]"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-espresso-500">Email</dt>
                <dd>{order.customerEmail ?? "-"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-espresso-500">Penerima</dt>
                <dd>{order.recipientName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-espresso-500">Cara terima</dt>
                <dd>{fulfillmentLabels[order.fulfillmentType]}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-espresso-500">Telepon</dt>
                <dd>{order.phone}</dd>
              </div>
            </dl>
            {order.fulfillmentType === "PICKUP" ? (
              <p className="mt-3 rounded-2xl bg-ivory-100 p-4 text-sm text-espresso-700">
                Ambil di toko. Alamat dan jam ambil dikirim ke pelanggan lewat
                chat.
                {order.note ? (
                  <span className="mt-1 block text-espresso-500">
                    Catatan: {order.note}
                  </span>
                ) : null}
              </p>
            ) : (
              <address className="mt-3 rounded-2xl bg-ivory-100 p-4 text-sm not-italic text-espresso-700">
                {order.addressLine}, {order.city} {order.postalCode}
                {order.note ? (
                  <span className="mt-1 block text-espresso-500">
                    Catatan: {order.note}
                  </span>
                ) : null}
              </address>
            )}
          </section>

          <section className="rounded-3xl bg-ivory-50 p-5 sm:p-6">
            <h2 className="font-display text-2xl">Item</h2>
            <ul className="mt-4 divide-y divide-line">
              {order.items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-espresso-500">
                      Ukuran {item.size} x {item.qty}
                    </p>
                  </div>
                  <p>{formatIDR(item.lineTotal)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-espresso-500">Subtotal</dt>
                <dd>{formatIDR(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-espresso-500">Ongkos kirim</dt>
                <dd>
                  {order.fulfillmentType === "PICKUP"
                    ? "Tanpa ongkir"
                    : order.shippingCost === 0
                      ? "Gratis"
                      : formatIDR(order.shippingCost)}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-line pt-3 text-base font-medium">
                <dt>Total</dt>
                <dd>{formatIDR(order.total)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-3xl bg-ivory-50 p-5 sm:p-6">
            <h2 className="font-display text-2xl">Pembayaran</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-espresso-500">Metode</dt>
                <dd>
                  {paymentMethodLabels[order.paymentMethod]}
                  {order.paymentMethod === "BANK_TRANSFER" && order.bankName
                    ? ` ${bankLabels[order.bankName]}`
                    : ""}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-espresso-500">Referensi</dt>
                <dd className="font-mono text-xs break-all">
                  {order.paymentReference}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-espresso-500">Bukti diunggah</dt>
                <dd>{formatDateTime(order.proofUploadedAt)}</dd>
              </div>
            </dl>

            {order.paymentMethod === "COD" ? (
              <p className="mt-4 rounded-2xl bg-ivory-100 p-4 text-sm text-espresso-700">
                Pesanan COD. Pembayaran diterima saat kurir menyerahkan paket.
                Status bayar otomatis jadi terverifikasi setelah pesanan
                ditandai selesai.
              </p>
            ) : order.proofName ? (
              <div className="mt-4">
                <img
                  src={`/api/orders/${order.id}/proof`}
                  alt={`Bukti pembayaran pesanan ${order.number}`}
                  className="max-h-[420px] w-auto rounded-2xl border border-line bg-white object-contain"
                />
                <p className="mt-2 text-xs text-espresso-500">
                  {order.proofName}
                </p>
              </div>
            ) : (
              <p className="mt-4 rounded-2xl bg-ivory-100 p-4 text-sm text-espresso-500">
                Belum ada bukti pembayaran.
              </p>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl bg-ivory-50 p-5 sm:p-6">
            <h2 className="font-display text-2xl">Tindakan</h2>
            <p className="mt-1 text-sm text-espresso-500">
              Perubahan status langsung tersimpan di database.
            </p>
            <div className="mt-4">
              <AdminOrderActions orderId={order.id} status={order.status} />
            </div>
          </section>

          <section className="rounded-3xl bg-ivory-50 p-5 sm:p-6">
            <h2 className="font-display text-2xl">Riwayat</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-espresso-500">Dibuat</dt>
                <dd>{formatDateTime(order.createdAt)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-espresso-500">Dibayar</dt>
                <dd>{formatDateTime(order.paidAt)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-espresso-500">Dikirim</dt>
                <dd>{formatDateTime(order.shippedAt)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-espresso-500">Selesai</dt>
                <dd>{formatDateTime(order.completedAt)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-espresso-500">Dibatalkan</dt>
                <dd>{formatDateTime(order.cancelledAt)}</dd>
              </div>
            </dl>
            {order.adminNote ? (
              <p className="mt-3 rounded-2xl bg-ivory-100 p-4 text-sm text-espresso-700">
                {order.adminNote}
              </p>
            ) : null}
          </section>

          <Link
            href="/admin?view=pesanan"
            className="inline-flex min-h-11 items-center text-sm underline underline-offset-4 hover:text-clay-500"
          >
            Kembali ke semua pesanan
          </Link>
        </div>
      </div>
    </div>
  );
}
