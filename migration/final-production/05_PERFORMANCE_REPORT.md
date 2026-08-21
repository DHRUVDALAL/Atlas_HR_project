# Performance Report

## Frontend
- Bundle size: 96KB gzip
- SSR size: 15KB gzip
- Build time: 2.23s
- TanStack Query caching (staleTime: 5min)
- Code splitting via TanStack Router
- Lazy loading enabled

## Backend
- Connection pool: 20 connections, 10 overflow
- Pool recycle: 1800s
- Gzip compression enabled
- Static asset caching (30 days)
- Database indexes on all query columns

## Nginx
- Gzip compression for text/html, application/json, etc.
- Proxy buffering enabled
- Client max body size: 10M
- Timeout: 60s (120s for API)
