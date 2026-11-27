import { readFileSync, existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

/**
 * Copies existing local uploads from DATA_DIR into Supabase Storage.
 *
 * Usage:
 *   npm run storage:migrate
 *
 * The script reads .env when it exists, skips files that already exist in the
 * bucket, and never deletes the local copies. Run it once when moving an
 * existing deployment from local disk to Supabase Storage.
 */

const EXTENSION_MIMES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

const BUCKET_BY_KIND: Record<string, string> = {
  products: "products",
  proofs: "proofs",
  results: "results",
  reviews: "reviews",
  tryon: "results",
};

const PUBLIC_KINDS = new Set(["products", "reviews"]);

function loadEnvFile(): void {
  const file = path.join(process.cwd(), ".env");
  if (!existsSync(file)) return;

  for (const rawLine of readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separator = line.indexOf("=");
    if (separator < 1) continue;

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

async function main(): Promise<void> {
  loadEnvFile();

  const supabaseUrl = process.env.SUPABASE_URL?.trim() ?? "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";

  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      "SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY harus diisi di .env.",
    );
  }

  const dataDir = path.resolve(
    process.env.DATA_DIR?.trim() || path.join(process.cwd(), ".data"),
  );

  if (!existsSync(dataDir)) {
    console.log(`Folder ${dataDir} tidak ada. Tidak ada file untuk dipindah.`);
    return;
  }

  const client = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const [kind, bucket] of Object.entries(BUCKET_BY_KIND)) {
    const directory = path.join(dataDir, kind);
    if (!existsSync(directory)) continue;

    const entries = await readdir(directory, { withFileTypes: true });
    const files = entries.filter((entry) => entry.isFile());

    for (const entry of files) {
      const extension = path.extname(entry.name).toLowerCase();
      const mime = EXTENSION_MIMES[extension];

      if (!mime) {
        skipped += 1;
        continue;
      }

      const buffer = await readFile(path.join(directory, entry.name));
      const { error } = await client.storage.from(bucket).upload(entry.name, buffer, {
        contentType: mime,
        cacheControl: PUBLIC_KINDS.has(kind) ? "31536000" : "3600",
        upsert: false,
      });

      if (!error) {
        uploaded += 1;
        console.log(`ok    ${kind}/${entry.name} -> ${bucket}`);
        continue;
      }

      if (/already exists|duplicate/i.test(error.message)) {
        skipped += 1;
        console.log(`skip  ${kind}/${entry.name} (sudah ada)`);
        continue;
      }

      failed += 1;
      console.error(`gagal ${kind}/${entry.name}: ${error.message}`);
    }
  }

  console.log(
    `\nSelesai. ${uploaded} diunggah, ${skipped} dilewati, ${failed} gagal.`,
  );

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
