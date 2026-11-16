"""
FinShield AI Backend Application
Main entry point for the FastAPI application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import engine
from app.models import Base
from app.api import api_router
from app.database import get_db

# Create database tables on startup
Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("FinShield AI backend starting...")
    yield
    # Shutdown
    print("FinShield AI backend shutting down...")


app = FastAPI(
    title="FinShield AI",
    description="AI-Powered Financial Intelligence Platform",
    version="0.1.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(api_router)


@app.get("/")
async def root():
    return {
        "message": "Welcome to FinShield AI",
        "version": "0.1.0",
        "documentation": "/docs",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "finshield-ai-backend"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
    )
