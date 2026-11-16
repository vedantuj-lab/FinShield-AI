"""
Authentication routes
"""

from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from datetime import timedelta

from app.database import get_db
from app.models import User, UserRole
from app.schemas import UserRegister, UserLogin, TokenResponse, UserResponse
from app.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    generate_id,
    decode_token,
)

router = APIRouter()


@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user"""
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create new user
    user = User(
        id=generate_id(),
        email=user_data.email,
        name=user_data.name,
        hashed_password=hash_password(user_data.password),
        role=UserRole.USER,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    # Create token
    access_token = create_access_token(data={"sub": user.id})

    return {
        "token": access_token,
        "user": UserResponse.from_orm(user),
    }


@router.post("/login", response_model=TokenResponse)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """Login user"""
    
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    if not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )

    # Create token
    access_token = create_access_token(data={"sub": user.id})

    return {
        "token": access_token,
        "user": UserResponse.from_orm(user),
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    authorization: str = Header(None),
    db: Session = Depends(get_db),
):
    """Get current user information"""
    
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    token = authorization.split(" ")[1]
    payload = decode_token(token)
    user_id = payload.get("sub")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return UserResponse.from_orm(user)


@router.post("/logout")
async def logout():
    """Logout user (token invalidation happens on client side)"""
    return {"message": "Logged out successfully"}
