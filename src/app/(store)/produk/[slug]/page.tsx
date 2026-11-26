import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BuyPanel } from "@/components/product-buy-panel";
import { ProductGallery } from "@/components/product-gallery";
import { ProductCard } from "@/components/product-card";
import { ProductReviews } from "@/components/product-reviews";
import { SizeGuide } from "@/components/size-guide";
import { WishlistButton } from "@/components/wishlist-button";
import { buttonStyles } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import { isProductFavorite } from "@/lib/favorites";
import { formatIDR } from "@/lib/format";
import { getProductReviews } from "@/lib/reviews";
import { absoluteUrl } from "@/lib/seo";

function productImageUrls(product: {
  image: string | null;
  images: { url: string }[];
}): string[] {
  return [
    ...new Set(
      [product.image, ...product.images.map((image) => image.url)].filter(
        (url): url is string => Boolean(url),
      ),
    ),
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Produk tidak ditemukan",
      robots: { index: false, follow: false },
    };
  }

  const url = absoluteUrl(`/produk/${product.slug}`);
  const description = `${product.description} Bahan ${product.material}.`;
  const gallery = productImageUrls(product).map(absoluteUrl);
  const images = gallery.length > 0 ? gallery : undefined;

  return {
    title: product.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: product.name,
      description,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const viewer = await getCurrentUser();
  const [{ reviews, summary, hasReviewed }, saved, related] = await Promise.all([
    getProductReviews(product.id, viewer?.id),
    viewer ? isProductFavorite(viewer.id, product.id) : Promise.resolve(false),
    getRelatedProducts(product),
  ]);

  const productUrl = absoluteUrl(`/produk/${product.slug}`);
  const inStock = Object.values(product.stockBySize).some((stock) => stock > 0);
  const gallery = productImageUrls(product).map(absoluteUrl);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.slug,
    material: product.material,
    brand: { "@type": "Brand", name: "Boutique NC" },
    ...(gallery.length > 0 ? { image: gallery } : {}),
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "IDR",
      price: String(product.price),
      itemCondition: "https://schema.org/NewCondition",
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
    ...(summary.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: summary.average.toFixed(1),
            reviewCount: summary.count,
          },
        }
      : {}),
  };

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-8 pb-20 sm:px-8 lg:px-10 lg:pt-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <nav aria-label="Remah roti" className="text-sm text-espresso-500">
        <Link href="/" className="hover:text-clay-500">
          Koleksi
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-espresso-900">{product.name}</span>
      </nav>

      <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <ProductGallery product={product} />

        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-xs font-semibold tracking-[0.14em] text-clay-500 uppercase">
            {product.material}
          </p>
          <h1 className="mt-3 font-display text-[clamp(2rem,3.4vw,3rem)] leading-tight">
            {product.name}
          </h1>
          <p className="mt-4 text-xl">{formatIDR(product.price)}</p>
          <p className="mt-6 max-w-lg leading-relaxed text-espresso-500">
            {product.description}
          </p>

          <BuyPanel product={product} />

          <Link
            href={`/try-on?produk=${product.slug}`}
            className={buttonStyles({
              variant: "secondary",
              className: "mt-3 w-full",
            })}
          >
            Coba dulu dengan AI Try-On
          </Link>

          <WishlistButton
            productId={product.id}
            initialSaved={saved}
            isLoggedIn={Boolean(viewer)}
            nextPath={`/produk/${product.slug}`}
            variant="full"
          />

          {product.sizeGuide.some(
            (row) => row.chest || row.length || row.waist,
          ) ? (
            <a
              href="#panduan-ukuran"
              className="mt-4 inline-flex text-sm underline underline-offset-4 hover:text-clay-500"
            >
              Lihat panduan ukuran
            </a>
          ) : null}

          <dl className="mt-10 space-y-3 border-t border-line pt-6 text-sm">
            <div className="flex justify-between gap-6">
              <dt className="text-espresso-500">Bahan</dt>
              <dd className="text-right">{product.material}</dd>
            </div>
            <div className="flex justify-between gap-6">
              <dt className="text-espresso-500">Ukuran tersedia</dt>
              <dd className="text-right">{product.sizes.join(", ")}</dd>
            </div>
            <div className="flex justify-between gap-6">
              <dt className="text-espresso-500">Pengiriman</dt>
              <dd className="text-right">
                Rp 25.000, gratis di atas Rp 1.000.000
              </dd>
            </div>
            <div className="flex justify-between gap-6">
              <dt className="text-espresso-500">Pembayaran</dt>
              <dd className="text-right">QRIS, COD, atau bayar online</dd>
            </div>
          </dl>
        </div>
      </div>

      <SizeGuide rows={product.sizeGuide} />

      {related.length > 0 ? (
        <section className="mt-16 border-t border-line pt-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-[0.14em] text-clay-500 uppercase">
                Pilihan lain
              </p>
              <h2 className="mt-2 font-display text-2xl sm:text-3xl">
                Mungkin Anda juga suka
              </h2>
            </div>
            <Link
              href="/#koleksi"
              className="text-sm underline underline-offset-4 hover:text-clay-500"
            >
              Lihat semua koleksi
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
            {related.map((item) => (
              <ProductCard
                key={item.slug}
                product={item}
                isLoggedIn={Boolean(viewer)}
                nextPath={`/produk/${product.slug}`}
              />
            ))}
          </div>
        </section>
      ) : null}

      <ProductReviews
        productId={product.id}
        productSlug={product.slug}
        reviews={reviews}
        summary={summary}
        hasReviewed={hasReviewed}
        isLoggedIn={Boolean(viewer)}
      />
    </div>
  );
}
