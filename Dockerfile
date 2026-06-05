FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/
COPY packages/ai/package.json packages/ai/
COPY packages/shared/package.json packages/shared/
RUN npm install -g pnpm && pnpm install
COPY apps/backend /app/apps/backend
COPY packages/ai /app/packages/ai
COPY packages/shared /app/packages/shared
WORKDIR /app/packages/ai
RUN pnpm build
WORKDIR /app/apps/backend
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps ./apps
COPY --from=builder /app/packages ./packages
EXPOSE 3001
WORKDIR /app/apps/backend
CMD ["node", "dist/index.js"]