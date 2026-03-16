# --- Base ---
FROM node:22-slim AS base
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
ARG VITE_API_BASE_URL
ARG VITE_SOCKET_URL
ARG VITE_SOCKET_PATH
ARG VITE_MAX_UPLOAD_FILE_COUNT
ARG VITE_MAX_UPLOAD_SIZE_MB
RUN pnpm run build

# --- Runner ---
FROM nginx:alpine AS runner
COPY --from=build /app/dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80