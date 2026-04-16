import type { ComgatePaymentStatus } from "@/lib/comgate";

export type PaymentStatusEntry = {
  status: ComgatePaymentStatus;
  updatedAt: number;
};

/**
 * In-memory payment status store.
 *
 * Keyed by Comgate `transId`.  Entries are written by the push-notification
 * handler and read by the status-polling endpoint.
 *
 * This is intentionally a module-level singleton so that it persists across
 * requests within the same Node.js process (i.e. a single container replica).
 *
 * ⚠️  Limitations of this in-memory store:
 *   - Data is lost on process restart (e.g. container redeploy).
 *   - Multiple replicas will have inconsistent state; a payment notification
 *     received by replica A will not be visible to a poll request served by
 *     replica B.
 * Replace with a shared, persistent storage layer (e.g. a database or Redis)
 * when running more than one replica or when persistence across restarts is
 * required.
 */
const store = new Map<string, PaymentStatusEntry>();

export const setPaymentStatus = (transId: string, status: ComgatePaymentStatus): void => {
  store.set(transId, { status, updatedAt: Date.now() });
};

export const getPaymentStatus = (transId: string): PaymentStatusEntry | undefined => {
  return store.get(transId);
};
