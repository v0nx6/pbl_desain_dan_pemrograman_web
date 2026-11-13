import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BuyPanel } from "@/components/product-buy-panel";
import { ProductReviews } from "@/components/product-reviews";
import { buttonStyles } from "@/components/ui/button";
import { ProductMedia } from "@/components/ui/product-media";
import { getCurrentUser } from "@/lib/auth";
import { getProductBySlug } from "@/lib/catalog";
import { formatIDR } from "@/lib/format";
import { getProductReviews } from "@/lib/reviews";
import { absoluteUrl } from "@/lib/seo";

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
  const images = product.image ? [absoluteUrl(product.image)] : undefined;

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
  const { reviews, summary, hasReviewed } = await getProductReviews(
    product.id,
    viewer?.id,
  );

  const productUrl = absoluteUrl(`/produk/${product.slug}`);
  const inStock = Object.values(product.stockBySize).some((stock) => stock > 0);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.slug,
    material: product.material,
    brand: { "@type": "Brand", name: "Boutique NC" },
    ...(product.image ? { image: [absoluteUrl(product.image)] } : {}),
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
        <ProductMedia
          product={product}
          className="aspect-[4/5]"
          sizes="(min-width: 1024px) 50vw, 100vw"
          priority
        />

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
              <dd className="text-right">QRIS, transfer bank, atau COD</dd>
            </div>
          </dl>
        </div>
      </div>

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
