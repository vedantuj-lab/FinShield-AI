"""
Tax calculation and assistance routes
"""

from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.security import decode_token
from fastapi import HTTPException, status

router = APIRouter()


def get_current_user_from_header(authorization: str = Header(None), db: Session = Depends(get_db)) -> User:
    """Get current user from Authorization header"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    user_id = payload.get("sub")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    
    return user


@router.post("/calculate")
async def calculate_tax(
    financial_year: str,
    salary_income: float,
    other_income: float = 0,
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
):
    """Calculate income tax"""
    
    # Placeholder for actual tax calculation
    total_income = salary_income + other_income
    
    return {
        "financial_year": financial_year,
        "total_income": total_income,
        "estimated_tax": "Calculation pending",
    }


@router.post("/compare-regimes")
async def compare_tax_regimes(
    financial_year: str,
    salary_income: float,
    other_income: float = 0,
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
):
    """Compare old vs new tax regime"""
    
    return {
        "financial_year": financial_year,
        "old_regime_tax": "Calculation pending",
        "new_regime_tax": "Calculation pending",
    }


@router.get("/rules")
async def get_tax_rules(
    financial_year: str,
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
):
    """Get applicable tax rules"""
    
    return {
        "financial_year": financial_year,
        "rules": "Tax rules database pending",
    }
