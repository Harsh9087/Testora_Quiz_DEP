import pytest
import time
from datetime import datetime, timedelta, timezone
from app.models.user import User
from app.models.coupon import CouponCampaign, Coupon, SystemSetting
from app.models.payment import CreditTransaction
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
                full_name="Platform Super Administrator",
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

@pytest.fixture
async def student_auth(client):
    db = TestingSessionLocal()
    try:
        student = db.query(User).filter(User.email == "student@aegeus.edu").first()
        token = create_access_token(student.id)
    finally:
        db.close()
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.anyio
async def test_unauthorized_access_to_admin_endpoints(client, student_auth, teacher_auth):
    """Verify that regular students and teachers cannot access /api/v1/admin/*"""
    # 1. Student access
    res = await client.get("/api/v1/admin/overview", headers=student_auth)
    assert res.status_code == 403, f"Expected 403 for student, got {res.status_code}"

    # 2. Teacher access to super_admin routes
    res = await client.get("/api/v1/admin/coupons/campaigns", headers=teacher_auth)
    assert res.status_code == 403, f"Expected 403 for teacher, got {res.status_code}"

    # 3. Unauthenticated access
    res = await client.get("/api/v1/admin/overview")
    assert res.status_code == 401, f"Expected 401 for unauthenticated, got {res.status_code}"


@pytest.mark.anyio
async def test_super_admin_can_access_overview_and_diagnostics(client, admin_auth):
    """Verify super_admin can read overview analytics and system diagnostics."""
    res = await client.get("/api/v1/admin/overview", headers=admin_auth)
    assert res.status_code == 200, res.text
    data = res.json()
    assert "stats" in data
    assert "total_users" in data["stats"]
    assert "total_available_credits" in data["stats"]

    res_diag = await client.get("/api/v1/admin/system/diagnostics", headers=admin_auth)
    assert res_diag.status_code == 200
    assert res_diag.json()["status"] == "operational"


@pytest.mark.anyio
async def test_super_admin_user_management(client, admin_auth):
    """Verify user listing, status toggle, credit adjustment, and self-deactivation protection."""
    # List users
    res = await client.get("/api/v1/admin/users", headers=admin_auth)
    assert res.status_code == 200
    users = res.json()["items"]
    assert len(users) >= 2

    # Find teacher
    teacher_item = next((u for u in users if u["email"] == "teacher@aegeus.edu"), None)
    assert teacher_item is not None

    # Toggle teacher status to inactive
    res_status = await client.patch(
        f"/api/v1/admin/users/{teacher_item['id']}/status",
        headers=admin_auth,
        json={"is_active": False}
    )
    assert res_status.status_code == 200

    # Verify inactive in DB
    db = TestingSessionLocal()
    try:
        t_user = db.query(User).filter(User.id == teacher_item["id"]).first()
        assert t_user.is_active is False

        # Restore active status
        t_user.is_active = True
        db.commit()
    finally:
        db.close()

    # Manual credit adjustment
    res_credit = await client.post(
        f"/api/v1/admin/users/{teacher_item['id']}/adjust-credits",
        headers=admin_auth,
        json={"amount": 500, "credit_type": "PAID", "reason": "Faculty Grant"}
    )
    assert res_credit.status_code == 200
    assert res_credit.json()["success"] is True

    # Verify self-deactivation is rejected
    admin_id = next(u["id"] for u in users if u["email"] == "admin@aegeus.edu")
    res_self = await client.patch(
        f"/api/v1/admin/users/{admin_id}/status",
        headers=admin_auth,
        json={"is_active": False}
    )
    assert res_self.status_code == 400


@pytest.mark.anyio
async def test_coupon_campaign_generation_and_csv_export(client, admin_auth):
    """Verify FDP campaign creation: 25 unique codes worth 10,000 credits each."""
    payload = {
        "name": "FDP Faculty Enablement 2026",
        "description": "Faculty development program sponsorship",
        "code_prefix": "FDP-",
        "credits_per_coupon": 10000,
        "credit_type": "PAID",
        "total_coupons": 25,
        "allowed_roles": "teacher",
        "max_redemptions_per_user": 1
    }
    res = await client.post("/api/v1/admin/coupons/campaigns", headers=admin_auth, json=payload)
    assert res.status_code == 200, res.text
    campaign = res.json()
    assert campaign["total_coupons"] == 25
    assert campaign["credits_per_coupon"] == 10000
    campaign_id = campaign["id"]

    # Verify detail returns 25 unique coupons
    res_detail = await client.get(f"/api/v1/admin/coupons/campaigns/{campaign_id}", headers=admin_auth)
    assert res_detail.status_code == 200
    detail = res_detail.json()
    codes = [c["code"] for c in detail["coupons"]]
    assert len(codes) == 25
    assert len(set(codes)) == 25, "All 25 coupon codes must be strictly unique!"
    assert all(c.startswith("FDP-") for c in codes)

    # Test CSV export
    res_csv = await client.get(f"/api/v1/admin/coupons/campaigns/{campaign_id}/export-csv", headers=admin_auth)
    assert res_csv.status_code == 200
    assert "text/csv" in res_csv.headers["content-type"]
    assert "Voucher Code" in res_csv.text
    assert codes[0] in res_csv.text


@pytest.mark.anyio
async def test_atomic_coupon_redemption_and_ledger(client, admin_auth, teacher_auth):
    """Verify voucher redemption, balance crediting, and duplicate protection."""
    # 1. Admin creates a campaign of 2 coupons worth 5000 credits
    payload = {
        "name": "Test Promo Campaign",
        "code_prefix": "PROMO-",
        "credits_per_coupon": 5000,
        "credit_type": "PAID",
        "total_coupons": 2,
        "allowed_roles": "teacher",
        "max_redemptions_per_user": 1
    }
    camp_res = await client.post("/api/v1/admin/coupons/campaigns", headers=admin_auth, json=payload)
    assert camp_res.status_code == 200
    camp_id = camp_res.json()["id"]

    # Get generated codes
    detail_res = await client.get(f"/api/v1/admin/coupons/campaigns/{camp_id}", headers=admin_auth)
    coupons = detail_res.json()["coupons"]
    code1 = coupons[0]["code"]
    code2 = coupons[1]["code"]

    # Check initial teacher balance
    db = TestingSessionLocal()
    teacher = db.query(User).filter(User.email == "teacher@aegeus.edu").first()
    init_balance = teacher.total_available_credits
    db.close()

    # 2. Teacher redeems code1
    redeem_res = await client.post(
        "/api/v1/payments/credits/redeem-coupon",
        headers=teacher_auth,
        json={"code": code1}
    )
    assert redeem_res.status_code == 200, redeem_res.text
    data = redeem_res.json()
    assert data["success"] is True
    assert data["credits_added"] == 5000
    assert data["new_balance"] == init_balance + 5000

    # 3. Duplicate redemption of code1 must fail with 400
    dup_res = await client.post(
        "/api/v1/payments/credits/redeem-coupon",
        headers=teacher_auth,
        json={"code": code1}
    )
    assert dup_res.status_code == 400
    assert "already been redeemed" in dup_res.json()["detail"].lower()

    # 4. Teacher attempting to redeem code2 from same campaign fails (max_redemptions_per_user = 1)
    limit_res = await client.post(
        "/api/v1/payments/credits/redeem-coupon",
        headers=teacher_auth,
        json={"code": code2}
    )
    assert limit_res.status_code == 400
    assert "maximum allowed" in limit_res.json()["detail"].lower()

    # 5. Verify CreditTransaction record exists
    db = TestingSessionLocal()
    try:
        tx = db.query(CreditTransaction).filter(
            CreditTransaction.transaction_type == "COUPON_REDEMPTION",
            CreditTransaction.amount_credits == 5000
        ).first()
        assert tx is not None
        assert "PROMO-" in tx.description
    finally:
        db.close()


@pytest.mark.anyio
async def test_system_settings_configuration(client, admin_auth):
    """Verify viewing and updating platform settings (e.g. signup_bonus_credits)."""
    # Read settings
    res = await client.get("/api/v1/admin/settings", headers=admin_auth)
    assert res.status_code == 200
    settings = {s["key"]: s["value"] for s in res.json()}
    assert "signup_bonus_credits" in settings

    # Update signup_bonus_credits to 250
    res_up = await client.put(
        "/api/v1/admin/settings/signup_bonus_credits",
        headers=admin_auth,
        json={"value": "250"}
    )
    assert res_up.status_code == 200
    assert res_up.json()["value"] == "250"

    # Reset back to 200
    await client.put(
        "/api/v1/admin/settings/signup_bonus_credits",
        headers=admin_auth,
        json={"value": "200"}
    )
