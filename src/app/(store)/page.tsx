import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CatalogFilters } from "@/components/catalog-filters";
import { HeroSlideshow } from "@/components/hero-slideshow";
import { ProductCard } from "@/components/product-card";
import { buttonStyles } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/label";
import { getCurrentUser } from "@/lib/auth";
import { catalogSizes, filterCatalog, getCatalog } from "@/lib/catalog";
import { hasCatalogFilter } from "@/lib/catalog-options";
import { collections } from "@/lib/collections";
import { getFavoriteProductIds } from "@/lib/favorites";
import { absoluteUrl } from "@/lib/seo";
import { getSiteImages } from "@/lib/site-images";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function StorefrontPage({
  searchParams,
}: {
  searchParams: Promise<{
    kategori?: string;
    q?: string;
    ukuran?: string;
    tipe?: string;
    harga?: string;
    terbaik?: string;
    baru?: string;
    urut?: string;
  }>;
}) {
  const params = await searchParams;
  const active =
    collections.find((item) => item.value === params.kategori) ??
    collections[0];
  const viewer = await getCurrentUser();
  const [catalog, siteImages, favoriteIds] = await Promise.all([
    getCatalog(),
    getSiteImages(),
    getFavoriteProductIds(viewer?.id),
  ]);
  const filters = {
    kategori: active.value,
    q: params.q ?? "",
    ukuran: params.ukuran ?? "",
    tipe: params.tipe ?? "",
    harga: params.harga ?? "",
    terbaik: params.terbaik ?? "",
    baru: params.baru ?? "",
    urut: params.urut ?? "",
  };
  const items = filterCatalog(catalog, filters);
  const hasExtraFilter = hasCatalogFilter(filters);
  const isFiltered = active.value !== "semua" || hasExtraFilter;
  const sizes = catalogSizes(catalog);

  function collectionHref(value: string): string {
    const query = new URLSearchParams();
    if (value !== "semua") query.set("kategori", value);
    if (filters.q) query.set("q", filters.q);
    if (filters.ukuran) query.set("ukuran", filters.ukuran);
    if (filters.tipe) query.set("tipe", filters.tipe);
    if (filters.harga) query.set("harga", filters.harga);
    if (filters.terbaik) query.set("terbaik", filters.terbaik);
    if (filters.baru) query.set("baru", filters.baru);
    if (filters.urut) query.set("urut", filters.urut);
    const suffix = query.toString();
    return `/${suffix ? `?${suffix}` : ""}#koleksi`;
  }

  const resetQuery = new URLSearchParams();
  if (active.value !== "semua") resetQuery.set("kategori", active.value);
  const resetSuffix = resetQuery.toString();
  const resetHref = `/${resetSuffix ? `?${resetSuffix}` : ""}#koleksi`;
  const heroSlides = siteImages
    .filter((image) => image.key.startsWith("hero"))
    .map((image) => ({
      image: image.image,
      alt: image.imageAlt ?? "Koleksi Boutique NC",
    }));
  const story = siteImages.find((image) => image.key === "story");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Boutique NC",
    url: absoluteUrl("/"),
    description:
      "Kebaya, batik, dan tenun pilihan dengan AI Virtual Try-On.",
    inLanguage: "id-ID",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <section className="px-3 pt-3 sm:px-5 lg:px-6">
        <div className="relative isolate mx-auto min-h-[70svh] max-w-[1540px] overflow-hidden rounded-[1.75rem] bg-sand-300 sm:min-h-[600px] lg:min-h-[700px]">
          <HeroSlideshow slides={heroSlides} />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r from-espresso-900/85 via-espresso-900/45 to-espresso-900/10"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-espresso-900/60 via-transparent to-transparent"
          />

          <div className="relative flex min-h-[70svh] flex-col justify-end px-6 py-8 sm:min-h-[600px] sm:px-10 sm:py-10 lg:min-h-[700px] lg:px-14 lg:py-14">
            <div className="max-w-3xl text-ivory-50">
              <p className="text-[11px] font-semibold tracking-[0.22em] text-ivory-100/80 uppercase">
                Koleksi {new Date().getFullYear()}
              </p>
              <h1 className="mt-4 font-display text-[clamp(2.75rem,6.4vw,5.6rem)] leading-[0.94] tracking-[-0.035em] text-balance">
                Kebaya buat harimu.
              </h1>
              <p className="mt-5 max-w-lg text-sm leading-relaxed text-ivory-100/85 sm:text-base">
                Batik, tenun, dan kebaya dari perajin lokal. Jahitannya rapi,
                dan kamu bisa coba dulu lewat AI Try-On sebelum beli.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="#koleksi"
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-ivory-50 px-7 text-sm font-medium text-espresso-900 transition-colors hover:bg-white"
                >
                  Lihat koleksi
                </Link>
                <Link
                  href="/try-on"
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-ivory-50/45 px-7 text-sm font-medium text-ivory-50 transition-colors hover:bg-ivory-50/10"
                >
                  Coba AI Try-On
                </Link>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-ivory-50/25 pt-5 text-[10px] font-semibold tracking-[0.18em] text-ivory-100/70 uppercase sm:text-[11px]">
              <span>Jumlahnya terbatas</span>
              <span>Bahan nyaman</span>
              <span>Coba dulu, baru beli</span>
            </div>
          </div>
        </div>
      </section>

      <section
        id="koleksi"
        className="mx-auto max-w-[1540px] scroll-mt-28 px-5 pt-14 sm:px-8 lg:px-10 lg:pt-20"
      >
        <div className="flex flex-col gap-5 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <SectionLabel>
              {filters.q
                ? "Hasil pencarian"
                : hasExtraFilter
                  ? "Hasil filter"
                  : isFiltered
                    ? `Kategori ${active.label}`
                    : "Pilihan kami"}
            </SectionLabel>
            <h2 className="mt-2 font-display text-[clamp(2rem,3.6vw,3.25rem)] leading-[1.02] tracking-[-0.02em]">
              {filters.q ? `Untuk "${filters.q}"` : "Yang lagi kami suka"}
            </h2>
          </div>

          <nav aria-label="Filter koleksi" className="flex flex-wrap gap-2">
            {collections.map((item) => {
              const selected = item.value === active.value;
              return (
                <Link
                  key={item.value}
                  href={collectionHref(item.value)}
                  aria-current={selected ? "true" : undefined}
                  className={`inline-flex min-h-11 items-center rounded-full border px-5 text-sm transition-colors ${
                    selected
                      ? "border-espresso-900 bg-espresso-900 text-ivory-50"
                      : "border-line bg-ivory-50 text-espresso-700 hover:border-espresso-900"
                  }`}
                >
                  {item.value === "semua" ? "Semua" : item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <CatalogFilters
          sizes={sizes}
          current={{
            q: filters.q,
            ukuran: filters.ukuran,
            tipe: filters.tipe,
            harga: filters.harga,
            terbaik: filters.terbaik,
            baru: filters.baru,
            urut: filters.urut,
          }}
          kategori={active.value}
          resultCount={items.length}
          hasFilter={hasExtraFilter}
          resetHref={resetHref}
        />

        {items.length === 0 ? (
          <div className="mt-10 rounded-[1.5rem] border border-line bg-ivory-50 px-8 py-16 text-center">
            <p className="font-display text-2xl">
              Belum ada produk yang cocok
            </p>
            <p className="mt-2 text-sm text-espresso-500">
              Coba ubah kata kunci, ukuran, kategori, atau rentang harga.
            </p>
            <Link
              href={hasExtraFilter ? resetHref : "/#koleksi"}
              className={buttonStyles({
                variant: "secondary",
                className: "mt-6",
              })}
            >
              {hasExtraFilter ? "Hapus filter" : "Lihat semua koleksi"}
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-12">
            {items.map((product) => (
              <ProductCard
                key={product.slug}
                product={product}
                saved={favoriteIds.includes(product.id)}
                isLoggedIn={Boolean(viewer)}
                nextPath="/#koleksi"
              />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto mt-20 max-w-[1540px] px-5 sm:px-8 lg:px-10">
        <div className="grid gap-8 rounded-[1.75rem] bg-ivory-50 p-6 sm:p-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12 lg:p-12">
          <div>
            <SectionLabel>Coba dulu</SectionLabel>
            <h2 className="mt-3 max-w-xl font-display text-[clamp(1.9rem,3.4vw,3rem)] leading-[1.04] tracking-[-0.02em]">
              Coba kebayanya dulu, baru pesan.
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-espresso-500 sm:text-base">
              Unggah satu foto, pilih produk, lalu lihat hasilnya. Foto Anda
              hanya digunakan untuk membuat hasil try-on dan tidak disimpan.
            </p>
            <Link
              href="/try-on"
              className={buttonStyles({ size: "lg", className: "mt-7" })}
            >
              Mulai try-on
            </Link>
          </div>

          <ol className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              {
                step: "01",
                title: "Pilih produk",
                body: "Buka koleksi, lalu pilih yang kamu suka.",
              },
              {
                step: "02",
                title: "Unggah foto",
                body: "Pakai foto seluruh badan dengan cahaya yang cukup.",
              },
              {
                step: "03",
                title: "Lihat hasilnya",
                body: "Kalau sudah cocok, simpan gambarnya dan lanjut checkout.",
              },
            ].map((item) => (
              <li
                key={item.step}
                className="flex gap-4 rounded-2xl border border-line px-4 py-4"
              >
                <span className="font-display text-sm text-clay-500">
                  {item.step}
                </span>
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-espresso-500">
                    {item.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mt-20 bg-espresso-900 text-ivory-50">
        <div className="mx-auto grid max-w-[1540px] lg:grid-cols-2">
          <div className="relative min-h-[360px] overflow-hidden sm:min-h-[460px] lg:min-h-[620px]">
            {story ? (
              <Image
                src={story.image}
                alt={story.imageAlt ?? "Perajin Boutique NC"}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            ) : null}
          </div>
          <div className="flex flex-col justify-center px-6 py-14 sm:px-10 lg:px-16">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-sand-300 uppercase">
              Cerita kami
            </p>
            <h2 className="mt-4 max-w-lg font-display text-[clamp(2rem,4vw,3.5rem)] leading-[1.03] tracking-[-0.02em]">
              Kain pilihan, dijahit dengan sabar.
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-ivory-100/75 sm:text-base">
              Kami kerja sama dengan perajin lokal supaya motif, warna, dan
              jahitannya tetap terjaga. Tiap potong dibuat dalam jumlah kecil,
              jadi tidak ada yang benar-benar sama.
            </p>

            <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-ivory-50/20 pt-6">
              <div>
                <dt className="text-xs text-ivory-100/55">Bahan</dt>
                <dd className="mt-1 text-sm">Kain pilihan</dd>
              </div>
              <div>
                <dt className="text-xs text-ivory-100/55">Jahitan</dt>
                <dd className="mt-1 text-sm">Rapi</dd>
              </div>
              <div>
                <dt className="text-xs text-ivory-100/55">Ukuran</dt>
                <dd className="mt-1 text-sm">Beragam</dd>
              </div>
            </dl>

            <Link
              href="#koleksi"
              className="mt-8 inline-flex min-h-12 w-fit items-center justify-center rounded-full border border-ivory-50/40 px-7 text-sm font-medium transition-colors hover:bg-ivory-50 hover:text-espresso-900"
            >
              Lihat koleksi
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
