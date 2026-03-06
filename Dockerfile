# Multi-stage Dockerfile for Leasebase Web (Next.js + Node.js)

# 1) Builder image: install deps and build the app
FROM node:20-alpine AS builder

WORKDIR /app

# Install OS deps (if needed for future tooling)
RUN apk add --no-cache libc6-compat

# Copy package manifests and lockfile first for better caching
COPY package.json package-lock.json ./

RUN npm ci

# Copy the rest of the source
COPY . .

# API URLs — baked into the Next.js build.
# API_BASE_URL:              used by next.config.mjs server-side rewrites.
# NEXT_PUBLIC_API_BASE_URL:  used by browser-side code (apiBase.ts).
ARG API_BASE_URL=http://localhost:4000
ARG NEXT_PUBLIC_API_BASE_URL=
ENV API_BASE_URL=${API_BASE_URL}
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

# Build the Next.js app
RUN npm run build

# 2) Runner image: minimal production runtime (standalone)
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Runtime env vars are injected at deploy time (ECS task definition, etc.):
#   API_BASE_URL, NEXT_PUBLIC_API_BASE_URL,
#   NEXT_PUBLIC_COGNITO_USER_POOL_ID, NEXT_PUBLIC_COGNITO_CLIENT_ID,
#   NEXT_PUBLIC_COGNITO_DOMAIN, DEV_ONLY_MOCK_AUTH

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs \
  && adduser -S nextjs -u 1001

# With output: 'standalone', Next.js bundles everything into .next/standalone.
# We only need the standalone server, static assets, and public dir.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

# Start the Next.js standalone server directly.
# CloudFront → public web ALB → ECS; no API Gateway in the web path.
CMD ["node", "server.js"]
