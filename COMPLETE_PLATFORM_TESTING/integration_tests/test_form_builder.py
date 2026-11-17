import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_custom_form_creation_and_lifecycle(client: AsyncClient, create_test_user):
    teacher, token = create_test_user("form_teacher@testora.edu", role="teacher", full_name="Form Teacher")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create a dynamic custom form
    form_payload = {
        "title": "Course Feedback & Evaluation 2026",
        "description": "Please provide your detailed feedback on course materials.",
        "theme": "indigo",
        "fields": [
            {
                "field_type": "text",
                "label": "Full Name",
                "is_required": True,
                "order": 1
            },
            {
                "field_type": "choice",
                "label": "Course Difficulty Rating",
                "is_required": True,
                "options": ["Introductory", "Intermediate", "Advanced", "Rigorous"],
                "order": 2
            }
        ]
    }

    res = await client.post("/api/v1/custom-forms", json=form_payload, headers=headers)
    assert res.status_code in [200, 201], f"Custom form creation failed: {res.text}"
    form_data = res.json()
    assert "id" in form_data or "slug" in form_data
