"""
Admin routes - Phase 9: Admin & Monitoring
Comprehensive admin dashboard, user management, analytics, and audit logging
"""

from fastapi import APIRouter, Depends, Header, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models import (
    User, UserRole, AuditLog, Transaction, Budget, Investigation,
    RescueCase, ConversationSession, ChatMessage
)

router = APIRouter()


# Pydantic schemas
class UserUpdate(BaseModel):
    is_active: Optional[bool] = None
    role: Optional[str] = None


class AuditLogCreate(BaseModel):
    action: str
    entity_type: str
    entity_id: str
    details: Optional[str] = None


def get_admin_user(authorization: str = Header(None), db: Session = Depends(get_db)) -> User:
    """Get admin user and verify admin role"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    
    token = authorization.split(" ")[1]
    from app.security import decode_token
    payload = decode_token(token)
    user_id = payload.get("sub")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    
    if user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    
    return user


def log_audit(db: Session, action: str, entity_type: str, entity_id: str, 
              user_id: str = None, details: str = None):
    """Create an audit log entry"""
    import uuid
    audit_log = AuditLog(
        id=str(uuid.uuid4()),
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        user_id=user_id,
        details=details
    )
    db.add(audit_log)
    db.commit()


@router.get("/overview")
async def get_admin_overview(
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Get comprehensive admin dashboard overview"""
    
    total_users = db.query(User).count()
    admin_users = db.query(User).filter(User.role == UserRole.ADMIN).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    
    # Transaction metrics
    total_transactions = db.query(Transaction).count()
    total_transaction_value = db.query(func.sum(Transaction.amount)).scalar() or 0
    
    # Investigation metrics
    total_investigations = db.query(Investigation).count()
    high_risk_investigations = db.query(Investigation).filter(
        Investigation.risk_level.in_(["HIGH", "CRITICAL"])
    ).count()
    
    # Rescue cases
    total_rescue_cases = db.query(RescueCase).count()
    open_rescue_cases = db.query(RescueCase).filter(RescueCase.case_status == "open").count()
    total_disputed_amount = db.query(func.sum(RescueCase.disputed_amount)).scalar() or 0
    total_recovered_amount = db.query(func.sum(RescueCase.recovered_amount)).scalar() or 0
    
    # AI usage
    total_conversations = db.query(ConversationSession).count()
    total_messages = db.query(ChatMessage).count()
    
    return {
        "users": {
            "total": total_users,
            "admin": admin_users,
            "active": active_users,
            "inactive": total_users - active_users,
        },
        "transactions": {
            "total": total_transactions,
            "total_value": float(total_transaction_value),
        },
        "investigations": {
            "total": total_investigations,
            "high_risk": high_risk_investigations,
        },
        "rescue_cases": {
            "total": total_rescue_cases,
            "open": open_rescue_cases,
            "disputed_amount": float(total_disputed_amount),
            "recovered_amount": float(total_recovered_amount),
        },
        "ai_usage": {
            "conversations": total_conversations,
            "messages": total_messages,
        },
        "timestamp": datetime.utcnow(),
    }


@router.get("/users")
async def list_users(
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    role: str = Query(None),
):
    """List all users with optional filtering"""
    
    query = db.query(User)
    
    if role:
        query = query.filter(User.role == role)
    
    total = query.count()
    users = query.offset(skip).limit(limit).all()
    
    return {
        "users": [
            {
                "id": u.id,
                "email": u.email,
                "name": u.name,
                "role": u.role,
                "is_active": u.is_active,
                "created_at": u.created_at,
                "updated_at": u.updated_at,
            }
            for u in users
        ],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.put("/users/{user_id}")
async def update_user(
    user_id: str,
    update_data: UserUpdate,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Update user details"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    changes = []
    if update_data.is_active is not None and update_data.is_active != user.is_active:
        user.is_active = update_data.is_active
        changes.append(f"is_active={update_data.is_active}")
    
    if update_data.role:
        role = update_data.role.upper() if isinstance(update_data.role, str) else update_data.role
        if role in ["USER", "ADMIN"]:
            if role != user.role:
                user.role = role
                changes.append(f"role={role}")
    
    user.updated_at = datetime.utcnow()
    db.commit()
    
    # Log the action
    log_audit(
        db, "UPDATE_USER", "User", user_id, admin_user.id,
        f"Changes: {', '.join(changes)}"
    )
    
    return {
        "message": "User updated successfully",
        "user_id": user_id,
        "changes": changes,
    }


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Delete a user and all associated data"""
    
    if user_id == admin_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Log before deletion
    log_audit(
        db, "DELETE_USER", "User", user_id, admin_user.id,
        f"Deleted user: {user.email}"
    )
    
    # Delete user (cascades to related data)
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully", "user_id": user_id}


@router.get("/analytics")
async def get_analytics(
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
    days: int = Query(30, ge=1, le=365),
):
    """Get comprehensive analytics"""
    
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    # User growth
    new_users = db.query(User).filter(User.created_at >= cutoff_date).count()
    
    # Transaction analytics
    transactions_in_period = db.query(Transaction).filter(
        Transaction.created_at >= cutoff_date
    ).all()
    
    transaction_by_type = {}
    transaction_by_category = {}
    total_by_period = 0
    
    for t in transactions_in_period:
        transaction_by_type[t.transaction_type] = transaction_by_type.get(t.transaction_type, 0) + 1
        transaction_by_category[t.category] = transaction_by_category.get(t.category, 0) + t.amount
        total_by_period += t.amount
    
    # Investigation analytics
    investigations = db.query(Investigation).filter(
        Investigation.created_at >= cutoff_date
    ).all()
    
    investigations_by_status = {}
    investigations_by_risk = {}
    
    for inv in investigations:
        investigations_by_status[inv.status] = investigations_by_status.get(inv.status, 0) + 1
        investigations_by_risk[inv.risk_level] = investigations_by_risk.get(inv.risk_level, 0) + 1
    
    # Rescue case analytics
    rescue_cases = db.query(RescueCase).filter(
        RescueCase.created_at >= cutoff_date
    ).all()
    
    total_disputed = sum(c.disputed_amount for c in rescue_cases)
    total_recovered = sum(c.recovered_amount for c in rescue_cases)
    recovery_rate = (total_recovered / total_disputed * 100) if total_disputed > 0 else 0
    
    return {
        "period_days": days,
        "new_users": new_users,
        "transactions": {
            "total_transactions": len(transactions_in_period),
            "total_value": float(total_by_period),
            "by_type": transaction_by_type,
            "by_category": transaction_by_category,
        },
        "investigations": {
            "total": len(investigations),
            "by_status": investigations_by_status,
            "by_risk": investigations_by_risk,
        },
        "rescue_cases": {
            "total": len(rescue_cases),
            "disputed_amount": float(total_disputed),
            "recovered_amount": float(total_recovered),
            "recovery_rate": round(recovery_rate, 2),
        },
        "timestamp": datetime.utcnow(),
    }


@router.get("/health")
async def get_system_health(
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Get system health status"""
    
    # Database connectivity check
    try:
        db.query(User).first()
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    
    # Data metrics
    total_records = {
        "users": db.query(User).count(),
        "transactions": db.query(Transaction).count(),
        "budgets": db.query(Budget).count(),
        "investigations": db.query(Investigation).count(),
        "rescue_cases": db.query(RescueCase).count(),
        "conversations": db.query(ConversationSession).count(),
    }
    
    # Recent activity
    recent_audit_logs = db.query(AuditLog).order_by(desc(AuditLog.created_at)).limit(5).all()
    
    return {
        "status": "operational" if db_status == "healthy" else "degraded",
        "database": {
            "status": db_status,
            "total_records": total_records,
        },
        "services": {
            "api": "operational",
            "ai_assistant": "operational",
            "fraud_detection": "operational",
        },
        "recent_activity": [
            {
                "id": log.id,
                "action": log.action,
                "entity_type": log.entity_type,
                "user_id": log.user_id,
                "created_at": log.created_at,
            }
            for log in recent_audit_logs
        ],
        "timestamp": datetime.utcnow(),
    }


@router.get("/audit-logs")
async def get_audit_logs(
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    action: str = Query(None),
    entity_type: str = Query(None),
    user_id: str = Query(None),
):
    """Get audit logs with filtering"""
    
    query = db.query(AuditLog)
    
    if action:
        query = query.filter(AuditLog.action == action)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    
    total = query.count()
    logs = query.order_by(desc(AuditLog.created_at)).offset(skip).limit(limit).all()
    
    return {
        "logs": [
            {
                "id": log.id,
                "action": log.action,
                "entity_type": log.entity_type,
                "entity_id": log.entity_id,
                "user_id": log.user_id,
                "details": log.details,
                "created_at": log.created_at,
            }
            for log in logs
        ],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.post("/audit-logs")
async def create_audit_log_endpoint(
    log_data: AuditLogCreate,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Manually create an audit log entry (for admin actions)"""
    
    log_audit(db, log_data.action, log_data.entity_type, log_data.entity_id, admin_user.id, log_data.details)
    
    return {"message": "Audit log created", "timestamp": datetime.utcnow()}


@router.get("/system-metrics")
async def get_system_metrics(
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Get detailed system metrics and performance data"""
    
    # Calculate average transaction value
    avg_transaction = db.query(func.avg(Transaction.amount)).scalar() or 0
    
    # User activity
    users_with_transactions = db.query(func.count(func.distinct(Transaction.user_id))).scalar()
    
    # Investigation resolution rate
    total_investigations = db.query(Investigation).count()
    resolved_investigations = db.query(Investigation).filter(
        Investigation.status.in_(["resolved", "closed"])
    ).count()
    resolution_rate = (resolved_investigations / total_investigations * 100) if total_investigations > 0 else 0
    
    # Fraud detection metrics
    high_risk_cases = db.query(Investigation).filter(
        Investigation.risk_level == "CRITICAL"
    ).count()
    
    return {
        "transactions": {
            "average_value": float(avg_transaction),
            "users_with_transactions": users_with_transactions,
        },
        "investigations": {
            "total": total_investigations,
            "resolved": resolved_investigations,
            "resolution_rate": round(resolution_rate, 2),
            "critical_risk_cases": high_risk_cases,
        },
        "timestamp": datetime.utcnow(),
    }
