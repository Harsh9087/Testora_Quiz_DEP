import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_teacher_exam_creation_and_lifecycle(client: AsyncClient, create_test_user):
    teacher, token = create_test_user("studio_teacher@testora.edu", role="teacher", full_name="Studio Teacher")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Assessment Blueprint
    exam_payload = {
        "title": "Quantum Physics Midterm Assessment",
        "description": "Comprehensive midterm exam on wave functions and quantum mechanics.",
        "duration_minutes": 45,
        "total_marks": 50,
        "pass_marks": 20,
        "is_published": True,
        "questions": [
            {
                "text": "What does the square of the wavefunction $\\|\\psi\\|^2$ represent?",
                "question_type": "MCQ",
                "marks": 10.0,
                "negative_marks": 2.5,
                "options": [
                    {"text": "Probability density", "is_correct": True},
                    {"text": "Particle momentum", "is_correct": False},
                    {"text": "Total system energy", "is_correct": False},
                    {"text": "Magnetic moment", "is_correct": False}
                ]
            }
        ]
    }

    create_res = await client.post("/api/v1/exams", json=exam_payload, headers=headers)
    assert create_res.status_code in [200, 201], f"Exam creation failed: {create_res.text}"
    exam_data = create_res.json()
    assert "id" in exam_data
    assert exam_data["title"] == "Quantum Physics Midterm Assessment"

    exam_id = exam_data["id"]

    # 2. Retrieve Exam Details
    get_res = await client.get(f"/api/v1/exams/{exam_id}", headers=headers)
    assert get_res.status_code == 200
    detail = get_res.json()
    assert detail["title"] == "Quantum Physics Midterm Assessment"
    assert detail["duration_minutes"] == 45
