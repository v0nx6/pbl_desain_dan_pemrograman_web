"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";

export function DeleteAccount({ hasPassword }: { hasPassword: boolean }) {
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function remove() {
    setError(null);
    if (!password) {
      setError("Masukkan kata sandi untuk menghapus akun.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/profile", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Akun tidak bisa dihapus.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Tidak bisa menghubungi server. Periksa koneksi lalu coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  if (!hasPassword) {
    return (
      <p className="text-sm text-espresso-500">
        Buat kata sandi dulu di bagian Ubah kata sandi sebelum menghapus akun
        ini.
      </p>
    );
  }

  if (!asking) {
    return (
      <div>
        <p className="text-sm text-espresso-500">
          Menghapus akun akan mengosongkan nama, email, telepon, dan alamat.
          Riwayat pesanan tetap tersimpan untuk admin.
        </p>
        <Button
          type="button"
          variant="quiet"
          className="mt-4 border-clay-500 text-clay-600"
          onClick={() => setAsking(true)}
        >
          Hapus akun saya
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-clay-500 bg-clay-50 p-4">
      <p className="font-medium text-clay-600">Hapus akun ini?</p>
      <p className="mt-1 text-sm text-espresso-500">
        Tindakan ini tidak bisa dibatalkan. Pesanan lama tetap ada di riwayat
        admin tanpa data profil.
      </p>
      <div className="mt-4 max-w-sm">
        <Field
          label="Kata sandi"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-clay-600">
          {error}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          className="bg-clay-600 hover:bg-clay-500"
          onClick={remove}
          disabled={busy}
        >
          {busy ? "Menghapus..." : "Ya, hapus akun"}
        </Button>
        <Button
          type="button"
          variant="quiet"
          onClick={() => {
            setAsking(false);
            setPassword("");
            setError(null);
          }}
          disabled={busy}
        >
          Batal
        </Button>
      </div>
    </div>
  );
}
