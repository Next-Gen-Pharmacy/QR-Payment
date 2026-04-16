import { NextResponse } from "next/server";
import { getPaymentStatus } from "@/lib/payment-store";

/**
 * GET /api/payments/comgate/status?transId=XXXXX-XXXXX-XXXXX
 *
 * Returns the latest known status for a Comgate transaction, as recorded by
 * the push-notification handler.
 *
 * Responds with `{ status: "PENDING" | "PAID" | "CANCELLED" | "AUTHORIZED" }`
 * or `{ status: "UNKNOWN" }` when no notification has been received yet.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const transId = searchParams.get("transId");

  if (!transId) {
    return NextResponse.json({ message: "Missing transId parameter." }, { status: 400 });
  }

  const entry = getPaymentStatus(transId);
  return NextResponse.json({ status: entry?.status ?? "UNKNOWN" }, { status: 200 });
}
