import pytest
import asyncio
from app.models.user import User
from app.utils.security import get_password_hash, create_access_token
from tests.conftest import TestingSessionLocal

@pytest.fixture
async def admin_auth(client):
    db = TestingSessionLocal()
    try:
        admin = db.query(User).filter(User.email == "admin@aegeus.edu").first()
        if not admin:
            admin = User(
                email="admin@aegeus.edu",
                hashed_password=get_password_hash("securepassword"),
                full_name="Super Admin",
                role="super_admin",
                is_active=True,
                credits_balance=999999
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
        token = create_access_token(admin.id)
    finally:
        db.close()
    return {"Authorization": f"Bearer {token}"}

@pytest.mark.anyio
async def test_concurrent_single_voucher_redemption(client, admin_auth):
    """
    Spawns 10 concurrent redemption attempts on a single voucher code.
    Guarantees atomic locking: exactly 1 request must succeed, 9 must fail.
    """
    # 1. Admin creates a single voucher campaign
    payload = {
        "name": "Race Condition Stress Test",
        "code_prefix": "RACE-",
        "credits_per_coupon": 1000,
        "credit_type": "PAID",
        "total_coupons": 1,
        "allowed_roles": "teacher",
        "max_redemptions_per_user": 10
    }
    camp_res = await client.post("/api/v1/admin/coupons/campaigns", headers=admin_auth, json=payload)
    assert camp_res.status_code == 200
    camp_id = camp_res.json()["id"]

    detail_res = await client.get(f"/api/v1/admin/coupons/campaigns/{camp_id}", headers=admin_auth)
    coupon_code = detail_res.json()["coupons"][0]["code"]

    # 2. Create 10 different teacher tokens
    tokens = []
    db = TestingSessionLocal()
    try:
        for i in range(10):
            email = f"teacher_race_{i}@aegeus.edu"
            u = db.query(User).filter(User.email == email).first()
            if not u:
                u = User(
                    email=email,
                    hashed_password=get_password_hash("securepassword"),
                    full_name=f"Race Teacher {i}",
                    role="teacher",
                    is_active=True,
                    credits_balance=0
                )
                db.add(u)
                db.commit()
                db.refresh(u)
            tokens.append(create_access_token(u.id))
    finally:
        db.close()

    # 3. Fire 10 simultaneous requests
    async def try_redeem(tok):
        return await client.post(
            "/api/v1/payments/credits/redeem-coupon",
            headers={"Authorization": f"Bearer {tok}"},
            json={"code": coupon_code}
        )

    results = await asyncio.gather(*[try_redeem(t) for t in tokens])
    status_codes = [r.status_code for r in results]

    successes = status_codes.count(200)
    failures = status_codes.count(400)

    assert successes == 1, f"Expected exactly 1 success under concurrency, got {successes} (statuses: {status_codes})"
    assert failures == 9, f"Expected 9 failures with 400 Bad Request, got {failures}"
