# QR-Payment

In-store payment terminal for creating instant bank transfer payments through Comgate.

## Features

- Next.js app router architecture for easy extension
- Simple React Bootstrap UI for shop assistants to enter payable amount
- Backend API endpoint (`POST /api/payments/comgate`) that initializes Comgate payment
- Docker-ready standalone production build

## Environment variables

Copy `.env.example` to `.env.local` and set your Comgate credentials:

```bash
cp .env.example .env.local
```

Required:

- `COMGATE_MERCHANT`
- `COMGATE_SECRET`

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
