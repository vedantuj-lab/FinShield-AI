"""
AI Assistant routes
Handles chat conversations and intent-based routing
"""

from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import uuid

from app.database import get_db
from app.models import User, ConversationSession, ChatMessage
from app.schemas import (
    ChatMessageCreate, ChatMessageResponse,
    ConversationSessionCreate, ConversationSessionResponse,
    ConversationDetailResponse
)
from app.security import decode_token
from app.services.nlp_service import get_intent_detector, get_response_generator
from app.security import generate_id

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


@router.post("/conversations", response_model=ConversationSessionResponse)
async def create_conversation(
    request: ConversationSessionCreate,
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """Create a new conversation session"""
    
    conversation = ConversationSession(
        id=generate_id(),
        user_id=current_user.id,
        title=request.title,
        language=request.language
    )
    
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    
    return conversation


@router.get("/conversations", response_model=List[ConversationSessionResponse])
async def list_conversations(
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """List all conversations for the current user"""
    
    conversations = db.query(ConversationSession).filter(
        ConversationSession.user_id == current_user.id
    ).order_by(ConversationSession.updated_at.desc()).all()
    
    return conversations


@router.get("/conversations/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation(
    conversation_id: str,
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """Get a specific conversation with all messages"""
    
    conversation = db.query(ConversationSession).filter(
        ConversationSession.id == conversation_id,
        ConversationSession.user_id == current_user.id
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    
    return conversation


@router.post("/chat/{conversation_id}", response_model=ChatMessageResponse)
async def send_message(
    conversation_id: str,
    request: ChatMessageCreate,
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """Send a message in a conversation"""
    
    # Verify conversation exists and belongs to user
    conversation = db.query(ConversationSession).filter(
        ConversationSession.id == conversation_id,
        ConversationSession.user_id == current_user.id
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    
    # Detect intent
    intent_detector = get_intent_detector()
    detected_intent, confidence = intent_detector.detect_intent(
        request.user_message,
        language=request.language
    )
    
    # Generate response based on intent
    response_generator = get_response_generator()
    assistant_response = response_generator.generate_response(detected_intent, request.language)
    
    # Get module for routing
    module_routed = intent_detector.get_module_for_intent(detected_intent)
    
    # Create chat message
    chat_message = ChatMessage(
        id=generate_id(),
        conversation_id=conversation_id,
        user_id=current_user.id,
        user_message=request.user_message,
        assistant_response=assistant_response,
        detected_intent=detected_intent.value,
        intent_confidence=confidence,
        module_routed_to=module_routed,
        language=request.language,
        has_action=module_routed is not None,
        action_type=module_routed,
    )
    
    db.add(chat_message)
    
    # Update conversation timestamp
    conversation.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(chat_message)
    
    return chat_message


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(lambda auth=Header(None), db=Depends(get_db): get_current_user_from_header(auth, db)),
    db: Session = Depends(get_db),
):
    """Delete a conversation and all its messages"""
    
    conversation = db.query(ConversationSession).filter(
        ConversationSession.id == conversation_id,
        ConversationSession.user_id == current_user.id
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    
    db.delete(conversation)
    db.commit()
    
    return {"status": "deleted"}


@router.get("/health")
async def assistant_health():
    """Health check for assistant service"""
    return {"status": "healthy", "service": "ai-assistant"}
