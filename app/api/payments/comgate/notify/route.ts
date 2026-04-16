import { NextResponse } from "next/server";
import { verifyComgateNotification } from "@/lib/comgate";
import { setPaymentStatus } from "@/lib/payment-store";

/**
 * POST /api/payments/comgate/notify
 *
 * Comgate push-notification (callback) endpoint.
 *
 * Comgate calls this URL whenever a payment status changes (PAID, CANCELLED,
 * PENDING, AUTHORIZED).  The request body is application/x-www-form-urlencoded
 * and must contain at minimum: merchant, secret, transId, status, price, curr,
 * refId.
 *
 * The endpoint must respond with HTTP 200 and the body "OK" to acknowledge
 * receipt.  Any other response causes Comgate to retry.
 *
 * Register this URL in the Comgate merchant portal as the callback URL for
 * all payment-status events.
 */
export async function POST(request: Request) {
  let body: URLSearchParams;

  try {
    const text = await request.text();
    body = new URLSearchParams(text);
  } catch {
    return new NextResponse("Bad Request", { status: 400 });
  }

  const notification = verifyComgateNotification(body);
  if (!notification) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Persist the status so the result page can poll for it.
  setPaymentStatus(notification.transId, notification.status);
  console.log(
    `[comgate/notify] transId=${notification.transId} status=${notification.status} refId=${notification.refId} price=${notification.price} ${notification.curr}`,
  );

  return new NextResponse("OK", { status: 200 });
}
