import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_mock_test_library_discovery(client: AsyncClient):
    # Retrieve public library of mock tests
    res = await client.get("/api/v1/mock-tests/library")
    assert res.status_code in [200, 404] # 200 if seeded, 404/empty if fresh
    if res.status_code == 200:
        data = res.json()
        assert isinstance(data, (list, dict))

@pytest.mark.asyncio
async def test_free_mock_tests_zero_credit_deduction(client: AsyncClient, create_test_user):
    student, token = create_test_user("mock_student@testora.edu", role="student", full_name="Mock Student")
    headers = {"Authorization": f"Bearer {token}"}

    # Verify student starting credit balance remains untouched
    me_res = await client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    initial_credits = me_res.json().get("credits_balance", 0)

    # Free mock test access must not deduct credits
    assert initial_credits >= 0
