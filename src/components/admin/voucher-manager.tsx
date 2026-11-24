"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { formatDate, formatIDR } from "@/lib/format";
import type { VoucherType, VoucherView } from "@/lib/types";

const typeLabels: Record<VoucherType, string> = {
  PERCENT: "Persen (%)",
  FIXED: "Potongan tetap (Rp)",
};

function VoucherRow({ voucher }: { voucher: VoucherView }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleActive() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/vouchers/${voucher.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !voucher.active }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok) {
        setError(data.error ?? "Status voucher tidak bisa diubah.");
        return;
      }
      router.refresh();
    } catch {
      setError("Tidak bisa menghubungi server. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Hapus voucher ${voucher.code}?`)) return;

    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/vouchers/${voucher.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(data.error ?? "Voucher tidak bisa dihapus.");
        return;
      }
      router.refresh();
    } catch {
      setError("Tidak bisa menghubungi server. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  const usage =
    voucher.maxUses === null
      ? `${voucher.usedCount} kali dipakai`
      : `${voucher.usedCount} dari ${voucher.maxUses} kali dipakai`;

  return (
    <li className="rounded-2xl border border-line bg-ivory-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-sm font-medium tracking-wide break-all">
            {voucher.code}
          </p>
          <p className="mt-1 text-sm text-espresso-700">
            {voucher.type === "PERCENT"
              ? `Potongan ${voucher.value}%`
              : `Potongan ${formatIDR(voucher.value)}`}
            {voucher.minSpend > 0
              ? `, minimal ${formatIDR(voucher.minSpend)}`
              : ""}
          </p>
          <p className="mt-1 text-xs text-espresso-500">
            {usage}
            {voucher.expiresAt
              ? `, berlaku sampai ${formatDate(voucher.expiresAt)}`
              : ""}
          </p>
        </div>
        <span
          className={`inline-flex min-h-8 items-center rounded-full px-3 text-xs ${
            voucher.active
              ? "bg-sage-700/10 text-sage-700"
              : "bg-espresso-900/10 text-espresso-500"
          }`}
        >
          {voucher.active ? "Aktif" : "Nonaktif"}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="quiet"
          onClick={() => void toggleActive()}
          disabled={busy}
        >
          {voucher.active ? "Nonaktifkan" : "Aktifkan"}
        </Button>
        <Button
          type="button"
          variant="quiet"
          onClick={() => void remove()}
          disabled={busy}
        >
          Hapus
        </Button>
      </div>
      {error ? <p className="mt-2 text-xs text-clay-600">{error}</p> : null}
    </li>
  );
}

export function VoucherManager({ vouchers }: { vouchers: VoucherView[] }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [type, setType] = useState<VoucherType>("PERCENT");
  const [value, setValue] = useState("");
  const [minSpend, setMinSpend] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);

    try {
      const response = await fetch("/api/admin/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          type,
          value: value === "" ? 0 : Number(value),
          minSpend: minSpend === "" ? 0 : Number(minSpend),
          maxUses: maxUses === "" ? undefined : Number(maxUses),
          expiresAt: expiresAt ? `${expiresAt}T23:59:59+07:00` : undefined,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok) {
        setError(data.error ?? "Voucher tidak bisa disimpan.");
        return;
      }

      setCode("");
      setValue("");
      setMinSpend("");
      setMaxUses("");
      setExpiresAt("");
      setNotice("Voucher baru sudah dibuat.");
      router.refresh();
    } catch {
      setError("Tidak bisa menghubungi server. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-3xl bg-ivory-50 p-5 sm:p-6">
        <h2 className="font-display text-2xl">Buat voucher</h2>
        <p className="mt-1 text-sm text-espresso-500">
          Potongan dihitung ulang di server saat pesanan dibuat.
        </p>

        <form onSubmit={submit} className="mt-4 space-y-4">
          <Field
            label="Kode voucher"
            value={code}
            onChange={(next) => setCode(next.toUpperCase())}
            hint="Huruf, angka, dan tanda hubung. Contoh: PBL10."
            required
          />

          <div className="space-y-2">
            <label htmlFor="voucher-type" className="block text-sm font-medium">
              Jenis potongan
            </label>
            <select
              id="voucher-type"
              value={type}
              onChange={(event) => setType(event.target.value as VoucherType)}
              className="min-h-11 w-full rounded-full border border-line bg-ivory-50 px-5 text-sm"
            >
              {(Object.keys(typeLabels) as VoucherType[]).map((item) => (
                <option key={item} value={item}>
                  {typeLabels[item]}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={type === "PERCENT" ? "Besar potongan (%)" : "Potongan (Rp)"}
              type="number"
              value={value}
              onChange={setValue}
              inputMode="numeric"
              required
            />
            <Field
              label="Minimal belanja (Rp)"
              type="number"
              value={minSpend}
              onChange={setMinSpend}
              inputMode="numeric"
              hint="Kosongkan kalau tanpa minimal."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Batas pemakaian"
              type="number"
              value={maxUses}
              onChange={setMaxUses}
              inputMode="numeric"
              hint="Kosongkan kalau tanpa batas."
            />
            <Field
              label="Berlaku sampai"
              type="date"
              value={expiresAt}
              onChange={setExpiresAt}
              hint="Kosongkan kalau tanpa batas waktu."
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={busy}>
              {busy ? "Menyimpan..." : "Simpan voucher"}
            </Button>
            {notice ? <p className="text-xs text-sage-700">{notice}</p> : null}
          </div>
          {error ? <p className="text-xs text-clay-600">{error}</p> : null}
        </form>
      </section>

      <section className="rounded-3xl bg-ivory-50 p-5 sm:p-6">
        <h2 className="font-display text-2xl">Daftar voucher</h2>
        {vouchers.length === 0 ? (
          <p className="mt-3 rounded-2xl bg-ivory-100 p-4 text-sm text-espresso-500">
            Belum ada voucher. Buat satu di sebelah kiri.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {vouchers.map((voucher) => (
              <VoucherRow key={voucher.id} voucher={voucher} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
