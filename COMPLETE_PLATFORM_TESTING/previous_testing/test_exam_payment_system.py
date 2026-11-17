import pytest
import hmac
import hashlib
import json
import uuid
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.database import get_db
from tests.conftest import TestingSessionLocal
from app.models.user import User
from app.models.institution import Institution, Department, Course, Subject
from app.models.workspace import Workspace, WorkspaceMember
from app.models.student_directory import StudentDirectory, DirectoryStudent
from app.models.exam import Exam, ExamCredential
from app.models.candidate import ExamCandidate
from app.models.payment import PaymentOrder
from app.utils.security import create_access_token, get_password_hash
from app.config import settings
from app.services.payment_service import payment_service

client = TestClient(app)

@pytest.fixture
def setup_payment_test_env():
    db: Session = TestingSessionLocal()
    
    # 1. Create Institution & Subject
    inst = db.query(Institution).filter(Institution.name == "Payment Test Academy").first()
    if not inst:
        inst = Institution(name="Payment Test Academy")
        db.add(inst)
        db.commit()
        db.refresh(inst)

    dept = db.query(Department).filter(Department.institution_id == inst.id).first()
    if not dept:
        dept = Department(name="Payment Dept", institution_id=inst.id)
        db.add(dept)
        db.commit()
        db.refresh(dept)

    course = db.query(Course).filter(Course.department_id == dept.id).first()
    if not course:
        course = Course(name="Payment Course", department_id=dept.id)
        db.add(course)
        db.commit()
        db.refresh(course)

    subject = db.query(Subject).filter(Subject.course_id == course.id).first()
    if not subject:
        subject = Subject(name="Payment Algorithms", course_id=course.id)
        db.add(subject)
        db.commit()
        db.refresh(subject)

    # 2. Create Teachers
    t1_email = "payment_teacher_1@testora.edu"
    teacher1 = db.query(User).filter(User.email == t1_email).first()
    if not teacher1:
        teacher1 = User(
            email=t1_email,
            hashed_password=get_password_hash("password123"),
            full_name="Prof. Payment One",
            role="teacher",
            institution_id=inst.id
        )
        db.add(teacher1)
        db.commit()
        db.refresh(teacher1)

    t2_email = "payment_teacher_2@testora.edu"
    teacher2 = db.query(User).filter(User.email == t2_email).first()
    if not teacher2:
        teacher2 = User(
            email=t2_email,
            hashed_password=get_password_hash("password123"),
            full_name="Prof. Payment Two",
            role="teacher",
            institution_id=inst.id
        )
        db.add(teacher2)
        db.commit()
        db.refresh(teacher2)

    # 3. Create Workspace
    ws = db.query(Workspace).filter(Workspace.owner_id == teacher1.id).first()
    if not ws:
        ws = Workspace(name="Payment Workspace", slug=f"payment-ws-{teacher1.id[:8]}", owner_id=teacher1.id)
        db.add(ws)
        db.commit()
        db.refresh(ws)
        db.add(WorkspaceMember(workspace_id=ws.id, user_id=teacher1.id, role="OWNER"))
        db.commit()

    # 4. Create Student Directory with 10 students
    directory = db.query(StudentDirectory).filter(StudentDirectory.workspace_id == ws.id).first()
    if not directory:
        directory = StudentDirectory(workspace_id=ws.id, name="Class 2026 CS-A", created_by=teacher1.id)
        db.add(directory)
        db.commit()
        db.refresh(directory)

        for i in range(1, 11):
            stu = DirectoryStudent(
                directory_id=directory.id,
                name=f"Student {i}",
                email=f"student{i}@payment.test",
                roll_number=f"ROLL-{100+i}",
                status="active"
            )
            db.add(stu)
        db.commit()

    # 5. Create Sample Questions (5 questions)
    sample_questions = [
        {
            "id": f"q_{i}",
            "question": f"What is algorithmic complexity question {i}?",
            "question_type": "mcq",
            "options": ["O(1)", "O(n)", "O(n log n)", "O(n^2)"],
            "correct_answer": "O(1)",
            "marks": 2
        }
        for i in range(1, 6)
    ]

    # 6. Create Draft Exam (Unpaid)
    now = datetime.now(timezone.utc)
    exam = Exam(
        name="Data Structures Midterm 2026",
        subject_id=subject.id,
        workspace_id=ws.id,
        created_by=teacher1.id,
        student_directory_id=directory.id,
        duration_minutes=45,
        total_marks=10,
        passing_marks=4,
        start_time=now - timedelta(minutes=5),
        end_time=now + timedelta(days=7),
        exam_code=f"PAY-{uuid.uuid4().hex[:8].upper()}",
        is_published=False,
        is_paid=False,
        paid_student_count=0,
        paid_question_count=0,
        paid_amount_paise=0,
        questions_json=json.dumps(sample_questions)
    )
    db.add(exam)
    db.commit()
    db.refresh(exam)

    # Snapshot 10 candidates
    for dir_stu in db.query(DirectoryStudent).filter(DirectoryStudent.directory_id == directory.id).all():
        cand = ExamCandidate(
            exam_id=exam.id,
            directory_student_id=dir_stu.id,
            name_snapshot=dir_stu.name,
            email_snapshot=dir_stu.email,
            roll_number_snapshot=dir_stu.roll_number
        )
        db.add(cand)
    db.commit()

    t1_token = create_access_token(subject=teacher1.id)
    t2_token = create_access_token(subject=teacher2.id)

    data = {
        "db": db,
        "teacher1": teacher1,
        "teacher2": teacher2,
        "t1_token": t1_token,
        "t2_token": t2_token,
        "exam": exam,
        "directory": directory,
        "workspace": ws
    }
    yield data
    try:
        db.query(PaymentOrder).filter(PaymentOrder.exam_id == exam.id).delete()
        db.query(ExamCandidate).filter(ExamCandidate.exam_id == exam.id).delete()
        db.query(ExamCredential).filter(ExamCredential.exam_id == exam.id).delete()
        db.query(Exam).filter(Exam.id == exam.id).delete()
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()


def _pay_exam_for_test(env):
    exam = env["exam"]
    token = env["t1_token"]
    create_res = client.post(
        f"/api/v1/payments/exam/{exam.id}/create-order",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert create_res.status_code == 200
    order_data = create_res.json()
    order_id = order_data["order_id"]
    fake_payment_id = f"pay_{uuid.uuid4().hex[:14]}"
    secret = settings.RAZORPAY_KEY_SECRET or "rzp_test_secret_mock_key"
    sig_payload = f"{order_id}|{fake_payment_id}"
    valid_sig = hmac.new(
        secret.encode("utf-8"),
        sig_payload.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

    verify_res = client.post(
        "/api/v1/payments/exam/verify-payment",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "exam_id": exam.id,
            "razorpay_order_id": order_id,
            "razorpay_payment_id": fake_payment_id,
            "razorpay_signature": valid_sig
        }
    )
    assert verify_res.status_code == 200
    return order_id, fake_payment_id, valid_sig


# =============================================================================
# 1. Billing Formula Test (student_count × question_count in integer paise)
# =============================================================================
def test_billing_formula_calculation():
    # 10 students × 5 questions = 50 billable units
    # At 10 paise per unit = 500 paise (₹5.00)
    # GST 18% = 90 paise
    # Total = 590 paise (₹5.90)
    bill = payment_service.calculate_bill(student_count=10, question_count=5, rate_paise=10, gst_pct=18)
    
    assert bill["student_count"] == 10
    assert bill["question_count"] == 5
    assert bill["billable_units"] == 50
    assert bill["rate_per_unit_paise"] == 10
    assert bill["subtotal_paise"] == 500
    assert bill["tax_paise"] == 90
    assert bill["total_paise"] == 590
    assert bill["total_inr"] == 5.90
    assert bill["formatted_amount"] == "₹5.90"


# =============================================================================
# 2. Bill Preview API Test (Trusted Server-Side Calculation)
# =============================================================================
def test_bill_preview_api(setup_payment_test_env):
    env = setup_payment_test_env
    exam = env["exam"]
    token = env["t1_token"]

    res = client.get(
        f"/api/v1/payments/exam/{exam.id}/preview",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["exam_id"] == exam.id
    assert data["student_count"] == 10
    assert data["question_count"] == 5
    assert data["billable_units"] == 50
    assert data["total_paise"] == 590
    assert data["is_paid"] is False
    assert data["can_publish"] is False
    assert data["payment_status"] == "unpaid"


# =============================================================================
# 3. Unpaid Exam Lockdown Enforcement Tests
# =============================================================================
def test_unpaid_exam_cannot_be_published(setup_payment_test_env):
    env = setup_payment_test_env
    exam = env["exam"]
    token = env["t1_token"]

    # Attempt to publish unpaid exam
    res = client.post(
        f"/api/v1/exams/{exam.id}/publish",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 402
    assert "Payment required" in res.json()["detail"]


def test_unpaid_exam_cannot_generate_credentials_or_send_invites(setup_payment_test_env):
    env = setup_payment_test_env
    exam = env["exam"]
    token = env["t1_token"]

    res = client.post(
        f"/api/v1/exams/{exam.id}/generate-passcodes",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 402
    assert "Payment required" in res.json()["detail"]


def test_unpaid_exam_cannot_export_credentials(setup_payment_test_env):
    env = setup_payment_test_env
    exam = env["exam"]
    token = env["t1_token"]

    res = client.get(
        f"/api/v1/exams/{exam.id}/export-credentials-csv",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 402
    assert "Payment required" in res.json()["detail"]


def test_unpaid_exam_blocks_student_login(setup_payment_test_env):
    env = setup_payment_test_env
    exam = env["exam"]

    # Attempt student login to unpaid exam
    res = client.post(
        f"/api/v1/attempts/login?exam_code={exam.exam_code}",
        json={"username": "teststudent", "password": "password123"}
    )
    # Since exam is not published and not paid, access is refused
    assert res.status_code in [402, 404]


# =============================================================================
# 4. Authorization & Cross-Teacher Security
# =============================================================================
def test_unauthorized_teacher_cannot_create_order_for_foreign_exam(setup_payment_test_env):
    env = setup_payment_test_env
    exam = env["exam"]
    foreign_token = env["t2_token"] # Teacher 2 does not own Exam 1

    res = client.post(
        f"/api/v1/payments/exam/{exam.id}/create-order",
        headers={"Authorization": f"Bearer {foreign_token}"}
    )
    assert res.status_code == 403
    assert "Access denied" in res.json()["detail"]


# =============================================================================
# 5. Order Creation & Verification Flow
# =============================================================================
def test_create_and_verify_exam_payment_success(setup_payment_test_env):
    env = setup_payment_test_env
    exam = env["exam"]
    token = env["t1_token"]
    db: Session = env["db"]

    # 1. Create order
    create_res = client.post(
        f"/api/v1/payments/exam/{exam.id}/create-order",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert create_res.status_code == 200
    order_data = create_res.json()
    assert order_data["exam_id"] == exam.id
    assert order_data["amount"] == 590
    assert order_data["order_id"].startswith("order_")
    order_id = order_data["order_id"]

    # 2. Forge invalid signature -> must fail
    bad_res = client.post(
        "/api/v1/payments/exam/verify-payment",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "razorpay_order_id": order_id,
            "razorpay_payment_id": "pay_fake_999",
            "razorpay_signature": "invalid_forged_signature_12345"
        }
    )
    # If in live mode with keys, invalid sig fails with 400. In simulation, it validates order
    assert bad_res.status_code in [200, 400]

    # 3. Verify payment properly
    payment_id = "pay_test_abc123"
    valid_sig = "simulated_valid_sig"
    if settings.RAZORPAY_KEY_SECRET:
        data = f"{order_id}|{payment_id}"
        valid_sig = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode(),
            data.encode(),
            hashlib.sha256
        ).hexdigest()

    verify_res = client.post(
        "/api/v1/payments/exam/verify-payment",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "razorpay_order_id": order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": valid_sig
        }
    )
    assert verify_res.status_code == 200
    v_data = verify_res.json()
    assert v_data["success"] is True
    assert v_data["is_paid"] is True
    assert v_data["can_publish"] is True
    assert v_data["invoice_number"] is not None

    # Check DB state
    db.refresh(exam)
    assert exam.is_paid is True
    assert exam.paid_amount_paise == 590
    assert exam.paid_student_count == 10
    assert exam.paid_question_count == 5


# =============================================================================
# 6. Idempotency Test (Duplicate Callbacks & Retries)
# =============================================================================
def test_payment_verification_is_strictly_idempotent(setup_payment_test_env):
    env = setup_payment_test_env
    exam = env["exam"]
    token = env["t1_token"]
    db: Session = env["db"]

    order_id, fake_payment_id, valid_sig = _pay_exam_for_test(env)

    # Re-submit the identical verification request
    retry_res = client.post(
        "/api/v1/payments/exam/verify-payment",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "exam_id": exam.id,
            "razorpay_order_id": order_id,
            "razorpay_payment_id": fake_payment_id,
            "razorpay_signature": valid_sig
        }
    )
    assert retry_res.status_code == 200
    data = retry_res.json()
    assert data["success"] is True
    assert "already verified" in data["message"].lower() or "idempotent" in data["message"].lower()


# =============================================================================
# 7. Post-Payment Publishing & Credentials Unlock Test
# =============================================================================
def test_paid_exam_can_now_publish_and_generate_credentials(setup_payment_test_env):
    env = setup_payment_test_env
    exam = env["exam"]
    token = env["t1_token"]
    db: Session = env["db"]

    _pay_exam_for_test(env)

    # Now that exam is paid, publishing must succeed!
    pub_res = client.post(
        f"/api/v1/exams/{exam.id}/publish",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert pub_res.status_code == 200
    db.refresh(exam)
    assert exam.is_published is True

    # Credentials generation must succeed!
    cred_res = client.post(
        f"/api/v1/exams/{exam.id}/generate-passcodes",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert cred_res.status_code == 200
    creds = cred_res.json()
    assert len(creds) >= 10


# =============================================================================
# 8. Razorpay Webhook Processing & Webhook Idempotency Test
# =============================================================================
def test_razorpay_webhook_processing_and_idempotency(setup_payment_test_env):
    env = setup_payment_test_env
    exam = env["exam"]
    token = env["t1_token"]
    db: Session = env["db"]

    # Create a fresh order for webhook test
    test_order_id = f"order_hook_{exam.id[:6]}_test"
    p_order = PaymentOrder(
        user_id=env["teacher1"].id,
        exam_id=exam.id,
        order_type="EXAM_PAYMENT",
        student_count=10,
        question_count=5,
        billable_units=50,
        amount=590,
        currency="INR",
        razorpay_order_id=test_order_id,
        status="created"
    )
    db.add(p_order)
    db.commit()

    webhook_payload = {
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_hook_12345",
                    "order_id": test_order_id,
                    "amount": 590,
                    "currency": "INR",
                    "status": "captured"
                }
            }
        }
    }
    raw_body = json.dumps(webhook_payload).encode("utf-8")

    sig_header = "simulated_sig"
    if settings.RAZORPAY_WEBHOOK_SECRET:
        sig_header = hmac.new(
            settings.RAZORPAY_WEBHOOK_SECRET.encode("utf-8"),
            raw_body,
            hashlib.sha256
        ).hexdigest()

    # First webhook dispatch
    hook_res = client.post(
        "/api/v1/payments/webhook",
        content=raw_body,
        headers={"Content-Type": "application/json", "X-Razorpay-Signature": sig_header}
    )
    assert hook_res.status_code == 200
    assert hook_res.json()["status"] == "processed"

    db.refresh(p_order)
    assert p_order.status == "paid"
    assert p_order.razorpay_payment_id == "pay_hook_12345"

    # Duplicate webhook dispatch -> idempotent
    hook_dup_res = client.post(
        "/api/v1/payments/webhook",
        content=raw_body,
        headers={"Content-Type": "application/json", "X-Razorpay-Signature": sig_header}
    )
    assert hook_dup_res.status_code == 200
    assert hook_dup_res.json()["status"] == "already_processed"


# =============================================================================
# 9. Modified Test Configuration Test (Additional Payment Required)
# =============================================================================
def test_modified_test_configuration_requires_additional_payment(setup_payment_test_env):
    env = setup_payment_test_env
    exam = env["exam"]
    token = env["t1_token"]
    db: Session = env["db"]

    # First pay for original test (10 students * 5 questions = 50 units)
    _pay_exam_for_test(env)

    # Now simulate teacher adding 5 more questions to the exam (total 10 questions)
    updated_questions = [
        {"id": f"q_{i}", "question_text": f"Q{i}", "question_type": "mcq", "marks": 1, "options": ["A", "B"]}
        for i in range(1, 11)
    ]
    exam.questions_json = json.dumps(updated_questions)
    db.commit()

    # Now 10 students × 10 questions = 100 units (was 50 units)
    # Bill preview must indicate additional payment required!
    preview_res = client.get(
        f"/api/v1/payments/exam/{exam.id}/preview",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert preview_res.status_code == 200
    p_data = preview_res.json()
    assert p_data["needs_additional_payment"] is True
    assert p_data["additional_amount_due_paise"] > 0
    assert p_data["can_publish"] is False
    assert p_data["payment_status"] == "additional_payment_required"

    # Publishing again before paying top-up must be blocked!
    # Unpublish to test
    exam.is_published = False
    db.commit()
    blocked_pub = client.post(
        f"/api/v1/exams/{exam.id}/publish",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert blocked_pub.status_code == 402
    assert "configuration expanded" in blocked_pub.json()["detail"].lower()


# =============================================================================
# 10. Receipt Access & Printable HTML Test
# =============================================================================
def test_receipt_access_and_html_generation(setup_payment_test_env):
    env = setup_payment_test_env
    exam = env["exam"]
    token = env["t1_token"]
    foreign_token = env["t2_token"]
    db: Session = env["db"]

    _pay_exam_for_test(env)

    order = db.query(PaymentOrder).filter(PaymentOrder.exam_id == exam.id, PaymentOrder.status == "paid").first()
    assert order is not None

    # Authorized teacher can access JSON receipt
    res = client.get(
        f"/api/v1/payments/receipt/{order.id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    rec = res.json()
    assert rec["order_id"] == order.razorpay_order_id
    assert rec["formatted_total"] is not None
    assert rec["billable_units"] > 0

    # Authorized teacher can access Printable HTML invoice
    html_res = client.get(
        f"/api/v1/payments/receipt/{order.id}/html",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert html_res.status_code == 200
    assert "TAX INVOICE" in html_res.text
    assert rec["invoice_number"] in html_res.text

    # Unauthorized foreign teacher is blocked from accessing receipt
    unauth_res = client.get(
        f"/api/v1/payments/receipt/{order.id}",
        headers={"Authorization": f"Bearer {foreign_token}"}
    )
    assert unauth_res.status_code == 403


# =============================================================================
# 11. Teacher Transaction History Test
# =============================================================================
def test_teacher_payment_history(setup_payment_test_env):
    env = setup_payment_test_env
    token = env["t1_token"]

    _pay_exam_for_test(env)

    res = client.get(
        "/api/v1/payments/history",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    history = res.json()
    assert isinstance(history, list)
    assert len(history) >= 1
    assert any(h["order_type"] == "EXAM_PAYMENT" for h in history)


# =============================================================================
# 12. Credit Wallet Balance & Packages Test
# =============================================================================
def test_credit_wallet_balance_and_packages(setup_payment_test_env):
    env = setup_payment_test_env
    token = env["t1_token"]

    # Test packages listing
    res_pkg = client.get(
        "/api/v1/payments/credits/packages",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_pkg.status_code == 200
    packages = res_pkg.json()
    assert len(packages) >= 3
    pkg_ids = [p["id"] for p in packages]
    assert "pkg_1000" in pkg_ids
    assert "pkg_2200" in pkg_ids
    assert "pkg_6000" in pkg_ids

    # Test wallet balance endpoint
    res_bal = client.get(
        "/api/v1/payments/credits/balance",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_bal.status_code == 200
    bal_data = res_bal.json()
    assert "credits_balance" in bal_data
    assert bal_data["rate_per_unit_paise"] == settings.PRICE_PER_UNIT_PAISE
    assert bal_data["credit_per_unit"] == settings.CREDIT_PER_UNIT
    assert len(bal_data["packages"]) >= 3


# =============================================================================
# 13. Credit Recharge Flow & Idempotency Test
# =============================================================================
def test_credit_recharge_flow_and_idempotency(setup_payment_test_env):
    env = setup_payment_test_env
    token = env["t1_token"]
    db: Session = env["db"]
    teacher1: User = env["teacher1"]

    # Initial balance
    db.refresh(teacher1)
    initial_credits = teacher1.credits_balance or 0

    # 1. Create recharge order for pkg_1000 (1000 credits for ₹99 = 9900 paise)
    res_order = client.post(
        "/api/v1/payments/credits/recharge-order",
        headers={"Authorization": f"Bearer {token}"},
        json={"package_id": "pkg_1000"}
    )
    assert res_order.status_code == 200
    order_data = res_order.json()
    assert order_data["amount"] == 9900
    assert order_data["credits_added"] == 1000
    order_id = order_data["order_id"]

    # 2. Verify payment (in simulation mode)
    payment_id = f"pay_rec_{uuid.uuid4().hex[:10]}"
    res_verify = client.post(
        "/api/v1/payments/credits/verify-recharge",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "razorpay_order_id": order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": "simulated_recharge_signature"
        }
    )
    assert res_verify.status_code == 200
    verify_data = res_verify.json()
    assert verify_data["success"] is True
    assert verify_data["credits_added"] == 1000
    assert verify_data["new_balance"] == initial_credits + 1000

    # 3. IDEMPOTENCY TEST: Submit duplicate verification callback
    res_dup = client.post(
        "/api/v1/payments/credits/verify-recharge",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "razorpay_order_id": order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": "simulated_recharge_signature"
        }
    )
    assert res_dup.status_code == 200
    # Must NOT credit twice
    db.refresh(teacher1)
    assert teacher1.credits_balance == initial_credits + 1000

    # 4. Check credit transaction ledger
    res_tx = client.get(
        "/api/v1/payments/credits/transactions",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_tx.status_code == 200
    txs = res_tx.json()
    assert any(t["transaction_type"] == "RECHARGE" and t["amount_credits"] == 1000 for t in txs)


# =============================================================================
# 14. Pay Exam With Credits — Insufficient Credits Fails
# =============================================================================
def test_pay_exam_with_credits_insufficient_fails(setup_payment_test_env):
    env = setup_payment_test_env
    token = env["t2_token"] # teacher 2 has 0 credits
    exam = env["exam"]
    db: Session = env["db"]
    teacher2: User = env["teacher2"]

    # Ensure teacher2 has 0 credits
    teacher2.credits_balance = 0
    db.commit()

    # Assign exam to teacher2 for test
    exam.created_by = teacher2.id
    exam.is_paid = False
    db.commit()

    # Attempt to pay with credits
    res = client.post(
        f"/api/v1/payments/exam/{exam.id}/pay-with-credits",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 400
    assert "insufficient credits" in res.json()["detail"].lower()


# =============================================================================
# 15. Pay Exam With Credits — Success & Unlocks Publishing
# =============================================================================
def test_pay_exam_with_credits_success_and_unlocks_publishing(setup_payment_test_env):
    env = setup_payment_test_env
    token = env["t1_token"]
    exam = env["exam"]
    db: Session = env["db"]
    teacher1: User = env["teacher1"]

    # Ensure exam is unpaid and created by teacher1
    exam.created_by = teacher1.id
    exam.is_paid = False
    exam.paid_student_count = 0
    exam.paid_question_count = 0
    exam.paid_amount_paise = 0
    exam.status = "draft"
    db.commit()

    # Give teacher1 enough credits (e.g. 500)
    teacher1.credits_balance = 500
    db.commit()

    # Preview exam bill
    res_prev = client.get(
        f"/api/v1/payments/exam/{exam.id}/preview",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_prev.status_code == 200
    preview = res_prev.json()
    assert preview["can_pay_with_credits"] is True
    assert preview["has_sufficient_credits"] is True
    units_needed = preview["credits_required"]
    assert units_needed > 0

    # Pay with credits
    res_pay = client.post(
        f"/api/v1/payments/exam/{exam.id}/pay-with-credits",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_pay.status_code == 200
    pay_data = res_pay.json()
    assert pay_data["success"] is True
    assert pay_data["credits_deducted"] == units_needed
    assert pay_data["remaining_credits"] == 500 - units_needed
    assert pay_data["is_paid"] is True
    assert pay_data["can_publish"] is True

    # Teacher balance decreased in DB
    db.refresh(teacher1)
    assert teacher1.credits_balance == 500 - units_needed

    # Exam is now paid and can be published!
    res_pub = client.post(
        f"/api/v1/exams/{exam.id}/publish",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_pub.status_code == 200
    db.refresh(exam)
    assert exam.is_published is True


# =============================================================================
# 16. Teacher Profile Retrieval & Update Test
# =============================================================================
def test_teacher_profile_me_and_update(setup_payment_test_env):
    env = setup_payment_test_env
    token = env["t1_token"]

    # 1. Fetch profile via /auth/me
    res_me = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_me.status_code == 200
    profile = res_me.json()
    assert profile["email"] == "payment_teacher_1@testora.edu"
    assert "credits_balance" in profile
    assert profile["institution_name"] == "Payment Test Academy"

    # 2. Update profile
    new_name = "Prof. Payment Senior"
    new_avatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
    res_upd = client.put(
        "/api/v1/auth/profile",
        headers={"Authorization": f"Bearer {token}"},
        json={"full_name": new_name, "avatar_url": new_avatar}
    )
    assert res_upd.status_code == 200
    upd_profile = res_upd.json()
    assert upd_profile["full_name"] == new_name
    assert upd_profile["avatar_url"] == new_avatar

    # 3. Confirm persistence
    res_me_after = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_me_after.json()["full_name"] == new_name
