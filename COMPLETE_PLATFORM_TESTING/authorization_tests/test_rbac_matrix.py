import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_student_forbidden_from_teacher_apis(client: AsyncClient, create_test_user):
    # Create student
    student_user, student_token = create_test_user("candidate_rbac@testora.edu", role="student", full_name="Candidate RBAC")
    headers = {"Authorization": f"Bearer {student_token}"}

    # Attempt to access Teacher workspace bootstrap
    res_ws = await client.post("/api/v1/workspaces/bootstrap", headers=headers)
    assert res_ws.status_code in [401, 403], f"Expected 403, got {res_ws.status_code}"

    # Attempt to access Teacher create student directory
    res_dir = await client.post("/api/v1/student-directories", json={"name": "Hacked Directory"}, headers=headers)
    assert res_dir.status_code in [401, 403]

@pytest.mark.asyncio
async def test_teacher_forbidden_from_admin_apis(client: AsyncClient, create_test_user):
    # Create teacher
    teacher_user, teacher_token = create_test_user("teacher_rbac@testora.edu", role="teacher", full_name="Teacher RBAC")
    headers = {"Authorization": f"Bearer {teacher_token}"}

    # Attempt to access Super Admin user list
    res_admin = await client.get("/api/v1/admin/users", headers=headers)
    assert res_admin.status_code in [401, 403], f"Expected 403 for admin endpoint, got {res_admin.status_code}"

@pytest.mark.asyncio
async def test_unauthenticated_requests_rejected(client: AsyncClient):
    endpoints = [
        "/api/v1/auth/me",
        "/api/v1/workspaces/active",
        "/api/v1/student-directories",
        "/api/v1/admin/system/health"
    ]
    for ep in endpoints:
        res = await client.get(ep)
        assert res.status_code == 401, f"Expected 401 for unauthenticated {ep}, got {res.status_code}"
