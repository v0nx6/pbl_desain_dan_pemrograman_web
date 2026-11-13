/* eslint-disable @next/next/no-img-element */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import type { ReviewSummary, ReviewView } from "@/lib/types";

function StarIcon({
  filled,
  className = "size-4",
}: {
  filled: boolean;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="m12 3.6 2.6 5.3 5.9.9-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.2 5.9-.9Z" />
    </svg>
  );
}

function Stars({
  value,
  className = "size-4",
}: {
  value: number;
  className?: string;
}) {
  return (
    <span className="inline-flex items-center gap-0.5 text-clay-500">
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon key={star} filled={star <= Math.round(value)} className={className} />
      ))}
    </span>
  );
}

export function ProductReviews({
  productId,
  productSlug,
  reviews,
  summary,
  hasReviewed,
  isLoggedIn,
}: {
  productId: string;
  productSlug: string;
  reviews: ReviewView[];
  summary: ReviewSummary;
  hasReviewed: boolean;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previews]);

  function pickPhotos(list: FileList | null) {
    const picked = Array.from(list ?? []).slice(0, 3);
    setPhotos(picked);
    setPreviews(picked.map((file) => URL.createObjectURL(file)));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (comment.trim().length < 3) {
      setError("Tulis ulasan minimal 3 karakter.");
      return;
    }

    const body = new FormData();
    body.set("rating", String(rating));
    body.set("comment", comment.trim());
    for (const photo of photos) {
      body.append("photos", photo);
    }

    setBusy(true);
    try {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        body,
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Ulasan belum bisa dikirim. Coba lagi.");
        return;
      }

      setComment("");
      setRating(5);
      setPhotos([]);
      setPreviews([]);
      setNotice("Ulasan kamu sudah tampil. Terima kasih.");
      router.refresh();
    } catch {
      setError("Tidak bisa menghubungi server. Periksa koneksi lalu coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      id="ulasan"
      className="mt-16 scroll-mt-24 border-t border-line pt-10"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl">Ulasan pembeli</h2>
          <p className="mt-2 text-sm text-espresso-500">
            Ulasan ini khusus untuk produk ini, ditulis oleh pembeli yang sudah
            masuk.
          </p>
        </div>
        <div className="text-right">
          <p className="flex items-center justify-end gap-2 text-lg font-medium">
            {summary.count > 0 ? summary.average.toFixed(1) : "Belum ada"}
            {summary.count > 0 ? (
              <Stars value={summary.average} className="size-4" />
            ) : null}
          </p>
          <p className="mt-1 text-xs text-espresso-500">
            {summary.count > 0
              ? `${summary.count} ulasan`
              : "Jadilah yang pertama menulis ulasan"}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_0.85fr]">
        <div className="space-y-5">
          {reviews.length === 0 ? (
            <p className="rounded-[var(--radius-card)] border border-line bg-ivory-50 p-6 text-sm text-espresso-500">
              Belum ada ulasan untuk produk ini. Kalau kamu sudah membelinya,
              tulis pengalamanmu di sini.
            </p>
          ) : (
            reviews.map((review) => (
              <article
                key={review.id}
                className="rounded-[var(--radius-card)] border border-line bg-ivory-50 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">
                      {review.authorName}
                      {review.isMine ? (
                        <span className="ml-2 text-xs text-espresso-500">
                          Ulasan kamu
                        </span>
                      ) : null}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <Stars value={review.rating} />
                      <span className="text-xs text-espresso-500">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-espresso-700">
                  {review.comment}
                </p>
                {review.photos.length > 0 ? (
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {review.photos.map((photo) => (
                      <li key={photo.id}>
                        <a
                          href={photo.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block"
                        >
                          <img
                            src={photo.url}
                            alt={`Foto ulasan dari ${review.authorName}`}
                            loading="lazy"
                            className="size-20 rounded-xl border border-line object-cover"
                          />
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))
          )}
        </div>

        <div className="lg:sticky lg:top-28 lg:self-start">
          {!isLoggedIn ? (
            <div className="rounded-[var(--radius-card)] border border-line bg-ivory-50 p-5">
              <h3 className="font-display text-xl">Ingin menulis ulasan?</h3>
              <p className="mt-2 text-sm text-espresso-500">
                Masuk dulu supaya ulasanmu tersimpan di akun kamu.
              </p>
              <Link
                href={`/masuk?next=${encodeURIComponent(`/produk/${productSlug}#ulasan`)}`}
                className="mt-4 inline-flex min-h-11 items-center rounded-full bg-espresso-900 px-6 text-sm font-medium text-ivory-50"
              >
                Masuk untuk menulis ulasan
              </Link>
            </div>
          ) : hasReviewed ? (
            <div className="rounded-[var(--radius-card)] border border-line bg-ivory-50 p-5">
              <h3 className="font-display text-xl">Terima kasih</h3>
              <p className="mt-2 text-sm text-espresso-500">
                Kamu sudah menulis ulasan untuk produk ini. Ulasan kamu tampil
                di daftar sebelah.
              </p>
            </div>
          ) : (
            <form
              onSubmit={submit}
              noValidate
              className="rounded-[var(--radius-card)] border border-line bg-ivory-50 p-5"
            >
              <h3 className="font-display text-xl">Tulis ulasan</h3>

              <fieldset className="mt-4">
                <legend className="text-sm font-medium">Bintang</legend>
                <div className="mt-2 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <label
                      key={star}
                      className="cursor-pointer p-0.5 text-clay-500"
                      aria-label={`${star} bintang`}
                    >
                      <input
                        type="radio"
                        name="bintang"
                        value={star}
                        checked={rating === star}
                        onChange={() => setRating(star)}
                        className="sr-only"
                      />
                      <StarIcon filled={star <= rating} className="size-7" />
                    </label>
                  ))}
                  <span className="ml-2 text-sm text-espresso-500">
                    {rating} dari 5
                  </span>
                </div>
              </fieldset>

              <div className="mt-4">
                <label
                  htmlFor="ulasan-komentar"
                  className="block text-sm font-medium"
                >
                  Ulasan
                </label>
                <textarea
                  id="ulasan-komentar"
                  rows={4}
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Bagaimana bahan, jahitan, dan ukurannya?"
                  className="mt-2 w-full resize-y rounded-2xl border border-line bg-ivory-50 px-5 py-3 text-sm"
                />
              </div>

              <div className="mt-4">
                <label
                  htmlFor="ulasan-foto"
                  className="block text-sm font-medium"
                >
                  Foto (opsional)
                </label>
                <input
                  id="ulasan-foto"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={(event) => pickPhotos(event.target.files)}
                  className="mt-2 block w-full text-xs text-espresso-500 file:mr-3 file:rounded-full file:border-0 file:bg-ivory-200 file:px-4 file:py-2 file:text-xs file:font-medium file:text-espresso-900"
                />
                <p className="mt-1 text-xs text-espresso-500">
                  Maksimal 3 foto, masing-masing 5 MB.
                </p>
                {previews.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {previews.map((url) => (
                      <li key={url}>
                        <img
                          src={url}
                          alt="Pratinjau foto ulasan"
                          className="size-16 rounded-xl border border-line object-cover"
                        />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              <p className="mt-3 text-xs text-espresso-500">
                Satu akun bisa menulis satu ulasan per produk.
              </p>

              <Button
                type="submit"
                className="mt-4 w-full"
                disabled={busy}
              >
                {busy ? "Mengirim..." : "Kirim ulasan"}
              </Button>

              {error ? (
                <p role="alert" className="mt-3 text-sm text-clay-600">
                  {error}
                </p>
              ) : null}
              {notice ? (
                <p role="status" className="mt-3 text-sm text-sage-700">
                  {notice}
                </p>
              ) : null}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
