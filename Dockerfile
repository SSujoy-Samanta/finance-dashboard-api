# --- Stage 1: Base ---
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm
RUN apk add --no-cache libc6-compat openssl build-base python3 pkgconfig

# --- Stage 2: Dependencies ---
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# --- Stage 3: Build ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate Prisma Client
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" pnpm prisma generate
# Build the application
# We use the SKIP_ENV_VALIDATION flag to safely mock secrets during the build phase
RUN SKIP_ENV_VALIDATION=true pnpm build
# Re-install only production dependencies to clear devDependencies from node_modules
RUN pnpm prune --prod

# --- Stage 4: Production Runner ---
FROM node:20-alpine AS runner
WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache openssl

# Security: Run as non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs
USER nodejs

ENV NODE_ENV=production

# Copy built assets and production node_modules from builder
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
# Copy generated swagger documentation
COPY --from=builder --chown=nodejs:nodejs /app/src/generated/swagger ./dist/generated/swagger
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

EXPOSE 3000

# Healthcheck for the container
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/server.js"]
