"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";

type FieldErrors = Record<string, string | undefined>;

export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const local: FieldErrors = {};
    if (hasPassword && !currentPassword) {
      local.currentPassword = "Masukkan kata sandi saat ini.";
    }
    if (newPassword.length < 8) {
      local.newPassword = "Kata sandi baru minimal 8 karakter.";
    }
    if (newPassword !== confirmPassword) {
      local.confirmPassword = "Konfirmasi kata sandi tidak sama.";
    }

    setErrors(local);
    setNotice(null);
    setError(null);
    if (Object.keys(local).length > 0) return;

    setBusy(true);
    try {
      const response = await fetch("/api/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        details?: Record<string, string[] | undefined>;
      };

      if (!response.ok) {
        const details = data.details ?? {};
        const mapped: FieldErrors = {};
        for (const key of ["currentPassword", "newPassword", "confirmPassword"]) {
          if (details[key]?.[0]) mapped[key] = details[key][0];
        }
        setErrors(mapped);
        setError(data.error ?? "Kata sandi tidak bisa diubah.");
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setNotice(
        hasPassword
          ? "Kata sandi berhasil diubah."
          : "Kata sandi berhasil dibuat. Sekarang kamu bisa masuk dengan email.",
      );
      router.refresh();
    } catch {
      setError("Tidak bisa menghubungi server. Periksa koneksi lalu coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {hasPassword ? (
        <Field
          label="Kata sandi saat ini"
          type="password"
          value={currentPassword}
          onChange={setCurrentPassword}
          error={errors.currentPassword}
          autoComplete="current-password"
          required
        />
      ) : (
        <p className="rounded-2xl border border-line bg-ivory-100 p-4 text-sm text-espresso-500">
          Akun ini masuk dengan Google. Buat kata sandi kalau kamu juga ingin
          masuk pakai email.
        </p>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Kata sandi baru"
          type="password"
          value={newPassword}
          onChange={setNewPassword}
          error={errors.newPassword}
          autoComplete="new-password"
          hint="Minimal 8 karakter."
          required
        />
        <Field
          label="Ulangi kata sandi baru"
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          error={errors.confirmPassword}
          autoComplete="new-password"
          required
        />
      </div>

      {notice ? (
        <p
          role="status"
          className="rounded-2xl border border-sage-700 bg-ivory-50 p-4 text-sm text-sage-700"
        >
          {notice}
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="rounded-2xl border border-clay-500 bg-clay-50 p-4 text-sm text-clay-600"
        >
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={busy}>
        {busy
          ? "Menyimpan..."
          : hasPassword
            ? "Ubah kata sandi"
            : "Buat kata sandi"}
      </Button>
    </form>
  );
}
