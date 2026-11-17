import Link from "next/link";
import { WishlistButton } from "@/components/wishlist-button";
import { formatIDR } from "@/lib/format";
import type { Product } from "@/lib/types";
import { ProductMedia } from "@/components/ui/product-media";

export function ProductCard({
  product,
  saved = false,
  isLoggedIn = false,
  nextPath = "/#koleksi",
}: {
  product: Product;
  saved?: boolean;
  isLoggedIn?: boolean;
  nextPath?: string;
}) {
  const badge = product.isNew
    ? "Baru"
    : product.bestSeller
      ? "Favorit"
      : null;

  return (
    <article className="group">
      <div className="relative">
        <Link
          href={`/produk/${product.slug}`}
          className="block rounded-[var(--radius-card)] transition-shadow hover:ring-2 hover:ring-clay-500 hover:ring-offset-4 hover:ring-offset-ivory-100"
          aria-label={`Lihat ${product.name}`}
        >
          <ProductMedia product={product} className="aspect-[4/5]" />
        </Link>

        {badge ? (
          <span
            className={`absolute top-3 left-3 rounded-full px-3 py-1 text-[10px] font-semibold tracking-[0.12em] uppercase ${
              product.isNew
                ? "bg-clay-500 text-white"
                : "bg-ivory-50/95 text-espresso-900"
            }`}
          >
            {badge}
          </span>
        ) : null}

        <WishlistButton
          productId={product.id}
          initialSaved={saved}
          isLoggedIn={isLoggedIn}
          nextPath={nextPath}
          className="absolute top-3 right-3"
        />

        <Link
          href={`/try-on?produk=${product.slug}`}
          className="absolute right-3 bottom-3 inline-flex min-h-9 items-center rounded-full bg-ivory-50/95 px-3.5 text-[11px] font-medium text-espresso-900 transition-colors hover:bg-espresso-900 hover:text-ivory-50"
        >
          Coba dulu
        </Link>
      </div>

      <div className="mt-4">
        <p className="text-[10px] font-semibold tracking-[0.14em] text-espresso-500 uppercase">
          {product.productType === "couple" ? "Set couple" : product.material}
        </p>
        <div className="mt-1.5 flex items-start justify-between gap-3">
          <h3 className="min-w-0 font-display text-base leading-snug sm:text-lg">
            <Link href={`/produk/${product.slug}`} className="hover:text-clay-500">
              {product.name}
            </Link>
          </h3>
          <p className="shrink-0 pt-0.5 text-xs tabular-nums sm:text-sm">
            {formatIDR(product.price)}
          </p>
        </div>
      </div>
    </article>
  );
}
