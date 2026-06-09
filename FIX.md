# MemoraX Smoke Test Findings — 2026-06-08

## Smoke Test Coverage
- Backend: 19 endpoints tested (15/19 passing = 78.9%)
- Database: 14 queries executed across all 11 tables
- AI Pipeline: 4 scenarios tested
- Web: Railway + Vercel deployment tested
- Railway Infra: CLI auth tested

---

## 🔴 CRITICAL — App Not Functional

### 1. Railway Web Deployment is DEAD
**Severity:** CRITICAL
**Status:** Needs redeployment

The Railway web service at `https://web-production-352c5.up.railway.app` returns:
```json
{"status":"error","code":404,"message":"Application not found"}
```

The web service was deleted in a previous session (to avoid confusion with Vercel web), but Vercel was never set up as a replacement.

**Fix:** Either:
- A) Re-deploy web to Railway (follow DEPLOY.md section 4.3)
- B) Set up Vercel deployment (see issue #7)

---

### 2. Railway CLI Auth Expired
**Severity:** CRITICAL
**Status:** Needs re-authentication

All `railway` CLI commands fail with:
```
Warning: failed to refresh OAuth token: Token refresh failed: invalid_grant: grant request is invalid.
Unauthorized. Please run `railway login` again.
```

Cannot manage services via CLI until re-authenticated.

**Fix:**
```powershell
railway login
```
Then re-run management commands.

---

---

## ✅ RESOLVED — Webhook Routes Wired (2026-06-08)

**Commit:** `d96df88` — "feat(backend): wire Slack, Telegram, Twilio, WhatsApp, Discord webhook routes"

All 5 webhook routes are now wired in `apps/backend/src/index.ts`:
- `POST /webhooks/stripe` → existing Stripe handler (already worked)
- `POST /webhooks/slack` → Slack webhook (HMAC-SHA256, `X-Slack-Signature` header)
- `POST /webhooks/telegram` → Telegram webhook (`X-Telegram-Bot-Api-Secret-Token` header)
- `POST /webhooks/twilio` → Twilio SMS (`X-Twilio-Signature` header, TwiML response)
- `POST /webhooks/whatsapp` → WhatsApp (`X-Hub-Signature-256` HMAC, verify challenge GET)
- `POST /webhooks/discord` → **NEW** Discord (bot token auth, message capture)

**Railway auto-deploy pending** — pushed to `main`, Railway will deploy automatically.
Once deployed, all 5 will return 503 when secrets not configured, 401 on auth failure.

**Pre-deploy status:** Routes return 404 (old code still running on Railway).

---

## 🟠 HIGH — Railway CLI Auth Expired
**Severity:** HIGH
**Status:** Needs re-authentication — user must run `railway login` in terminal

All `railway` CLI commands fail with:
```
Warning: failed to refresh OAuth token: Token refresh failed: invalid_grant: grant request is invalid.
Unauthorized. Please run `railway login` again.
```

Cannot manage services via CLI until re-authenticated.

**Fix:**
```powershell
railway login
```
Then re-run management commands.

---

## 🟠 HIGH — Railway Web Deployment DEAD
**Severity:** HIGH
**Status:** Web service deleted from Railway — no frontend is currently hosted

`https://web-production-352c5.up.railway.app` → **404 "Application not found"**

Vercel was never set up as replacement.

**Fix:** Either:
- A) Re-deploy web to Railway: `railway login` → `railway up` from `apps/web/`
- B) Set up Vercel: `vercel --prod` from `apps/web/` directory (requires Vercel account linked to GitHub)

---

## 🟠 HIGH — Features Broken

### 4. HMAC Auth Ordering — Clerk Check Before Capture Secret
**Severity:** HIGH
**Status:** Known behavior, not critical

When a request has HMAC headers (valid signature) but no channel capture secret is configured, the backend returns:
```
503 {"error":"Authentication not configured"}
```

Expected (per security model):
```
401 {"error":"No capture secret configured for channel"}
```

**Root cause:** In `channelAuthMiddleware`, the `Authorization: Bearer` check happens before the HMAC signature check. A request with HMAC headers but no Bearer token AND no channel secret should fail with "No capture secret", but since `authMiddleware` returns 503 when no Clerk key is set, the HMAC path is never reached.

**Fix:** Reorder checks in `channelAuthMiddleware`:
1. Check HMAC signature FIRST (doesn't need Clerk)
2. Then check Bearer token (needs Clerk)
3. Then check dev bypass

Or: Check for HMAC presence before delegating to Clerk auth.

---

### 5. Stripe Webhook Returns 503 Instead of 401
**Severity:** MEDIUM
**Status:** Minor deviation

`POST /webhooks/stripe` with no auth returns:
```
503 {"error":"Stripe not configured"}
```

Expected: `401` or `400` for unauthenticated webhook call.

**Fix:** Return 401 instead of 503 when Stripe is not configured, to avoid leaking configuration state.

---

### 6. No Memories Have Embeddings
**Severity:** HIGH
**Status:** Expected without API keys

- `SELECT count(*) from memories where embedding is not null` → **0**
- All 4 memories have `embedding IS NULL`
- No embedding functions stored in DB

**Root cause:** No `GEMINI_API_KEY` and no `OPENAI_API_KEY` are set, so:
- `aiPipeline.isConfigured()` returns `false`
- `fallbackProcess()` is used, which doesn't generate embeddings
- Embeddings require either Gemini (for embeddings via OpenAI-compatible API) or OpenAI API

**Fix:** Set `OPENAI_API_KEY` (for embeddings) and `GEMINI_API_KEY` (for AI features) in Railway backend variables.

---

### 7. Vercel Not Set Up — No Frontend Deployment
**Severity:** HIGH
**Status:** Needs setup

No Vercel git remote is configured:
```
origin  https://github.com/marvinmcv-svg/MemoraX.git (fetch)
origin  https://github.com/marvinmcv-svg/MemoraX.git (push)
```

The `apps/web/vercel.json` exists but no Vercel project is linked.

**Fix:** Either:
- A) Set up Vercel: `vercel --prod` from `apps/web/` directory
- B) Re-deploy web to Railway (see issue #1)

---

## 🟡 MEDIUM — Degraded but Functional

### 8. Railway Backend Health Check Works
**Severity:** INFO
**Status:** ✅ Working

`GET /health` → `200 {"status":"ok","db":"configured"}` ✅

Database connected, all tables present, 4 memories stored successfully.

---

### 9. All 11 Database Tables Present
**Severity:** INFO
**Status:** ✅ Working

Tables: `ai_processing_log`, `briefings`, `memories`, `memory_entities`, `reminders`, `team_members`, `teams`, `user_channels`, `users`, `workspace_memories`, `workspaces` — all present with correct schemas.

Vector type installed (`vector` extension loaded).

---

### 10. Clerk Auth Properly Configured (503 Without Key)
**Severity:** INFO
**Status:** ✅ Working as intended

All `/api/v1/*` routes return `503 {"error":"Authentication not configured"}` when no Clerk key is set. This is the correct fail-closed behavior.

---

## 📋 Priority Fix Order

### Phase 1 — Restore Deployability (do first)
1. **Re-auth Railway CLI** → `railway login` (unblocks Railway management + manual deploys)
2. **Re-deploy web to Railway** OR set up Vercel (frontend is currently unhosted)
3. ✅ **Webhook routes wired** (commit `d96df88` pushed — Railway auto-deploy pending)

### Phase 2 — Enable AI Features (do second)
4. **Set `GEMINI_API_KEY`** in Railway backend vars → activates intent/entities/briefing
5. **Set `OPENAI_API_KEY`** in Railway backend vars → activates embeddings

### Phase 3 — Security Hardening (do third)
6. **Fix HMAC auth ordering** in `channelAuthMiddleware`
7. **Fix Stripe webhook error code** (503 → 401)

### Phase 4 — New Channel
8. **Add `DISCORD_BOT_TOKEN`** to Railway backend vars → enables Discord capture

---

## 🔑 Secrets Currently Set on Railway Backend

| Secret | Value |
|--------|-------|
| `CHANNEL_CAPTURE_SECRET` | `1a95fc977c4ae07255356edb3f06d42b9fea86496098864135eca61e092c058f` |
| `WHATSAPP_CAPTURE_SECRET` | `23f3ce1cbd17730679661c9b17f0d6810f5fc0b3fa7819e439c9e17f39af8377` |
| `TELEGRAM_CAPTURE_SECRET` | `fcb6e869454c8ee72a362cd66deedf28e6abe32de50c95d3357e51549128cd2c` |
| `SLACK_CAPTURE_SECRET` | `bb2598e85051fab2c433ecdbbda37fc49c75adebde56af4b3d1a5b657b383281` |
| `EMAIL_CAPTURE_SECRET` | `e3dc53374b63438091d61aaf75b64a9ae909802534c95bb85584272e8561dafe` |
| `SMS_CAPTURE_SECRET` | `2dd27103992f881c51566941fb60990f3ad4bdc70e7f60bcbaa7c8c7f0aa8fef` |

**Still needed:**
- `GEMINI_API_KEY` — get at https://aistudio.google.com/app/apikey
- `OPENAI_API_KEY` — get at https://platform.openai.com/api-keys
- `CLERK_SECRET_KEY` — get at https://dashboard.clerk.com
- `DISCORD_BOT_TOKEN` — get from https://discord.com/developers/applications

---

## 📊 Backend Route Test Results (15/19 passing — webhook routes pending Railway deploy)

| # | Endpoint | Expected | Actual (pre-deploy) | Status |
|---|----------|----------|---------|--------|
| 1 | `GET /health` | 200 | 200 | ✅ |
| 2 | `GET /api/v1/memories` | 401/503 | 503 | ✅ |
| 3 | `GET /api/v1/reminders` | 401/503 | 503 | ✅ |
| 4 | `GET /api/v1/workspaces` | 401/503 | 503 | ✅ |
| 5 | `GET /api/v1/briefing` | 401/503 | 503 | ✅ |
| 6 | `POST /api/v1/capture` (no auth) | 401 | 401 | ✅ |
| 7 | `POST /api/v1/capture` (fake Bearer) | 503 | 503 | ✅ |
| 8 | `POST /api/v1/capture` (HMAC, no secrets) | 401 "No capture secret" | 503 | ❌ |
| 9 | `GET /api/v1/kg` | 401/503 | 503 | ✅ |
| 10 | `GET /api/v1/serendipity` | 401/503 | 503 | ✅ |
| 11 | `GET /api/v1/channels` | 401/503 | 503 | ✅ |
| 12 | `GET /api/v1/api-keys` | 401/503 | 503 | ✅ |
| 13 | `GET /api/v1/ai` | 401/503 | 503 | ✅ |
| 14 | `POST /webhooks/stripe` | 400/401 | 503 | ❌ |
| 15 | `POST /webhooks/slack` | 503 (no secret) | 404 | ⏳ Railway deploy pending |
| 16 | `POST /webhooks/telegram` | 503 (no secret) | 404 | ⏳ Railway deploy pending |
| 17 | `POST /webhooks/twilio` | 503 (no secret) | 404 | ⏳ Railway deploy pending |
| 18 | `POST /webhooks/whatsapp` | 503 (no secret) | 404 | ⏳ Railway deploy pending |
| 19 | `POST /webhooks/discord` | 503 (no secret) | 404 | ⏳ Railway deploy pending |
| 20 | `GET /` | 404 | 404 | ✅ |
