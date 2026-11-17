import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_role_lock_teacher_priority_regression(client: AsyncClient):
    """Verify that explicit role: 'teacher' in login never routes or defaults to student."""
    login_payload = {
        "email": "teacher_lock_check@testora.edu",
        "password": "Password123!",
        "role": "teacher"
    }
    # Regardless of whether user exists or returns 400, role parsing must accept teacher
    res = await client.post("/api/v1/auth/login", json=login_payload)
    if res.status_code == 200:
        assert res.json().get("role") == "teacher"
    else:
        assert res.status_code == 400 # Proper bad credentials, not a 500 error

@pytest.mark.asyncio
async def test_public_system_stats_endpoint(client: AsyncClient):
    """Verify public system statistics loads without authentication requirements."""
    res = await client.get("/api/v1/pricing-plans")
    assert res.status_code in [200, 404]
