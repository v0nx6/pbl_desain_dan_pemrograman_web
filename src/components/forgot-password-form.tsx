"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { SectionLabel } from "@/components/ui/label";

type Step = "email" | "code" | "reset" | "done";

type FieldErrors = {
  email?: string;
  code?: string;
  password?: string;
  confirmPassword?: string;
};

const copy: Record<Step, { title: string; intro: string }> = {
  email: {
    title: "Lupa kata sandi",
    intro: "Masukkan email akun kamu. Kami kirim kode OTP ke email itu.",
  },
  code: {
    title: "Masukkan kode OTP",
    intro:
      "Cek inbox atau folder spam. Kode terdiri dari 6 angka dan berlaku 10 menit.",
  },
  reset: {
    title: "Buat kata sandi baru",
    intro: "Kode sudah cocok. Sekarang buat kata sandi baru untuk akunmu.",
  },
  done: {
    title: "Kata sandi sudah diganti",
    intro: "Semua sesi lama sudah keluar. Masuk lagi pakai kata sandi baru.",
  },
};

export function ForgotPasswordForm() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [developmentCode, setDevelopmentCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const text = copy[step];

  async function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const local: FieldErrors = {};
    if (!email.includes("@")) local.email = "Masukkan alamat email yang valid.";
    setErrors(local);
    setError(null);
    setNotice(null);
    setDevelopmentCode(null);
    if (Object.keys(local).length > 0) return;

    setBusy(true);
    try {
      const response = await fetch("/api/auth/forgot/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        developmentCode?: string;
        details?: Record<string, string[] | undefined>;
      };

      if (!response.ok) {
        setError(data.error ?? "Kode belum bisa dikirim. Coba lagi.");
        return;
      }

      setCode("");
      setStep("code");
      setNotice(data.message ?? "Kode OTP sudah dikirim ke email kamu.");
      setDevelopmentCode(data.developmentCode ?? null);
    } catch {
      setError("Tidak bisa menghubungi server. Periksa koneksi lalu coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  async function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const local: FieldErrors = {};
    if (!/^[0-9]{6}$/.test(code.trim())) {
      local.code = "Kode OTP terdiri dari 6 angka.";
    }
    setErrors(local);
    setError(null);
    setNotice(null);
    if (Object.keys(local).length > 0) return;

    setBusy(true);
    try {
      const response = await fetch("/api/auth/forgot/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        details?: Record<string, string[] | undefined>;
      };

      if (!response.ok) {
        setError(data.error ?? "Kode OTP tidak cocok. Coba lagi.");
        return;
      }

      setPassword("");
      setConfirmPassword("");
      setStep("reset");
    } catch {
      setError("Tidak bisa menghubungi server. Periksa koneksi lalu coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  async function submitReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const local: FieldErrors = {};
    if (password.length < 8) {
      local.password = "Kata sandi baru minimal 8 karakter.";
    }
    if (password !== confirmPassword) {
      local.confirmPassword = "Konfirmasi kata sandi tidak sama.";
    }
    setErrors(local);
    setError(null);
    setNotice(null);
    if (Object.keys(local).length > 0) return;

    setBusy(true);
    try {
      const response = await fetch("/api/auth/forgot/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirmPassword }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Kata sandi belum bisa diganti. Coba lagi.");
        return;
      }

      setStep("done");
    } catch {
      setError("Tidak bisa menghubungi server. Periksa koneksi lalu coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/auth/forgot/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Kode belum bisa dikirim ulang. Coba lagi.");
        return;
      }

      setCode("");
      setNotice(data.message ?? "Kode OTP baru sudah dikirim.");
    } catch {
      setError("Tidak bisa menghubungi server. Periksa koneksi lalu coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-[440px] px-5 pt-14 pb-24 sm:px-8">
      <SectionLabel>Akun</SectionLabel>
      <h1 className="mt-3 font-display text-4xl leading-tight">{text.title}</h1>
      <p className="mt-3 text-sm text-espresso-500">{text.intro}</p>

      {step === "email" ? (
        <form onSubmit={submitEmail} noValidate className="mt-8 space-y-5">
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            error={errors.email}
            autoComplete="email"
            required
          />
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? "Mengirim kode..." : "Kirim kode OTP"}
          </Button>
        </form>
      ) : null}

      {step === "code" ? (
        <form onSubmit={submitCode} noValidate className="mt-8 space-y-5">
          <div className="rounded-2xl border border-line bg-ivory-50 p-4 text-sm text-espresso-500">
            Kode dikirim ke <span className="text-espresso-900">{email}</span>.
          </div>
          <Field
            label="Kode OTP"
            inputMode="numeric"
            value={code}
            onChange={(value) => setCode(value.replace(/\D/g, "").slice(0, 6))}
            error={errors.code}
            hint="6 angka dari email."
            autoComplete="one-time-code"
            required
          />
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? "Memeriksa kode..." : "Kirim kode"}
          </Button>
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setCode("");
                setError(null);
                setNotice(null);
                setDevelopmentCode(null);
              }}
              className="text-espresso-900 underline underline-offset-4 hover:text-clay-500"
            >
              Ganti email
            </button>
            <button
              type="button"
              onClick={resend}
              disabled={busy}
              className="text-espresso-900 underline underline-offset-4 hover:text-clay-500 disabled:opacity-50"
            >
              Kirim ulang kode
            </button>
          </div>
        </form>
      ) : null}

      {step === "reset" ? (
        <form onSubmit={submitReset} noValidate className="mt-8 space-y-5">
          <Field
            label="Kata sandi baru"
            type="password"
            value={password}
            onChange={setPassword}
            error={errors.password}
            hint="Minimal 8 karakter."
            autoComplete="new-password"
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
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? "Menyimpan..." : "Simpan kata sandi"}
          </Button>
        </form>
      ) : null}

      {step === "done" ? (
        <div className="mt-8 space-y-5">
          <p className="rounded-2xl border border-sage-700 bg-ivory-50 p-4 text-sm text-sage-700">
            Kata sandi berhasil diganti. Silakan masuk lagi.
          </p>
          <Link
            href="/masuk"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-espresso-900 px-6 text-sm font-medium text-ivory-50"
          >
            Masuk
          </Link>
        </div>
      ) : null}

      {notice ? (
        <div
          role="status"
          className="mt-5 rounded-2xl border border-line bg-ivory-50 p-4 text-sm text-espresso-700"
        >
          <p>{notice}</p>
          {developmentCode ? (
            <p className="mt-2">
              Mode pengembangan, email belum diatur. Kode OTP kamu:{" "}
              <span className="font-medium tracking-[0.2em] text-espresso-900">
                {developmentCode}
              </span>
            </p>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-5 rounded-2xl border border-clay-500 bg-clay-50 p-4 text-sm text-clay-600"
        >
          {error}
        </p>
      ) : null}

      {step !== "done" ? (
        <p className="mt-8 text-sm text-espresso-500">
          Ingat kata sandi?{" "}
          <Link
            href="/masuk"
            className="text-espresso-900 underline underline-offset-4 hover:text-clay-500"
          >
            Masuk
          </Link>
        </p>
      ) : null}
    </div>
  );
}
