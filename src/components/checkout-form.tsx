"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useCart } from "@/components/cart-provider";
import { Button, buttonStyles } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { ProductMedia } from "@/components/ui/product-media";
import { bankLabels, formatIDR, lineKey } from "@/lib/format";
import type {
  BankName,
  FulfillmentType,
  PaymentMethod,
  SessionUser,
} from "@/lib/types";

const SHIPPING_FLAT = 25000;
const FREE_SHIPPING_MIN = 1000000;

type FieldErrors = {
  recipientName?: string;
  phone?: string;
  addressLine?: string;
  city?: string;
  postalCode?: string;
  note?: string;
  paymentMethod?: string;
  bankName?: string;
};

const fulfillmentOptions: {
  value: FulfillmentType;
  label: string;
  hint: string;
}[] = [
  {
    value: "COURIER",
    label: "Kirim lewat kurir",
    hint: "Ongkir Rp 25.000, gratis mulai Rp 1.000.000.",
  },
  {
    value: "PICKUP",
    label: "Ambil di toko",
    hint: "Tanpa ongkir. Alamat toko kami kirim lewat chat.",
  },
];

const paymentOptions: {
  value: PaymentMethod;
  label: string;
  hint: string;
}[] = [
  {
    value: "QRIS",
    label: "QRIS",
    hint: "Kode QR demo tampil setelah pesanan dibuat.",
  },
  {
    value: "BANK_TRANSFER",
    label: "Transfer bank",
    hint: "Pilih bank, nomor VA demo tampil setelah pesanan dibuat.",
  },
  {
    value: "COD",
    label: "Bayar di tempat (COD)",
    hint: "Bayar ke kurir saat paket datang. Khusus pengiriman kurir.",
  },
];

const banks: BankName[] = ["BCA", "MANDIRI", "BNI", "BRI"];

export function CheckoutForm({ user }: { user: SessionUser }) {
  const router = useRouter();
  const { detailed, lines, subtotal, clear } = useCart();

  const [recipientName, setRecipientName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [fulfillmentType, setFulfillmentType] =
    useState<FulfillmentType>("COURIER");
  const [addressLine, setAddressLine] = useState(user.addressLine ?? "");
  const [city, setCity] = useState(user.city ?? "");
  const [postalCode, setPostalCode] = useState(user.postalCode ?? "");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("QRIS");
  const [bankName, setBankName] = useState<BankName>("BCA");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isPickup = fulfillmentType === "PICKUP";
  const availablePayments = isPickup
    ? paymentOptions.filter((option) => option.value !== "COD")
    : paymentOptions;
  const shippingCost = isPickup
    ? 0
    : subtotal >= FREE_SHIPPING_MIN
      ? 0
      : SHIPPING_FLAT;
  const total = subtotal + shippingCost;
  const missingLines = lines.length - detailed.length;
  const activePaymentLabel =
    paymentMethod === "BANK_TRANSFER"
      ? `Transfer ${bankLabels[bankName]}`
      : paymentMethod === "COD"
        ? "Bayar di tempat (COD)"
        : "QRIS";

  function chooseFulfillment(value: FulfillmentType) {
    setFulfillmentType(value);
    if (value === "PICKUP" && paymentMethod === "COD") {
      setPaymentMethod("BANK_TRANSFER");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const local: FieldErrors = {};

    if (recipientName.trim().length < 2) {
      local.recipientName = "Nama penerima minimal 2 karakter.";
    }
    if (!/^[0-9+\-\s()]{8,20}$/.test(phone.trim())) {
      local.phone = "Masukkan nomor telepon yang valid.";
    }
    if (!isPickup) {
      if (addressLine.trim().length < 8) {
        local.addressLine = "Alamat minimal 8 karakter.";
      }
      if (city.trim().length < 2) local.city = "Kota minimal 2 karakter.";
      if (!/^[0-9]{5}$/.test(postalCode.trim())) {
        local.postalCode = "Kode pos terdiri dari 5 angka.";
      }
    }

    setErrors(local);
    setNotice(null);
    if (Object.keys(local).length > 0) return;
    if (detailed.length === 0) {
      setNotice("Keranjang masih kosong.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: detailed.map(({ line }) => ({
            slug: line.slug,
            size: line.size,
            qty: line.qty,
          })),
          recipientName: recipientName.trim(),
          phone: phone.trim(),
          fulfillmentType,
          addressLine: isPickup ? undefined : addressLine.trim(),
          city: isPickup ? undefined : city.trim(),
          postalCode: isPickup ? undefined : postalCode.trim(),
          note: note.trim() || undefined,
          paymentMethod,
          bankName: paymentMethod === "BANK_TRANSFER" ? bankName : undefined,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        details?: Record<string, string[] | undefined>;
        order?: { id: string };
      };

      if (!response.ok || !data.order) {
        const details = data.details ?? {};
        const mapped: FieldErrors = {};
        for (const key of [
          "recipientName",
          "phone",
          "addressLine",
          "city",
          "postalCode",
          "note",
          "paymentMethod",
          "bankName",
        ] as const) {
          if (details[key]?.[0]) mapped[key] = details[key]?.[0];
        }
        setErrors(mapped);
        setNotice(
          data.error ?? "Pesanan tidak bisa dibuat. Periksa isian lalu coba lagi.",
        );
        return;
      }

      clear();
      router.push(`/akun/pesanan/${data.order.id}`);
      router.refresh();
    } catch {
      setNotice("Tidak bisa menghubungi server. Periksa koneksi lalu coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  if (detailed.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] border border-line bg-ivory-50 px-8 py-16 text-center">
        <p className="font-display text-2xl">Keranjang masih kosong</p>
        <p className="mt-2 text-sm text-espresso-500">
          Pilih produk dulu sebelum checkout.
        </p>
        <Link
          href="/#koleksi"
          className={buttonStyles({ variant: "secondary", className: "mt-6" })}
        >
          Lihat koleksi
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-8">
        <fieldset className="rounded-[var(--radius-card)] border border-line bg-ivory-50 p-5 sm:p-6">
          <legend className="px-1 font-display text-2xl">
            Cara terima pesanan
          </legend>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {fulfillmentOptions.map((option) => {
              const selected = fulfillmentType === option.value;
              return (
                <label
                  key={option.value}
                  className={`block cursor-pointer rounded-2xl border p-4 transition-colors focus-within:outline-2 focus-within:outline-clay-500 focus-within:outline-offset-2 ${
                    selected
                      ? "border-clay-500 bg-clay-50"
                      : "border-line bg-ivory-50 hover:border-espresso-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="cara-terima"
                    value={option.value}
                    checked={selected}
                    onChange={() => chooseFulfillment(option.value)}
                    className="sr-only"
                  />
                  <span className="block text-sm font-medium">
                    {option.label}
                  </span>
                  <span className="mt-1 block text-xs text-espresso-500">
                    {option.hint}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <section className="rounded-[var(--radius-card)] border border-line bg-ivory-50 p-5 sm:p-6">
          <h2 className="font-display text-2xl">
            {isPickup ? "Kontak" : "Alamat pengiriman"}
          </h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field
                label={isPickup ? "Nama" : "Nama penerima"}
                value={recipientName}
                onChange={setRecipientName}
                error={errors.recipientName}
                autoComplete="name"
                required
              />
            </div>
            <Field
              label="Nomor telepon"
              type="tel"
              value={phone}
              onChange={setPhone}
              error={errors.phone}
              hint="Contoh: 081234567890."
              autoComplete="tel"
              required
            />
            {isPickup ? (
              <p className="self-end rounded-2xl border border-line bg-ivory-100 p-4 text-xs leading-relaxed text-espresso-500 sm:col-span-2">
                Pesanan diambil di toko, jadi alamat tidak perlu diisi. Detail
                alamat dan jam ambil kami kirim lewat chat setelah pesanan
                dibuat.
              </p>
            ) : (
              <>
                <Field
                  label="Kode pos"
                  value={postalCode}
                  onChange={setPostalCode}
                  error={errors.postalCode}
                  autoComplete="postal-code"
                  required
                />
                <div className="sm:col-span-2">
                  <Field
                    label="Alamat lengkap"
                    value={addressLine}
                    onChange={setAddressLine}
                    error={errors.addressLine}
                    hint="Jalan, nomor rumah, RT/RW, kelurahan."
                    autoComplete="street-address"
                    required
                  />
                </div>
                <Field
                  label="Kota atau kabupaten"
                  value={city}
                  onChange={setCity}
                  error={errors.city}
                  autoComplete="address-level2"
                  required
                />
              </>
            )}
            <div className="sm:col-span-2">
              <label
                htmlFor="catatan-pesanan"
                className="block text-sm font-medium"
              >
                Catatan (opsional)
              </label>
              <textarea
                id="catatan-pesanan"
                rows={3}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="mt-2 w-full resize-y rounded-2xl border border-line bg-ivory-50 px-5 py-3 text-sm"
              />
              {errors.note ? (
                <p className="mt-2 text-xs text-clay-600">{errors.note}</p>
              ) : null}
            </div>
          </div>
        </section>

        <fieldset className="rounded-[var(--radius-card)] border border-line bg-ivory-50 p-5 sm:p-6">
          <legend className="px-1 font-display text-2xl">Pembayaran</legend>
          <p className="mt-2 text-sm text-espresso-500">
            Semua pembayaran di demo ini disimulasikan. Tidak ada uang yang
            berpindah.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {availablePayments.map((method) => {
              const selected = paymentMethod === method.value;
              return (
                <label
                  key={method.value}
                  className={`block cursor-pointer rounded-2xl border p-4 transition-colors focus-within:outline-2 focus-within:outline-clay-500 focus-within:outline-offset-2 ${
                    selected
                      ? "border-clay-500 bg-clay-50"
                      : "border-line bg-ivory-50 hover:border-espresso-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="metode"
                    value={method.value}
                    checked={selected}
                    onChange={() => setPaymentMethod(method.value)}
                    className="sr-only"
                  />
                  <span className="block text-sm font-medium">
                    {method.label}
                  </span>
                  <span className="mt-1 block text-xs text-espresso-500">
                    {method.hint}
                  </span>
                </label>
              );
            })}
          </div>

          {paymentMethod === "BANK_TRANSFER" ? (
            <div className="mt-5 border-t border-line pt-5">
              <p className="text-sm font-medium">Pilih bank</p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {banks.map((bank) => {
                  const selected = bankName === bank;
                  return (
                    <label
                      key={bank}
                      className={`block cursor-pointer rounded-xl border px-3 py-3 text-center text-sm transition-colors focus-within:outline-2 focus-within:outline-clay-500 focus-within:outline-offset-2 ${
                        selected
                          ? "border-clay-500 bg-clay-50 font-medium"
                          : "border-line bg-ivory-50 hover:border-espresso-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="bank"
                        value={bank}
                        checked={selected}
                        onChange={() => setBankName(bank)}
                        className="sr-only"
                      />
                      {bankLabels[bank]}
                    </label>
                  );
                })}
              </div>
              {errors.bankName ? (
                <p className="mt-2 text-xs text-clay-600">{errors.bankName}</p>
              ) : null}
            </div>
          ) : null}

          {errors.paymentMethod ? (
            <p className="mt-3 text-xs text-clay-600">
              {errors.paymentMethod}
            </p>
          ) : null}
        </fieldset>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-[var(--radius-card)] border border-line bg-ivory-50 p-5 sm:p-6">
          <h2 className="font-display text-2xl">Ringkasan pesanan</h2>

          <ul className="mt-4 divide-y divide-line">
            {detailed.map(({ line, product }) => {
              const key = lineKey(line.slug, line.size);
              return (
                <li key={key} className="flex gap-3 py-3">
                  <ProductMedia
                    product={product}
                    showLabel={false}
                    radius="rounded-lg"
                    className="h-16 w-12 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-espresso-500">
                      Ukuran {line.size} x {line.qty}
                    </p>
                  </div>
                  <p className="text-sm">
                    {formatIDR(product.price * line.qty)}
                  </p>
                </li>
              );
            })}
          </ul>

          {missingLines > 0 ? (
            <p
              role="status"
              className="mt-3 rounded-xl border border-amber-700/40 bg-ivory-100 p-3 text-xs text-amber-700"
            >
              {missingLines} item di keranjang sudah tidak dijual dan tidak
              ikut dipesan.
            </p>
          ) : null}

          <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-espresso-500">Subtotal</dt>
              <dd>{formatIDR(subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-espresso-500">Cara terima</dt>
              <dd>{isPickup ? "Ambil di toko" : "Kurir"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-espresso-500">Ongkos kirim</dt>
              <dd>
                {isPickup
                  ? "Tanpa ongkir"
                  : shippingCost === 0
                    ? "Gratis"
                    : formatIDR(shippingCost)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-espresso-500">Pembayaran</dt>
              <dd>{activePaymentLabel}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-line pt-3 text-base font-medium">
              <dt>Total</dt>
              <dd>{formatIDR(total)}</dd>
            </div>
          </dl>

          <Button
            type="submit"
            size="lg"
            className="mt-5 w-full"
            disabled={busy}
          >
            {busy ? "Membuat pesanan..." : "Buat pesanan"}
          </Button>
          <p className="mt-3 text-center text-xs text-espresso-500">
            {isPickup
              ? "Ambil di toko tanpa ongkir. Pembayaran bisa QRIS atau transfer."
              : "Ongkir Rp 25.000, gratis untuk pesanan mulai Rp 1.000.000."}
          </p>
        </div>
      </aside>

      {notice ? (
        <p
          role="alert"
          className="rounded-2xl border border-clay-500 bg-clay-50 p-4 text-sm text-clay-600 lg:col-span-2"
        >
          {notice}
        </p>
      ) : null}
    </form>
  );
}
