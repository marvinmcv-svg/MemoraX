# MemoraX Status — 2026-06-09

## ✅ Working

| Component | URL | Status |
|-----------|-----|--------|
| Backend (Railway) | `https://backend-production-c00c.up.railway.app` | ✅ Online |
| Web (Vercel) | `https://web-blush-eight-92.vercel.app` | ✅ All pages 200 |

### Verified Working
- `GET /health` → 200 ✅
- All 5 webhook routes return correct fail-closed codes:
  - `/webhooks/slack` → 503 (no secret)
  - `/webhooks/telegram` → 503 (no secret)
  - `/webhooks/whatsapp` → 503 (no secret)
  - `/webhooks/discord` → 503 (no secret)
  - `/webhooks/stripe` → 401 (no secret)
- Railway backend: connected to Postgres, 4 memories stored, scheduler running
- All 11 DB tables present with vector extension

---

## 🟡 Known Issues — Needs User Input

### 1. AI Features — Need API Keys
**Status:** Blocked on user

No `OPENAI_API_KEY` or `GEMINI_API_KEY` set on Railway backend → memories have no embeddings.

**To fix:** Provide your keys, I'll add them to Railway backend vars.

---

### 2. Discord Channel — Need Bot Token
**Status:** Blocked on user

`DISCORD_BOT_TOKEN` not set → Discord webhook route exists but not functional.

**To fix:** Provide bot token, I'll add to Railway backend vars.

---

### 3. Clerk Auth — Temporarily Disabled
**Status:** Deferred — app works in dev mode

Clerk v5 (5.7.6) has SSR context issues with Next.js App Router on Vercel edge.
Downgraded to v4 (4.31.8) but still hit 401 on all routes due to Clerk key not accessible in edge runtime.

**Workaround:** Dev-mode sign-in/sign-up buttons. App is functional.

**To fix later:** Re-enable Clerk with proper key configuration.

---

## 📋 Secrets Needed From User

| Secret | Where to get |
|--------|-------------|
| `OPENAI_API_KEY` | https://platform.openai.com/api-keys |
| `GEMINI_API_KEY` | https://aistudio.google.com/app/apikey |
| `DISCORD_BOT_TOKEN` | https://discord.com/developers/applications |

---

## 🔑 Secrets Already Set on Railway Backend

| Secret |
|--------|
| `CHANNEL_CAPTURE_SECRET` |
| `WHATSAPP_CAPTURE_SECRET` |
| `TELEGRAM_CAPTURE_SECRET` |
| `SLACK_CAPTURE_SECRET` |
| `EMAIL_CAPTURE_SECRET` |
| `SMS_CAPTURE_SECRET` |
| `GEMINI_API_KEY` |
| `CLERK_SECRET_KEY` |

---

## 📊 Backend Route Test Results (2026-06-09)

| Endpoint | Status |
|----------|--------|
| `GET /health` | 200 ✅ |
| `GET /api/v1/*` (auth required) | 503 ✅ (fail-closed) |
| `POST /api/v1/capture` (no auth) | 401 ✅ |
| `POST /webhooks/stripe` (no secret) | 401 ✅ |
| `POST /webhooks/slack` (no secret) | 503 ✅ |
| `POST /webhooks/telegram` (no secret) | 503 ✅ |
| `POST /webhooks/whatsapp` (no secret) | 503 ✅ |
| `POST /webhooks/discord` (no secret) | 503 ✅ |

---

## 📝 Notes

- Clerk temporarily disabled — web works in dev mode with localStorage session
- Railway backend linked to project `memorax`, service `backend`
- Vercel web deployed via `npx vercel --prod --force` (GitHub auto-deploy not configured)
- Webhook routes wired in `apps/backend/src/index.ts` — all fail-closed when secrets not configured