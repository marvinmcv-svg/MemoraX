FROM node:20-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/
COPY packages/ai/package.json packages/ai/
COPY packages/shared/package.json packages/shared/
COPY packages/db/package.json packages/db/

RUN pnpm install

COPY apps/backend apps/backend
COPY packages/ai packages/ai
COPY packages/shared packages/shared

WORKDIR /app/apps/backend
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/package.json ./

RUN npm install --omit=dev

EXPOSE 3001
CMD ["node", "dist/index.js"]