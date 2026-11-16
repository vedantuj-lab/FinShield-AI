"""
Admin routes
"""

from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, UserRole
from app.security import decode_token
from fastapi import HTTPException, status

router = APIRouter()


def get_admin_user(authorization: str = Header(None), db: Session = Depends(get_db)) -> User:
    """Get admin user and verify admin role"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    user_id = payload.get("sub")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    
    if user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    
    return user


@router.get("/overview")
async def get_admin_overview(
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Get admin dashboard overview"""
    
    total_users = db.query(User).count()
    admin_users = db.query(User).filter(User.role == UserRole.ADMIN).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    
    return {
        "total_users": total_users,
        "admin_users": admin_users,
        "active_users": active_users,
    }


@router.get("/users")
async def list_users(
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 10,
):
    """List all users"""
    
    users = db.query(User).offset(skip).limit(limit).all()
    
    return {
        "users": [
            {
                "id": u.id,
                "email": u.email,
                "name": u.name,
                "role": u.role,
                "is_active": u.is_active,
                "created_at": u.created_at,
            }
            for u in users
        ]
    }


@router.patch("/users/{user_id}")
async def update_user(
    user_id: str,
    is_active: bool = None,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Update user status"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    if is_active is not None:
        user.is_active = is_active
    
    db.commit()
    
    return {"message": "User updated successfully"}


@router.get("/ai/health")
async def check_ai_health(
    admin_user: User = Depends(get_admin_user),
):
    """Check AI service health"""
    
    return {
        "status": "operational",
        "gemini_api": "pending_integration",
        "last_check": "2024-01-01T00:00:00Z",
    }


@router.get("/support")
async def get_support_tickets(
    admin_user: User = Depends(get_admin_user),
):
    """Get support tickets"""
    
    return {
        "total_tickets": 0,
        "open_tickets": 0,
        "resolved_tickets": 0,
    }


@router.get("/audit-logs")
async def get_audit_logs(
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
    limit: int = 50,
):
    """Get audit logs"""
    
    return {
        "logs": [],
        "total": 0,
    }
