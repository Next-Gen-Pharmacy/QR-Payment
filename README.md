# QR-Payment

In-store payment terminal for creating instant bank transfer payments through Comgate.

## Features

- Next.js app router architecture for easy extension
- Simple React Bootstrap UI for shop assistants to enter payable amount
- Backend API endpoint (`POST /api/payments/comgate`) that initializes Comgate payment
- Comgate push-notification receiver (`POST /api/payments/comgate/notify`) that validates, persists, and acknowledges payment-status callbacks
- Payment result page (`/payment/result`) that polls for confirmation after the user returns from the Comgate payment page
- Docker-ready standalone production build

## Environment variables

Copy `.env.example` to `.env.local` and set your Comgate credentials:

```bash
cp .env.example .env.local
```

Required:

- `COMGATE_MERCHANT`
- `COMGATE_SECRET`

Optional:

- `APP_URL` — public base URL of this app (default: `http://localhost:3000`).
  Used to build the `urlOk`/`urlCancel` return URLs sent to Comgate so the
  user is redirected back to `/payment/result` after completing or cancelling
  payment.  Set this to your actual public domain in production, e.g.:
  `https://your-domain.example`

## Payment flow

1. The shop assistant enters an amount and clicks **Create bank transfer payment**.
2. The app creates a Comgate payment and opens the Comgate-hosted payment page in a new tab.
3. The customer scans the QR code or follows the bank-transfer instructions on Comgate's page.
4. After the customer completes or cancels payment, Comgate redirects them to `/payment/result?transId=…`.
5. The result page polls `GET /api/payments/comgate/status?transId=…` every 3 seconds.
6. In parallel, Comgate sends a server-to-server push notification to `POST /api/payments/comgate/notify` whenever the payment status changes.
7. The notify handler persists the status; the result page displays **Payment confirmed** (PAID) or **Payment cancelled** (CANCELLED) as soon as the update arrives.

> **Important:** The return-URL redirect is UX-only — it simply brings the user back
> to the app.  The push notification is the authoritative confirmation of payment
> success and should be used for any business logic (e.g. fulfilling an order).

## Push notifications (callbacks)

Comgate sends a server-to-server `POST` request to your **callback URL** every
time a payment status changes (`PAID`, `CANCELLED`, `PENDING`, `AUTHORIZED`).
This is mandatory according to the [Comgate API docs](https://apidoc.comgate.cz/en/push-notifikace).

This app exposes a ready-made callback receiver at:

```
POST /api/payments/comgate/notify
```

Register this URL (prefixed with your public domain) in the Comgate merchant
portal as the callback URL for all payment-status events, e.g.:

```
https://your-domain.example/api/payments/comgate/notify
```

The handler:

1. Parses the URL-encoded body that Comgate sends.
2. Validates that `merchant` and `secret` match your configured credentials.
3. Persists the `transId → status` mapping in memory so the result page can read it.
4. Logs the `transId`, `status`, `refId`, `price`, and currency.
5. Returns `HTTP 200` with body `OK` — the acknowledgement Comgate requires.

> **Note on storage:** Payment statuses are currently stored in process memory.
> This works correctly for a single container replica but statuses are lost on
> restart.  Swap `lib/payment-store.ts` for a database or Redis client when you
> need persistence across restarts or multi-replica deployments.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Docker

```bash
docker build -t qr-payment .
docker run --rm -p 3000:3000 --env-file .env.local qr-payment
```
