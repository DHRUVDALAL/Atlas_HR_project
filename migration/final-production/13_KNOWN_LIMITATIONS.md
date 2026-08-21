# Known Limitations

## Non-Blocking
1. No SSL/TLS termination (use external proxy)
2. Mock BGV provider (no real verification)
3. No PDF generation (HTML offer letters)
4. No WebSocket real-time updates
5. No admin settings UI (env vars only)
6. No bulk operations UI

## Recommendations
1. Add Traefik/Caddy for SSL
2. Integrate real BGV API
3. Add WeasyPrint/ReportLab for PDF
4. Add WebSocket for notifications
5. Add admin settings page
6. Add bulk import/export
