"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, buttonStyles } from "@/components/ui/button";

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
    </svg>
  );
}

export function WishlistButton({
  productId,
  initialSaved,
  isLoggedIn,
  nextPath,
  variant = "icon",
  className = "",
}: {
  productId: string;
  initialSaved: boolean;
  isLoggedIn: boolean;
  nextPath: string;
  variant?: "icon" | "full";
  className?: string;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isLoggedIn) {
    if (variant === "full") {
      return (
        <Link
          href={`/masuk?next=${encodeURIComponent(nextPath)}`}
          className={buttonStyles({
            variant: "secondary",
            className: `mt-3 w-full ${className}`.trim(),
          })}
        >
          Masuk untuk menyimpan
        </Link>
      );
    }

    return (
      <Link
        href={`/masuk?next=${encodeURIComponent(nextPath)}`}
        aria-label="Masuk untuk menyimpan produk ke favorit"
        title="Masuk untuk menyimpan"
        className={`inline-flex size-10 items-center justify-center rounded-full bg-ivory-50/95 text-espresso-900 shadow-sm transition-colors hover:bg-espresso-900 hover:text-ivory-50 ${className}`.trim()}
      >
        <HeartIcon filled={false} />
      </Link>
    );
  }

  async function toggle() {
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      const response = await fetch(`/api/wishlist/${productId}`, {
        method: "POST",
      });
      const data = (await response.json().catch(() => ({}))) as {
        saved?: boolean;
        error?: string;
      };

      if (!response.ok || typeof data.saved !== "boolean") {
        setError(data.error ?? "Favorit belum bisa disimpan. Coba lagi.");
        return;
      }

      setSaved(data.saved);
      router.refresh();
    } catch {
      setError("Tidak bisa menghubungi server. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  if (variant === "full") {
    return (
      <div className={`mt-3 ${className}`.trim()}>
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={toggle}
          disabled={busy}
          aria-pressed={saved}
        >
          <HeartIcon filled={saved} />
          {busy
            ? "Menyimpan..."
            : saved
              ? "Tersimpan di favorit"
              : "Simpan ke favorit"}
        </Button>
        {error ? (
          <p role="alert" className="mt-2 text-xs text-clay-600">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={saved}
      aria-label={saved ? "Hapus dari favorit" : "Simpan ke favorit"}
      title={saved ? "Hapus dari favorit" : "Simpan ke favorit"}
      className={`inline-flex size-10 items-center justify-center rounded-full bg-ivory-50/95 text-espresso-900 shadow-sm transition-colors hover:bg-espresso-900 hover:text-ivory-50 disabled:opacity-60 ${className}`.trim()}
    >
      <HeartIcon filled={saved} />
    </button>
  );
}
