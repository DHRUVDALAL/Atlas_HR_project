# Phase 11.11 — System Configuration

## Overview
Admin settings for company profile, SMTP, branding, templates, and system policies.

## Environment Variables

### SMTP Configuration
```env
EMAIL_ENABLED=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM_NAME=ATLAS HR System
SMTP_FROM_EMAIL=noreply@atlas.com
SMTP_USE_TLS=true
```

### File Storage
```env
UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=10
```

### Background Verification
```env
BGV_PROVIDER=mock
```

### Application
```env
DATABASE_URL=postgresql+psycopg2://atlas:atlas@db:5432/atlas
SECRET_KEY=change-me-to-a-long-random-secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

## Default Settings

| Setting | Default | Description |
|---------|---------|-------------|
| EMAIL_ENABLED | false | Enable/disable email sending |
| SMTP_HOST | smtp.gmail.com | SMTP server host |
| SMTP_PORT | 587 | SMTP server port |
| MAX_FILE_SIZE_MB | 10 | Maximum upload file size |
| BGV_PROVIDER | mock | Background verification provider |
| ACCESS_TOKEN_EXPIRE_MINUTES | 30 | JWT token expiry |

## Configuration Management
- All configuration via environment variables
- No admin UI for settings (use env vars or Docker Compose)
- Sensitive values (passwords, secrets) via environment only
