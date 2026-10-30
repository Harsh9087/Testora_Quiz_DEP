import pytest
from app.models.user import User
from app.models.user_preference import UserPreference
from app.services.notification_service import create_notification
from backend.tests.conftest import TestingSessionLocal

@pytest.mark.anyio
async def test_user_preferences_model_and_endpoints(client, teacher_auth):
    # 1. GET /preferences (should auto-create defaults for teacher)
    get_res = await client.get("/api/v1/preferences", headers=teacher_auth)
    assert get_res.status_code == 200
    data = get_res.json()
    assert data["font_family"] == "inter"
    assert data["text_scale"] == 100
    assert data["interface_density"] == "standard"
    assert data["theme"] == "system"
    assert data["language"] == "en"
    assert data["cat_security"] is True

    # 2. PUT /preferences (update settings)
    update_payload = {
        "font_family": "dyslexic",
        "text_scale": 115,
        "interface_density": "compact",
        "theme": "dark",
        "language": "hi",
        "cat_marketing": False,
        "cat_security": False  # Must be enforced to True on backend
    }
    put_res = await client.put("/api/v1/preferences", json=update_payload, headers=teacher_auth)
    assert put_res.status_code == 200
    updated = put_res.json()
    assert updated["font_family"] == "dyslexic"
    assert updated["text_scale"] == 115
    assert updated["interface_density"] == "compact"
    assert updated["theme"] == "dark"
    assert updated["language"] == "hi"
    assert updated["cat_security"] is True  # Verified security invariant

    # 3. Test notification preference enforcement
    db = TestingSessionLocal()
    try:
        teacher = db.query(User).filter(User.email == "teacher@aegeus.edu").first()
        assert teacher is not None

        # Marketing notification should be blocked because cat_marketing is False
        m_notif = create_notification(
            db=db,
            user_id=teacher.id,
            title="Promo Announcement",
            message="Special institutional deal",
            notification_type="marketing"
        )
        assert m_notif is None

        # Security alert should always be delivered
        s_notif = create_notification(
            db=db,
            user_id=teacher.id,
            title="Password Modified",
            message="Your password was changed from Chrome",
            notification_type="security"
        )
        assert s_notif is not None
        assert s_notif.title == "Password Modified"
    finally:
        db.close()

    # 4. Test Data Export
    export_res = await client.get("/api/v1/preferences/export-data", headers=teacher_auth)
    assert export_res.status_code == 200
    exp_data = export_res.json()
    assert "user_profile" in exp_data
    assert exp_data["user_profile"]["email"] == "teacher@aegeus.edu"
    assert "preferences" in exp_data

    # 5. Test Reset Preferences
    reset_res = await client.post("/api/v1/preferences/reset", headers=teacher_auth)
    assert reset_res.status_code == 200
    reset_data = reset_res.json()
    assert reset_data["font_family"] == "inter"
    assert reset_data["text_scale"] == 100
    assert reset_data["interface_density"] == "standard"
