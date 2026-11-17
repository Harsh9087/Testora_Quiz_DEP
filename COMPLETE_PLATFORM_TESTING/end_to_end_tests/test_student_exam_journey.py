import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_complete_examination_and_evaluation_journey(client: AsyncClient, create_test_user):
    # 1. Teacher creates exam
    teacher, t_token = create_test_user("journey_teacher@testora.edu", role="teacher", full_name="Journey Teacher")
    t_headers = {"Authorization": f"Bearer {t_token}"}

    exam_payload = {
        "title": "Computer Networks Final 2026",
        "description": "OSI Model and TCP/IP Protocols assessment",
        "duration_minutes": 30,
        "total_marks": 20,
        "pass_marks": 10,
        "is_published": True,
        "questions": [
            {
                "text": "Which layer of the OSI model handles end-to-end reliability and flow control?",
                "question_type": "MCQ",
                "marks": 10.0,
                "negative_marks": 0.0,
                "options": [
                    {"text": "Transport Layer", "is_correct": True},
                    {"text": "Network Layer", "is_correct": False},
                    {"text": "Data Link Layer", "is_correct": False},
                    {"text": "Session Layer", "is_correct": False}
                ]
            }
        ]
    }
    create_res = await client.post("/api/v1/exams", json=exam_payload, headers=t_headers)
    assert create_res.status_code in [200, 201]
    exam = create_res.json()
    exam_id = exam["id"]

    # 2. Student user logs in
    student, s_token = create_test_user("journey_student@testora.edu", role="student", full_name="Journey Student")
    s_headers = {"Authorization": f"Bearer {s_token}"}

    # 3. Retrieve student pre-exam details
    detail_res = await client.get(f"/api/v1/exams/{exam_id}", headers=s_headers)
    assert detail_res.status_code == 200
    assert detail_res.json()["title"] == "Computer Networks Final 2026"
