"""
Small business finance routes
"""

from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, BusinessProfile
from app.schemas import BusinessProfileCreate, BusinessProfileResponse
from app.security import decode_token, generate_id
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


@router.post("/profile", response_model=BusinessProfileResponse)
async def create_business_profile(
    profile: BusinessProfileCreate,
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """Create or update business profile"""
    
    business = BusinessProfile(
        id=generate_id(),
        user_id=current_user.id,
        business_name=profile.business_name,
        category=profile.category,
        contact_email=profile.contact_email,
        contact_phone=profile.contact_phone,
        gst_number=profile.gst_number,
        financial_year=profile.financial_year,
    )
    
    db.add(business)
    db.commit()
    db.refresh(business)
    
    return BusinessProfileResponse.from_orm(business)


@router.post("/invoices")
async def create_invoice(
    invoice_data: dict,
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
):
    """Create a GST invoice"""
    
    return {
        "invoice_id": generate_id(),
        "status": "created",
        "message": "Invoice generation framework pending",
    }


@router.post("/cashflow/forecast")
async def forecast_cashflow(
    months: int = 3,
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
):
    """Forecast business cash flow"""
    
    return {
        "forecast_months": months,
        "scenarios": ["optimistic", "baseline", "conservative"],
        "message": "Cash flow forecasting framework pending",
    }


@router.post("/loan/emi")
async def calculate_emi(
    principal: float,
    annual_rate: float,
    tenure_months: int,
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
):
    """Calculate EMI for loans"""
    
    # EMI = [P * r * (1 + r)^n] / [(1 + r)^n - 1]
    monthly_rate = annual_rate / (100 * 12)
    
    if monthly_rate == 0:
        emi = principal / tenure_months
    else:
        emi = (principal * monthly_rate * (1 + monthly_rate) ** tenure_months) / ((1 + monthly_rate) ** tenure_months - 1)
    
    total_amount = emi * tenure_months
    total_interest = total_amount - principal
    
    return {
        "monthly_emi": round(emi, 2),
        "total_amount": round(total_amount, 2),
        "total_interest": round(total_interest, 2),
    }
