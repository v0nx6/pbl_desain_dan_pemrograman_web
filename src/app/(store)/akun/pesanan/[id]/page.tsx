/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { notFound } from "next/navigation";
import { CancelOrderButton } from "@/components/cancel-order-button";
import { OrderProofUpload } from "@/components/order-proof-upload";
import { buttonStyles } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/label";
import { PaymentStatusText, StatusText } from "@/components/ui/status";
import { requirePageUser } from "@/lib/auth";
import {
  bankLabels,
  formatDateTime,
  formatIDR,
  fulfillmentLabels,
  paymentMethodLabels,
} from "@/lib/format";
import { getOrderForUser } from "@/lib/order-queries";

export const metadata = { title: "Detail pesanan" };

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requirePageUser(`/akun/pesanan/${id}`);
  const order = await getOrderForUser(id, user.id);

  if (!order) notFound();

  const stages = [
    { label: "Pesanan dibuat", at: order.createdAt },
    { label: "Pembayaran diverifikasi", at: order.paidAt },
    { label: "Dikirim", at: order.shippedAt },
    { label: "Selesai", at: order.completedAt },
  ];

  return (
    <div className="mx-auto max-w-[1000px] px-5 pt-10 pb-24 sm:px-8 lg:px-10">
      <nav aria-label="Remah roti" className="text-sm text-espresso-500">
        <Link href="/akun" className="hover:text-clay-500">
          Akun
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-espresso-900">{order.number}</span>
      </nav>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <SectionLabel>Pesanan</SectionLabel>
          <h1 className="mt-2 font-display text-[clamp(1.9rem,3vw,2.75rem)] leading-tight">
            {order.number}
          </h1>
          <p className="mt-2 text-sm text-espresso-500">
            Dibuat {formatDateTime(order.createdAt)}
          </p>
        </div>
        <div className="text-right">
          <StatusText status={order.status} />
          <p className="mt-1 text-sm">{formatIDR(order.total)}</p>
        </div>
      </div>

      {order.status === "CANCELLED" ? (
        <p className="mt-6 rounded-2xl border border-line bg-ivory-50 p-4 text-sm text-espresso-700">
          Pesanan ini dibatalkan. Stok sudah dikembalikan ke katalog.
        </p>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <section className="rounded-[var(--radius-card)] border border-line bg-ivory-50 p-5 sm:p-6">
            <h2 className="font-display text-2xl">Pembayaran</h2>
            <dl className="mt-4 space-y-2 text-sm">
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
                <dt className="text-espresso-500">Cara terima</dt>
                <dd>{fulfillmentLabels[order.fulfillmentType]}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-espresso-500">Status bayar</dt>
                <dd>
                  <PaymentStatusText status={order.paymentStatus} />
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-espresso-500">Total</dt>
                <dd className="font-medium">{formatIDR(order.total)}</dd>
              </div>
            </dl>

            <p className="mt-4 rounded-xl border border-amber-700/40 bg-ivory-100 p-3 text-xs leading-relaxed text-amber-700">
              Pembayaran disimulasikan untuk demo. Jangan mengirim uang sungguhan.
            </p>

            {order.paymentMethod === "QRIS" ? (
              <div className="mt-4 rounded-2xl border border-line bg-white p-4 text-center">
                <p className="text-sm font-medium">Kode QRIS demo</p>
                <img
                  src={`/api/orders/${order.id}/qris`}
                  alt={`Kode QRIS demo untuk pesanan ${order.number}`}
                  width={220}
                  height={220}
                  className="mx-auto mt-3 size-[220px]"
                />
                <p className="mt-2 text-xs text-espresso-500">
                  Tidak dapat dipindai untuk pembayaran nyata.
                </p>
              </div>
            ) : null}

            {order.paymentMethod === "BANK_TRANSFER" ? (
              <div className="mt-4 rounded-2xl border border-line bg-ivory-100 p-4">
                <p className="text-xs text-espresso-500">
                  Nomor VA demo{order.bankName ? ` ${bankLabels[order.bankName]}` : ""}
                </p>
                <p className="mt-1 font-mono text-lg tracking-wide break-all">
                  {order.paymentReference}
                </p>
              </div>
            ) : null}

            {order.paymentMethod === "COD" ? (
              <p className="mt-4 rounded-2xl border border-line bg-ivory-100 p-4 text-sm leading-relaxed text-espresso-700">
                Pesanan ini dibayar di tempat. Siapkan uang tunai sebesar{" "}
                {formatIDR(order.total)} saat kurir datang.
              </p>
            ) : null}

            {order.paymentMethod !== "COD" ? (
              <div className="mt-6 border-t border-line pt-5">
                <OrderProofUpload
                  orderId={order.id}
                  canUpload={order.canUploadProof}
                  proofName={order.proofName}
                />
              </div>
            ) : null}

            {order.canCancel ? (
              <div className="mt-6 border-t border-line pt-5">
                <CancelOrderButton orderId={order.id} />
              </div>
            ) : null}
          </section>

          <section className="rounded-[var(--radius-card)] border border-line bg-ivory-50 p-5 sm:p-6">
            <h2 className="font-display text-2xl">Rincian item</h2>
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
        </div>

        <div className="space-y-6">
          <section className="rounded-[var(--radius-card)] border border-line bg-ivory-50 p-5 sm:p-6">
            <h2 className="font-display text-2xl">Status pesanan</h2>
            <ol className="mt-4 space-y-4">
              {stages.map((stage, index) => (
                <li key={stage.label} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className={`mt-1 size-2.5 shrink-0 rounded-full ${
                      stage.at ? "bg-sage-700" : "bg-sand-300"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium">
                      {index + 1}. {stage.label}
                    </p>
                    <p className="text-xs text-espresso-500">
                      {stage.at ? formatDateTime(stage.at) : "Menunggu"}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            {order.adminNote ? (
              <p className="mt-4 rounded-xl border border-line bg-ivory-100 p-3 text-sm text-espresso-700">
                Catatan admin: {order.adminNote}
              </p>
            ) : null}
          </section>

          <section className="rounded-[var(--radius-card)] border border-line bg-ivory-50 p-5 sm:p-6">
            <h2 className="font-display text-2xl">
              {order.fulfillmentType === "PICKUP"
                ? "Ambil di toko"
                : "Dikirim ke"}
            </h2>
            {order.fulfillmentType === "PICKUP" ? (
              <div className="mt-3 space-y-1 text-sm">
                <p className="font-medium">{order.recipientName}</p>
                <p className="text-espresso-500">{order.phone}</p>
                <p className="text-espresso-500 leading-relaxed">
                  Alamat toko dan jam ambil kami kirim lewat chat setelah
                  pesanan dibuat.
                </p>
                {order.note ? (
                  <p className="text-espresso-500">Catatan: {order.note}</p>
                ) : null}
              </div>
            ) : (
              <address className="mt-3 space-y-1 text-sm not-italic">
                <p className="font-medium">{order.recipientName}</p>
                <p className="text-espresso-500">{order.phone}</p>
                <p className="text-espresso-500">
                  {order.addressLine}, {order.city} {order.postalCode}
                </p>
                {order.note ? (
                  <p className="text-espresso-500">Catatan: {order.note}</p>
                ) : null}
              </address>
            )}
          </section>

          <Link
            href="/akun"
            className={buttonStyles({ variant: "quiet", className: "w-full" })}
          >
            Kembali ke akun
          </Link>
        </div>
      </div>
    </div>
  );
}
