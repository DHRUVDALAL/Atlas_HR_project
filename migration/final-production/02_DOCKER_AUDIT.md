# Docker Audit

## Backend Dockerfile
- Multi-stage build (builder + runtime)
- Non-root user (atlas:atlas)
- HEALTHCHECK instruction
- Production CMD with 4 workers
- Layer caching optimized

## Frontend Dockerfile
- Multi-stage build (node:22-alpine + nginx:1.27-alpine)
- Non-root user
- HEALTHCHECK instruction
- Proper entrypoint with signal handling

## Docker Compose
- 3 services: db, backend, frontend
- Health checks on all services
- Restart policies (unless-stopped)
- Resource limits (512M db, 512M backend, 256M frontend)
- Named bridge network (atlas-net)
- Named volumes (pgdata, uploads)
