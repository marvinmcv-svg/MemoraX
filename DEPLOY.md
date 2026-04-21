# MemoraX Deployment Guide

## Prerequisites
- Node.js 20+
- Docker & Docker Compose
- PNPM (`npm install -g pnpm`)

## Quick Start (Development)

```bash
# Install dependencies
pnpm install

# Start backend
cd apps/backend && pnpm dev

# Start web (separate terminal)
cd apps/web && pnpm dev
```

## Production Deployment

### 1. Clone and Configure

```bash
git clone <repo-url> memorax
cd memorax
cp .env.production .env
# Edit .env with your actual API keys
```

### 2. Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 3. Manual Deployment

```bash
# Build web
pnpm build --filter=@memorax/web

# Build backend
pnpm build --filter=@memorax/backend

# Start
NODE_ENV=production node apps/backend/dist/index.js
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| Web | 3000 | Next.js frontend |
| Backend | 3001 | Express API |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache/Rate limiting |

## Environment Variables

### Required for Production
- `MINIMAX_API_KEY` - MiniMax AI for classification/extraction
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `CLERK_SECRET_KEY` - Clerk authentication

### Optional Services
- `ANTHROPIC_API_KEY` - Claude AI (alternative)
- `OPENAI_API_KEY` - GPT embeddings
- `DEEPGRAM_API_KEY` - Voice transcription
- `TWILIO_*` - SMS integration
- `TELEGRAM_BOT_TOKEN` - Telegram bot
- `WHATSAPP_*` - WhatsApp Business API
- `SLACK_SIGNING_SECRET` - Slack integration

## Deployment Platforms

### Railway
```bash
railway login
railway init
railway up
```

### Render
```bash
render.yaml included for one-click deploy
```

### Vercel (Web only)
```bash
cd apps/web && vercel --prod
```

### Cloudflare Pages (API Gateway)
```bash
cd apps/api-gateway && wrangler deploy
```

## Health Checks

- Backend: `GET /health`
- Web: `GET /` returns 200

## Cron Jobs

The scheduler runs inside the backend process:
- Every minute: Check pending reminders
- Daily at 7 AM: Generate briefings

## Scaling

For high traffic:
1. Add Redis for BullMQ job queue
2. Scale backend horizontally (stateless design)
3. Use Cloudflare Workers for API gateway (rate limiting, edge caching)