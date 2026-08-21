# --- Build stage ---
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --ignore-scripts

COPY . .
ENV NITRO_PRESET=node-server
RUN npm run build

# --- Runtime stage ---
FROM nginx:1.27-alpine

RUN apk add --no-cache nodejs curl \
    && addgroup -S atlas && adduser -S atlas -G atlas

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/.output /app/.output
RUN chown -R atlas:atlas /app

WORKDIR /app

ENV PORT=3000
ENV HOST=0.0.0.0

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:80/ || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
