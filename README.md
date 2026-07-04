# Shopify AI Dynamic Pricing Assistant

Assessment project for MGLogics. The app fetches Shopify products, uses Gemini to recommend price increases when inventory is low, validates every AI response against merchant rules, updates Shopify automatically, and records all decisions in PostgreSQL.

## Stack

- Next.js App Router, React, TypeScript
- Shopify Polaris
- TanStack Query
- Prisma + PostgreSQL
- Shopify Admin GraphQL API
- Gemini API
- Local `node-cron` scheduler and Vercel Cron endpoint

## Features

- Fetch Shopify product title, product ID, current price, inventory quantity, product type, and vendor.
- Settings page for inventory threshold, maximum allowed price, review frequency, and AI behavior prompt.
- Gemini pricing engine with strict safety validation.
- Automatic Shopify price updates after validation.
- Read-only dashboard showing recommendations, AI reasons, statuses, and run history.
- Price history tracking for updates, skips, invalid AI responses, validation failures, and Shopify update failures.

## Environment

Copy `.env.example` to `.env` and fill the values.

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/shopify_pricing?schema=public"
SHOPIFY_SHOP_DOMAIN="your-dev-store.myshopify.com"
SHOPIFY_ACCESS_TOKEN="shpat_or_admin_api_access_token"
SHOPIFY_API_VERSION="2026-07"
GEMINI_API_KEY="your_gemini_api_key"
CRON_SECRET="change-me-to-a-long-random-value"
APP_URL="http://localhost:3000"
```

For the Shopify token approach, create a Shopify development store, create a custom app, grant Admin API access to products/inventory, install it on the store, and copy the Admin API access token.

## Setup

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Open `http://localhost:3000`.

## Local Scheduler

Run the app in one terminal:

```bash
npm run dev
```

Run the local scheduler in another terminal:

```bash
npm run scheduler
```

The scheduler calls `POST /api/cron/pricing-run` every hour. The endpoint checks the saved review frequency before running, so one hourly trigger supports hourly, daily, weekly, and monthly settings.

## API Routes

- `GET /api/settings`
- `PUT /api/settings`
- `GET /api/products`
- `GET /api/pricing/history`
- `GET /api/pricing/runs`
- `POST /api/pricing/run`
- `POST /api/cron/pricing-run`

The cron endpoint requires:

```txt
Authorization: Bearer <CRON_SECRET>
```

## Safety Rules

The app never updates Shopify when:

- inventory is above the threshold
- Gemini response is malformed
- recommended price is below the current price
- recommended price exceeds the maximum allowed price
- Shopify rejects the update

Every skipped or failed product is logged to the dashboard.

## Deployment Notes

Deploy to Vercel with a hosted PostgreSQL database. Add all environment variables in Vercel.

`node-cron` is only for local development. Vercel does not keep a Node process alive permanently, so `vercel.json` configures Vercel Cron to call the protected cron endpoint hourly.

Production improvements for a multi-merchant Shopify app would include Shopify OAuth, per-shop token storage, Shopify webhooks, queue workers with BullMQ/Redis or Inngest, and stronger tenant-level authorization.
