# Shopify AI Dynamic Pricing Assistant

Assessment project for MGLogics. The app fetches Shopify products, uses Gemini to recommend price increases when inventory is low, validates every AI response against merchant rules, updates Shopify automatically, and records every decision in PostgreSQL.

## Stack

- Next.js App Router, React 19, TypeScript
- Shopify Polaris
- TanStack Query
- Prisma 7 + PostgreSQL
- Shopify Admin GraphQL API
- Gemini API
- Local `node-cron` scheduler and Vercel Cron endpoint

## Features

- Fetches Shopify product title, product ID, current price, inventory quantity, product type, and vendor.
- Settings page for inventory threshold, maximum allowed price, review frequency, and AI behavior prompt.
- Gemini pricing engine with strict JSON parsing and safety validation.
- Automatic Shopify price updates after validation.
- Dashboard with latest-run decisions, full history, and pricing run history.
- Dev-only clear history action for clean demos.
- Price history tracking for updates, skips, invalid AI responses, validation failures, and Shopify update failures.
- Mock Shopify/Gemini mode for reviewer demos without external credentials.

## Architecture

The app is full-stack Next.js, but the frontend and backend responsibilities are intentionally separated:

- UI components live under `src/components`.
- TanStack Query hooks live under `src/features/pricing`.
- API routes live under `src/app/api`.
- Business logic lives under `src/server`.
- Prisma database access is isolated in repository files.
- Shopify and Gemini calls are isolated in service adapters.

React components do not call Prisma, Shopify, or Gemini directly. The UI talks to API routes, API routes call services, and services call repositories or external APIs.

## Environment

Copy `.env.example` to `.env` and fill the values.

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/shopify_pricing?schema=public"
SHOPIFY_SHOP_DOMAIN="your-dev-store.myshopify.com"
SHOPIFY_ACCESS_TOKEN="shpat_your_token_here"
SHOPIFY_API_VERSION="2026-07"
GEMINI_API_KEY="your_gemini_api_key_here"
CRON_SECRET="change-me-to-a-long-random-value"
APP_URL="http://localhost:3000"
MOCK_SHOPIFY="false"
MOCK_GEMINI="false"
```

For real Shopify mode, create a Shopify development store, create a custom app, grant Admin API product/inventory access, install it on the store, and copy the Admin API access token.

Required Shopify scopes:

```txt
read_products
write_products
read_inventory
```

## Setup

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Open `http://localhost:3000`.

## Mock Demo Mode

Mock mode is useful when reviewers want to test the application without Shopify or Gemini credentials.

Set:

```env
MOCK_SHOPIFY="true"
MOCK_GEMINI="true"
```

Then run:

```bash
npm run dev
```

The app will use deterministic fake products:

- Premium Hoodie, inventory 10, price 100
- Basic T-Shirt, inventory 80, price 25
- Leather Bag, inventory 5, price 120

Use settings:

```txt
Inventory threshold: 50
Maximum allowed price: 150
Review frequency: Hourly
```

Expected result:

- Premium Hoodie is processed and updated.
- Basic T-Shirt is skipped because inventory is above threshold.
- Leather Bag is processed and updated.

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
- `GET /api/pricing/latest`
- `GET /api/pricing/history?limit=10&cursor=<decisionId>`
- `GET /api/pricing/runs?limit=10&cursor=<runId>`
- `POST /api/pricing/run`
- `DELETE /api/pricing/clear-history`
- `POST /api/cron/pricing-run`

The cron endpoint requires:

```txt
Authorization: Bearer <CRON_SECRET>
```

Paginated endpoints return a `nextCursor` value. Pass it as `cursor` to load the next page. `limit` is clamped server-side to protect performance.

## Safety Rules

The app never updates Shopify when:

- inventory is above the threshold
- Gemini response is malformed
- recommended price is below the current price
- recommended price exceeds the maximum allowed price
- Shopify rejects the update

Every skipped or failed product is logged to the dashboard.

## Tests

```bash
npm run test
npm run lint
npm run build
```

Current automated coverage includes:

- price validation accepts safe recommendations
- price validation rejects below-current-price recommendations
- price validation rejects above-maximum recommendations
- scheduler frequency checks prevent early runs

## Deployment Notes

Deploy to Vercel with a hosted PostgreSQL database such as Neon, Supabase, Railway, or Vercel Postgres. Add all environment variables in Vercel.

`node-cron` is only for local development. Vercel does not keep a Node process alive permanently, so `vercel.json` configures Vercel Cron to call the protected cron endpoint hourly.

Before submitting:

- Run `npm run lint`
- Run `npm run test`
- Run `npm run build`
- Add real Shopify/Gemini credentials or enable mock mode for demo
- Capture screenshots of the dashboard, settings page, latest-run decisions, and Shopify product price after update

## Tradeoffs

In this assessment i useses single-store Admin API token to keep setup simple and reviewable. A production multi-merchant Shopify app should add Shopify OAuth, per-shop token storage, Shopify webhooks, stronger tenant authorization, and a background workflow system such as BullMQ/Redis or Inngest for high-volume processing.

## Future Production Upgrades

- Product catalog pagination for stores with large catalogs, including cursor-based Shopify GraphQL pagination across all products and variants.
- Shopify OAuth for a true multi-merchant embedded app instead of a single-store Admin API token.
- BullMQ/Redis or Inngest for heavier background processing, retries, observability, and higher-volume scheduled pricing runs.
- Shopify webhooks for product, inventory, and variant changes so the local system can stay synchronized without waiting for the next scheduled run.
