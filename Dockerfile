FROM node:20-alpine AS base

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/*/package.json packages/
COPY apps/backend/package.json apps/backend/
COPY apps/web/package.json apps/web/
COPY apps/mobile/package.json apps/mobile/
RUN npm install -g pnpm && pnpm install --frozen-lockfile

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build --filter=@memorax/web --filter=@memorax/backend

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/backend/dist ./backend
COPY --from=builder /app/apps/backend/package.json ./backend/
COPY --from=deps /app/node_modules ./node_modules
EXPOSE 3001
CMD ["node", "backend/dist/index.js"]