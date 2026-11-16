"""
API router for FinShield AI
Aggregates all API endpoints
"""

from fastapi import APIRouter
from app.routes import auth, budget, investments, trading, tax, fraud, business, admin, assistant

api_router = APIRouter(prefix="/api")

# Include all route modules
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(budget.router, prefix="/budget", tags=["budget"])
api_router.include_router(investments.router, prefix="/investments", tags=["investments"])
api_router.include_router(trading.router, prefix="/trading", tags=["trading"])
api_router.include_router(tax.router, prefix="/tax", tags=["tax"])
api_router.include_router(fraud.router, prefix="/fraud", tags=["fraud"])
api_router.include_router(business.router, prefix="/business", tags=["business"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(assistant.router, prefix="/assistant", tags=["assistant"])
