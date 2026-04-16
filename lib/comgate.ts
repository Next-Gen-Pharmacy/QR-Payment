const COMGATE_CREATE_PAYMENT_URL =
  process.env.COMGATE_CREATE_PAYMENT_URL ?? "https://payments.comgate.cz/v2.0/create";

const COMGATE_MERCHANT = process.env.COMGATE_MERCHANT;
const COMGATE_SECRET = process.env.COMGATE_SECRET;
const COMGATE_CURRENCY = process.env.COMGATE_CURRENCY ?? "CZK";
const COMGATE_LABEL = process.env.COMGATE_LABEL ?? "In-store payment";
const COMGATE_LANG = process.env.COMGATE_LANG ?? "cs";
const COMGATE_METHOD = process.env.COMGATE_METHOD ?? "BANK_ALL";

/** Base URL of this application, used to build return URLs for Comgate. */
const APP_URL = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

export type ComgateCreatePaymentResult = {
  code?: string | number;
  message?: string;
  transId?: string;
  redirect?: string;
};

export type ComgatePaymentStatus = "PAID" | "CANCELLED" | "PENDING" | "AUTHORIZED";

export type ComgateNotification = {
  merchant: string;
  secret: string;
  transId: string;
  status: ComgatePaymentStatus;
  price: string;
  curr: string;
  refId: string;
  email?: string;
  test?: string;
  fee?: string;
  label?: string;
  method?: string;
  account?: string;
  phone?: string;
  name?: string;
  lang?: string;
  prepareOnly?: string;
  preauth?: string;
  initRecurring?: string;
  verification?: string;
  payerId?: string;
  payerName?: string;
  payerAccountName?: string;
  exId?: string;
  exUrl?: string;
};

/**
 * Parses and validates an incoming Comgate push-notification request body.
 *
 * Returns the parsed notification when the `merchant` and `secret` fields
 * match the configured credentials, or `null` when validation fails.
 */
export const verifyComgateNotification = (
  body: URLSearchParams,
): ComgateNotification | null => {
  if (!COMGATE_MERCHANT || !COMGATE_SECRET) {
    return null;
  }

  const merchant = body.get("merchant");
  const secret = body.get("secret");
  const transId = body.get("transId");
  const status = body.get("status") as ComgatePaymentStatus | null;
  const price = body.get("price");
  const curr = body.get("curr");
  const refId = body.get("refId");

  if (
    merchant !== COMGATE_MERCHANT ||
    secret !== COMGATE_SECRET ||
    !transId ||
    !status ||
    !price ||
    !curr ||
    !refId
  ) {
    return null;
  }

  const notification: ComgateNotification = {
    merchant,
    secret,
    transId,
    status,
    price,
    curr,
    refId,
  };

  const optional = [
    "email", "test", "fee", "label", "method", "account", "phone", "name",
    "lang", "prepareOnly", "preauth", "initRecurring", "verification",
    "payerId", "payerName", "payerAccountName", "exId", "exUrl",
  ] as const;

  for (const key of optional) {
    const value = body.get(key);
    if (value !== null) {
      (notification as Record<string, string>)[key] = value;
    }
  }

  return notification;
};

type ComgatePayload = {
  amountCzk: number;
};

const parseComgateResponse = (raw: string): ComgateCreatePaymentResult => {
  const params = new URLSearchParams(raw);
  return Object.fromEntries(params.entries()) as ComgateCreatePaymentResult;
};

export const createComgatePayment = async (
  payload: ComgatePayload,
): Promise<ComgateCreatePaymentResult> => {
  if (!COMGATE_MERCHANT || !COMGATE_SECRET) {
    throw new Error(
      "Comgate credentials are not configured. Please set COMGATE_MERCHANT and COMGATE_SECRET.",
    );
  }

  const amountInHellers = Math.round((payload.amountCzk + Number.EPSILON) * 100);
  const body = new URLSearchParams({
    merchant: COMGATE_MERCHANT,
    secret: COMGATE_SECRET,
    price: String(amountInHellers),
    curr: COMGATE_CURRENCY,
    label: COMGATE_LABEL,
    method: COMGATE_METHOD,
    lang: COMGATE_LANG,
    refId: crypto.randomUUID(),
    urlOk: `${APP_URL}/payment/result`,
    urlCancel: `${APP_URL}/payment/result`,
  });

  const response = await fetch(COMGATE_CREATE_PAYMENT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json,text/plain,*/*",
    },
    body: body.toString(),
    cache: "no-store",
  });

  const responseText = await response.text();
  const parsed = parseComgateResponse(responseText);

  return {
    code: parsed.code,
    message: parsed.message,
    transId: parsed.transId,
    redirect: parsed.redirect,
  };
};
