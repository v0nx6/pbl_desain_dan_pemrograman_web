import { z } from "zod";

const phoneField = z
  .string({ error: "Masukkan nomor telepon." })
  .trim()
  .regex(/^[0-9+\-\s()]{8,20}$/, "Masukkan nomor telepon yang valid.");

const addressNoteField = z
  .string()
  .trim()
  .max(300, "Deskripsi alamat maksimal 300 karakter.")
  .optional()
  .or(z.literal(""));

export const registerSchema = z.object({
  name: z
    .string({ error: "Masukkan nama." })
    .trim()
    .min(2, "Nama minimal 2 karakter.")
    .max(80, "Nama maksimal 80 karakter."),
  email: z.email({ error: "Masukkan alamat email yang valid." }),
  password: z
    .string({ error: "Masukkan kata sandi." })
    .min(8, "Kata sandi minimal 8 karakter.")
    .max(200, "Kata sandi terlalu panjang."),
  phone: phoneField,
  addressLine: z
    .string({ error: "Masukkan alamat." })
    .trim()
    .min(8, "Alamat minimal 8 karakter.")
    .max(300, "Alamat maksimal 300 karakter."),
  addressNote: addressNoteField,
});

export const loginSchema = z.object({
  email: z.email("Masukkan alamat email yang valid."),
  password: z.string().min(1, "Masukkan kata sandi."),
});

export const forgotPasswordRequestSchema = z.object({
  email: z.email("Masukkan alamat email yang valid."),
});

export const forgotPasswordVerifySchema = z.object({
  email: z.email("Masukkan alamat email yang valid."),
  code: z
    .string({ error: "Masukkan kode OTP." })
    .trim()
    .regex(/^[0-9]{6}$/, "Kode OTP terdiri dari 6 angka."),
});

export const passwordResetSchema = z
  .object({
    password: z
      .string({ error: "Masukkan kata sandi baru." })
      .min(8, "Kata sandi baru minimal 8 karakter.")
      .max(200, "Kata sandi terlalu panjang."),
    confirmPassword: z
      .string({ error: "Ulangi kata sandi baru." })
      .min(1, "Ulangi kata sandi baru."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi kata sandi tidak sama.",
    path: ["confirmPassword"],
  });

export const reviewCreateSchema = z.object({
  rating: z.coerce
    .number({ error: "Pilih jumlah bintang." })
    .int("Jumlah bintang harus bilangan bulat.")
    .min(1, "Pilih minimal 1 bintang.")
    .max(5, "Jumlah bintang maksimal 5."),
  comment: z
    .string({ error: "Tulis ulasan dulu." })
    .trim()
    .min(3, "Ulasan minimal 3 karakter.")
    .max(1000, "Ulasan maksimal 1000 karakter."),
});

export const firebaseLoginSchema = z.object({
  idToken: z
    .string({ error: "Token Google tidak ditemukan." })
    .min(20, "Token Google tidak valid."),
});

export const profileUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter.")
    .max(80, "Nama maksimal 80 karakter."),
  email: z.email("Masukkan alamat email yang valid."),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{8,20}$/, "Masukkan nomor telepon yang valid.")
    .optional()
    .or(z.literal("")),
  addressLine: z
    .string()
    .trim()
    .max(300, "Alamat maksimal 300 karakter.")
    .optional()
    .or(z.literal("")),
  city: z
    .string()
    .trim()
    .max(100, "Kota maksimal 100 karakter.")
    .optional()
    .or(z.literal("")),
  postalCode: z
    .string()
    .trim()
    .regex(/^[0-9]{5}$/, "Kode pos terdiri dari 5 angka.")
    .optional()
    .or(z.literal("")),
  addressNote: addressNoteField,
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().max(200).optional().default(""),
    newPassword: z
      .string()
      .min(8, "Kata sandi baru minimal 8 karakter.")
      .max(200, "Kata sandi terlalu panjang."),
    confirmPassword: z.string().min(1, "Ulangi kata sandi baru."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi kata sandi tidak sama.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "Kata sandi baru harus berbeda dari yang lama.",
    path: ["newPassword"],
  });

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Masukkan kata sandi untuk menghapus akun."),
});

const optionalMeasurement = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce
    .number()
    .int("Ukuran badan harus bilangan bulat.")
    .min(1, "Ukuran badan minimal 1 cm.")
    .max(300, "Ukuran badan maksimal 300 cm.")
    .optional(),
);

const variantSchema = z.object({
  size: z
    .string()
    .trim()
    .min(1, "Ukuran wajib diisi.")
    .max(30, "Ukuran maksimal 30 karakter."),
  stock: z.coerce
    .number()
    .int("Stok harus bilangan bulat.")
    .min(0, "Stok tidak boleh negatif.")
    .max(10000, "Stok maksimal 10.000."),
  chestCm: optionalMeasurement,
  lengthCm: optionalMeasurement,
  waistCm: optionalMeasurement,
});

const productImageSchema = z.object({
  path: z
    .string()
    .trim()
    .max(300, "Path gambar terlalu panjang.")
    .regex(
      /^\/[A-Za-z0-9/_.-]+$/,
      "Path gambar harus diawali / dan hanya berisi huruf, angka, garis miring, atau tanda hubung.",
    ),
  alt: z
    .string()
    .trim()
    .max(200, "Alt gambar maksimal 200 karakter.")
    .optional()
    .or(z.literal("")),
});

export const productSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(3, "Slug minimal 3 karakter.")
    .max(80, "Slug maksimal 80 karakter.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug hanya boleh huruf kecil, angka, dan tanda hubung.",
    ),
  name: z
    .string()
    .trim()
    .min(2, "Nama produk minimal 2 karakter.")
    .max(120, "Nama produk maksimal 120 karakter."),
  description: z
    .string()
    .trim()
    .min(10, "Deskripsi minimal 10 karakter.")
    .max(2000, "Deskripsi maksimal 2.000 karakter."),
  material: z
    .string()
    .trim()
    .min(2, "Bahan minimal 2 karakter.")
    .max(120, "Bahan maksimal 120 karakter."),
  price: z.coerce
    .number()
    .int("Harga harus bilangan bulat.")
    .min(1000, "Harga minimal Rp 1.000.")
    .max(100000000, "Harga maksimal Rp 100.000.000."),
  collections: z
    .array(z.enum(["baru", "batik", "kebaya", "priya"]))
    .min(1, "Pilih minimal satu koleksi."),
  productType: z.enum(["single", "couple"]).default("single"),
  bestSeller: z.boolean().default(false),
  isNew: z.boolean().default(false),
  tone: z.coerce.number().int().min(200).max(500).default(300),
  image: z
    .string()
    .trim()
    .max(300, "Path gambar terlalu panjang.")
    .regex(
      /^\/[A-Za-z0-9/_.-]+$/,
      "Path gambar harus diawali / dan hanya berisi huruf, angka, garis miring, atau tanda hubung.",
    )
    .optional()
    .or(z.literal("")),
  imageAlt: z
    .string()
    .trim()
    .max(200, "Alt gambar maksimal 200 karakter.")
    .optional()
    .or(z.literal("")),
  images: z
    .array(productImageSchema)
    .max(8, "Maksimal 8 foto galeri.")
    .default([]),
  tryOnCategory: z
    .enum(["upper_body", "lower_body", "dresses"])
    .default("upper_body"),
  tryOnPhotoType: z
    .enum(["model", "flat-lay"])
    .nullable()
    .default(null),
  variants: z
    .array(variantSchema)
    .min(1, "Tambahkan minimal satu ukuran.")
    .max(20, "Maksimal 20 ukuran."),
  active: z.boolean().default(true),
});

export const orderCreateSchema = z
  .object({
    items: z
      .array(
        z.object({
          slug: z.string().trim().min(1),
          size: z.string().trim().min(1),
          qty: z.coerce.number().int().min(1).max(99),
        }),
      )
      .min(1, "Keranjang masih kosong.")
      .max(50, "Terlalu banyak baris pesanan."),
    recipientName: z
      .string()
      .trim()
      .min(2, "Nama penerima minimal 2 karakter.")
      .max(100, "Nama penerima maksimal 100 karakter."),
    phone: z
      .string()
      .trim()
      .regex(/^[0-9+\-\s()]{8,20}$/, "Masukkan nomor telepon yang valid."),
    fulfillmentType: z.enum(["PICKUP", "COURIER"], {
      error: "Pilih mau ambil di toko atau dikirim kurir.",
    }),
    addressLine: z.string().trim().max(300).optional(),
    city: z.string().trim().max(100).optional(),
    postalCode: z.string().trim().max(10).optional(),
    note: z
      .string()
      .trim()
      .max(500, "Catatan maksimal 500 karakter.")
      .optional(),
    paymentMethod: z.enum(["QRIS", "COD", "MIDTRANS"], {
      error: "Pilih cara pembayaran.",
    }),
    voucherCode: z
      .string()
      .trim()
      .max(30, "Kode voucher maksimal 30 karakter.")
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (value.fulfillmentType === "COURIER") {
      if (!value.addressLine || value.addressLine.length < 8) {
        ctx.addIssue({
          code: "custom",
          path: ["addressLine"],
          message: "Alamat minimal 8 karakter.",
        });
      }
      if (!value.city || value.city.length < 2) {
        ctx.addIssue({
          code: "custom",
          path: ["city"],
          message: "Kota minimal 2 karakter.",
        });
      }
      if (!value.postalCode || !/^[0-9]{5}$/.test(value.postalCode)) {
        ctx.addIssue({
          code: "custom",
          path: ["postalCode"],
          message: "Kode pos terdiri dari 5 angka.",
        });
      }
    }

    if (value.paymentMethod === "COD" && value.fulfillmentType === "PICKUP") {
      ctx.addIssue({
        code: "custom",
        path: ["paymentMethod"],
        message: "COD hanya untuk pesanan yang dikirim kurir.",
      });
    }
  });

export const orderActionSchema = z.object({
  action: z.enum([
    "verify",
    "reject",
    "process",
    "ship",
    "complete",
    "cancel",
  ]),
  note: z.string().trim().max(500, "Catatan maksimal 500 karakter.").optional(),
});

export const orderShippingSchema = z.object({
  courier: z
    .string()
    .trim()
    .max(60, "Nama kurir maksimal 60 karakter.")
    .optional(),
  trackingNumber: z
    .string()
    .trim()
    .max(60, "Nomor resi maksimal 60 karakter.")
    .optional(),
});

const voucherCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .min(3, "Kode voucher minimal 3 karakter.")
  .max(30, "Kode voucher maksimal 30 karakter.")
  .regex(
    /^[A-Z0-9-]+$/,
    "Kode voucher hanya boleh huruf, angka, dan tanda hubung.",
  );

export const voucherInputSchema = z
  .object({
    code: voucherCodeSchema,
    type: z.enum(["PERCENT", "FIXED"], { error: "Pilih jenis potongan." }),
    value: z.coerce
      .number({ error: "Masukkan nilai potongan." })
      .int("Nilai potongan harus bilangan bulat.")
      .min(1, "Nilai potongan minimal 1.")
      .max(100000000, "Nilai potongan terlalu besar."),
    minSpend: z.coerce
      .number({ error: "Masukkan minimal belanja." })
      .int("Minimal belanja harus bilangan bulat.")
      .min(0, "Minimal belanja tidak boleh negatif.")
      .max(100000000, "Minimal belanja terlalu besar.")
      .default(0),
    maxUses: z.preprocess(
      (value) => (value === "" || value === null ? undefined : value),
      z.coerce
        .number()
        .int("Batas pemakaian harus bilangan bulat.")
        .min(1, "Batas pemakaian minimal 1.")
        .max(100000, "Batas pemakaian terlalu besar.")
        .optional(),
    ),
    expiresAt: z.preprocess(
      (value) => (value === "" || value === null ? undefined : value),
      z
        .string()
        .trim()
        .refine(
          (value) => !Number.isNaN(Date.parse(value)),
          "Tanggal berlaku tidak valid.",
        )
        .optional(),
    ),
    active: z.boolean().default(true),
  })
  .refine((data) => data.type !== "PERCENT" || data.value <= 100, {
    message: "Potongan persen maksimal 100.",
    path: ["value"],
  });

export const voucherUpdateSchema = z.object({
  active: z.boolean({ error: "Status voucher tidak valid." }),
});

export const voucherValidateSchema = z.object({
  code: z.string().trim().min(1, "Masukkan kode voucher.").max(30),
  subtotal: z.coerce.number().int().min(0),
});

export const financeEntrySchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"], { error: "Pilih jenis catatan." }),
  category: z
    .string({ error: "Masukkan kategori." })
    .trim()
    .min(2, "Kategori minimal 2 karakter.")
    .max(60, "Kategori maksimal 60 karakter."),
  description: z
    .string({ error: "Masukkan keterangan." })
    .trim()
    .min(3, "Keterangan minimal 3 karakter.")
    .max(300, "Keterangan maksimal 300 karakter."),
  amount: z.coerce
    .number({ error: "Masukkan nominal dalam angka." })
    .int("Nominal harus bilangan bulat.")
    .min(1, "Nominal minimal Rp 1.")
    .max(2_000_000_000, "Nominal maksimal Rp 2.000.000.000."),
  occurredAt: z
    .string({ error: "Pilih tanggal catatan." })
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Pilih tanggal catatan.")
    .refine((value) => {
      const parsed = new Date(`${value}T00:00:00.000Z`);
      return (
        !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === value
      );
    }, "Tanggal catatan tidak valid."),
});
