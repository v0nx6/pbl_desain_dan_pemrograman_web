import { VoucherManager } from "@/components/admin/voucher-manager";
import { requireAdminPage } from "@/lib/auth";
import { listVouchers } from "@/lib/vouchers";

export const dynamic = "force-dynamic";
export const metadata = { title: "Voucher" };

export default async function VoucherPage() {
  await requireAdminPage("/admin/voucher");
  const vouchers = await listVouchers();

  return (
    <>
      <p className="text-sm text-espresso-500">Promo toko</p>
      <div className="mt-1">
        <h1 className="font-display text-4xl leading-tight">Voucher</h1>
        <p className="mt-2 max-w-2xl text-sm text-espresso-500">
          Buat kode potongan harga untuk pelanggan. Pelanggan memasukkan kode
          ini di halaman checkout.
        </p>
      </div>

      <div className="mt-6">
        <VoucherManager vouchers={vouchers} />
      </div>
    </>
  );
}
