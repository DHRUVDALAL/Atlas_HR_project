from fastapi import FastAPI
from routes import auth, protected, admin, applicant
from database.connection import Base, engine

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ATLAS Interview Management System",
    description="Backend for Interview Management System with JWT authentication and RBAC",
    version="1.0.0"
)

# Include routers
app.include_router(auth.router)
app.include_router(protected.router)
app.include_router(admin.router)
app.include_router(applicant.router)

@app.get("/")
def root():
    return {
        "message": "Welcome to ATLAS Interview Management System API",
        "docs": "/docs",
        "redoc": "/redoc"
    }