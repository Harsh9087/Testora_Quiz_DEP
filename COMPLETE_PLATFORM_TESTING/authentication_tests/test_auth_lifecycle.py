import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_auth_registration_and_login_lifecycle(client: AsyncClient):
    # 1. Register new teacher
    reg_payload = {
        "email": "lifecycle_teacher@testora.edu",
        "password": "SecurePassword123!",
        "full_name": "Prof. Lifecycle",
        "role": "teacher"
    }
    reg_res = await client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code in [200, 201], f"Registration failed: {reg_res.text}"
    reg_data = reg_res.json()
    assert "access_token" in reg_data
    assert reg_data["role"] == "teacher"

    # 2. Prevent duplicate registration with same role
    dup_res = await client.post("/api/v1/auth/register", json=reg_payload)
    assert dup_res.status_code == 400
    assert "already" in dup_res.text.lower() or "registered" in dup_res.text.lower()

    # 3. Successful Login
    login_payload = {
        "email": "lifecycle_teacher@testora.edu",
        "password": "SecurePassword123!",
        "role": "teacher"
    }
    login_res = await client.post("/api/v1/auth/login", json=login_payload)
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert "access_token" in login_data
    assert login_data["role"] == "teacher"

    token = login_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 4. Profile retrieval /api/v1/auth/me
    me_res = await client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["email"] == "lifecycle_teacher@testora.edu"
    assert me_data["full_name"] == "Prof. Lifecycle"
    assert me_data["role"] == "teacher"

@pytest.mark.asyncio
async def test_auth_invalid_credentials(client: AsyncClient):
    # Non-existent user
    bad_login = {
        "email": "ghost_user_999@testora.edu",
        "password": "WrongPassword123!",
        "role": "student"
    }
    res = await client.post("/api/v1/auth/login", json=bad_login)
    assert res.status_code == 400
    assert "incorrect" in res.text.lower() or "not found" in res.text.lower()

@pytest.mark.asyncio
async def test_auth_weak_password_validation(client: AsyncClient):
    weak_payload = {
        "email": "weak_pwd@testora.edu",
        "password": "123", # < 8 chars
        "full_name": "Weak User",
        "role": "student"
    }
    res = await client.post("/api/v1/auth/register", json=weak_payload)
    assert res.status_code in [400, 422]
