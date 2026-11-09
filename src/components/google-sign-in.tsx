"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { firebaseAuth, firebaseConfigured } from "@/lib/firebase/client";

function googleErrorMessage(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";

  if (
    code === "auth/popup-closed-by-user" ||
    code === "auth/cancelled-popup-request"
  ) {
    return "Jendela Google ditutup. Coba lagi kalau mau lanjut.";
  }
  if (code === "auth/popup-blocked") {
    return "Izinkan popup di browser, lalu coba lagi.";
  }
  if (code === "auth/unauthorized-domain") {
    return "Masuk dengan Google belum siap untuk alamat website ini.";
  }
  if (code === "auth/operation-not-allowed") {
    return "Masuk dengan Google belum aktif.";
  }
  if (code === "auth/network-request-failed") {
    return "Tidak bisa menghubungi Google. Periksa koneksi lalu coba lagi.";
  }

  return "Masuk dengan Google gagal. Coba lagi.";
}

export function GoogleSignIn({ next }: { next: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!firebaseConfigured) return null;

  async function submit() {
    const auth = firebaseAuth();
    if (!auth) {
      setError("Masuk dengan Google belum siap.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const provider = new GoogleAuthProvider();
      provider.addScope("email");
      provider.setCustomParameters({ prompt: "select_account" });

      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      const response = await fetch("/api/auth/firebase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        needsProfile?: boolean;
      };

      if (!response.ok) {
        setError(data.error ?? "Masuk dengan Google gagal. Coba lagi.");
        return;
      }

      if (data.needsProfile) {
        router.push("/akun/profil?lengkapi=alamat");
      } else {
        router.push(next || "/");
      }
      router.refresh();
    } catch (caught) {
      setError(googleErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6">
      <Button
        type="button"
        variant="secondary"
        size="lg"
        className="w-full gap-2.5"
        onClick={submit}
        disabled={busy}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4">
          <path
            fill="#4285F4"
            d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.54-5.17 3.54-8.87Z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.95H1.27v3.1A12 12 0 0 0 12 24Z"
          />
          <path
            fill="#FBBC05"
            d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58v-3.1H1.27a12 12 0 0 0 0 10.78l4-3.1Z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.23 0 12 0A12 12 0 0 0 1.27 6.61l4 3.1C6.22 6.87 8.87 4.75 12 4.75Z"
          />
        </svg>
        {busy ? "Menghubungkan..." : "Masuk dengan Google"}
      </Button>
      <p className="mt-3 text-center text-xs text-espresso-500">
        atau isi email di bawah
      </p>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-clay-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
