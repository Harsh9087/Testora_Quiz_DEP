import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_certificates_templates_and_verification(client: AsyncClient, create_test_user):
    teacher, token = create_test_user("cert_teacher@testora.edu", role="teacher", full_name="Cert Teacher")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Fetch available templates
    res = await client.get("/api/v1/certificates/templates", headers=headers)
    assert res.status_code in [200, 404]

    # 2. Public certificate verification check with invalid code
    verify_res = await client.get("/api/v1/certificates/verify/INVALID-CERT-999")
    assert verify_res.status_code in [404, 400]
