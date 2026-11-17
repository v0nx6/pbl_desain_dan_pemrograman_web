"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { Button, buttonStyles } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import type { Collection, Product, ProductType } from "@/lib/types";

type VariantRow = {
  size: string;
  stock: string;
  chest: string;
  length: string;
  waist: string;
};

type GalleryRow = { path: string; alt: string };

type FieldErrors = Record<string, string | undefined>;

const collectionOptions: { value: Collection; label: string }[] = [
  { value: "baru", label: "Baru" },
  { value: "batik", label: "Batik" },
  { value: "kebaya", label: "Kebaya" },
  { value: "priya", label: "Pria" },
];

const categories = [
  { value: "upper_body", label: "Atasan" },
  { value: "lower_body", label: "Bawahan" },
  { value: "dresses", label: "Gaun / set" },
];

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_GALLERY = 8;
const IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export function ProductForm({
  mode,
  product,
}: {
  mode: "create" | "edit";
  product?: Product;
}) {
  const router = useRouter();

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [material, setMaterial] = useState(product?.material ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [collections, setCollections] = useState<Collection[]>(
    product?.collections ?? ["baru"],
  );
  const [productType, setProductType] = useState<ProductType>(
    product?.productType ?? "single",
  );
  const [bestSeller, setBestSeller] = useState(product?.bestSeller ?? false);
  const [isNew, setIsNew] = useState(product?.isNew ?? false);
  const [tone, setTone] = useState(String(product?.tone ?? 300));
  const [image, setImage] = useState(product?.image ?? "");
  const [imageAlt, setImageAlt] = useState(product?.imageAlt ?? "");
  const [gallery, setGallery] = useState<GalleryRow[]>(
    product?.images.map((item) => ({
      path: item.url,
      alt: item.alt ?? "",
    })) ?? [],
  );
  const [tryOnCategory, setTryOnCategory] = useState(
    product?.tryOnCategory ?? "upper_body",
  );
  const [tryOnPhotoType, setTryOnPhotoType] = useState(
    product?.tryOnPhotoType ?? "",
  );
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [active, setActive] = useState(product?.active ?? true);
  const [variants, setVariants] = useState<VariantRow[]>(
    product
      ? product.sizes.map((size) => {
          const guide = product.sizeGuide.find((row) => row.size === size);
          return {
            size,
            stock: String(product.stockBySize[size] ?? 0),
            chest: guide?.chest ? String(guide.chest) : "",
            length: guide?.length ? String(guide.length) : "",
            waist: guide?.waist ? String(guide.waist) : "",
          };
        })
      : [{ size: "M", stock: "0", chest: "", length: "", waist: "" }],
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function toggleCollection(value: Collection) {
    setCollections((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }

  function updateVariant(index: number, patch: Partial<VariantRow>) {
    setVariants((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row,
      ),
    );
  }

  function updateGallery(index: number, patch: Partial<GalleryRow>) {
    setGallery((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row,
      ),
    );
  }

  async function uploadImage(file: File | undefined) {
    if (!file) return;

    setImageError(null);
    if (!IMAGE_TYPES.includes(file.type)) {
      setImageError("Foto harus JPG, PNG, atau WEBP.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError("Ukuran foto melebihi 5 MB.");
      return;
    }

    const body = new FormData();
    body.set("image", file);

    setUploadingImage(true);
    try {
      const response = await fetch("/api/products/image", {
        method: "POST",
        body,
      });
      const data = (await response.json().catch(() => ({}))) as {
        image?: string;
        error?: string;
      };

      if (!response.ok || !data.image) {
        setImageError(data.error ?? "Foto tidak bisa diunggah.");
        return;
      }

      setImage(data.image);
    } catch {
      setImageError("Tidak bisa menghubungi server. Coba lagi.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function uploadGallery(files: FileList | null) {
    if (!files || files.length === 0) return;

    setGalleryError(null);
    const remaining = MAX_GALLERY - gallery.length;
    if (remaining <= 0) {
      setGalleryError("Galeri sudah penuh. Hapus satu foto dulu.");
      return;
    }

    const selected = Array.from(files).slice(0, remaining);
    const added: GalleryRow[] = [];
    setUploadingGallery(true);

    try {
      for (const file of selected) {
        if (!IMAGE_TYPES.includes(file.type)) {
          setGalleryError("Foto harus JPG, PNG, atau WEBP.");
          continue;
        }
        if (file.size > MAX_IMAGE_BYTES) {
          setGalleryError("Ukuran foto melebihi 5 MB.");
          continue;
        }

        const body = new FormData();
        body.set("image", file);
        const response = await fetch("/api/products/image", {
          method: "POST",
          body,
        });
        const data = (await response.json().catch(() => ({}))) as {
          image?: string;
          error?: string;
        };

        if (!response.ok || !data.image) {
          setGalleryError(data.error ?? "Foto galeri tidak bisa diunggah.");
          continue;
        }

        added.push({ path: data.image, alt: "" });
      }
    } catch {
      setGalleryError("Tidak bisa menghubungi server. Coba lagi.");
    } finally {
      if (added.length > 0) {
        setGallery((current) => [...current, ...added].slice(0, MAX_GALLERY));
      }
      setUploadingGallery(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const local: FieldErrors = {};
    if (name.trim().length < 2) local.name = "Nama minimal 2 karakter.";
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim())) {
      local.slug = "Slug hanya huruf kecil, angka, dan tanda hubung.";
    }
    if (description.trim().length < 10) {
      local.description = "Deskripsi minimal 10 karakter.";
    }
    if (material.trim().length < 2) local.material = "Bahan minimal 2 karakter.";
    if (Number(price) < 1000) local.price = "Harga minimal Rp 1.000.";
    if (collections.length === 0) {
      local.collections = "Pilih minimal satu koleksi.";
    }
    if (variants.length === 0) {
      local.variants = "Tambahkan minimal satu ukuran.";
    }
    if (variants.some((row) => !row.size.trim())) {
      local.variants = "Setiap ukuran harus punya nama.";
    }
    if (variants.some((row) => Number(row.stock) < 0 || row.stock === "")) {
      local.variants = "Stok harus 0 atau lebih.";
    }
    const measurementInvalid = variants.some((row) =>
      [row.chest, row.length, row.waist].some((value) => {
        if (value === "") return false;
        const number = Number(value);
        return !Number.isInteger(number) || number < 1 || number > 300;
      }),
    );
    if (measurementInvalid) {
      local.variants = "Ukuran badan harus 1 sampai 300 cm.";
    }
    if (gallery.length > MAX_GALLERY) {
      local.images = `Maksimal ${MAX_GALLERY} foto galeri.`;
    }

    setErrors(local);
    setNotice(null);
    if (Object.keys(local).length > 0) return;

    const payload = {
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim(),
      material: material.trim(),
      price: Number(price),
      collections,
      productType,
      bestSeller,
      isNew,
      tone: Number(tone),
      image: image.trim(),
      imageAlt: imageAlt.trim(),
      images: gallery.map((row) => ({
        path: row.path,
        alt: row.alt.trim(),
      })),
      tryOnCategory,
      tryOnPhotoType: tryOnPhotoType || null,
      active,
      variants: variants.map((row) => ({
        size: row.size.trim(),
        stock: Number(row.stock),
        chestCm: row.chest === "" ? undefined : Number(row.chest),
        lengthCm: row.length === "" ? undefined : Number(row.length),
        waistCm: row.waist === "" ? undefined : Number(row.waist),
      })),
    };

    setBusy(true);
    try {
      const response = await fetch(
        mode === "create" ? "/api/products" : `/api/products/${product?.id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        details?: Record<string, string[] | undefined>;
      };

      if (!response.ok) {
        const details = data.details ?? {};
        const mapped: FieldErrors = {};
        for (const key of [
          "name",
          "slug",
          "description",
          "material",
          "price",
          "collections",
          "productType",
          "bestSeller",
          "isNew",
          "image",
          "imageAlt",
          "images",
          "tryOnCategory",
          "tryOnPhotoType",
          "variants",
        ]) {
          if (details[key]?.[0]) mapped[key] = details[key][0];
        }
        setErrors(mapped);
        setNotice(data.error ?? "Produk tidak bisa disimpan. Periksa isian.");
        return;
      }

      router.push("/admin?view=produk");
      router.refresh();
    } catch {
      setNotice("Tidak bisa menghubungi server. Periksa koneksi lalu coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-5 rounded-3xl bg-ivory-50 p-5 sm:p-6">
          <h2 className="font-display text-2xl">Informasi produk</h2>
          <Field
            label="Nama produk"
            value={name}
            onChange={setName}
            error={errors.name}
            required
          />
          <Field
            label="Slug"
            value={slug}
            onChange={setSlug}
            error={errors.slug}
            hint="Dipakai di URL, contoh: kebaya-encim-modern."
            required
          />
          <Field
            label="Harga (Rp)"
            type="number"
            value={price}
            onChange={setPrice}
            error={errors.price}
            required
          />
          <Field
            label="Bahan"
            value={material}
            onChange={setMaterial}
            error={errors.material}
            required
          />

          <div>
            <label
              htmlFor="deskripsi-produk"
              className="block text-sm font-medium"
            >
              Deskripsi
            </label>
            <textarea
              id="deskripsi-produk"
              rows={5}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className={`mt-2 w-full resize-y rounded-2xl border bg-ivory-50 px-5 py-3 text-sm ${
                errors.description ? "border-clay-500" : "border-line"
              }`}
            />
            {errors.description ? (
              <p className="mt-2 text-xs text-clay-600">{errors.description}</p>
            ) : null}
          </div>
        </section>

        <section className="space-y-5 rounded-3xl bg-ivory-50 p-5 sm:p-6">
          <h2 className="font-display text-2xl">Tampilan dan koleksi</h2>

          <fieldset>
            <legend className="text-sm font-medium">Koleksi</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {collectionOptions.map((option) => {
                const checked = collections.includes(option.value);
                return (
                  <label
                    key={option.value}
                    className={`inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-sm focus-within:outline-2 focus-within:outline-clay-500 focus-within:outline-offset-2 ${
                      checked
                        ? "border-clay-500 bg-clay-500 text-white"
                        : "border-line bg-ivory-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCollection(option.value)}
                      className="sr-only"
                    />
                    {option.label}
                  </label>
                );
              })}
            </div>
            {errors.collections ? (
              <p className="mt-2 text-xs text-clay-600">{errors.collections}</p>
            ) : null}
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium">Kategori produk</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {(
                [
                  { value: "single", label: "Single" },
                  { value: "couple", label: "Couple" },
                ] as const
              ).map((option) => {
                const checked = productType === option.value;
                return (
                  <label
                    key={option.value}
                    className={`inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-sm focus-within:outline-2 focus-within:outline-clay-500 focus-within:outline-offset-2 ${
                      checked
                        ? "border-clay-500 bg-clay-500 text-white"
                        : "border-line bg-ivory-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="kategori-produk"
                      value={option.value}
                      checked={checked}
                      onChange={() => setProductType(option.value)}
                      className="sr-only"
                    />
                    {option.label}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="grid gap-2">
            <label className="flex min-h-11 items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={bestSeller}
                onChange={(event) => setBestSeller(event.target.checked)}
                className="size-5 rounded border-line"
              />
              Tandai sebagai produk terbaik
            </label>
            <label className="flex min-h-11 items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={isNew}
                onChange={(event) => setIsNew(event.target.checked)}
                className="size-5 rounded border-line"
              />
              Tandai sebagai produk baru
            </label>
          </div>

          <div>
            <label htmlFor="kategori-tryon" className="block text-sm font-medium">
              Kategori try-on
            </label>
            <select
              id="kategori-tryon"
              value={tryOnCategory}
              onChange={(event) => setTryOnCategory(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-full border border-line bg-ivory-50 px-5 text-sm"
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="foto-tryon" className="block text-sm font-medium">
              Foto untuk try-on
            </label>
            <select
              id="foto-tryon"
              value={tryOnPhotoType}
              onChange={(event) => setTryOnPhotoType(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-full border border-line bg-ivory-50 px-5 text-sm"
            >
              <option value="">Tidak dipakai untuk try-on</option>
              <option value="model">Model / manekin</option>
              <option value="flat-lay">Flat-lay</option>
            </select>
            <p className="mt-2 text-xs text-espresso-500">
              Pilih hanya jika foto menampilkan pakaian utuh, bukan detail kain.
            </p>
            {errors.tryOnPhotoType ? (
              <p className="mt-2 text-xs text-clay-600">
                {errors.tryOnPhotoType}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="tone-produk" className="block text-sm font-medium">
              Warna latar kartu
            </label>
            <select
              id="tone-produk"
              value={tone}
              onChange={(event) => setTone(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-full border border-line bg-ivory-50 px-5 text-sm"
            >
              <option value="200">Terang</option>
              <option value="300">Netral</option>
              <option value="400">Hangat</option>
              <option value="500">Gelap</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Foto utama</label>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => {
                uploadImage(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            <div className="mt-2 rounded-2xl border border-dashed border-sand-500 p-3">
              {image ? (
                <img
                  src={image}
                  alt={imageAlt || "Pratinjau foto produk"}
                  className="max-h-64 w-full rounded-xl object-cover"
                />
              ) : (
                <div className="flex min-h-40 flex-col items-center justify-center px-4 text-center">
                  <p className="text-sm font-medium">Belum ada foto</p>
                  <p className="mt-1 text-xs text-espresso-500">
                    Unggah foto produk dari perangkat kamu.
                  </p>
                </div>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => imageInputRef.current?.click()}
                disabled={uploadingImage}
              >
                {uploadingImage
                  ? "Mengunggah..."
                  : image
                    ? "Ganti foto"
                    : "Unggah foto"}
              </Button>
              {image ? (
                <Button
                  type="button"
                  variant="quiet"
                  onClick={() => {
                    setImage("");
                    setImageError(null);
                  }}
                  disabled={uploadingImage}
                >
                  Hapus foto
                </Button>
              ) : null}
            </div>
            <p className="mt-2 text-xs text-espresso-500">
              JPG, PNG, atau WEBP. Maksimal 5 MB.
            </p>
            {imageError || errors.image ? (
              <p className="mt-2 text-xs text-clay-600">
                {imageError ?? errors.image}
              </p>
            ) : null}
          </div>

          <Field
            label="Alt foto utama"
            value={imageAlt}
            onChange={setImageAlt}
            error={errors.imageAlt}
            hint="Jelaskan isi foto untuk pembaca layar."
          />

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="block text-sm font-medium">Galeri foto</label>
              <span className="text-xs text-espresso-500">
                {gallery.length}/{MAX_GALLERY}
              </span>
            </div>
            <input
              ref={galleryInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => {
                uploadGallery(event.target.files);
                event.target.value = "";
              }}
            />
            {gallery.length > 0 ? (
              <ul className="mt-2 space-y-2">
                {gallery.map((row, index) => (
                  <li
                    key={row.path}
                    className="flex items-start gap-3 rounded-2xl border border-line bg-ivory-100 p-3"
                  >
                    <img
                      src={row.path}
                      alt=""
                      className="size-20 shrink-0 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <label
                        htmlFor={`galeri-alt-${index}`}
                        className="block text-xs text-espresso-500"
                      >
                        Alt foto
                      </label>
                      <input
                        id={`galeri-alt-${index}`}
                        value={row.alt}
                        onChange={(event) =>
                          updateGallery(index, { alt: event.target.value })
                        }
                        placeholder="Contoh: tampak samping"
                        className="mt-1 min-h-10 w-full rounded-full border border-line bg-ivory-50 px-4 text-sm"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="quiet"
                      onClick={() =>
                        setGallery((current) =>
                          current.filter(
                            (_, rowIndex) => rowIndex !== index,
                          ),
                        )
                      }
                      aria-label={`Hapus foto galeri ${index + 1}`}
                    >
                      Hapus
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 rounded-2xl border border-dashed border-sand-500 px-4 py-6 text-center text-xs text-espresso-500">
                Belum ada foto tambahan.
              </p>
            )}
            <Button
              type="button"
              variant="secondary"
              className="mt-3"
              onClick={() => galleryInputRef.current?.click()}
              disabled={uploadingGallery || gallery.length >= MAX_GALLERY}
            >
              {uploadingGallery ? "Mengunggah..." : "+ Tambah foto galeri"}
            </Button>
            <p className="mt-2 text-xs text-espresso-500">
              JPG, PNG, atau WEBP. Maksimal 5 MB per foto, 8 foto.
            </p>
            {galleryError || errors.images ? (
              <p className="mt-2 text-xs text-clay-600">
                {galleryError ?? errors.images}
              </p>
            ) : null}
          </div>

          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={active}
              onChange={(event) => setActive(event.target.checked)}
              className="size-5 rounded border-line"
            />
            Tampilkan produk di toko
          </label>
        </section>
      </div>

      <section className="rounded-3xl bg-ivory-50 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">Ukuran dan stok</h2>
            <p className="mt-1 text-xs text-espresso-500">
              Ukuran badan dalam sentimeter, boleh dikosongkan.
            </p>
          </div>
          <Button
            type="button"
            variant="quiet"
            onClick={() =>
              setVariants((current) => [
                ...current,
                { size: "", stock: "0", chest: "", length: "", waist: "" },
              ])
            }
          >
            + Tambah ukuran
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          {variants.map((row, index) => (
            <div
              key={index}
              className="rounded-2xl border border-line bg-ivory-100 p-3"
            >
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[160px] flex-1">
                  <label
                    htmlFor={`ukuran-${index}`}
                    className="block text-xs text-espresso-500"
                  >
                    Ukuran
                  </label>
                  <input
                    id={`ukuran-${index}`}
                    value={row.size}
                    onChange={(event) =>
                      updateVariant(index, { size: event.target.value })
                    }
                    placeholder="S, M, L, All size"
                    className="mt-1 min-h-11 w-full rounded-full border border-line bg-ivory-50 px-4 text-sm"
                  />
                </div>
                <div className="w-32">
                  <label
                    htmlFor={`stok-${index}`}
                    className="block text-xs text-espresso-500"
                  >
                    Stok
                  </label>
                  <input
                    id={`stok-${index}`}
                    type="number"
                    min={0}
                    value={row.stock}
                    onChange={(event) =>
                      updateVariant(index, { stock: event.target.value })
                    }
                    className="mt-1 min-h-11 w-full rounded-full border border-line bg-ivory-50 px-4 text-sm"
                  />
                </div>
                <Button
                  type="button"
                  variant="quiet"
                  onClick={() =>
                    setVariants((current) =>
                      current.filter((_, rowIndex) => rowIndex !== index),
                    )
                  }
                  disabled={variants.length === 1}
                >
                  Hapus
                </Button>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div>
                  <label
                    htmlFor={`dada-${index}`}
                    className="block text-xs text-espresso-500"
                  >
                    Lingkar dada (cm)
                  </label>
                  <input
                    id={`dada-${index}`}
                    type="number"
                    min={1}
                    max={300}
                    value={row.chest}
                    onChange={(event) =>
                      updateVariant(index, { chest: event.target.value })
                    }
                    placeholder="Opsional"
                    className="mt-1 min-h-11 w-full rounded-full border border-line bg-ivory-50 px-4 text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor={`panjang-${index}`}
                    className="block text-xs text-espresso-500"
                  >
                    Panjang badan (cm)
                  </label>
                  <input
                    id={`panjang-${index}`}
                    type="number"
                    min={1}
                    max={300}
                    value={row.length}
                    onChange={(event) =>
                      updateVariant(index, { length: event.target.value })
                    }
                    placeholder="Opsional"
                    className="mt-1 min-h-11 w-full rounded-full border border-line bg-ivory-50 px-4 text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor={`pinggang-${index}`}
                    className="block text-xs text-espresso-500"
                  >
                    Lingkar pinggang (cm)
                  </label>
                  <input
                    id={`pinggang-${index}`}
                    type="number"
                    min={1}
                    max={300}
                    value={row.waist}
                    onChange={(event) =>
                      updateVariant(index, { waist: event.target.value })
                    }
                    placeholder="Opsional"
                    className="mt-1 min-h-11 w-full rounded-full border border-line bg-ivory-50 px-4 text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        {errors.variants ? (
          <p className="mt-2 text-xs text-clay-600">{errors.variants}</p>
        ) : null}
      </section>

      {notice ? (
        <p
          role="alert"
          className="rounded-2xl border border-clay-500 bg-clay-50 p-4 text-sm text-clay-600"
        >
          {notice}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="lg" disabled={busy}>
          {busy
            ? "Menyimpan..."
            : mode === "create"
              ? "Simpan produk"
              : "Simpan perubahan"}
        </Button>
        <Link
          href="/admin?view=produk"
          className={buttonStyles({ variant: "quiet", size: "lg" })}
        >
          Batal
        </Link>
      </div>
    </form>
  );
}
