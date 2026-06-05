# Security Model

This document describes how MemoraX authenticates users, accepts inbound messages from external channels, verifies webhook signatures, redacts PII from logs, and where the known limitations are.

## Authentication layers

### User authentication (Clerk)

User-facing endpoints under `/api/v1/*` (memories, reminders, channels, workspaces, AI, briefings, knowledge graph, serendipity) are protected by Clerk.

- The web app obtains a session JWT from Clerk and forwards it as `Authorization: Bearer <token>`.
- The api-gateway (Cloudflare Worker) calls `verifyToken` from `@clerk/backend` against `CLERK_SECRET_KEY`. On success it attaches `authToken` and `userId` to the Hono context. On failure it logs a warning and lets the request through — **the gateway does not 401**, the backend does the strict enforcement.
- The backend (`apps/backend/src/middleware/auth.ts`) is the authoritative gate. It calls `verifyToken` from `@clerk/clerk-sdk-node`. A missing `Authorization` header returns 401. An invalid/expired token returns 401. A missing `CLERK_SECRET_KEY` returns 503.

### Dev bypass

For local `curl` testing, set both `NODE_ENV=development` and `AUTH_BYPASS_HEADER=true`, then pass `-H "x-dev-user-id: my-user-id"`. This is gated on `NODE_ENV === 'development'`, so a misconfigured production deploy cannot accidentally bypass authentication. A startup warning is logged the first time the bypass is active.

**Never set `AUTH_BYPASS_HEADER=true` in production.** See the Security checklist in [DEPLOY.md](./DEPLOY.md).

## Channel authentication (`/api/v1/capture`)

The `/api/v1/capture` endpoint accepts new memories from external channels (WhatsApp, Telegram, Slack, SMS, email) and is mounted **without** the user Clerk middleware, because the channel sources are services, not humans. It uses its own middleware at `apps/backend/src/middleware/channel-auth.ts`.

Three authentication modes are accepted:

1. **HMAC-SHA256 signature (production).** The channel sends an `X-Channel-Signature: <hex>` header containing `HMAC-SHA256(rawBody, secret)`. The backend recomputes the HMAC over the captured raw body (set by `express.json({ verify })`) and compares with `crypto.timingSafeEqual` to prevent timing attacks. The secret is looked up per-channel:
   - `WHATSAPP_CAPTURE_SECRET`
   - `TELEGRAM_CAPTURE_SECRET`
   - `SLACK_CAPTURE_SECRET`
   - `SMS_CAPTURE_SECRET`
   - `EMAIL_CAPTURE_SECRET`
   - `CHANNEL_CAPTURE_SECRET` (generic fallback if no per-channel secret is set)

   On success the request is marked `channelVerified` and the route synthesizes a `channel-<channel>-<channelUserId>` userId so the memory is attributed to the channel sender.

2. **Bearer token (alternative).** User-authenticated clients (the web app) can POST memories attributed to the Clerk user by passing a normal `Authorization: Bearer ...`. The middleware delegates to the existing `authMiddleware`.

3. **Test / dev bypass.**
   - `NODE_ENV === 'test'` and an `x-test-user-id` header is present — sets `req.userId` and lets the request through. Used by `apps/backend/src/__tests__/security.test.ts`.
   - `NODE_ENV === 'development'` AND `CHANNEL_BYPASS === 'true'` — accepts unsigned requests and logs a startup warning. This is a manual-curl escape hatch and is **never** active in production.

Any other case (no signature, no bearer token, no test/dev bypass) returns 401.

## Webhook signature verification

Each channel verifies the signature on inbound webhooks before processing the payload. If a required secret is unset, the webhook fails closed rather than silently accepting.

| Channel | Scheme | Header(s) | Secret | Library |
|---------|--------|-----------|--------|---------|
| WhatsApp | HMAC-SHA256 of body | `X-Hub-Signature-256` | `WHATSAPP_APP_SECRET` | `crypto.subtle` (HMAC) |
| Slack | HMAC-SHA256 of `v0:<ts>:<body>` | `X-Slack-Signature` + `X-Slack-Request-Timestamp` (5 min replay window) | `SLACK_SIGNING_SECRET` | `crypto.subtle` (HMAC) |
| Telegram | Shared secret (constant-time compare) | `X-Telegram-Bot-Api-Secret-Token` | `TELEGRAM_SECRET_TOKEN` | manual XOR loop |
| Twilio (SMS) | HMAC-SHA1 of `<url> + <sortedParams>` | `X-Twilio-Signature` | `TWILIO_AUTH_TOKEN` | `crypto.subtle` (HMAC) |
| Email | None — see [Known limitations](#known-limitations) | — | — | — |
| Stripe | `stripe.webhooks.constructEvent(rawBody, sig, secret)` | `stripe-signature` | `STRIPE_WEBHOOK_SECRET` | `stripe` SDK |

Slack and Twilio return **503** if their respective signing secret is unset. Telegram and WhatsApp should follow the same pattern — see the issues section of this doc.

## CORS

The backend uses a configurable allowlist via the `CORS_ORIGINS` env var (comma-separated). Without it, the defaults are `http://localhost:3000,http://localhost:3001` for local dev. Same-origin requests (no `Origin` header — i.e. server-to-server) are always allowed.

**Production MUST set `CORS_ORIGINS`** to the actual web app URL (e.g. `https://memorax-web.up.railway.app`). A disallowed origin returns 403.

The api-gateway sets its own CORS allowlist directly in `apps/api-gateway/src/index.ts` and is unrelated to `CORS_ORIGINS`.

## PII handling

Webhook logs are redacted via `redactPII()` in `apps/api-gateway/src/lib/log.ts`:

- Email addresses → `[REDACTED_EMAIL]`
- Phone numbers (7-15 digits with international prefix/formatting) → `[REDACTED_PHONE]`
- Long digit sequences (9+, e.g. credit cards, account numbers) → `[REDACTED_NUM]`
- All logged content is truncated to 100 chars max (sender to 30, content to 80).

Only message IDs and content lengths are logged without redaction, for debugging. The `logWebhook(channel, sender, content)` helper is the single entry point — webhook handlers should use it instead of `console.log` with raw payloads.

## Known limitations

- **Email webhook has no signature scheme.** Most email-to-webhook providers (Mailgun, Postmark inbound, SendGrid Inbound Parse) do not sign requests. Production deployment should add an IP allowlist (Cloudflare WAF rule, or nginx `allow`/`deny`) in front of the api-gateway `/webhooks/email` route, restricted to the provider's published outbound IP ranges.
- **API keys** generated at `/api/v1/api-keys` are stored but not yet validated on incoming requests — they will be wired up in a future release.
- **Rate limiting** in the api-gateway is per-IP (`CF-Connecting-IP`, 100 requests / 60 s via Upstash Ratelimit). If a user is behind a shared NAT or a malicious actor controls many IPs, additional rate-limiting at the user level is recommended.
- **Dev bypass modes** must NEVER be enabled in production. Consider adding a deploy-time assertion that fails the build if `AUTH_BYPASS_HEADER=true` or `CHANNEL_BYPASS=true` is set when `NODE_ENV=production`.
- **Telegram and WhatsApp webhook handlers do not currently fail closed** when their signing secret is unset (see the issues report that accompanied this doc). Slack and Twilio do.

## Reporting a vulnerability

Email security@memorax.ai (placeholder — update when you have a real address). PGP key TBD.
