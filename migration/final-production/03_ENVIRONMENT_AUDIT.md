# Environment Audit

## Variables Verified
| Variable | Default | Used By |
|----------|---------|---------|
| DATABASE_URL | postgresql+psycopg2://atlas:atlas@db:5432/atlas | Backend |
| SECRET_KEY | dev-only-secret | Backend |
| ALGORITHM | HS256 | Backend |
| ACCESS_TOKEN_EXPIRE_MINUTES | 30 | Backend |
| REFRESH_TOKEN_EXPIRE_DAYS | 7 | Backend |
| CORS_ORIGINS | http://localhost:5173 | Backend |
| EMAIL_ENABLED | false | Backend |
| SMTP_HOST | smtp.gmail.com | Backend |
| SMTP_PORT | 587 | Backend |
| UPLOAD_DIR | uploads | Backend |
| MAX_FILE_SIZE_MB | 10 | Backend |
| BGV_PROVIDER | mock | Backend |
| VITE_API_BASE_URL | /api | Frontend |

## Files Created
- .env.example (root) - All variables documented
- frontend-new/.env.example - Frontend variables
