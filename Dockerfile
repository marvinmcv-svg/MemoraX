FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
COPY tsconfig.json ./
COPY apps/backend/package.json apps/backend/
COPY apps/backend/tsconfig.json apps/backend/
RUN npm install -g pnpm && pnpm install
COPY apps/backend /app/apps/backend
WORKDIR /app/apps/backend
RUN npx tsc

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/package.json ./
WORKDIR /app
RUN npm install --omit=dev
EXPOSE 3001
CMD ["node", "dist/index.js"]