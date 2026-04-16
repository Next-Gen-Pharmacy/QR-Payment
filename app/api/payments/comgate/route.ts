import { NextResponse } from "next/server";
import { createComgatePayment } from "@/lib/comgate";

const MAX_CZK_AMOUNT = 1_000_000;

export async function POST(request: Request) {
  let amountCzk: number;

  try {
    const payload = (await request.json()) as { amountCzk?: number };
    amountCzk = Number(payload.amountCzk);
  } catch {
    return NextResponse.json({ message: "Invalid request payload." }, { status: 400 });
  }

  if (!Number.isFinite(amountCzk) || amountCzk <= 0 || amountCzk > MAX_CZK_AMOUNT) {
    return NextResponse.json(
      { message: `Amount must be greater than 0 and at most ${MAX_CZK_AMOUNT} CZK.` },
      { status: 400 },
    );
  }

  if (!Number.isInteger((amountCzk + Number.EPSILON) * 100)) {
    return NextResponse.json(
      { message: "Amount can have at most two decimal places." },
      { status: 400 },
    );
  }

  try {
    const result = await createComgatePayment({ amountCzk });
    if (String(result.code) !== "0" || !result.redirect) {
      return NextResponse.json(
        {
          message: result.message ?? "Comgate rejected payment creation.",
          code: result.code,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        code: result.code,
        message: result.message,
        transactionId: result.transId,
        paymentUrl: result.redirect,
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected payment error.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
