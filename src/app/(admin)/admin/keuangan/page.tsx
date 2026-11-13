import { FinanceManager } from "@/components/admin/finance-manager";
import { buttonStyles } from "@/components/ui/button";
import { requireAdminPage } from "@/lib/auth";
import { getFinanceSummary, listFinanceEntries } from "@/lib/finance";

export const metadata = {
  title: "Keuangan",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const user = await requireAdminPage("/admin/keuangan");
  const [initialEntries, initialSummary] = await Promise.all([
    listFinanceEntries(),
    getFinanceSummary(),
  ]);

  return (
    <>
      <p className="text-sm text-espresso-500">
        Selamat datang, {user.name.split(" ")[0]}
      </p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl leading-tight">Keuangan</h1>
          <p className="mt-2 max-w-xl text-sm text-espresso-500">
            Catat pemasukan dan pengeluaran manual, lalu pantau saldo toko.
          </p>
        </div>
        <a
          href="/api/admin/finance/export"
          className={buttonStyles({ variant: "secondary" })}
          download
        >
          Unduh CSV pendapatan
        </a>
      </div>

      <FinanceManager
        initialEntries={initialEntries}
        initialSummary={initialSummary}
      />
    </>
  );
}
