"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";

export function ShippingForm({
  orderId,
  courier,
  trackingNumber,
}: {
  orderId: string;
  courier: string | null;
  trackingNumber: string | null;
}) {
  const router = useRouter();
  const [courierValue, setCourierValue] = useState(courier ?? "");
  const [trackingValue, setTrackingValue] = useState(trackingNumber ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(`/api/orders/${orderId}/shipping`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courier: courierValue.trim() || undefined,
          trackingNumber: trackingValue.trim() || undefined,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Data pengiriman tidak bisa disimpan.");
        return;
      }

      setNotice("Data pengiriman sudah disimpan.");
      router.refresh();
    } catch {
      setError("Tidak bisa menghubungi server. Periksa koneksi lalu coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Field
            label="Kurir"
            value={courierValue}
            onChange={setCourierValue}
            hint="Contoh: JNE, J&T, SiCepat."
          />
        </div>
        <Field
          label="Nomor resi"
          value={trackingValue}
          onChange={setTrackingValue}
          hint="Boleh dikosongkan kalau resi belum keluar."
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="secondary" disabled={busy}>
          {busy ? "Menyimpan..." : "Simpan data kirim"}
        </Button>
        {notice ? <p className="text-xs text-sage-700">{notice}</p> : null}
        {error ? <p className="text-xs text-clay-600">{error}</p> : null}
      </div>
    </form>
  );
}
