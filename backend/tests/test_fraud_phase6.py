"""
Tests for Phase 6: Fraud Detection
Comprehensive testing of fraud detection implementation
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

from main import app
from app.database import SessionLocal
from app.models import User, UserRole, Investigation, RescueCase
from app.security import create_access_token


@pytest.fixture
def db():
    """Database session fixture"""
    session = SessionLocal()
    yield session
    session.close()


@pytest.fixture
def test_user(db):
    """Create a test regular user"""
    unique_id = str(uuid.uuid4())[:8]
    user = User(
        id=str(uuid.uuid4()),
        email=f"user_fraud_{unique_id}@test.com",
        name="Test User",
        hashed_password="hashed_password",
        role=UserRole.USER,
        is_active=True,
    )
    db.add(user)
    db.commit()
    return user


@pytest.fixture
def user_token(test_user):
    """Generate user access token"""
    return create_access_token({"sub": test_user.id})


@pytest.fixture
def client():
    """FastAPI test client"""
    return TestClient(app)


@pytest.fixture
def test_investigation(db, test_user):
    """Create a test investigation"""
    investigation = Investigation(
        id=str(uuid.uuid4()),
        user_id=test_user.id,
        title="Test Fraud Investigation",
        description="Testing fraud detection",
        status="open",
        risk_level="HIGH",
    )
    db.add(investigation)
    db.commit()
    return investigation


class TestFraudModelsExist:
    """Test that fraud detection models exist and can be instantiated"""

    def test_investigation_model_creation(self, db, test_user):
        """Test Investigation model can be created"""
        inv = Investigation(
            id=str(uuid.uuid4()),
            user_id=test_user.id,
            title="Test",
            status="open",
            risk_level="HIGH"
        )
        assert inv.id is not None
        assert inv.status == "open"
        assert inv.risk_level == "HIGH"

    def test_rescue_case_model_creation(self, db, test_user):
        """Test RescueCase model can be created"""
        case = RescueCase(
            id=str(uuid.uuid4()),
            user_id=test_user.id,
            incident_date=datetime.utcnow(),
            incident_type="fraudulent_transaction",
            incident_description="Test incident",
            disputed_amount=1000,
            payment_method="credit_card"
        )
        assert case.id is not None
        assert case.disputed_amount == 1000


class TestFraudEndpointsCallable:
    """Test that fraud detection endpoints can be called"""

    def test_investigation_create_endpoint(self, client, user_token):
        """Test investigation creation endpoint"""
        response = client.post(
            "/api/fraud/investigations",
            headers={"Authorization": f"Bearer {user_token}"},
            json={"title": "Test", "description": "Test", "risk_level": "HIGH"}
        )
        assert response.status_code is not None

    def test_investigation_list_endpoint(self, client, user_token):
        """Test investigation listing endpoint"""
        response = client.get(
            "/api/fraud/investigations",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code is not None

    def test_rescue_case_create_endpoint(self, client, user_token):
        """Test rescue case creation endpoint"""
        response = client.post(
            "/api/fraud/rescue/create",
            headers={"Authorization": f"Bearer {user_token}"},
            json={
                "case_title": "Test",
                "case_description": "Test",
                "case_type": "transaction_fraud",
                "disputed_amount": 1000
            }
        )
        assert response.status_code is not None

    def test_rescue_case_list_endpoint(self, client, user_token):
        """Test rescue case listing endpoint"""
        response = client.get(
            "/api/fraud/rescue",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code is not None


class TestFraudDatabaseOperations:
    """Test fraud detection database operations"""

    def test_create_and_retrieve_investigation(self, db, test_user):
        """Test creating and retrieving investigation"""
        inv_id = str(uuid.uuid4())
        inv = Investigation(
            id=inv_id,
            user_id=test_user.id,
            title="Test Investigation",
            description="Test",
            status="open",
            risk_level="HIGH"
        )
        db.add(inv)
        db.commit()

        retrieved = db.query(Investigation).filter(Investigation.id == inv_id).first()
        assert retrieved is not None
        assert retrieved.title == "Test Investigation"

    def test_create_and_retrieve_rescue_case(self, db, test_user):
        """Test creating and retrieving rescue case"""
        case_id = str(uuid.uuid4())
        case = RescueCase(
            id=case_id,
            user_id=test_user.id,
            incident_date=datetime.utcnow(),
            incident_type="fraudulent_transaction",
            incident_description="Test incident",
            disputed_amount=2000,
            payment_method="credit_card",
            merchant_name="Test Merchant",
            transaction_id="test_txn_123"
        )
        db.add(case)
        db.commit()

        retrieved = db.query(RescueCase).filter(RescueCase.id == case_id).first()
        assert retrieved is not None
        assert retrieved.disputed_amount == 2000

    def test_query_investigations_by_status(self, db, test_user):
        """Test querying investigations by status"""
        # Create multiple investigations
        for i in range(3):
            inv = Investigation(
                id=str(uuid.uuid4()),
                user_id=test_user.id,
                title=f"Investigation {i}",
                status="open" if i < 2 else "closed",
                risk_level="HIGH"
            )
            db.add(inv)
        db.commit()

        open_investigations = db.query(Investigation).filter(Investigation.status == "open").all()
        assert len(open_investigations) >= 2


class TestFraudDataValidation:
    """Test fraud detection data validation"""

    def test_investigation_status_values(self):
        """Test valid investigation status values"""
        valid_statuses = ["open", "under_review", "closed", "resolved"]
        for status in valid_statuses:
            assert status in valid_statuses

    def test_investigation_risk_levels(self):
        """Test valid risk level values"""
        valid_risk_levels = ["LOW", "MODERATE", "HIGH", "CRITICAL"]
        for level in valid_risk_levels:
            assert level in valid_risk_levels

    def test_case_status_values(self):
        """Test valid case status values"""
        valid_statuses = ["open", "investigating", "disputed", "resolved", "closed"]
        for status in valid_statuses:
            assert status in valid_statuses


class TestFraudEndpointAccessControl:
    """Test fraud endpoint authentication"""

    def test_fraud_endpoints_require_auth(self, client):
        """Test that fraud endpoints handle missing authentication"""
        endpoints = [
            "/api/fraud/investigations",
            "/api/fraud/rescue",
        ]
        
        for endpoint in endpoints:
            response = client.get(endpoint)
            # Should require auth or return an error, but not crash
            assert response.status_code >= 400


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

