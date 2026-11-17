import "server-only";

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { Resend } from "resend";
import { ApiError } from "@/lib/api-helpers";
import { formatIDR, orderStatusLabels } from "@/lib/format";
import type { OrderDetail } from "@/lib/types";

const resendKey = process.env.RESEND_API_KEY?.trim();
const smtpUser = process.env.GMAIL_USER?.trim();
const smtpPass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");
const smtpHost = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
const smtpPort = Number(process.env.SMTP_PORT || 465);
const smtpSecure = process.env.SMTP_SECURE !== "false";

const from =
  process.env.MAIL_FROM?.trim() ||
  (resendKey
    ? "Boutique NC <onboarding@resend.dev>"
    : smtpUser
      ? `Boutique NC <${smtpUser}>`
      : "");

export const mailProvider: "resend" | "smtp" | null = resendKey
  ? "resend"
  : smtpUser && smtpPass
    ? "smtp"
    : null;

export const mailConfigured = Boolean(mailProvider && from);

let resend: Resend | null = null;
let transport: Transporter | null = null;

function getResend(): Resend {
  if (!resend) resend = new Resend(resendKey);
  return resend;
}

function getTransport(): Transporter {
  if (!transport) {
    transport = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: { user: smtpUser, pass: smtpPass },
    });
  }
  return transport;
}

type MailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

const MAIL_TIMEOUT_MS = 10_000;

function withTimeout<T>(promise: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Pengiriman email melebihi batas waktu."));
    }, MAIL_TIMEOUT_MS);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

async function deliver({ to, subject, text, html }: MailInput): Promise<void> {
  if (mailProvider === "resend") {
    const { error } = await getResend().emails.send({
      from,
      to,
      subject,
      text,
      html,
    });

    if (error) {
      throw new Error(error.message || "Resend menolak pengiriman email.");
    }
    return;
  }

  await getTransport().sendMail({ from, to, subject, text, html });
}

function otpText(code: string): string {
  return [
    "Halo,",
    "",
    "Ada permintaan untuk mengatur ulang kata sandi akun Boutique NC.",
    `Kode OTP kamu: ${code}`,
    "",
    "Kode ini berlaku 10 menit dan hanya bisa dipakai satu kali.",
    "Kalau kamu tidak meminta reset kata sandi, abaikan email ini.",
    "",
    "Salam,",
    "Boutique NC",
  ].join("\n");
}

function otpHtml(code: string): string {
  return `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#2b2118">
  <p>Halo,</p>
  <p>Ada permintaan untuk mengatur ulang kata sandi akun Boutique NC.</p>
  <p style="font-size:24px;letter-spacing:6px;font-weight:bold;margin:24px 0">${code}</p>
  <p>Kode ini berlaku 10 menit dan hanya bisa dipakai satu kali.</p>
  <p>Kalau kamu tidak meminta reset kata sandi, abaikan email ini.</p>
  <p>Salam,<br>Boutique NC</p>
</div>`;
}

export async function sendPasswordOtp(
  email: string,
  code: string,
): Promise<{ delivered: boolean }> {
  if (!mailConfigured) {
    if (process.env.NODE_ENV === "production") {
      throw new ApiError(
        503,
        "Pengiriman email belum diatur. Hubungi admin toko.",
      );
    }

    console.info(`[dev] Kode OTP untuk ${email}: ${code}`);
    return { delivered: false };
  }

  try {
    await withTimeout(
      deliver({
        to: email,
        subject: "Kode OTP reset kata sandi Boutique NC",
        text: otpText(code),
        html: otpHtml(code),
      }),
    );
  } catch (error) {
    console.error("Gagal mengirim OTP:", error);
    throw new ApiError(
      502,
      "Kode belum bisa dikirim ke email. Coba lagi sebentar lagi.",
    );
  }

  return { delivered: true };
}

export type OrderEmailEvent =
  | "created"
  | "proof"
  | "verify"
  | "reject"
  | "process"
  | "ship"
  | "complete"
  | "cancel";

const orderEvents: Record<
  OrderEmailEvent,
  { subject: (number: string) => string; heading: string; body: string }
> = {
  created: {
    subject: (number) => `Pesanan ${number} sudah kami terima`,
    heading: "Pesanan kamu sudah masuk.",
    body: "Kami akan mengabari lagi setelah pembayaran atau pesanan diproses.",
  },
  proof: {
    subject: (number) => `Bukti pembayaran ${number} sudah diterima`,
    heading: "Bukti pembayaran sudah kami terima.",
    body: "Admin akan mengecek bukti transfer kamu. Status pesanan akan berubah setelah verifikasi.",
  },
  verify: {
    subject: (number) => `Pembayaran ${number} sudah terverifikasi`,
    heading: "Pembayaran sudah kami verifikasi.",
    body: "Pesanan kamu akan segera kami siapkan.",
  },
  reject: {
    subject: (number) => `Bukti pembayaran ${number} perlu diperbarui`,
    heading: "Bukti pembayaran belum cocok.",
    body: "Silakan buka halaman pesanan dan unggah ulang bukti transfer yang benar.",
  },
  process: {
    subject: (number) => `Pesanan ${number} sedang disiapkan`,
    heading: "Pesanan sedang kami siapkan.",
    body: "Kami akan mengabari lagi saat pesanan dikirim.",
  },
  ship: {
    subject: (number) => `Pesanan ${number} sedang dikirim`,
    heading: "Pesanan kamu sedang dalam perjalanan.",
    body: "Kalau pesanan sudah sampai, jangan lupa selesaikan pesanan di halaman akun.",
  },
  complete: {
    subject: (number) => `Pesanan ${number} sudah selesai`,
    heading: "Pesanan sudah selesai.",
    body: "Terima kasih sudah belanja di Boutique NC. Kalau sempat, tulis ulasan untuk produk yang kamu beli.",
  },
  cancel: {
    subject: (number) => `Pesanan ${number} dibatalkan`,
    heading: "Pesanan dibatalkan.",
    body: "Kalau pembatalan ini tidak kamu harapkan, balas email ini supaya kami bantu cek.",
  },
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function orderLink(order: OrderDetail): string {
  const base = (process.env.APP_URL?.trim() || "http://localhost:3000").replace(
    /\/+$/,
    "",
  );
  return `${base}/akun/pesanan/${order.id}`;
}

function orderText(
  order: OrderDetail,
  heading: string,
  body: string,
): string {
  const name = order.customerName?.trim() || "kak";
  return [
    `Halo ${name},`,
    "",
    heading,
    body,
    "",
    `Nomor pesanan: ${order.number}`,
    `Total: ${formatIDR(order.total)}`,
    `Status: ${orderStatusLabels[order.status]}`,
    "",
    `Lihat detail pesanan: ${orderLink(order)}`,
    "",
    "Kalau ada pertanyaan, balas email ini.",
    "",
    "Salam,",
    "Boutique NC",
  ].join("\n");
}

function orderHtml(order: OrderDetail, heading: string, body: string): string {
  const name = escapeHtml(order.customerName?.trim() || "kak");
  const link = orderLink(order);
  return `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#2b2118;max-width:560px">
  <p>Halo ${name},</p>
  <p style="font-weight:bold;font-size:18px;margin:20px 0 8px">${escapeHtml(heading)}</p>
  <p>${escapeHtml(body)}</p>
  <table style="margin:24px 0;border-collapse:collapse;font-size:14px">
    <tr><td style="padding:4px 16px 4px 0;color:#6b5b4b">Nomor pesanan</td><td style="padding:4px 0">${escapeHtml(order.number)}</td></tr>
    <tr><td style="padding:4px 16px 4px 0;color:#6b5b4b">Total</td><td style="padding:4px 0">${escapeHtml(formatIDR(order.total))}</td></tr>
    <tr><td style="padding:4px 16px 4px 0;color:#6b5b4b">Status</td><td style="padding:4px 0">${escapeHtml(orderStatusLabels[order.status])}</td></tr>
  </table>
  <p><a href="${escapeHtml(link)}" style="display:inline-block;background:#8a5a44;color:#fff;text-decoration:none;padding:10px 18px;border-radius:999px">Lihat detail pesanan</a></p>
  <p style="margin-top:24px">Kalau ada pertanyaan, balas email ini.</p>
  <p>Salam,<br>Boutique NC</p>
</div>`;
}

export async function sendOrderEmail(
  order: OrderDetail,
  event: OrderEmailEvent,
): Promise<void> {
  const to = order.customerEmail?.trim();
  if (!to) return;

  const copy = orderEvents[event];
  const body =
    event === "created" && order.paymentMethod === "COD"
      ? "Pesanan COD akan kami siapkan. Pembayaran dilakukan saat barang diterima."
      : event === "created"
        ? "Silakan selesaikan pembayaran, lalu unggah bukti transfer di halaman pesanan."
        : copy.body;

  if (!mailConfigured) {
    console.info(
      `[mail] Email pesanan ${order.number} (${event}) tidak dikirim karena email belum diatur.`,
    );
    return;
  }

  try {
    await withTimeout(
      deliver({
        to,
        subject: copy.subject(order.number),
        text: orderText(order, copy.heading, body),
        html: orderHtml(order, copy.heading, body),
      }),
    );
  } catch (error) {
    console.error(`Gagal mengirim email pesanan ${order.number}:`, error);
  }
}
