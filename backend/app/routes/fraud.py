"""
Fraud detection and investigation routes
"""

from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Investigation
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


@router.post("/analyze")
async def analyze_evidence(
    evidence_text: str,
    evidence_type: str,
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
):
    """Analyze evidence for fraud indicators"""
    
    return {
        "risk_level": "MODERATE",
        "indicators": [
            "Urgent language detected",
            "Request for payment",
        ],
        "message": "AI analysis framework pending",
    }


@router.post("/investigations")
async def create_investigation(
    title: str,
    description: str = None,
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """Create a new fraud investigation"""
    
    investigation = Investigation(
        id=generate_id(),
        user_id=current_user.id,
        title=title,
        description=description,
    )
    
    db.add(investigation)
    db.commit()
    db.refresh(investigation)
    
    return {
        "id": investigation.id,
        "title": investigation.title,
        "status": investigation.status,
    }


@router.post("/rescue/create")
async def create_rescue_case(
    incident_date: str,
    amount: float,
    payment_method: str,
    description: str,
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
):
    """Create a FINSHIELD RESCUE case"""
    
    return {
        "case_id": generate_id(),
        "status": "open",
        "guidance": [
            "Contact your bank immediately",
            "Call cybercrime helpline 1930",
            "Document all evidence",
        ],
    }
