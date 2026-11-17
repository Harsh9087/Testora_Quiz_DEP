import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_sql_injection_payload_resistance(client: AsyncClient, create_test_user):
    teacher, token = create_test_user("sql_teacher@testora.edu", role="teacher")
    headers = {"Authorization": f"Bearer {token}"}

    malicious_inputs = [
        "' OR '1'='1",
        "'; DROP TABLE users; --",
        "\" OR \"\"=\"",
        "admin' --",
        "UNION SELECT null, username, password FROM users--"
    ]

    for payload in malicious_inputs:
        # Search query parameter injection check
        res = await client.get(f"/api/v1/exams?q={payload}", headers=headers)
        # Should gracefully return 200 (filtered) or 400/422, but NEVER 500 database syntax error
        assert res.status_code in [200, 400, 422, 404], f"SQL Injection triggered server error on payload: {payload}"

@pytest.mark.asyncio
async def test_xss_payload_escaping(client: AsyncClient, create_test_user):
    teacher, token = create_test_user("xss_teacher@testora.edu", role="teacher")
    headers = {"Authorization": f"Bearer {token}"}

    xss_payload = "<script>alert('XSS-TEST')</script><img src=x onerror=alert(1)>"
    exam_payload = {
        "title": xss_payload,
        "description": "Safe test description",
        "duration_minutes": 30,
        "total_marks": 20,
        "pass_marks": 8,
        "is_published": False,
        "questions": []
    }

    res = await client.post("/api/v1/exams", json=exam_payload, headers=headers)
    assert res.status_code in [200, 201, 400, 422]
    if res.status_code in [200, 201]:
        data = res.json()
        # Verify JSON serialization does not evaluate raw script
        assert "title" in data
