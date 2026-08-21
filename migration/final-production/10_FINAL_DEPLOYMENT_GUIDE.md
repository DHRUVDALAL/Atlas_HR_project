# Final Deployment Guide

## Quick Start
1. Copy .env.example to .env
2. Edit .env with production values (especially SECRET_KEY)
3. Run: docker compose build
4. Run: docker compose up -d
5. Access: http://localhost:5174

## Production Deployment
1. Set secure SECRET_KEY
2. Configure SMTP for emails
3. Set EMAIL_ENABLED=true
4. Configure CORS_ORIGINS for your domain
5. Use external PostgreSQL (update DATABASE_URL)
6. Add SSL/TLS via Traefik/Caddy
7. Set up backup strategy

## Services
- Frontend: http://localhost:5174
- Backend API: http://localhost:8001
- Backend Health: http://localhost:8001/health
- API Docs: http://localhost:8001/docs
