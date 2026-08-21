from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from routes import (
    auth, applicant, workflow, user, scorecard, offer, onboarding,
    email, notification, activity_log, document_storage, bgv, scheduler,
    search, reports, dashboard_alerts, interview,
)
import os
import time
from utils.limiter import limiter
from utils.logging import setup_logging
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

# Initialize structured logging
setup_logging()

# Schema is managed by Alembic migrations (`alembic upgrade head`), not
# create_all — see alembic/ and the container entrypoint.

app = FastAPI(
    title="ATLAS Interview Management System",
    description="Backend for Interview Management System with JWT authentication and RBAC",
    version="1.0.0"
)

# Configure CORS
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

# Configure Rate Limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# Include routers
app.include_router(auth.router)
app.include_router(applicant.router)
app.include_router(workflow.router)
app.include_router(user.router)
app.include_router(scorecard.router)
app.include_router(offer.router)
app.include_router(onboarding.router)
app.include_router(email.router)
app.include_router(notification.router)
app.include_router(activity_log.router)
app.include_router(document_storage.router)
app.include_router(bgv.router)
app.include_router(scheduler.router)
app.include_router(search.router)
app.include_router(reports.router)
app.include_router(dashboard_alerts.router)
app.include_router(interview.router)

@app.get("/")
def root():
    return {
        "message": "Welcome to ATLAS Interview Management System API",
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/health")
def health_check():
    """Health check endpoint for Docker and load balancers."""
    health_status = {
        "status": "healthy",
        "timestamp": time.time(),
        "version": "1.0.0",
        "services": {}
    }

    # Check database
    try:
        from database.connection import engine
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        health_status["services"]["database"] = "healthy"
    except Exception as e:
        health_status["services"]["database"] = f"unhealthy: {str(e)}"
        health_status["status"] = "degraded"

    return JSONResponse(
        content=health_status,
        status_code=200 if health_status["status"] == "healthy" else 503
    )