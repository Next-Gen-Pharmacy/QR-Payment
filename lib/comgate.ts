const COMGATE_CREATE_PAYMENT_URL =
  process.env.COMGATE_CREATE_PAYMENT_URL ?? "https://payments.comgate.cz/v2.0/create";

const COMGATE_MERCHANT = process.env.COMGATE_MERCHANT;
const COMGATE_SECRET = process.env.COMGATE_SECRET;
const COMGATE_CURRENCY = process.env.COMGATE_CURRENCY ?? "CZK";
const COMGATE_LABEL = process.env.COMGATE_LABEL ?? "In-store payment";
const COMGATE_LANG = process.env.COMGATE_LANG ?? "cs";
const COMGATE_METHOD = process.env.COMGATE_METHOD ?? "BANK_ALL";

export type ComgateCreatePaymentResult = {
  code?: string | number;
  message?: string;
  transId?: string;
  redirect?: string;
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
