import pytest
from datetime import timedelta
from jose import jwt

from app.models.user import User
from app.config import settings
from app.utils.timezone import now_utc
from tests.conftest import TestingSessionLocal

@pytest.mark.anyio
async def test_public_platform_stats(client):
    """Verify that the public platform stats endpoint works without any auth headers."""
    res = await client.get("/api/v1/public/platform-stats")
    assert res.status_code == 200
    data = res.json()
    assert "active_users" in data
    assert "assessments_created" in data
    assert "submissions_evaluated" in data
    assert "institutions_active" in data
    assert "ai_synthesis_speed" in data
    assert "evaluation_accuracy" in data

@pytest.mark.anyio
async def test_auth_login_and_jwt_verification(client):
    """Verify login and JWT token validation for super_admin and teacher."""
    # Teacher login
    res = await client.post("/api/v1/auth/login", json={
        "email": "teacher@aegeus.edu",
        "password": "securepassword"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["role"] == "teacher"
    token = data["access_token"]

    # Validate token with auth/me
    me_res = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["email"] == "teacher@aegeus.edu"
    assert "credits_balance" in me_data
    assert "bonus_credits" in me_data

@pytest.mark.anyio
async def test_jwt_expired_token_rejection(client):
    """Verify that an expired JWT token is properly rejected with 401 when verify_exp is True."""
    # Generate an expired token intentionally
    expired_payload = {
        "sub": "some_user_id",
        "role": "teacher",
        "exp": int((now_utc() - timedelta(minutes=10)).timestamp())
    }
    expired_token = jwt.encode(expired_payload, settings.SECRET_KEY, algorithm="HS256")

    res = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
    assert res.status_code == 401
    assert "expired" in res.json().get("detail", "").lower()
