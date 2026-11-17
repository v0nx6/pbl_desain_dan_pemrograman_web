"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent } from "react";
import { buttonStyles } from "@/components/ui/button";
import {
  catalogPriceRanges,
  catalogSortOptions,
} from "@/lib/catalog-options";

export function CatalogFilters({
  sizes,
  current,
  kategori,
  resultCount,
  hasFilter,
  resetHref,
}: {
  sizes: string[];
  current: {
    q: string;
    ukuran: string;
    tipe: string;
    harga: string;
    terbaik: string;
    baru: string;
    urut: string;
  };
  kategori: string;
  resultCount: number;
  hasFilter: boolean;
  resetHref: string;
}) {
  const router = useRouter();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const query = new URLSearchParams();
    for (const [key, value] of data.entries()) {
      if (typeof value === "string" && value) query.set(key, value);
    }
    const suffix = query.toString();
    router.push(`/${suffix ? `?${suffix}` : ""}#koleksi`);
  }

  return (
    <form
      method="get"
      action="/#koleksi"
      onSubmit={submit}
      className="mt-6 rounded-[1.5rem] border border-line bg-ivory-50 p-4 sm:p-5"
    >
      {kategori && kategori !== "semua" ? (
        <input type="hidden" name="kategori" value={kategori} />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-[1.6fr_1fr]">
        <label className="block">
          <span className="text-xs font-medium text-espresso-500">
            Cari produk
          </span>
          <input
            type="search"
            name="q"
            defaultValue={current.q}
            placeholder="Cari nama, bahan, atau motif"
            className="mt-1.5 min-h-11 w-full rounded-full border border-line bg-ivory-50 px-5 text-sm"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-espresso-500">
            Urutkan
          </span>
          <select
            name="urut"
            defaultValue={current.urut}
            className="mt-1.5 min-h-11 w-full rounded-full border border-line bg-ivory-50 px-4 text-sm"
          >
            {catalogSortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <label className="block">
          <span className="text-xs font-medium text-espresso-500">Ukuran</span>
          <select
            name="ukuran"
            defaultValue={current.ukuran}
            className="mt-1.5 min-h-11 w-full rounded-full border border-line bg-ivory-50 px-4 text-sm"
          >
            <option value="">Semua ukuran</option>
            {sizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-espresso-500">
            Kategori
          </span>
          <select
            name="tipe"
            defaultValue={current.tipe}
            className="mt-1.5 min-h-11 w-full rounded-full border border-line bg-ivory-50 px-4 text-sm"
          >
            <option value="">Single dan couple</option>
            <option value="single">Single</option>
            <option value="couple">Couple</option>
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-espresso-500">Harga</span>
          <select
            name="harga"
            defaultValue={current.harga}
            className="mt-1.5 min-h-11 w-full rounded-full border border-line bg-ivory-50 px-4 text-sm"
          >
            {catalogPriceRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-espresso-500">
            Produk terbaik
          </span>
          <select
            name="terbaik"
            defaultValue={current.terbaik}
            className="mt-1.5 min-h-11 w-full rounded-full border border-line bg-ivory-50 px-4 text-sm"
          >
            <option value="">Semua produk</option>
            <option value="1">Hanya produk terbaik</option>
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-espresso-500">
            Produk baru
          </span>
          <select
            name="baru"
            defaultValue={current.baru}
            className="mt-1.5 min-h-11 w-full rounded-full border border-line bg-ivory-50 px-4 text-sm"
          >
            <option value="">Semua produk</option>
            <option value="1">Hanya produk baru</option>
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-espresso-500">
          {resultCount} produk ditampilkan
          {hasFilter ? " sesuai filter." : "."}
        </p>
        <div className="flex flex-wrap gap-2">
          {hasFilter ? (
            <Link href={resetHref} className={buttonStyles({ variant: "quiet" })}>
              Reset filter
            </Link>
          ) : null}
          <button
            type="submit"
            className={buttonStyles({ variant: "primary" })}
          >
            Terapkan filter
          </button>
        </div>
      </div>
    </form>
  );
}
