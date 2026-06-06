# MemoraX Deployment Guide

Railway path: one project, three services (Postgres + backend + web). Single dashboard, internal DNS, no CORS, scheduler (long-lived cron) supported. The api-gateway lives on Cloudflare Workers and is deployed separately (see section 4.4).

---

## 1. Overview

```
[Browser]
    |  https
    v
[Railway: memorax-web]          Next.js 14, public
    |
    |  https://<backend>.up.railway.app  (no CORS - same origin policy relaxed via Clerk + server-side fetch)
    v
[Railway: memorax-backend]      Express, public URL (web calls it)
    |
    |  DATABASE_URL (auto-injected via Railway reference)
    v
[Railway: memorax-postgres]     Postgres 15 + pgvector (custom image)
```

Why this works:
- One Railway project, one bill, one dashboard.
- Railway injects `DATABASE_URL` into the backend via a variable reference (`${{Postgres.DATABASE_URL}}`).
- Backend exposes a public HTTPS URL the web app calls; the web app does NOT need to be on the same domain.
- The backend runs a long-lived cron (reminders, daily briefings). Railway's default single-instance service keeps the scheduler from running twice.
- Internal network: services in the same Railway project can reference each other by service name.

---

## 2. Prerequisites

- GitHub repo pushed: `git push origin main`
- Railway account at https://railway.app (the $5/mo hobby credit covers a starter deployment)
- Clerk account at https://dashboard.clerk.com (auth keys)
- One AI provider key: Google Gemini (recommended) or OpenAI
- Optional: Stripe, Twilio, WhatsApp, Telegram, Slack, Deepgram (add later when you wire those features)

---

## 3. One-time setup

1. Push code: `git push origin main`
2. Sign into Railway with GitHub: https://railway.app
3. Click **New Project** -> **Deploy from GitHub repo** -> select `MemoraX`

This creates an empty project. Add the three Railway services next. The api-gateway is deployed separately to Cloudflare (see section 4.4).

---

## 4. Add the services

### 4.1 Postgres (with pgvector)

Railway's stock Postgres image does NOT include the `pgvector` extension. Use the `pgvector/pgvector:pg15` image instead.

1. In your Railway project, click **+ New** -> **Database** -> **PostgreSQL**.
2. Click the new Postgres service -> **Settings** -> **Deploy** -> find the image field and override it:
   ```
   pgvector/pgvector:pg15
   ```
3. Wait for it to redeploy with the new image.
4. Open the **Variables** tab. Copy the `DATABASE_URL` value (you will paste a reference into the backend).

Alternative: use Neon (https://neon.tech) for a free tier and point `DATABASE_URL` at it. Neon has pgvector built in.

### 4.2 Backend

1. Click **+ New** -> **GitHub Repo** -> select `MemoraX`.
2. Click the new service -> **Settings**:
   - **Build command**: leave empty (uses Dockerfile)
   - **Dockerfile path**: `Dockerfile.backend`
   - **Watch paths** (so the service only rebuilds on backend changes):
     ```
     apps/backend/**
     packages/**
     Dockerfile.backend
     package.json
     pnpm-lock.yaml
     pnpm-workspace.yaml
     ```
3. **Variables** tab -> **+ New Variable** -> add each:

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | |
| `PORT` | `3001` | |
| `CLERK_SECRET_KEY` | `sk_test_...` | use `sk_live_...` for prod |
| `GEMINI_API_KEY` | `AIza...` | optional but recommended |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | click "Add Reference" -> pick Postgres -> DATABASE_URL |
| `STRIPE_SECRET_KEY` | _(empty)_ | optional |
| `OPENAI_API_KEY` | _(empty)_ | optional (embeddings) |
| `DEEPGRAM_API_KEY` | _(empty)_ | optional (voice) |
| `WHATSAPP_ACCESS_TOKEN` | _(empty)_ | optional |
| `WHATSAPP_PHONE_ID` | _(empty)_ | optional |
| `WHATSAPP_APP_SECRET` | _(empty)_ | optional |
| `WHATSAPP_VERIFY_TOKEN` | _(empty)_ | optional |
| `TELEGRAM_BOT_TOKEN` | _(empty)_ | optional |
| `TWILIO_ACCOUNT_SID` | _(empty)_ | optional |
| `TWILIO_AUTH_TOKEN` | _(empty)_ | optional |
| `SLACK_SIGNING_SECRET` | _(empty)_ | optional |
| `SLACK_BOT_TOKEN` | _(empty)_ | optional |
| `CORS_ORIGINS` | `https://memorax-web.up.railway.app` | comma-separated allowlist; default `http://localhost:3000,http://localhost:3001` |
| `CHANNEL_CAPTURE_SECRET` | `<random 32+ char hex>` | generic HMAC secret for `/api/v1/capture` |
| `WHATSAPP_CAPTURE_SECRET` | `<random 32+ char hex>` | per-channel secret; overrides generic |
| `TELEGRAM_CAPTURE_SECRET` | `<random 32+ char hex>` | per-channel secret; overrides generic |
| `SLACK_CAPTURE_SECRET` | `<random 32+ char hex>` | per-channel secret; overrides generic |
| `SMS_CAPTURE_SECRET` | `<random 32+ char hex>` | per-channel secret; overrides generic |
| `EMAIL_CAPTURE_SECRET` | `<random 32+ char hex>` | per-channel secret; overrides generic |
| `CHANNEL_BYPASS` | `true` | ONLY set in dev — never in production |

Generate channel secrets with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

4. **Settings** -> **Networking** -> **Generate Domain**. Copy the URL (e.g. `memorax-backend.up.railway.app`). You will paste this into the web service.

### 4.3 Web

1. Click **+ New** -> **GitHub Repo** -> select `MemoraX`.
2. Click the new service -> **Settings**:
   - **Build command**: leave empty (uses Dockerfile)
   - **Dockerfile path**: `Dockerfile.web`
   - **Watch paths**:
     ```
     apps/web/**
     packages/**
     Dockerfile.web
     package.json
     pnpm-lock.yaml
     pnpm-workspace.yaml
     ```
3. **Variables** tab -> **+ New Variable**:

| Variable | Value | Notes |
|----------|-------|-------|
| `NEXT_PUBLIC_API_URL` | `https://<your-backend>.up.railway.app` | the URL from step 4.2, must be `https://` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_...` | use `pk_live_...` for prod |

4. **Settings** -> **Networking** -> **Generate Domain**. The result is your public app URL (e.g. `memorax-web.up.railway.app`). Add a custom domain here later if you have one.

### 4.4 API Gateway (Cloudflare Workers)

The api-gateway is a Hono.js Cloudflare Worker, not a Railway service. It sits in front of the channel webhooks (WhatsApp, Telegram, Slack, Twilio, Email) and rate-limits `/api/*` traffic. Deploy it from `apps/api-gateway/` with `wrangler deploy` (see its README for CI setup). The full env-var list lives in `apps/api-gateway/.env.example`; the new security-relevant vars introduced in commit `3d174a1` are:

| Variable | Value | Notes |
|----------|-------|-------|
| `TELEGRAM_SECRET_TOKEN` | `<random 32+ char hex>` | Telegram will send this in `X-Telegram-Bot-Api-Secret-Token` |
| `CLERK_SECRET_KEY` | `<from Clerk dashboard>` | now actually verified at the gateway (best-effort; backend still enforces 401) |

`CLERK_SECRET_KEY` MUST be the same key as the backend service and from the same Clerk app — see section 5. The gateway also needs the same webhook signing secrets as the backend (e.g. `WHATSAPP_APP_SECRET`, `SLACK_SIGNING_SECRET`, `TWILIO_AUTH_TOKEN`) because webhooks hit the gateway first.

---

## 5. Wire Clerk to your domains

In https://dashboard.clerk.com, open your app -> **Configure** -> **Domains**:

- Add the web service URL (e.g. `https://memorax-web.up.railway.app`) as an allowed origin.
- Add `https://*.up.railway.app` as a wildcard for preview deploys.
- Add the same URLs as redirect/sign-in URLs.
- If you set a custom domain (e.g. `app.memorax.com`): add it here AND in Railway (web service -> Settings -> Domains -> Custom Domain).

The Clerk publishable key in the web app and the Clerk secret key in the backend MUST come from the same Clerk app. Mixing keys from different Clerk apps causes `Invalid token` errors.

---

## 6. Verify deployment

1. Wait for all three Railway services to show a green **Deployed** status. First build takes 5-10 minutes (pnpm install of all workspace packages).
2. Open the **web** service URL in a browser. You should see the landing page or Clerk sign-in.
3. Sign in. You should reach the dashboard.
4. From the dashboard, capture a memory. Confirm it appears in the list.
5. Hit the backend health endpoint directly:
   ```
   curl https://<your-backend>.up.railway.app/health
   ```
   Expected response:
   ```json
   {"status":"ok","db":"configured","timestamp":"2026-..."}
   ```

---

## 7. Run database migrations

One-time, after the first successful deploy.

**Option A - Railway CLI** (faster):
```bash
railway link            # pick the project and the memorax-backend service
railway run pnpm db:migrate
```

**Option B - one-off shell in the dashboard**:
1. Open the backend service in Railway.
2. Click the **...** menu -> **Shell** (opens a web terminal attached to the running container).
3. Run:
   ```bash
   pnpm db:migrate
   ```

This creates the `memories`, `reminders`, `workspaces`, etc. tables and enables the `vector` extension.

---

## 8. Production hardening checklist

- [ ] Switch Clerk to live keys (`sk_live_...`, `pk_live_...`).
- [ ] Switch Gemini to a paid-tier key if free tier rate limits are hit.
- [ ] Add a custom domain to the web service (Settings -> Domains).
- [ ] Put Cloudflare in front of the custom domain for DDoS protection and a free TLS edge.
- [ ] Restrict CORS in `apps/backend/src/index.ts:21`. Currently `cors()` is fully open. Change to:
      ```ts
      app.use(cors({ origin: 'https://app.memorax.com', credentials: true }));
      ```
- [ ] Set Railway alerts: backend service -> Settings -> **Alerts** -> enable build-failure and crash notifications.
- [ ] Set up Postgres backups. Either upgrade to Railway Pro (automatic daily backups) or use Neon (built-in PITR on the free tier).

---

## 9. Security checklist

Run through this list after the first production deploy and again whenever you rotate secrets.

- [ ] Generate random secrets for all `CHANNEL_*_CAPTURE_SECRET` vars and store in Railway
- [ ] Set `CORS_ORIGINS` to the actual web URL (not `localhost`)
- [ ] Verify `CHANNEL_BYPASS` is NOT set in production (it should be absent)
- [ ] Verify `AUTH_BYPASS_HEADER` is NOT set in production
- [ ] Configure Clerk's allowed domains to include the Railway URLs
- [ ] All 5 webhook secrets (`WHATSAPP_APP_SECRET`, `SLACK_SIGNING_SECRET`, `TELEGRAM_SECRET_TOKEN`, `TWILIO_AUTH_TOKEN`, etc.) are set

See [SECURITY.md](./SECURITY.md) for the full security model (channel HMAC, webhook signature schemes, PII redaction, known limitations).

---

## 10. Local development still works

Railway is for production. Local dev is unchanged:

```bash
pnpm install
pnpm dev
```

- Backend falls back to an in-memory store when `DATABASE_URL` is empty (good for offline dev).
- Set `AUTH_BYPASS_HEADER=true` plus `NODE_ENV=development` to skip Clerk for `curl` testing.
- See `README.md` for the full dev setup.

---

## 11. Troubleshooting

**Backend says "Database is not configured"**
`DATABASE_URL` is not set on the backend service. In the backend's Variables tab it should read `${{Postgres.DATABASE_URL}}` (with the `${{...}}` reference, not a literal connection string pasted in). Railway resolves the reference at runtime.

**Web cannot reach the backend**
`NEXT_PUBLIC_API_URL` must be the backend's public URL (the `*.up.railway.app` URL from step 4.2), not `localhost`. It must start with `https://`, not `http://`. The variable is read at build time by Next.js, so rebuild the web service after changing it.

**Clerk returns "Invalid token" on the backend**
The Clerk publishable key (web) and secret key (backend) must come from the SAME Clerk app in the dashboard. If you created two apps, swap one of the keys.

**Web build fails: `Cannot find module '@memorax/shared'`**
`pnpm-workspace.yaml` and `pnpm-lock.yaml` must be present in the Docker build context. The current `.dockerignore` keeps them, but if a future change ignores them, the monorepo workspace breaks. Verify both files are at the repo root and not listed in `.dockerignore`.

**pgvector extension missing on Postgres**
If you used Railway's stock Postgres image instead of overriding to `pgvector/pgvector:pg15`, vector columns fail. Fix: Postgres service -> Settings -> Deploy -> set the image to `pgvector/pgvector:pg15` and redeploy.

**Scheduler not running / running multiple times**
The backend runs a single in-process cron. By default Railway runs one container, so the scheduler fires once. If you ever scale the backend to multiple instances, the cron will fire on each one. Fix later by either pinning replicas to 1, moving the scheduler to its own Railway service, or adopting BullMQ with Redis.

**First deploy takes 5-10 minutes**
Normal. pnpm is installing all workspace packages. Subsequent deploys are faster thanks to Docker layer caching.

**Backend redeploys on every push**
You configured Watch Paths. The service only rebuilds when files under those globs change. If it's still rebuilding on unrelated commits, double-check the Watch Paths list in Settings.
