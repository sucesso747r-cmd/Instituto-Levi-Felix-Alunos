# ── Stage 1: builder ─────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

ARG BUILD_COMMIT
ENV BUILD_COMMIT=$BUILD_COMMIT

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: final ────────────────────────────────────────────────────────────
FROM node:22-alpine AS final
WORKDIR /app

RUN apk add --no-cache postgresql-client

ARG BUILD_COMMIT
ENV BUILD_COMMIT=$BUILD_COMMIT

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/index.mjs"]
