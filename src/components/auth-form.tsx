"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AddressPicker } from "@/components/address-picker";
import { GoogleSignIn } from "@/components/google-sign-in";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { SectionLabel } from "@/components/ui/label";
import { safeNextPath } from "@/lib/redirects";

type Mode = "masuk" | "daftar";

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  addressLine?: string;
  addressNote?: string;
};

const PHONE_PATTERN = /^[0-9+\-\s()]{8,20}$/;

const copy = {
  masuk: {
    label: "Akun",
    title: "Masuk",
    intro: "Masuk untuk checkout dan melihat hasil AI Try-On.",
    submit: "Masuk",
    busy: "Masuk...",
    switchText: "Belum punya akun?",
    switchLabel: "Buat akun",
    switchHref: "/daftar",
  },
  daftar: {
    label: "Akun baru",
    title: "Buat akun",
    intro: "Buat akun untuk menyimpan pesanan dan hasil try-on.",
    submit: "Buat akun",
    busy: "Membuat akun...",
    switchText: "Sudah punya akun?",
    switchLabel: "Masuk",
    switchHref: "/masuk",
  },
} as const;

function safeNext(value: string | null): string {
  return safeNextPath(value);
}

export function AuthForm({
  mode,
  next,
}: {
  mode: Mode;
  next: string | null;
}) {
  const router = useRouter();
  const text = copy[mode];
  const target = safeNext(next);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [addressNote, setAddressNote] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const local: FieldErrors = {};

    if (mode === "daftar" && name.trim().length < 2) {
      local.name = "Nama minimal 2 karakter.";
    }
    if (!email.includes("@")) local.email = "Masukkan alamat email yang valid.";
    if (mode === "daftar" && password.length < 8) {
      local.password = "Kata sandi minimal 8 karakter.";
    }
    if (mode === "masuk" && password.length === 0) {
      local.password = "Masukkan kata sandi.";
    }
    if (mode === "daftar") {
      if (!PHONE_PATTERN.test(phone.trim())) {
        local.phone = "Masukkan nomor telepon yang valid.";
      }
      if (addressLine.trim().length < 8) {
        local.addressLine = "Alamat minimal 8 karakter.";
      }
    }

    setErrors(local);
    setNotice(null);
    if (Object.keys(local).length > 0) return;

    setBusy(true);
    try {
      const endpoint = mode === "masuk" ? "login" : "register";
      const response = await fetch(`/api/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "daftar"
            ? {
                name: name.trim(),
                email: email.trim(),
                password,
                phone: phone.trim(),
                addressLine: addressLine.trim(),
                addressNote: addressNote.trim() || undefined,
              }
            : { email: email.trim(), password },
        ),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        details?: Record<string, string[] | undefined>;
      };

      if (!response.ok) {
        const details = data.details ?? {};
        const mapped: FieldErrors = {};
        if (details.name?.[0]) mapped.name = details.name[0];
        if (details.email?.[0]) mapped.email = details.email[0];
        if (details.password?.[0]) mapped.password = details.password[0];
        if (details.phone?.[0]) mapped.phone = details.phone[0];
        if (details.addressLine?.[0]) mapped.addressLine = details.addressLine[0];
        if (details.addressNote?.[0]) mapped.addressNote = details.addressNote[0];
        setErrors(mapped);
        setNotice(data.error ?? "Tidak bisa memproses permintaan. Coba lagi.");
        return;
      }

      router.push(target);
      router.refresh();
    } catch {
      setNotice("Tidak bisa menghubungi server. Periksa koneksi lalu coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-[440px] px-5 pt-14 pb-24 sm:px-8">
      <SectionLabel>{text.label}</SectionLabel>
      <h1 className="mt-3 font-display text-4xl leading-tight">{text.title}</h1>
      <p className="mt-3 text-sm text-espresso-500">{text.intro}</p>

      <GoogleSignIn next={target} />

      <form onSubmit={submit} noValidate className="mt-8 space-y-5">
        {mode === "daftar" ? (
          <Field
            label="Nama"
            value={name}
            onChange={setName}
            error={errors.name}
            autoComplete="name"
            required
          />
        ) : null}
        <Field
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          error={errors.email}
          autoComplete="email"
          required
        />
        <Field
          label="Kata sandi"
          type="password"
          value={password}
          onChange={setPassword}
          error={errors.password}
          hint={mode === "daftar" ? "Minimal 8 karakter." : undefined}
          autoComplete={mode === "daftar" ? "new-password" : "current-password"}
          required
        />
        {mode === "daftar" ? (
          <div className="space-y-5 border-t border-line pt-5">
            <div>
              <h2 className="font-display text-2xl">Alamat dan kontak</h2>
              <p className="mt-1 text-sm text-espresso-500">
                Disimpan untuk mengisi checkout berikutnya.
              </p>
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
            <AddressPicker
              address={addressLine}
              note={addressNote}
              onAddressChange={setAddressLine}
              onNoteChange={setAddressNote}
              errors={{
                addressLine: errors.addressLine,
                addressNote: errors.addressNote,
              }}
            />
          </div>
        ) : null}
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? text.busy : text.submit}
        </Button>
        {mode === "masuk" ? (
          <p className="text-center text-sm">
            <Link
              href="/lupa-sandi"
              className="text-espresso-500 underline underline-offset-4 hover:text-clay-500"
            >
              Lupa kata sandi?
            </Link>
          </p>
        ) : null}
      </form>

      {notice ? (
        <p
          role="alert"
          className="mt-5 rounded-2xl border border-clay-500 bg-clay-50 p-4 text-sm text-clay-600"
        >
          {notice}
        </p>
      ) : null}

      <p className="mt-8 text-sm text-espresso-500">
        {text.switchText}{" "}
        <Link
          href={
            next
              ? `${text.switchHref}?next=${encodeURIComponent(target)}`
              : text.switchHref
          }
          className="text-espresso-900 underline underline-offset-4 hover:text-clay-500"
        >
          {text.switchLabel}
        </Link>
      </p>

    </div>
  );
}
