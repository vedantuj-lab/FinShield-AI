"""
Tests for Phase 8: AI Assistant
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base
from app.database import get_db
from main import app
from app.models import User, ConversationSession, ChatMessage
from app.security import create_access_token, generate_id
from app.services.nlp_service import IntentDetector, ResponseGenerator, Intent

# Setup test database
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///./test_phase8.db"
engine = create_engine(SQLALCHEMY_TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture
def setup_test_user():
    """Create a test user"""
    db = TestingSessionLocal()
    
    # Clean up
    db.query(ChatMessage).delete()
    db.query(ConversationSession).delete()
    db.query(User).delete()
    db.commit()
    
    # Create user
    user = User(
        id=generate_id(),
        email="test@example.com",
        name="Test User",
        hashed_password="hashed_password_here",
        role="user",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Generate token
    token = create_access_token({"sub": user.id})
    
    yield {"user": user, "token": token}
    
    # Cleanup
    db.query(ChatMessage).delete()
    db.query(ConversationSession).delete()
    db.query(User).delete()
    db.commit()
    db.close()


class TestIntentDetection:
    """Test intent detection service"""
    
    def test_budget_intent_english(self):
        detector = IntentDetector()
        intent, confidence = detector.detect_intent("How much did I spend this month?", language="english")
        assert intent == Intent.BUDGET
        assert confidence > 0.3
    
    def test_investment_intent_english(self):
        detector = IntentDetector()
        intent, confidence = detector.detect_intent("What is my portfolio performance?", language="english")
        assert intent == Intent.INVESTMENT
        assert confidence >= 0.3
    
    def test_trading_intent_english(self):
        detector = IntentDetector()
        intent, confidence = detector.detect_intent("Show me technical analysis for NIFTY", language="english")
        assert intent == Intent.TRADING
        assert confidence >= 0.3
    
    def test_tax_intent_english(self):
        detector = IntentDetector()
        intent, confidence = detector.detect_intent("What is my tax filing status?", language="english")
        assert intent == Intent.TAX
        assert confidence >= 0.3
    
    def test_fraud_intent_english(self):
        detector = IntentDetector()
        intent, confidence = detector.detect_intent("I need to file a fraud complaint now", language="english")
        assert intent == Intent.FRAUD
        assert confidence >= 0.3
    
    def test_business_intent_english(self):
        detector = IntentDetector()
        intent, confidence = detector.detect_intent("Create a GST invoice for my business", language="english")
        assert intent == Intent.BUSINESS
        assert confidence > 0.3
    
    def test_budget_intent_spanish(self):
        detector = IntentDetector()
        intent, confidence = detector.detect_intent("Quiero rastrear mis gastos", language="spanish")
        assert intent == Intent.BUDGET
        assert confidence >= 0.3
    
    def test_budget_intent_french(self):
        detector = IntentDetector()
        intent, confidence = detector.detect_intent("Quel est mon budget?", language="french")
        assert intent == Intent.BUDGET
        assert confidence >= 0.3
    
    def test_budget_intent_hindi(self):
        detector = IntentDetector()
        intent, confidence = detector.detect_intent("मेरा बजट क्या है?", language="hindi")
        assert intent == Intent.BUDGET
        assert confidence >= 0.3
    
    def test_module_routing_budget(self):
        detector = IntentDetector()
        intent, _ = detector.detect_intent("Track my expenses", language="english")
        module = detector.get_module_for_intent(intent)
        assert module == "budgeting"
    
    def test_module_routing_investment(self):
        detector = IntentDetector()
        intent, _ = detector.detect_intent("Check my portfolio", language="english")
        module = detector.get_module_for_intent(intent)
        assert module == "investment"
    
    def test_module_routing_trading(self):
        detector = IntentDetector()
        intent, _ = detector.detect_intent("Technical analysis", language="english")
        module = detector.get_module_for_intent(intent)
        assert module == "trading"
    
    def test_module_routing_tax(self):
        detector = IntentDetector()
        intent, _ = detector.detect_intent("Tax deductions", language="english")
        module = detector.get_module_for_intent(intent)
        assert module == "tax"
    
    def test_module_routing_fraud(self):
        detector = IntentDetector()
        intent, _ = detector.detect_intent("Fraud detection", language="english")
        module = detector.get_module_for_intent(intent)
        assert module == "fraud"
    
    def test_module_routing_business(self):
        detector = IntentDetector()
        intent, _ = detector.detect_intent("Business finance", language="english")
        module = detector.get_module_for_intent(intent)
        assert module == "business"


class TestResponseGeneration:
    """Test response generation"""
    
    def test_budget_response_english(self):
        generator = ResponseGenerator()
        response = generator.generate_response(Intent.BUDGET, language="english")
        assert "budget" in response.lower()
        assert len(response) > 0
    
    def test_investment_response_english(self):
        generator = ResponseGenerator()
        response = generator.generate_response(Intent.INVESTMENT, language="english")
        assert "investment" in response.lower()
        assert len(response) > 0
    
    def test_response_spanish(self):
        generator = ResponseGenerator()
        response = generator.generate_response(Intent.BUDGET, language="spanish")
        assert len(response) > 0
        assert response != generator.generate_response(Intent.BUDGET, language="english")
    
    def test_response_french(self):
        generator = ResponseGenerator()
        response = generator.generate_response(Intent.BUDGET, language="french")
        assert len(response) > 0
    
    def test_response_hindi(self):
        generator = ResponseGenerator()
        response = generator.generate_response(Intent.BUDGET, language="hindi")
        assert len(response) > 0


class TestAPIEndpoints:
    """Test API endpoints"""
    
    def test_unauthorized_access(self):
        response = client.get("/api/assistant/conversations")
        assert response.status_code == 401
    
    def test_assistant_health(self):
        response = client.get("/api/assistant/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
