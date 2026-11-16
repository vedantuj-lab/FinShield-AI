"""
Tests for Phase 9: Admin & Monitoring
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import uuid

from main import app
from app.database import get_db, SessionLocal
from app.models import User, UserRole, AuditLog, Transaction, Investigation, RescueCase
from app.security import create_access_token


@pytest.fixture
def db():
    """Database session fixture"""
    session = SessionLocal()
    yield session
    session.close()


@pytest.fixture
def test_admin_user(db):
    """Create a test admin user"""
    unique_id = str(uuid.uuid4())[:8]
    user = User(
        id=str(uuid.uuid4()),
        email=f"admin_{unique_id}@test.com",
        name="Test Admin",
        hashed_password="hashed_password",
        role=UserRole.ADMIN,
        is_active=True,
    )
    db.add(user)
    db.commit()
    return user


@pytest.fixture
def test_regular_user(db):
    """Create a test regular user"""
    unique_id = str(uuid.uuid4())[:8]
    user = User(
        id=str(uuid.uuid4()),
        email=f"user_{unique_id}@test.com",
        name="Test User",
        hashed_password="hashed_password",
        role=UserRole.USER,
        is_active=True,
    )
    db.add(user)
    db.commit()
    return user


@pytest.fixture
def admin_token(test_admin_user):
    """Generate admin access token"""
    return create_access_token({"sub": test_admin_user.id})


@pytest.fixture
def user_token(test_regular_user):
    """Generate regular user access token"""
    return create_access_token({"sub": test_regular_user.id})


@pytest.fixture
def client():
    """FastAPI test client"""
    return TestClient(app)


class TestAdminOverview:
    """Test admin overview endpoint"""

    def test_admin_overview_success(self, client, admin_token):
        """Test getting admin overview"""
        response = client.get(
            "/api/admin/overview",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert "transactions" in data
        assert "investigations" in data
        assert "rescue_cases" in data
        assert "ai_usage" in data
        assert data["users"]["total"] >= 1
        assert "timestamp" in data

    def test_admin_overview_unauthorized(self, client, user_token):
        """Test that regular users cannot access admin overview"""
        response = client.get(
            "/api/admin/overview",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 403

    def test_admin_overview_no_token(self, client):
        """Test that unauthenticated requests are rejected"""
        response = client.get("/api/admin/overview")
        assert response.status_code == 401


class TestUserManagement:
    """Test user management endpoints"""

    def test_list_users(self, client, admin_token, db, test_regular_user):
        """Test listing users"""
        response = client.get(
            "/api/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"},
            params={"skip": 0, "limit": 100}  # Use max limit
        )
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert "total" in data
        assert data["total"] >= 1
        
        # Verify the response structure has the required fields
        if data["users"]:
            first_user = data["users"][0]
            assert "id" in first_user
            assert "email" in first_user
            assert "name" in first_user
            assert "role" in first_user
            assert "is_active" in first_user

    def test_list_users_with_pagination(self, client, admin_token):
        """Test listing users with pagination"""
        response = client.get(
            "/api/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"},
            params={"skip": 0, "limit": 5}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["skip"] == 0
        assert data["limit"] == 5

    def test_update_user_status(self, client, admin_token, db, test_regular_user):
        """Test updating user status"""
        response = client.put(
            f"/api/admin/users/{test_regular_user.id}",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"is_active": False}
        )
        assert response.status_code == 200
        
        # Verify user is deactivated
        db.refresh(test_regular_user)
        assert test_regular_user.is_active == False

    def test_update_user_role(self, client, admin_token, db, test_regular_user):
        """Test updating user role"""
        response = client.put(
            f"/api/admin/users/{test_regular_user.id}",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"role": "admin"}
        )
        assert response.status_code == 200
        
        # Verify role is updated
        db.refresh(test_regular_user)
        assert test_regular_user.role == UserRole.ADMIN

    def test_update_nonexistent_user(self, client, admin_token):
        """Test updating non-existent user"""
        fake_id = str(uuid.uuid4())
        response = client.put(
            f"/api/admin/users/{fake_id}",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"is_active": False}
        )
        assert response.status_code == 404

    def test_delete_user(self, client, admin_token, db, test_regular_user):
        """Test deleting a user"""
        user_id = test_regular_user.id
        response = client.delete(
            f"/api/admin/users/{user_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        # Verify user is deleted
        deleted_user = db.query(User).filter(User.id == user_id).first()
        assert deleted_user is None

    def test_cannot_delete_own_account(self, client, admin_token, test_admin_user):
        """Test that admins cannot delete their own account"""
        response = client.delete(
            f"/api/admin/users/{test_admin_user.id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 400


class TestAnalytics:
    """Test analytics endpoint"""

    def test_get_analytics(self, client, admin_token, db, test_regular_user):
        """Test getting analytics"""
        # Create some test data
        transaction = Transaction(
            id=str(uuid.uuid4()),
            user_id=test_regular_user.id,
            date=datetime.utcnow(),
            amount=1000,
            description="Test transaction",
            category="food",
            transaction_type="expense",
        )
        db.add(transaction)
        db.commit()

        response = client.get(
            "/api/admin/analytics",
            headers={"Authorization": f"Bearer {admin_token}"},
            params={"days": 30}
        )
        assert response.status_code == 200
        data = response.json()
        assert "transactions" in data
        assert "investigations" in data
        assert "rescue_cases" in data
        assert data["transactions"]["total_transactions"] >= 1

    def test_analytics_with_different_periods(self, client, admin_token):
        """Test analytics with different time periods"""
        for days in [7, 30, 90]:
            response = client.get(
                "/api/admin/analytics",
                headers={"Authorization": f"Bearer {admin_token}"},
                params={"days": days}
            )
            assert response.status_code == 200
            data = response.json()
            assert data["period_days"] == days


class TestHealthMonitoring:
    """Test health monitoring endpoints"""

    def test_get_system_health(self, client, admin_token):
        """Test getting system health status"""
        response = client.get(
            "/api/admin/health",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "database" in data
        assert "services" in data
        assert "recent_activity" in data
        assert data["status"] in ["operational", "degraded"]

    def test_system_metrics(self, client, admin_token, db, test_regular_user):
        """Test system metrics endpoint"""
        # Create test data
        transaction = Transaction(
            id=str(uuid.uuid4()),
            user_id=test_regular_user.id,
            date=datetime.utcnow(),
            amount=1000,
            description="Test transaction",
            category="food",
        )
        db.add(transaction)
        db.commit()

        response = client.get(
            "/api/admin/system-metrics",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "transactions" in data
        assert "investigations" in data


class TestAuditLogs:
    """Test audit logging endpoints"""

    def test_get_audit_logs(self, client, admin_token):
        """Test getting audit logs"""
        response = client.get(
            "/api/admin/audit-logs",
            headers={"Authorization": f"Bearer {admin_token}"},
            params={"limit": 50}
        )
        assert response.status_code == 200
        data = response.json()
        assert "logs" in data
        assert "total" in data

    def test_create_audit_log(self, client, admin_token, db, test_admin_user):
        """Test creating an audit log entry"""
        response = client.post(
            "/api/admin/audit-logs",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "action": "TEST_ACTION",
                "entity_type": "User",
                "entity_id": str(uuid.uuid4()),
                "details": "Test details"
            }
        )
        assert response.status_code == 200

    def test_audit_logs_with_filtering(self, client, admin_token, db, test_admin_user):
        """Test audit logs with filtering"""
        # Create a test audit log
        log = AuditLog(
            id=str(uuid.uuid4()),
            action="TEST_ACTION",
            entity_type="User",
            entity_id=test_admin_user.id,
            user_id=test_admin_user.id,
            details="Test details"
        )
        db.add(log)
        db.commit()

        response = client.get(
            "/api/admin/audit-logs",
            headers={"Authorization": f"Bearer {admin_token}"},
            params={"action": "TEST_ACTION"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1


class TestAdminPermissions:
    """Test admin-only access control"""

    def test_regular_user_cannot_access_admin_endpoints(self, client, user_token):
        """Test that regular users cannot access admin endpoints"""
        endpoints = [
            "/api/admin/overview",
            "/api/admin/users",
            "/api/admin/analytics",
            "/api/admin/health",
            "/api/admin/audit-logs",
        ]
        
        for endpoint in endpoints:
            response = client.get(
                endpoint,
                headers={"Authorization": f"Bearer {user_token}"}
            )
            assert response.status_code == 403, f"Endpoint {endpoint} should require admin role"

    def test_unauthenticated_cannot_access_admin_endpoints(self, client):
        """Test that unauthenticated users cannot access admin endpoints"""
        endpoints = [
            "/api/admin/overview",
            "/api/admin/users",
            "/api/admin/analytics",
            "/api/admin/health",
            "/api/admin/audit-logs",
        ]
        
        for endpoint in endpoints:
            response = client.get(endpoint)
            assert response.status_code == 401, f"Endpoint {endpoint} should require authentication"


class TestIntegration:
    """Integration tests for admin functionality"""

    def test_user_management_workflow(self, client, admin_token, db):
        """Test a complete user management workflow"""
        # Create a new user
        unique_id = str(uuid.uuid4())[:8]
        new_user = User(
            id=str(uuid.uuid4()),
            email=f"newuser_{unique_id}@test.com",
            name="New User",
            hashed_password="hashed_password",
            role=UserRole.USER,
            is_active=True,
        )
        db.add(new_user)
        db.commit()

        # List users
        response = client.get(
            "/api/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        users = response.json()["users"]
        assert len(users) >= 1

        # Update user role
        response = client.put(
            f"/api/admin/users/{new_user.id}",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"role": "admin"}
        )
        assert response.status_code == 200

        # Delete user
        response = client.delete(
            f"/api/admin/users/{new_user.id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200

    def test_dashboard_data_consistency(self, client, admin_token, db, test_regular_user):
        """Test that dashboard data is consistent"""
        # Create some test data
        transaction = Transaction(
            id=str(uuid.uuid4()),
            user_id=test_regular_user.id,
            date=datetime.utcnow(),
            amount=1000,
            description="Test transaction",
            category="food",
        )
        db.add(transaction)
        db.commit()

        # Get overview
        response = client.get(
            "/api/admin/overview",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        overview = response.json()

        # Get analytics
        response = client.get(
            "/api/admin/analytics",
            headers={"Authorization": f"Bearer {admin_token}"},
            params={"days": 30}
        )
        assert response.status_code == 200
        analytics = response.json()

        # Verify data consistency
        assert overview["transactions"]["total"] == analytics["transactions"]["total_transactions"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
