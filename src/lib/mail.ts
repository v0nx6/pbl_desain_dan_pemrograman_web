import "server-only";

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { ApiError } from "@/lib/api-helpers";

const user = process.env.GMAIL_USER?.trim();
const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");
const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
const port = Number(process.env.SMTP_PORT || 465);
const secure = process.env.SMTP_SECURE !== "false";
const from = process.env.MAIL_FROM?.trim() || (user ? `Boutique NC <${user}>` : "");

export const mailConfigured = Boolean(user && pass);

let transport: Transporter | null = null;

function getTransport(): Transporter {
  if (!transport) {
    transport = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
  }
  return transport;
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
    await getTransport().sendMail({
      from,
      to: email,
      subject: "Kode OTP reset kata sandi Boutique NC",
      text: otpText(code),
      html: otpHtml(code),
    });
  } catch (error) {
    console.error("Gagal mengirim OTP:", error);
    throw new ApiError(
      502,
      "Kode belum bisa dikirim ke email. Coba lagi sebentar lagi.",
    );
  }

  return { delivered: true };
}
