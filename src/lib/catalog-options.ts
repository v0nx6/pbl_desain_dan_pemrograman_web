export const catalogPriceRanges = [
  { value: "", label: "Semua harga" },
  { value: "0-500000", label: "Di bawah Rp 500.000" },
  { value: "500000-1000000", label: "Rp 500.000 sampai Rp 1.000.000" },
  { value: "1000000-2000000", label: "Rp 1.000.000 sampai Rp 2.000.000" },
  { value: "2000000-999999999", label: "Di atas Rp 2.000.000" },
] as const;

export const catalogSortOptions = [
  { value: "", label: "Urutan pilihan" },
  { value: "terbaru", label: "Terbaru" },
  { value: "terlaris", label: "Terlaris" },
  { value: "termurah", label: "Harga termurah" },
  { value: "termahal", label: "Harga termahal" },
] as const;

export type CatalogFilterInput = {
  kategori?: string;
  q?: string;
  ukuran?: string;
  tipe?: string;
  harga?: string;
  terbaik?: string;
  baru?: string;
  urut?: string;
};

export function catalogPriceRange(value: string): [number, number] | null {
  const range = catalogPriceRanges.find(
    (item) => item.value !== "" && item.value === value,
  );
  if (!range) return null;
  const [min, max] = range.value.split("-").map(Number);
  return [min, max];
}

export function hasCatalogFilter(filters: CatalogFilterInput): boolean {
  return Boolean(
    filters.q ||
      filters.ukuran ||
      filters.tipe ||
      filters.harga ||
      filters.terbaik ||
      filters.baru ||
      filters.urut,
  );
}
