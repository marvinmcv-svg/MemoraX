# MemoraX - AI Memory OS

Your AI-powered memory assistant that never forgets. Capture anything from any channel and recall everything with semantic search.

## Features

- **Multi-Channel Capture**: WhatsApp, Telegram, Slack, SMS, Email, Voice, Web
- **AI Processing Pipeline**: Intent classification, entity extraction, semantic embeddings
- **Smart Reminders**: Natural language scheduling with timezone support
- **Daily Briefings**: AI-generated personalized morning digests
- **Semantic Search**: Find anything using natural language queries
- **Team Workspaces**: Shared memory spaces for collaborative teams
- **Knowledge Graph**: Entity relationships visualized

## Tech Stack

- **Frontend**: Next.js 15, React Native (Expo), Chrome Extension
- **API Gateway**: Hono.js on Cloudflare Workers
- **Backend**: Node.js/TypeScript with Express
- **Database**: PostgreSQL (Neon) + pgvector
- **Cache**: Upstash Redis
- **AI**: Claude (Anthropic), GPT-4 (OpenAI), Deepgram
- **Auth**: Clerk
- **Infrastructure**: Railway, Cloudflare

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for local development)

### Installation

```bash
# Clone the repository
git clone https://github.com/memorax/memorax.git
cd memorax

# Install dependencies
pnpm install

# Copy environment variables
cp apps/backend/.env.example apps/backend/.env
cp apps/api-gateway/.env.example apps/api-gateway/.env
cp apps/web/.env.example apps/web/.env.local
```

### Environment Variables

```bash
# Backend
DATABASE_URL=
CLERK_SECRET_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
DEEPGRAM_API_KEY=

# API Gateway
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
WHATSAPP_APP_SECRET=
WHATSAPP_ACCESS_TOKEN=
TELEGRAM_BOT_TOKEN=
SLACK_SIGNING_SECRET=
```

### Development

```bash
# Run all services in development
pnpm dev

# Run specific workspace
pnpm --filter @memorax/backend dev
pnpm --filter @memorax/web dev
pnpm --filter @memorax/api-gateway dev
```

### Database Setup

```bash
# Run migrations
pnpm db:migrate

# Seed with sample data
pnpm db:seed
```

## Project Structure

```
memorax/
├── apps/
│   ├── api-gateway/      # Hono.js Cloudflare Worker
│   ├── backend/          # Node.js Express API
│   ├── web/              # Next.js 15 dashboard
│   ├── mobile/           # React Native Expo app
│   └── chrome-extension/ # Chrome Extension MV3
├── packages/
│   ├── shared/           # Shared types
│   ├── db/               # Database schema
│   └── ai/               # AI pipeline services
├── SPEC.md               # Full specification
└── turbo.json            # Turborepo config
```

## License

MIT
