"use client";

import Image from "next/image";
import { useState } from "react";
import { ProductMedia } from "@/components/ui/product-media";
import type { Product } from "@/lib/types";

export function ProductGallery({ product }: { product: Product }) {
  const images = [
    ...(product.image
      ? [{ id: "utama", url: product.image, alt: product.imageAlt }]
      : []),
    ...product.images,
  ].filter(
    (image, index, all) =>
      all.findIndex((entry) => entry.url === image.url) === index,
  );
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  if (!current) {
    return (
      <ProductMedia
        product={product}
        className="aspect-[4/5]"
        sizes="(min-width: 1024px) 50vw, 100vw"
        priority
      />
    );
  }

  return (
    <div>
      <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] bg-sand-300">
        <Image
          key={current.id}
          src={current.url}
          alt={current.alt ?? product.name}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          priority
          className="object-cover"
        />
      </div>

      {images.length > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Lihat foto ${index + 1}`}
              aria-current={index === active}
              className={`relative aspect-[4/5] w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-colors sm:w-20 ${
                index === active
                  ? "border-clay-500"
                  : "border-transparent hover:border-sand-500"
              }`}
            >
              <Image
                src={image.url}
                alt={image.alt ?? `${product.name}, foto ${index + 1}`}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
