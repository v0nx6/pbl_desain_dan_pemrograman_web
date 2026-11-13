"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import { CartDrawer } from "@/components/cart-drawer";
import { LogoutButton } from "@/components/logout-button";
import { Dialog } from "@/components/ui/dialog";
import { buttonStyles } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/label";
import type { SessionUser } from "@/lib/types";

const nav = [
  { href: "/#koleksi", label: "Koleksi" },
  { href: "/?kategori=baru#koleksi", label: "Baru" },
  { href: "/?kategori=batik#koleksi", label: "Batik" },
  { href: "/?kategori=kebaya#koleksi", label: "Kebaya" },
  { href: "/?kategori=priya#koleksi", label: "Pria" },
];

function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-baseline gap-2">
      <span
        className={`font-display text-lg font-semibold tracking-[0.16em] uppercase sm:text-xl ${
          light ? "text-ivory-50" : "text-espresso-900"
        }`}
      >
        Boutique
      </span>
      <span className="rounded-full bg-clay-500 px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em] text-white">
        NC
      </span>
    </span>
  );
}

export function SiteHeader({ user }: { user: SessionUser | null }) {
  const { count, open } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const firstName = user?.name.split(" ")[0];

  return (
    <header className="sticky top-0 z-40">
      <div className="bg-espresso-900 px-5 py-2 text-center text-[10px] font-medium tracking-[0.14em] text-ivory-100/85 uppercase sm:text-[11px]">
        Gratis ongkir buat pesanan di atas Rp 1.000.000
      </div>

      <div className="border-b border-line bg-ivory-100/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-[1540px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
          <Link href="/" aria-label="Boutique NC, beranda">
            <Wordmark />
          </Link>

          <nav aria-label="Navigasi utama" className="hidden lg:block">
            <ul className="flex items-center gap-8 text-sm">
              {nav.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="relative py-2 transition-colors hover:text-clay-500"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-3">
            {user ? (
              <Link
                href="/akun"
                className="hidden min-h-11 items-center px-2 text-sm transition-colors hover:text-clay-500 sm:inline-flex"
              >
                Halo, {firstName}
              </Link>
            ) : (
              <Link
                href="/masuk"
                className="hidden min-h-11 items-center px-2 text-sm transition-colors hover:text-clay-500 sm:inline-flex"
              >
                Masuk
              </Link>
            )}

            {user?.role === "ADMIN" ? (
              <Link
                href="/admin"
                className="hidden min-h-11 items-center px-2 text-sm transition-colors hover:text-clay-500 lg:inline-flex"
              >
                Admin
              </Link>
            ) : null}

            <button
              type="button"
              onClick={open}
              aria-haspopup="dialog"
              aria-label={`Buka keranjang, ${count} item`}
              className={buttonStyles({
                variant: "secondary",
                className: "min-h-10 gap-2 px-4 text-sm sm:min-h-11 sm:px-5",
              })}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <path d="M6 7h12l1 13H5L6 7Z" />
                <path d="M9 7a3 3 0 0 1 6 0" />
              </svg>
              <span className="hidden sm:inline">Keranjang</span>
              <span className="tabular-nums">({count})</span>
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Buka menu"
              aria-haspopup="dialog"
              className="inline-flex size-10 items-center justify-center rounded-full border border-line lg:hidden"
            >
              <span aria-hidden="true" className="space-y-1.5">
                <span className="block h-px w-5 bg-espresso-900" />
                <span className="block h-px w-5 bg-espresso-900" />
                <span className="block h-px w-5 bg-espresso-900" />
              </span>
            </button>
          </div>
        </div>
      </div>

      <Dialog open={menuOpen} onClose={() => setMenuOpen(false)} label="Menu">
        <div className="flex h-full flex-col bg-ivory-100 p-6">
          <div className="flex items-center justify-between">
            <Wordmark />
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Tutup menu"
              className="inline-flex size-11 items-center justify-center rounded-full border border-line text-xl leading-none"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>

          <div className="mt-10">
            <SectionLabel>Jelajahi</SectionLabel>
            <ul className="mt-4 space-y-1">
              {nav.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="block border-b border-line py-4 font-display text-3xl"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-auto grid gap-3 pt-8">
            {user ? (
              <>
                <Link
                  href="/akun"
                  onClick={() => setMenuOpen(false)}
                  className={buttonStyles({ variant: "secondary" })}
                >
                  Akun saya
                </Link>
                {user.role === "ADMIN" ? (
                  <Link
                    href="/admin"
                    onClick={() => setMenuOpen(false)}
                    className={buttonStyles({ variant: "quiet" })}
                  >
                    Dasbor admin
                  </Link>
                ) : null}
                <LogoutButton className="w-full" />
              </>
            ) : (
              <>
                <Link
                  href="/masuk"
                  onClick={() => setMenuOpen(false)}
                  className={buttonStyles({ variant: "secondary" })}
                >
                  Masuk
                </Link>
                <Link
                  href="/daftar"
                  onClick={() => setMenuOpen(false)}
                  className={buttonStyles({ variant: "quiet" })}
                >
                  Buat akun
                </Link>
              </>
            )}
            <Link
              href="/try-on"
              onClick={() => setMenuOpen(false)}
              className={buttonStyles({ variant: "quiet" })}
            >
              Coba AI Try-On
            </Link>
          </div>
        </div>
      </Dialog>

      <CartDrawer />
    </header>
  );
}
