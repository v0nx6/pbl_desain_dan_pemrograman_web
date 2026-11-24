"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function OrderPaymentActions({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"pay" | "sync" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function pay() {
    setBusy("pay");
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/orders/${orderId}/midtrans`, {
        method: "POST",
      });
      const data = (await response.json().catch(() => ({}))) as {
        redirectUrl?: string;
        error?: string;
      };

      if (!response.ok || !data.redirectUrl) {
        setError(data.error ?? "Pembayaran online belum bisa dibuka.");
        return;
      }

      window.location.assign(data.redirectUrl);
    } catch {
      setError("Tidak bisa menghubungi server. Periksa koneksi lalu coba lagi.");
    } finally {
      setBusy(null);
    }
  }

  async function sync() {
    setBusy("sync");
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/orders/${orderId}/midtrans/sync`, {
        method: "POST",
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Status pembayaran belum bisa dicek.");
        return;
      }

      setNotice("Status pembayaran sudah diperbarui.");
      router.refresh();
    } catch {
      setError("Tidak bisa menghubungi server. Periksa koneksi lalu coba lagi.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-line bg-ivory-100 p-4">
      <p className="text-sm font-medium">Pembayaran online</p>
      <p className="mt-1 text-xs leading-relaxed text-espresso-500">
        Selesaikan pembayaran lewat Midtrans. Setelah berhasil, status pesanan
        berubah otomatis.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button onClick={() => void pay()} disabled={busy !== null}>
          {busy === "pay" ? "Membuka..." : "Bayar sekarang"}
        </Button>
        <Button
          variant="quiet"
          onClick={() => void sync()}
          disabled={busy !== null}
        >
          {busy === "sync" ? "Mengecek..." : "Cek status pembayaran"}
        </Button>
      </div>

      {notice ? (
        <p className="mt-3 text-xs text-sage-700">{notice}</p>
      ) : null}
      {error ? <p className="mt-3 text-xs text-clay-600">{error}</p> : null}
    </div>
  );
}
