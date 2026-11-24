"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const items = [
  { id: "ringkasan", label: "Ringkasan", href: "/admin" },
  { id: "pesanan", label: "Pesanan", href: "/admin?view=pesanan" },
  { id: "produk", label: "Produk", href: "/admin?view=produk" },
  { id: "gambar", label: "Gambar situs", href: "/admin/gambar" },
  { id: "voucher", label: "Voucher", href: "/admin/voucher" },
  { id: "keuangan", label: "Keuangan", href: "/admin/keuangan" },
  { id: "chat", label: "Chat", href: "/admin?view=chat" },
] as const;

export function AdminNav({ variant }: { variant: "sidebar" | "mobile" }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const view = params.get("view") ?? "ringkasan";

  function isActive(id: (typeof items)[number]["id"]): boolean {
    if (pathname.startsWith("/admin/pesanan")) return id === "pesanan";
    if (pathname.startsWith("/admin/produk")) return id === "produk";
    if (pathname.startsWith("/admin/gambar")) return id === "gambar";
    if (pathname.startsWith("/admin/voucher")) return id === "voucher";
    if (pathname.startsWith("/admin/keuangan")) return id === "keuangan";
    return pathname === "/admin" && view === id;
  }

  return (
    <nav
      aria-label="Navigasi admin"
      className={
        variant === "sidebar"
          ? "mt-10"
          : "flex flex-wrap gap-2 border-b border-line px-5 py-3 lg:hidden"
      }
    >
      <ul
        className={
          variant === "sidebar" ? "space-y-1" : "flex flex-wrap gap-2"
        }
      >
        {items.map((item) => {
          const active = isActive(item.id);
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={
                  variant === "sidebar"
                    ? `flex min-h-11 items-center rounded-xl px-3 text-sm transition-colors focus-visible:outline-sand-200 ${
                        active
                          ? "bg-white/10 text-ivory-50"
                          : "text-ivory-200/80 hover:bg-white/5 hover:text-ivory-50"
                      }`
                    : `inline-flex min-h-11 items-center rounded-full px-4 text-sm ${
                        active
                          ? "bg-espresso-900 text-ivory-50"
                          : "border border-line bg-ivory-50"
                      }`
                }
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
