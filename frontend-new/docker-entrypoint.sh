#!/bin/sh
set -e

# Start the SSR server in the background
node /app/.output/server/index.mjs &
SSR_PID=$!

# Wait for SSR server to be ready
sleep 2

# Start nginx in the foreground
nginx -g 'daemon off;' &
NGINX_PID=$!

# Handle shutdown signals
cleanup() {
    kill $SSR_PID 2>/dev/null || true
    kill $NGINX_PID 2>/dev/null || true
    wait
}
trap cleanup TERM INT

# Wait for either process to exit
wait -n
