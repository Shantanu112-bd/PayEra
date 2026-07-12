FROM node:20-alpine AS base
WORKDIR /app

# Copy root workspace files
COPY package*.json ./
COPY turbo.json ./

# Copy all workspace package.json files first
COPY apps/api/package*.json ./apps/api/
COPY packages/sdk/package*.json ./packages/sdk/
COPY packages/types/package*.json ./packages/types/
COPY packages/ui/package*.json ./packages/ui/

# Install ALL dependencies from root
RUN npm ci

# Copy all source code
COPY apps/api ./apps/api
COPY packages ./packages

# Generate Prisma client
RUN cd apps/api && npx prisma generate

# Build shared packages first
RUN npm run build --workspace=packages/types
RUN npm run build --workspace=packages/sdk

# Build the API
RUN npm run build --workspace=apps/api

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY turbo.json ./

# Copy workspace package.json files
COPY apps/api/package*.json ./apps/api/
COPY packages/sdk/package*.json ./packages/sdk/
COPY packages/types/package*.json ./packages/types/
COPY packages/ui/package*.json ./packages/ui/

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built outputs from base stage
COPY --from=base /app/apps/api/dist ./apps/api/dist
COPY --from=base /app/apps/api/prisma ./apps/api/prisma
COPY --from=base /app/apps/api/src/generated ./apps/api/src/generated
COPY --from=base /app/packages/sdk/dist ./packages/sdk/dist
COPY --from=base /app/packages/types/dist ./packages/types/dist
COPY --from=base /app/node_modules ./node_modules

WORKDIR /app/apps/api

EXPOSE 10000

ENV PORT=10000
ENV NODE_ENV=production

CMD ["node", "dist/main.js"]
