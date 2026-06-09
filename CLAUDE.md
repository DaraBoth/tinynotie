# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TinyNotie is a full-stack expense-tracking and group finance app with Telegram Mini App integration, AI-powered chat, OCR receipt scanning, and PWA support.

## Repository Structure

This is a monorepo with two active workspaces:
- `client-next/` — Next.js 16 frontend (React 19, App Router)
- `server/` — Express.js backend (Node.js >=22)

> The `client/` directory is a legacy Vite/React app — it is no longer active.

## Commands

### Frontend (`client-next/`)
```bash
pnpm dev        # Start dev server on http://localhost:4000 (Turbopack)
pnpm build      # Production build
pnpm start      # Start production server
pnpm lint       # Run Next.js ESLint
```

### Backend (`server/`)
```bash
npm run dev     # Start with nodemon (auto-reload)
npm start       # Start with node index.js
```

There are no test suites configured in either workspace.

## Architecture

### Frontend (client-next/)

**Routing** — Next.js App Router (`app/` directory). Key routes:
- `app/home/` — main dashboard
- `app/groups/` — group management
- `app/tg/` — Telegram Mini App entry point
- `app/translate/`, `app/profile/`, `app/help/`

**State Management** — Two-layer approach:
- **Zustand** (`store/`) for client-side state: `authStore.js` (JWT persistence), `themeStore.js`, `uiStore.js`
- **TanStack Query v5** for all server state, caching, and background refetching

**API Layer** — `api/apiClient.js` is an Axios instance with interceptors that automatically inject the JWT from `authStore` and handle token expiration.

**UI Components** — shadcn/ui (Radix UI primitives) in `components/ui/`. Custom app components live directly in `components/`.

**Path Aliases** (from `jsconfig.json`):
```
@/components  @/lib  @/store  @/hooks  @/utils  @/api
```

**Notable integrations:**
- Tesseract.js for client-side OCR (receipt scanning)
- `next-themes` for dark mode
- Framer Motion for animations
- `ServiceWorkerRegistration` and `manifest.json` for PWA
- `TelegramMiniAppAuthBootstrap` component handles Telegram WebApp auth on the `app/tg/` route

### Backend (server/)

**Entry point:** `index.js` — sets up Express middleware (helmet, cors, morgan, multer), mounts all routers, registers Swagger docs at `/api-docs`, configures the Telegram webhook, and exposes `/healthz` for Fly.io health checks.

**Route files** (`routes/`):
- `auth.js` — JWT login/register, Telegram auth
- `api.js` — general endpoints
- `groupRoutes.js`, `tripRoutes.js` — core expense features
- `chatRoutes.js` — AI chat with database context
- `openai.js` — OpenAI/Gemini integrations
- `telegrambot.js` — Telegram bot webhook handler (webhook mode only, no polling)
- `userRoutes.js`, `miscRoutes.js`, `daraboth.js`

**Services** (`services/`):
- `aiAgentService.js` — wraps OpenAI and Google Vertex AI
- `openaiClient.js` — OpenAI client singleton
- `telegramBotService.js` — Telegraf bot instance
- `receiptService.js` — receipt OCR processing

**Database:** PostgreSQL via the `pg` driver with connection pooling. No ORM — raw SQL queries.

**Deployment targets:** Vercel (`vercel.json`), Fly.io (`fly.toml`), Docker (`Dockerfile`). Backend is currently deployed to Fly.io; frontend to Vercel.

## Key Conventions

- **No Redux** — use Zustand for UI/auth state, TanStack Query for anything fetched from the server.
- **Telegram bot runs webhook-only** — never switch to polling mode in production. Use `telegram-webhook.sh` to register the webhook URL.
- **Authentication** — JWT stored via Zustand persist middleware (localStorage). The `TokenExpirationHandler` component in the frontend handles expiry warnings globally.
- **Styling** — Tailwind utility classes only; CSS variables defined in `globals.css` drive the shadcn/ui theme tokens.
- **API docs** — Swagger annotations live in the route files; docs are served at `/api-docs`.
