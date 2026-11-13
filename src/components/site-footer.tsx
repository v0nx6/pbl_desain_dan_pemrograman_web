import Link from "next/link";

const collections = [
  { href: "/#koleksi", label: "Semua koleksi" },
  { href: "/?kategori=baru#koleksi", label: "Baru" },
  { href: "/?kategori=batik#koleksi", label: "Batik" },
  { href: "/?kategori=kebaya#koleksi", label: "Kebaya" },
  { href: "/?kategori=priya#koleksi", label: "Pria" },
];

const services = [
  { href: "/try-on", label: "AI Try-On" },
  { href: "/chat", label: "Chat" },
  { href: "/akun", label: "Akun saya" },
  { href: "/masuk", label: "Masuk" },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-espresso-900 text-ivory-100">
      <div className="mx-auto max-w-[1540px] px-5 py-14 sm:px-8 lg:px-10 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="font-display text-4xl leading-none tracking-[-0.02em] text-ivory-50 sm:text-5xl">
              Boutique NC
            </p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ivory-100/65">
              Kebaya, batik, dan tenun dari perajin lokal. Dibuat sedikit,
              dijahit rapi, dan enak dipakai lama.
            </p>
          </div>

          <div>
            <p className="text-[10px] font-semibold tracking-[0.18em] text-ivory-100/45 uppercase">
              Koleksi
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {collections.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="transition-colors hover:text-sand-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-semibold tracking-[0.18em] text-ivory-100/45 uppercase">
              Layanan
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {services.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="transition-colors hover:text-sand-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-ivory-50/15 pt-6 text-xs text-ivory-100/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Boutique NC.</p>
          <p>Kebaya, batik, dan tenun pilihan.</p>
        </div>
      </div>
    </footer>
  );
}
