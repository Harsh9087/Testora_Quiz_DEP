import time
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_health_and_public_endpoint_latency(client: AsyncClient):
    start = time.perf_counter()
    res = await client.get("/api/v1/pricing-plans")
    latency = (time.perf_counter() - start) * 1000 # ms
    assert res.status_code in [200, 404]
    # Benchmark target: public query response under 500ms
    assert latency < 500, f"Public pricing endpoint took {latency:.2f}ms, exceeding 500ms threshold"

@pytest.mark.asyncio
async def test_auth_me_latency(client: AsyncClient, create_test_user):
    user, token = create_test_user("perf_user@testora.edu", role="student")
    headers = {"Authorization": f"Bearer {token}"}

    start = time.perf_counter()
    res = await client.get("/api/v1/auth/me", headers=headers)
    latency = (time.perf_counter() - start) * 1000
    assert res.status_code == 200
    assert latency < 350, f"/auth/me latency {latency:.2f}ms exceeds 350ms budget"
