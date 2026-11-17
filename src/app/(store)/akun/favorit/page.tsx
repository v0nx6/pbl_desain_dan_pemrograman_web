import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { buttonStyles } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/label";
import { requirePageUser } from "@/lib/auth";
import { getFavoriteProducts } from "@/lib/favorites";

export const metadata = { title: "Favorit saya" };

export default async function FavoritesPage() {
  const user = await requirePageUser("/akun/favorit");
  const products = await getFavoriteProducts(user.id);

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-10 pb-24 sm:px-8 lg:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionLabel>Favorit</SectionLabel>
          <h1 className="mt-3 font-display text-[clamp(2rem,3.4vw,3rem)] leading-tight">
            Produk yang kamu simpan
          </h1>
          <p className="mt-2 text-sm text-espresso-500">
            {products.length > 0
              ? `${products.length} produk ada di daftar favorit.`
              : "Belum ada produk yang disimpan."}
          </p>
        </div>
        <Link
          href="/akun"
          className={buttonStyles({ variant: "quiet" })}
        >
          Kembali ke akun
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="mt-8 rounded-[var(--radius-card)] border border-line bg-ivory-50 px-8 py-14 text-center">
          <p className="font-display text-2xl">Daftar favorit masih kosong</p>
          <p className="mt-2 text-sm text-espresso-500">
            Tekan ikon hati di kartu produk untuk menyimpannya ke sini.
          </p>
          <Link
            href="/#koleksi"
            className={buttonStyles({
              variant: "secondary",
              className: "mt-6",
            })}
          >
            Lihat koleksi
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-12">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              saved
              isLoggedIn
              nextPath="/akun/favorit"
            />
          ))}
        </div>
      )}
    </div>
  );
}
