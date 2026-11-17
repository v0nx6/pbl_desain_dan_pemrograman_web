import type { SizeGuideRow } from "@/lib/types";

function measurement(value: number | null): string {
  return value ? `${value} cm` : "-";
}

export function SizeGuide({ rows }: { rows: SizeGuideRow[] }) {
  const filled = rows.some((row) => row.chest || row.length || row.waist);
  if (!filled) return null;

  return (
    <section
      id="panduan-ukuran"
      aria-labelledby="judul-panduan-ukuran"
      className="mt-14 scroll-mt-28 border-t border-line pt-8"
    >
      <h2
        id="judul-panduan-ukuran"
        className="font-display text-2xl leading-tight"
      >
        Panduan ukuran
      </h2>
      <p className="mt-2 max-w-xl text-sm text-espresso-500">
        Ukuran badan dalam sentimeter. Toleransi jahit sekitar 1 sampai 2 cm.
        Kalau ukuranmu berada di antara dua pilihan, ambil yang lebih besar.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[440px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs tracking-[0.08em] text-espresso-500 uppercase">
              <th scope="col" className="py-3 pr-4 font-medium">
                Ukuran
              </th>
              <th scope="col" className="py-3 pr-4 font-medium">
                Lingkar dada
              </th>
              <th scope="col" className="py-3 pr-4 font-medium">
                Panjang badan
              </th>
              <th scope="col" className="py-3 font-medium">
                Lingkar pinggang
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.size} className="border-b border-line last:border-0">
                <th scope="row" className="py-3 pr-4 text-left font-medium">
                  {row.size}
                </th>
                <td className="py-3 pr-4 tabular-nums">
                  {measurement(row.chest)}
                </td>
                <td className="py-3 pr-4 tabular-nums">
                  {measurement(row.length)}
                </td>
                <td className="py-3 tabular-nums">
                  {measurement(row.waist)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
