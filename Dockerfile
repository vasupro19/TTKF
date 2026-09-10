# ============================================================================
#  WEB IMAGE — static build served by nginx
# ============================================================================
#
#  The previous Dockerfile ended with:
#
#      CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
#
#  That runs VITE'S DEVELOPMENT SERVER in production. Consequences:
#    - every module is served unbundled and unminified, so a first load pulls
#      thousands of requests instead of a handful of hashed chunks
#    - source and source maps are exposed to anyone who opens devtools
#    - the HMR websocket is open to the internet
#    - three of the open vite advisories are dev-server-only, and this is the
#      configuration that made them apply
#
#  Now: build once, serve the static output from nginx.
# ============================================================================

# ---------------------------------------------------------------- build stage
FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite inlines VITE_* variables at BUILD time, not runtime — so the API URL has
# to be a build argument. One image per environment is the consequence of how
# Vite works; the alternative is a runtime config file fetched by the app.
ARG VITE_APP_BASE_URL
ARG VITE_APP_NAME=TTK
ARG VITE_APP_ENV=production

ENV VITE_APP_BASE_URL=$VITE_APP_BASE_URL \
    VITE_APP_NAME=$VITE_APP_NAME \
    VITE_APP_ENV=$VITE_APP_ENV

RUN test -n "$VITE_APP_BASE_URL" || (echo "ERROR: build with --build-arg VITE_APP_BASE_URL=https://api.example.com/v1" && exit 1)

RUN npm run build

# ------------------------------------------------------------- runtime stage
FROM nginx:1.27-alpine AS runtime

# nginx:alpine already runs worker processes as an unprivileged user; the
# master needs root to bind port 80 inside the container.
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
