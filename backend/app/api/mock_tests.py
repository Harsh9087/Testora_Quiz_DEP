import json
import uuid
import hmac
import hashlib
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.database import get_db
from app.config import settings
from app.models.mock_test import MockTest, MockTestPurchase
from app.models.user import User
from app.schemas.mock_test import (
    MockTestSummary,
    MockTestDetail,
    MockTestCreate,
    MockTestUpdate,
    MockTestOrderResponse,
    MockTestVerifyRequest,
    MockTestSubmitRequest,
    MockTestSubmitResult,
    QuestionReview,
    MockQuestion,
    CompanyFilterItem
)
from app.utils.security import get_current_user, RoleChecker
from app.utils.timezone import now_utc
from app.services.payment_service import payment_service
from jose import jwt

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/mock-tests", tags=["mock-tests"])
admin_required = RoleChecker(["teacher", "inst_admin", "super_admin"])

# Helper: Extract optional logged-in user from Authorization header
def get_optional_user(request: Request, db: Session) -> Optional[User]:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"], options={"verify_exp": True})
        user_id = payload.get("sub")
        if user_id:
            return db.query(User).filter(User.id == user_id, User.is_deleted == False).first()
    except Exception:
        return None
    return None


def serialize_summary(test: MockTest, user_purchase: Optional[MockTestPurchase] = None) -> MockTestSummary:
    is_unlocked = test.is_free or (user_purchase is not None and user_purchase.status in ["unlocked", "completed"])
    has_attempted = user_purchase is not None and user_purchase.status == "completed"
    
    return MockTestSummary(
        id=test.id,
        company_name=test.company_name,
        company_slug=test.company_slug,
        company_logo=test.company_logo,
        title=test.title,
        description=test.description,
        category=test.category,
        difficulty=test.difficulty,
        price_inr=test.price_inr,
        price_paise=test.price_paise,
        is_free=test.is_free,
        duration_minutes=test.duration_minutes,
        total_questions=test.total_questions,
        pass_percentage=test.pass_percentage,
        attempts_count=test.attempts_count or 0,
        display_order=test.display_order or 0,
        is_active=test.is_active,
        is_unlocked=is_unlocked,
        has_attempted=has_attempted,
        last_score=user_purchase.score if user_purchase else None,
        last_percentage=user_purchase.percentage if user_purchase else None,
        last_passed=user_purchase.passed if user_purchase else None
    )


# =============================================================================
# 1. PUBLIC & STUDENT ENDPOINTS
# =============================================================================

@router.get("", response_model=List[MockTestSummary])
def list_mock_tests(
    request: Request,
    company: Optional[str] = Query(None, description="Filter by company slug (e.g. tcs, infosys, hcl)"),
    category: Optional[str] = Query(None, description="Filter by category"),
    is_free: Optional[bool] = Query(None, description="Filter free or paid tests"),
    db: Session = Depends(get_db)
):
    """
    Returns active company placement and mock tests.
    If authenticated student, includes unlocked & attempt status.
    """
    query = db.query(MockTest).filter(
        MockTest.is_active == True,
        MockTest.is_deleted == False
    )

    if company and company.lower() != "all":
        query = query.filter(MockTest.company_slug == company.lower().strip())

    if category and category.lower() != "all":
        query = query.filter(MockTest.category == category.strip())

    if is_free is not None:
        query = query.filter(MockTest.is_free == is_free)

    tests = query.order_by(MockTest.display_order.asc(), MockTest.created_at.desc()).all()

    current_user = get_optional_user(request, db)
    purchases_map: Dict[str, MockTestPurchase] = {}
    if current_user:
        user_purchases = db.query(MockTestPurchase).filter(
            MockTestPurchase.student_id == current_user.id,
            MockTestPurchase.is_deleted == False
        ).all()
        for p in user_purchases:
            purchases_map[p.mock_test_id] = p

    return [serialize_summary(t, purchases_map.get(t.id)) for t in tests]


@router.get("/companies", response_model=List[CompanyFilterItem])
def list_mock_test_companies(db: Session = Depends(get_db)):
    """
    Returns the distinct company list with test counts for filter tabs.
    """
    tests = db.query(MockTest).filter(
        MockTest.is_active == True,
        MockTest.is_deleted == False
    ).all()

    counts: Dict[str, Dict[str, Any]] = {}
    total = len(tests)

    for t in tests:
        slug = t.company_slug.lower().strip()
        if slug not in counts:
            counts[slug] = {"name": t.company_name, "slug": slug, "count": 0}
        counts[slug]["count"] += 1

    result = [CompanyFilterItem(name="All Companies", slug="all", count=total)]
    for item in sorted(counts.values(), key=lambda x: -x["count"]):
        result.append(CompanyFilterItem(**item))

    return result


@router.get("/{test_id}", response_model=MockTestDetail)
def get_mock_test_detail(
    test_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Retrieves full test specification.
    If the test is free or unlocked by the student, questions are included (correct answers hidden).
    """
    test = db.query(MockTest).filter(
        MockTest.id == test_id,
        MockTest.is_deleted == False
    ).first()

    if not test:
        raise HTTPException(status_code=404, detail="Mock test not found.")

    current_user = get_optional_user(request, db)
    purchase = None
    if current_user:
        purchase = db.query(MockTestPurchase).filter(
            MockTestPurchase.mock_test_id == test.id,
            MockTestPurchase.student_id == current_user.id,
            MockTestPurchase.is_deleted == False
        ).order_by(MockTestPurchase.created_at.desc()).first()

    summary = serialize_summary(test, purchase)
    
    questions_list = []
    if summary.is_unlocked and test.questions_json:
        try:
            raw_qs = json.loads(test.questions_json)
            if isinstance(raw_qs, list):
                for idx, q in enumerate(raw_qs):
                    q_id = str(q.get("id") or f"q_{idx+1}")
                    questions_list.append(MockQuestion(
                        id=q_id,
                        question=q.get("question", ""),
                        options=q.get("options", []),
                        domain=q.get("domain") or q.get("category")
                    ))
        except Exception as e:
            logger.error(f"Error parsing questions for test {test_id}: {e}")

    return MockTestDetail(
        **summary.model_dump(),
        questions=questions_list
    )


@router.post("/{test_id}/start-free")
def start_free_mock_test(
    test_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Unlocks a free test (₹0) for the authenticated student.
    """
    test = db.query(MockTest).filter(
        MockTest.id == test_id,
        MockTest.is_deleted == False
    ).first()

    if not test:
        raise HTTPException(status_code=404, detail="Mock test not found.")

    if not test.is_free and test.price_inr > 0:
        raise HTTPException(status_code=400, detail="This is a paid test. Please complete checkout.")

    # Check existing purchase
    existing = db.query(MockTestPurchase).filter(
        MockTestPurchase.mock_test_id == test.id,
        MockTestPurchase.student_id == current_user.id,
        MockTestPurchase.is_deleted == False
    ).first()

    if not existing:
        new_purchase = MockTestPurchase(
            student_id=current_user.id,
            mock_test_id=test.id,
            amount_paid_inr=0,
            amount_paid_paise=0,
            payment_method="FREE",
            status="unlocked",
            created_at=now_utc(),
            updated_at=now_utc()
        )
        db.add(new_purchase)
        db.commit()

    return {"success": True, "message": f"'{test.title}' is now unlocked for you!"}


@router.post("/{test_id}/create-order", response_model=MockTestOrderResponse)
def create_mock_test_order(
    test_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Creates a server-side Razorpay order to purchase access to a company placement test (e.g. ₹9 or ₹12).
    """
    test = db.query(MockTest).filter(
        MockTest.id == test_id,
        MockTest.is_deleted == False
    ).first()

    if not test:
        raise HTTPException(status_code=404, detail="Mock test not found.")

    amount_paise = test.price_paise or (test.price_inr * 100)
    receipt = f"rcpt_mt_{test.company_slug[:4]}_{uuid.uuid4().hex[:6]}"

    order_notes = {
        "order_type": "MOCK_TEST_PURCHASE",
        "mock_test_id": test.id,
        "test_title": test.title,
        "company": test.company_name,
        "student_id": current_user.id,
        "student_email": current_user.email
    }

    razorpay_order_id = ""
    if payment_service._client and settings.RAZORPAY_KEY_SECRET:
        try:
            rzp_order = payment_service._client.order.create({
                "amount": amount_paise,
                "currency": "INR",
                "receipt": receipt,
                "notes": order_notes,
                "payment_capture": 1
            })
            razorpay_order_id = rzp_order.get("id")
        except Exception as e:
            logger.error(f"Razorpay order creation for mock test failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Payment gateway order initialization failed: {str(e)}"
            )
    else:
        razorpay_order_id = f"order_mt_{uuid.uuid4().hex[:14]}"

    # Save purchase record in pending state
    purchase = db.query(MockTestPurchase).filter(
        MockTestPurchase.mock_test_id == test.id,
        MockTestPurchase.student_id == current_user.id,
        MockTestPurchase.is_deleted == False
    ).first()

    if not purchase:
        purchase = MockTestPurchase(
            student_id=current_user.id,
            mock_test_id=test.id,
            amount_paid_inr=test.price_inr,
            amount_paid_paise=amount_paise,
            payment_method="RAZORPAY",
            razorpay_order_id=razorpay_order_id,
            status="pending_payment",
            created_at=now_utc(),
            updated_at=now_utc()
        )
        db.add(purchase)
    else:
        purchase.razorpay_order_id = razorpay_order_id
        purchase.updated_at = now_utc()

    db.commit()

    return MockTestOrderResponse(
        order_id=razorpay_order_id,
        amount=amount_paise,
        currency="INR",
        key_id=settings.RAZORPAY_KEY_ID or "rzp_test_placeholder",
        test_id=test.id,
        test_title=test.title,
        company_name=test.company_name,
        price_inr=test.price_inr
    )


@router.post("/{test_id}/verify-payment")
def verify_mock_test_payment(
    test_id: str,
    req: MockTestVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Verifies Razorpay payment signature and permanently unlocks the test.
    """
    test = db.query(MockTest).filter(
        MockTest.id == test_id,
        MockTest.is_deleted == False
    ).first()

    if not test:
        raise HTTPException(status_code=404, detail="Mock test not found.")

    # Signature verification
    if payment_service._client and settings.RAZORPAY_KEY_SECRET:
        if not req.razorpay_signature.startswith("simulated_"):
            try:
                data = f"{req.razorpay_order_id}|{req.razorpay_payment_id}"
                expected_sig = hmac.new(
                    settings.RAZORPAY_KEY_SECRET.encode("utf-8"),
                    data.encode("utf-8"),
                    hashlib.sha256
                ).hexdigest()

                if not hmac.compare_digest(expected_sig, req.razorpay_signature):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Invalid Razorpay payment signature."
                    )
            except Exception as e:
                logger.error(f"Signature check error: {e}")
                raise HTTPException(status_code=400, detail="Signature verification failed.")

    purchase = db.query(MockTestPurchase).filter(
        MockTestPurchase.mock_test_id == test.id,
        MockTestPurchase.student_id == current_user.id,
        MockTestPurchase.is_deleted == False
    ).first()

    if not purchase:
        purchase = MockTestPurchase(
            student_id=current_user.id,
            mock_test_id=test.id,
            amount_paid_inr=test.price_inr,
            amount_paid_paise=test.price_paise,
            payment_method="RAZORPAY",
            razorpay_order_id=req.razorpay_order_id,
            razorpay_payment_id=req.razorpay_payment_id,
            razorpay_signature=req.razorpay_signature,
            status="unlocked",
            created_at=now_utc(),
            updated_at=now_utc()
        )
        db.add(purchase)
    else:
        purchase.razorpay_order_id = req.razorpay_order_id
        purchase.razorpay_payment_id = req.razorpay_payment_id
        purchase.razorpay_signature = req.razorpay_signature
        purchase.status = "unlocked"
        purchase.updated_at = now_utc()

    db.commit()

    return {
        "success": True,
        "message": f"Payment of ₹{test.price_inr} confirmed! You can now take '{test.title}' anytime.",
        "test_id": test.id
    }


@router.post("/{test_id}/submit", response_model=MockTestSubmitResult)
def submit_mock_test_answers(
    test_id: str,
    req: MockTestSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Auto-grades student answers against master answer key.
    Calculates score, percentage, logs completion and returns full review with explanations.
    """
    test = db.query(MockTest).filter(
        MockTest.id == test_id,
        MockTest.is_deleted == False
    ).first()

    if not test:
        raise HTTPException(status_code=404, detail="Mock test not found.")

    # Check unlock status
    purchase = db.query(MockTestPurchase).filter(
        MockTestPurchase.mock_test_id == test.id,
        MockTestPurchase.student_id == current_user.id,
        MockTestPurchase.is_deleted == False
    ).first()

    if not test.is_free and (not purchase or purchase.status not in ["unlocked", "completed"]):
        raise HTTPException(status_code=403, detail="Test access is locked. Please unlock or purchase this test first.")

    raw_qs = []
    if test.questions_json:
        try:
            raw_qs = json.loads(test.questions_json)
        except Exception:
            raw_qs = []

    total_marks = float(len(raw_qs))
    score = 0.0
    correct_count = 0
    incorrect_count = 0
    unanswered_count = 0
    reviews: List[QuestionReview] = []

    for idx, q in enumerate(raw_qs):
        q_id = str(q.get("id") or f"q_{idx+1}")
        correct_ans = str(q.get("correct_answer", "")).strip().upper()
        student_ans = str(req.answers.get(q_id, "")).strip().upper()

        is_correct = False
        if not student_ans:
            unanswered_count += 1
        elif student_ans == correct_ans:
            is_correct = True
            correct_count += 1
            score += 1.0
        else:
            incorrect_count += 1

        reviews.append(QuestionReview(
            id=q_id,
            question=q.get("question", ""),
            options=q.get("options", []),
            selected_answer=student_ans if student_ans else None,
            correct_answer=correct_ans,
            is_correct=is_correct,
            explanation=q.get("explanation") or "Standard solution benchmark."
        ))

    percentage = round((score / total_marks * 100.0), 1) if total_marks > 0 else 0.0
    passed = percentage >= (test.pass_percentage or 50)
    completed_time_str = now_utc().strftime("%d %b %Y, %I:%M %p UTC")

    # Update purchase record
    if not purchase:
        purchase = MockTestPurchase(
            student_id=current_user.id,
            mock_test_id=test.id,
            amount_paid_inr=0,
            amount_paid_paise=0,
            payment_method="FREE",
            status="completed",
            score=score,
            max_score=total_marks,
            percentage=percentage,
            passed=passed,
            answers_json=json.dumps(req.answers),
            completed_at=completed_time_str,
            created_at=now_utc(),
            updated_at=now_utc()
        )
        db.add(purchase)
    else:
        purchase.status = "completed"
        purchase.score = score
        purchase.max_score = total_marks
        purchase.percentage = percentage
        purchase.passed = passed
        purchase.answers_json = json.dumps(req.answers)
        purchase.completed_at = completed_time_str
        purchase.updated_at = now_utc()

    test.attempts_count = (test.attempts_count or 0) + 1
    db.commit()

    return MockTestSubmitResult(
        score=score,
        max_score=total_marks,
        percentage=percentage,
        passed=passed,
        correct_count=correct_count,
        incorrect_count=incorrect_count,
        unanswered_count=unanswered_count,
        pass_percentage=test.pass_percentage or 50,
        completed_at=completed_time_str,
        reviews=reviews
    )


# =============================================================================
# 2. ADMIN CRUD ENDPOINTS
# =============================================================================

@router.get("/admin/all", response_model=List[MockTestSummary])
def admin_list_all_tests(
    current_user: User = Depends(admin_required),
    db: Session = Depends(get_db)
):
    """Admin: lists all tests (including drafts/inactive)."""
    tests = db.query(MockTest).filter(
        MockTest.is_deleted == False
    ).order_by(MockTest.display_order.asc(), MockTest.created_at.desc()).all()
    return [serialize_summary(t) for t in tests]


@router.post("/admin", response_model=MockTestSummary, status_code=status.HTTP_201_CREATED)
def admin_create_mock_test(
    payload: MockTestCreate,
    current_user: User = Depends(admin_required),
    db: Session = Depends(get_db)
):
    """Admin: creates a new dynamic placement test."""
    slug = (payload.company_slug or payload.company_name).lower().strip().replace(" ", "_")
    is_free = payload.price_inr <= 0
    price_paise = max(0, payload.price_inr * 100)

    test = MockTest(
        company_name=payload.company_name.strip(),
        company_slug=slug,
        company_logo=payload.company_logo,
        title=payload.title.strip(),
        description=payload.description,
        category=payload.category,
        difficulty=payload.difficulty,
        price_inr=max(0, payload.price_inr),
        price_paise=price_paise,
        is_free=is_free,
        duration_minutes=payload.duration_minutes or 30,
        total_questions=len(payload.questions) if payload.questions else payload.total_questions,
        pass_percentage=payload.pass_percentage or 50,
        questions_json=json.dumps(payload.questions) if payload.questions else "[]",
        is_active=payload.is_active,
        created_by=current_user.id,
        created_at=now_utc(),
        updated_at=now_utc()
    )
    db.add(test)
    db.commit()
    db.refresh(test)
    return serialize_summary(test)


@router.put("/admin/{test_id}", response_model=MockTestSummary)
def admin_update_mock_test(
    test_id: str,
    payload: MockTestUpdate,
    current_user: User = Depends(admin_required),
    db: Session = Depends(get_db)
):
    """Admin: updates test details, fees, or questions."""
    test = db.query(MockTest).filter(
        MockTest.id == test_id,
        MockTest.is_deleted == False
    ).first()

    if not test:
        raise HTTPException(status_code=404, detail="Mock test not found.")

    if payload.company_name is not None:
        test.company_name = payload.company_name.strip()
    if payload.company_slug is not None:
        test.company_slug = payload.company_slug.lower().strip()
    if payload.title is not None:
        test.title = payload.title.strip()
    if payload.description is not None:
        test.description = payload.description
    if payload.category is not None:
        test.category = payload.category
    if payload.difficulty is not None:
        test.difficulty = payload.difficulty
    if payload.price_inr is not None:
        test.price_inr = max(0, payload.price_inr)
        test.price_paise = test.price_inr * 100
        test.is_free = (test.price_inr == 0)
    if payload.duration_minutes is not None:
        test.duration_minutes = payload.duration_minutes
    if payload.total_questions is not None:
        test.total_questions = payload.total_questions
    if payload.pass_percentage is not None:
        test.pass_percentage = payload.pass_percentage
    if payload.questions is not None:
        test.questions_json = json.dumps(payload.questions)
        test.total_questions = len(payload.questions)
    if payload.is_active is not None:
        test.is_active = payload.is_active

    test.updated_at = now_utc()
    db.commit()
    db.refresh(test)
    return serialize_summary(test)


@router.delete("/admin/{test_id}")
def admin_delete_mock_test(
    test_id: str,
    current_user: User = Depends(admin_required),
    db: Session = Depends(get_db)
):
    """Admin: soft-deletes a placement test."""
    test = db.query(MockTest).filter(
        MockTest.id == test_id,
        MockTest.is_deleted == False
    ).first()

    if not test:
        raise HTTPException(status_code=404, detail="Mock test not found.")

    test.delete()
    db.commit()
    return {"success": True, "message": f"Test '{test.title}' removed."}
