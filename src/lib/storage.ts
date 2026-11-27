import "server-only";

import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const DATA_DIR = path.resolve(
  /* turbopackIgnore: true */
  process.env.DATA_DIR?.trim() || path.join(process.cwd(), ".data"),
);

const PUBLIC_DIR = path.join(process.cwd(), "public");

const kinds = new Set(["proofs", "tryon", "results", "products", "reviews"]);

const PRODUCT_IMAGE_PREFIX = "/api/product-image/";

const mimeExtensions: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const extensionMimes: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);

export type UploadKind = "proofs" | "tryon" | "results" | "products" | "reviews";

const bucketByKind: Record<UploadKind, string> = {
  proofs: "proofs",
  tryon: "results",
  results: "results",
  products: "products",
  reviews: "reviews",
};

const supabaseUrl = process.env.SUPABASE_URL?.trim() ?? "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
const supabaseStorageEnabled = Boolean(supabaseUrl && supabaseServiceKey);

export const storageDriver: "supabase" | "local" = supabaseStorageEnabled
  ? "supabase"
  : "local";

let supabaseClient: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (!supabaseStorageEnabled) return null;
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  }
  return supabaseClient;
}

function bucketFor(kind: UploadKind): string {
  return bucketByKind[kind];
}

function isUploadKind(value: string): value is UploadKind {
  return kinds.has(value);
}

function cacheControlFor(kind: UploadKind): string {
  return kind === "products" || kind === "reviews" ? "31536000" : "3600";
}

function storedPath(kind: UploadKind, filename: string): string {
  return `${kind}/${filename}`;
}

function parseStoredPath(
  relativePath: string,
): { kind: UploadKind; filename: string } | null {
  const [kind, filename, extra] = relativePath.split("/");
  if (
    extra !== undefined ||
    !isUploadKind(kind) ||
    !filename ||
    !allowedExtensions.has(path.extname(filename).toLowerCase())
  ) {
    return null;
  }

  return { kind, filename };
}

async function uploadToSupabase(
  kind: UploadKind,
  filename: string,
  buffer: Buffer,
  mime: string,
): Promise<void> {
  const client = getSupabase();
  if (!client) throw new Error("Supabase Storage belum dikonfigurasi.");

  const { error } = await client.storage
    .from(bucketFor(kind))
    .upload(filename, buffer, {
      contentType: mime,
      cacheControl: cacheControlFor(kind),
      upsert: false,
    });

  if (error) {
    throw new Error(`Gagal menyimpan file ke Supabase Storage: ${error.message}`);
  }
}

async function downloadFromSupabase(
  kind: UploadKind,
  filename: string,
): Promise<Buffer> {
  const client = getSupabase();
  if (!client) throw new Error("Supabase Storage belum dikonfigurasi.");

  const { data, error } = await client.storage
    .from(bucketFor(kind))
    .download(filename);

  if (error || !data) {
    throw new Error(
      `File tidak ditemukan di Supabase Storage: ${error?.message ?? filename}`,
    );
  }

  return Buffer.from(await data.arrayBuffer());
}

async function removeFromSupabase(
  kind: UploadKind,
  filename: string,
): Promise<void> {
  const client = getSupabase();
  if (!client) return;

  await client.storage
    .from(bucketFor(kind))
    .remove([filename])
    .catch(() => undefined);
}

export async function saveUpload(
  file: File,
  kind: UploadKind,
  maxBytes: number,
): Promise<{ path: string; mime: string; name: string }> {
  if (!kinds.has(kind)) throw new Error("Jenis unggahan tidak dikenal.");

  const extension = mimeExtensions[file.type];
  if (!extension) {
    throw new Error("Format file harus JPG, PNG, atau WEBP.");
  }

  if (file.size > maxBytes) {
    throw new Error(
      `Ukuran file melebihi ${Math.round(maxBytes / 1024 / 1024)} MB.`,
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.byteLength === 0) {
    throw new Error("File kosong.");
  }

  const filename = `${randomUUID()}${extension}`;

  if (supabaseStorageEnabled) {
    await uploadToSupabase(kind, filename, buffer, file.type);
  } else {
    const directory = path.join(/* turbopackIgnore: true */ DATA_DIR, kind);
    await mkdir(directory, { recursive: true });
    await writeFile(
      path.join(/* turbopackIgnore: true */ directory, filename),
      buffer,
    );
  }

  return {
    path: storedPath(kind, filename),
    mime: file.type,
    name: file.name.slice(0, 200) || filename,
  };
}

export async function saveBuffer(
  buffer: Buffer,
  kind: UploadKind,
  extension: string,
): Promise<string> {
  if (!kinds.has(kind)) throw new Error("Jenis unggahan tidak dikenal.");
  const safeExtension = extension.startsWith(".") ? extension : `.${extension}`;
  if (!allowedExtensions.has(safeExtension.toLowerCase())) {
    throw new Error("Ekstensi file tidak dikenal.");
  }

  const filename = `${randomUUID()}${safeExtension.toLowerCase()}`;
  const mime = extensionMimes[safeExtension.toLowerCase()] ?? "image/jpeg";

  if (supabaseStorageEnabled) {
    await uploadToSupabase(kind, filename, buffer, mime);
  } else {
    const directory = path.join(/* turbopackIgnore: true */ DATA_DIR, kind);
    await mkdir(directory, { recursive: true });
    await writeFile(
      path.join(/* turbopackIgnore: true */ directory, filename),
      buffer,
    );
  }

  return storedPath(kind, filename);
}

export async function deleteStored(relativePath: string): Promise<void> {
  try {
    const parsed = parseStoredPath(relativePath);
    if (!parsed) return;

    if (supabaseStorageEnabled) {
      await removeFromSupabase(parsed.kind, parsed.filename);
    }

    const full = path.resolve(
      /* turbopackIgnore: true */ DATA_DIR,
      parsed.kind,
      parsed.filename,
    );
    const root = path.resolve(/* turbopackIgnore: true */ DATA_DIR, parsed.kind);
    if (!full.startsWith(`${root}${path.sep}`)) return;

    await unlink(/* turbopackIgnore: true */ full).catch(() => {});
  } catch {
    // Ignore cleanup errors so the main request can still finish.
  }
}

export function isStoredReviewImage(name: string): boolean {
  return (
    /^[a-f0-9-]{36}\.(?:jpe?g|png|webp)$/i.test(name) &&
    path.basename(name) === name
  );
}

export async function readStored(relativePath: string): Promise<Buffer> {
  const parsed = parseStoredPath(relativePath);
  if (!parsed) {
    throw new Error("Path file tidak valid.");
  }

  if (supabaseStorageEnabled) {
    try {
      return await downloadFromSupabase(parsed.kind, parsed.filename);
    } catch {
      // Fall back to local disk so existing files still work during a
      // migration from DATA_DIR to Supabase Storage.
    }
  }

  const full = path.resolve(
    /* turbopackIgnore: true */ DATA_DIR,
    parsed.kind,
    parsed.filename,
  );
  const root = path.resolve(/* turbopackIgnore: true */ DATA_DIR, parsed.kind);
  if (!full.startsWith(`${root}${path.sep}`)) {
    throw new Error("Path file tidak valid.");
  }

  return readFile(/* turbopackIgnore: true */ full);
}

export async function readPublicImage(publicPath: string): Promise<Buffer> {
  const clean = publicPath.replace(/^\/+/, "");
  const full = path.resolve(/* turbopackIgnore: true */ PUBLIC_DIR, clean);
  if (!full.startsWith(`${PUBLIC_DIR}${path.sep}`)) {
    throw new Error("Path gambar tidak valid.");
  }
  return readFile(/* turbopackIgnore: true */ full);
}

function storedProductFilename(imagePath: string): string | null {
  let filename: string | null = null;

  if (imagePath.startsWith(PRODUCT_IMAGE_PREFIX)) {
    filename = imagePath.slice(PRODUCT_IMAGE_PREFIX.length);
  } else if (imagePath.startsWith("products/")) {
    filename = imagePath.slice("products/".length);
  }

  if (
    !filename ||
    !/^[a-f0-9-]{36}\.(?:jpe?g|png|webp)$/i.test(filename) ||
    path.basename(filename) !== filename
  ) {
    return null;
  }

  return filename;
}

export function productImageExists(imagePath: string): boolean {
  const filename = storedProductFilename(imagePath);
  if (!filename) return false;

  // Supabase downloads are async. The image route validates the object when it
  // is requested, so catalog rendering can keep using this synchronous check.
  if (supabaseStorageEnabled) return true;

  return existsSync(
    path.join(/* turbopackIgnore: true */ DATA_DIR, "products", filename),
  );
}

export async function saveProductImage(
  file: File,
  maxBytes: number,
): Promise<{ path: string; url: string; mime: string }> {
  const saved = await saveUpload(file, "products", maxBytes);
  const filename = path.basename(saved.path);

  return {
    path: saved.path,
    url: `${PRODUCT_IMAGE_PREFIX}${filename}`,
    mime: saved.mime,
  };
}

export async function deleteProductImage(
  imagePath: string | null,
): Promise<void> {
  if (!imagePath) return;
  const filename = storedProductFilename(imagePath);
  if (!filename) return;

  if (supabaseStorageEnabled) {
    await removeFromSupabase("products", filename);
  }

  await unlink(
    path.join(/* turbopackIgnore: true */ DATA_DIR, "products", filename),
  ).catch(() => {});
}

export async function readProductImage(imagePath: string): Promise<Buffer> {
  const filename = storedProductFilename(imagePath);

  if (filename) {
    if (supabaseStorageEnabled) {
      try {
        return await downloadFromSupabase("products", filename);
      } catch {
        // Fall back to local disk so existing uploads still work during a
        // migration from DATA_DIR to Supabase Storage.
      }
    }

    try {
      return await readFile(
        path.join(/* turbopackIgnore: true */ DATA_DIR, "products", filename),
      );
    } catch {
      // Fall through to the bundled public image path.
    }
  }

  return readPublicImage(imagePath);
}
