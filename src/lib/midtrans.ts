import "server-only";

import { createHash } from "node:crypto";
import type { OrderDetail } from "@/lib/types";

const serverKey = process.env.MIDTRANS_SERVER_KEY?.trim() ?? "";
const production = process.env.MIDTRANS_IS_PRODUCTION === "true";

export const midtransConfigured = Boolean(serverKey);
export const midtransIsProduction = production;

function apiBase(): string {
  return production
    ? "https://api.midtrans.com"
    : "https://api.sandbox.midtrans.com";
}

function authHeader(): string {
  return `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`;
}

function appUrl(): string {
  return (process.env.APP_URL?.trim() || "http://localhost:3000").replace(
    /\/+$/,
    "",
  );
}

function shorten(value: string, max = 50): string {
  return value.length > max ? value.slice(0, max) : value;
}

export type SnapTransaction = {
  token: string;
  redirectUrl: string;
};

type SnapResponse = {
  token?: string;
  redirect_url?: string;
  error_messages?: string[];
};

export async function createSnapTransaction(
  order: OrderDetail,
): Promise<SnapTransaction> {
  if (!midtransConfigured) {
    throw new Error("MIDTRANS_SERVER_KEY belum diatur.");
  }

  const itemDetails = order.items.map((item) => ({
    id: shorten(item.id, 50),
    name: shorten(item.name),
    price: item.price,
    quantity: item.qty,
  }));

  if (order.shippingCost > 0) {
    itemDetails.push({
      id: "ongkir",
      name: "Ongkos kirim",
      price: order.shippingCost,
      quantity: 1,
    });
  }

  if (order.discount > 0) {
    itemDetails.push({
      id: "voucher",
      name: shorten(`Voucher ${order.voucherCode ?? ""}`.trim()),
      price: -order.discount,
      quantity: 1,
    });
  }

  const payload = {
    transaction_details: {
      order_id: order.number,
      gross_amount: order.total,
    },
    item_details: itemDetails,
    customer_details: {
      first_name: shorten(order.recipientName, 50),
      email: order.customerEmail,
      phone: order.phone,
    },
    ...(order.fulfillmentType === "COURIER"
      ? {
          shipping_address: {
            first_name: shorten(order.recipientName, 50),
            phone: order.phone,
            address: order.addressLine,
            city: order.city,
            postal_code: order.postalCode,
          },
        }
      : {}),
    callbacks: {
      finish: `${appUrl()}/akun/pesanan/${order.id}`,
      error: `${appUrl()}/akun/pesanan/${order.id}`,
    },
    expiry: { unit: "hours", duration: 24 },
  };

  const response = await fetch(`${apiBase()}/snap/v1/transactions`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: authHeader(),
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15_000),
  });

  const body = (await response.json().catch(() => ({}))) as SnapResponse;

  if (!response.ok || !body.token || !body.redirect_url) {
    const message = body.error_messages?.join(" ") || "Midtrans menolak transaksi.";
    throw new Error(message);
  }

  return { token: body.token, redirectUrl: body.redirect_url };
}

export type MidtransStatus = {
  order_id?: string;
  status_code?: string;
  gross_amount?: string;
  signature_key?: string;
  transaction_status?: string;
  fraud_status?: string;
  payment_type?: string;
  transaction_id?: string;
};

export type MidtransOutcome = "paid" | "pending" | "failed";

export function verifyMidtransSignature(payload: MidtransStatus): boolean {
  if (!serverKey) return false;
  if (
    !payload.order_id ||
    !payload.status_code ||
    !payload.gross_amount ||
    !payload.signature_key
  ) {
    return false;
  }

  const expected = createHash("sha512")
    .update(
      `${payload.order_id}${payload.status_code}${payload.gross_amount}${serverKey}`,
    )
    .digest("hex");

  return expected === payload.signature_key;
}

export function midtransOutcome(payload: MidtransStatus): MidtransOutcome {
  const status = payload.transaction_status;

  if (status === "settlement") return "paid";
  if (status === "capture") {
    return payload.fraud_status === "accept" ? "paid" : "pending";
  }
  if (status === "deny" || status === "cancel" || status === "expire") {
    return "failed";
  }

  return "pending";
}

export async function fetchMidtransStatus(
  midtransOrderId: string,
): Promise<MidtransStatus> {
  if (!midtransConfigured) {
    throw new Error("MIDTRANS_SERVER_KEY belum diatur.");
  }

  const response = await fetch(
    `${apiBase()}/v2/${encodeURIComponent(midtransOrderId)}/status`,
    {
      headers: {
        Accept: "application/json",
        Authorization: authHeader(),
      },
      signal: AbortSignal.timeout(15_000),
    },
  );

  const body = (await response.json().catch(() => ({}))) as MidtransStatus & {
    status_message?: string;
  };

  if (!response.ok) {
    throw new Error(body.status_message || "Status Midtrans tidak bisa dibaca.");
  }

  return body;
}
