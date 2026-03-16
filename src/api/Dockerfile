# --- Base ---
FROM node:22-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
ENV PNPM_HOME="/pnpm" PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# --- Dependencies ---
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# --- Build ---
FROM deps AS build
COPY . .
RUN pnpm run db:generate && pnpm run build

# --- Production Dependencies ---
FROM build AS prod-deps
RUN pnpm prune --prod

# --- Migrate ---
FROM deps AS migrate
COPY prisma/ ./prisma/
COPY prisma.config.ts ./
CMD ["pnpm", "exec", "prisma", "migrate", "deploy"]

# --- Runner ---
FROM base AS runner
ENV NODE_ENV=production
COPY package.json ./
COPY --from=build /app/prisma/ ./prisma/
COPY --from=build /app/prisma.config.ts ./
COPY --from=prod-deps /app/node_modules/ ./node_modules/
COPY --from=build /app/dist/ ./dist/
RUN mkdir -p uploads uploads-tmp && chown -R node:node uploads uploads-tmp
USER node
EXPOSE 8080
CMD ["node", "dist/index.js"]
