# QR-Payment

In-store payment terminal for creating instant bank transfer payments through Comgate.

## Features

- Next.js app router architecture for easy extension
- Simple React Bootstrap UI for shop assistants to enter payable amount
- Backend API endpoint (`POST /api/payments/comgate`) that initializes Comgate payment
- Comgate push-notification receiver (`POST /api/payments/comgate/notify`) that validates and acknowledges payment-status callbacks
- Docker-ready standalone production build

## Environment variables

Copy `.env.example` to `.env.local` and set your Comgate credentials:

```bash
cp .env.example .env.local
```

Required:

- `COMGATE_MERCHANT`
- `COMGATE_SECRET`

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
3. Logs the `transId`, `status`, `refId`, `price`, and currency.
4. Returns `HTTP 200` with body `OK` — the acknowledgement Comgate requires.

Extend the `TODO` block in `app/api/payments/comgate/notify/route.ts` to
persist the status change in your database or trigger downstream workflows.

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
