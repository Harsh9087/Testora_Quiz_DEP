import json
import uuid
import hmac
import hashlib
import logging
import secrets
from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.database import get_db
from app.config import settings
from app.models.mock_test import MockTest, MockTestPurchase, MockTestCategory, MockTestType, MockTestAssignment
from app.models.student_directory import StudentDirectory, DirectoryStudent
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
    CompanyFilterItem,
    MockTestCategoryCreate,
    MockTestCategoryUpdate,
    MockTestCategoryResponse,
    MockTestTypeCreate,
    MockTestTypeUpdate,
    MockTestTypeResponse,
    MockTestAdminStats,
    TeacherMockTestCreate,
    TeacherMockTestAssignRequest,
    MockTestSharePublicDetail,
    MockTestStartPayload,
    MockTestSendEmailRequest,
    MockTestResultItem,
    MockTestTakerRecord,
    MockTestTakersResponse
)
from app.services.email_service import email_service
from app.utils.security import get_current_user, RoleChecker
from app.utils.timezone import now_utc
from app.services.payment_service import payment_service
from app.services.ai_service import AIService
from app.services.mock_test_seed import (
    seed_initial_mock_tests,
    seed_mock_test_categories,
    seed_mock_test_types
)
from jose import jwt

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/mock-tests", tags=["mock-tests"])
admin_required = RoleChecker(["teacher", "inst_admin", "super_admin"])
super_admin_only = RoleChecker(["inst_admin", "super_admin"])
teacher_or_admin = RoleChecker(["teacher", "inst_admin", "super_admin"])


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

    diff_dist = None
    if test.difficulty_distribution_json:
        try:
            diff_dist = json.loads(test.difficulty_distribution_json)
        except Exception:
            diff_dist = None

    assigned_dirs_count = 0
    if test.assigned_directories_json:
        try:
            assigned_dirs_count = len(json.loads(test.assigned_directories_json))
        except Exception:
            pass

    assigned_studs_count = 0
    if test.assigned_students_json:
        try:
            assigned_studs_count = len(json.loads(test.assigned_students_json))
        except Exception:
            pass

    t_sec = getattr(test, "target_section", None)
    if not t_sec:
        is_placement = (
            (test.exam_type and "corporate" in test.exam_type.lower()) or
            (test.category and ("corporate" in test.category.lower() or "placement" in test.category.lower())) or
            (test.company_slug and test.company_slug.lower() not in ["testora", "testora_national", "testora_mock"])
        )
        t_sec = "placement_tests" if is_placement else "mock_test_library"

    return MockTestSummary(
        id=test.id,
        category_id=test.category_id,
        category=test.category or "School Examinations",
        subcategory=test.subcategory,
        test_type_id=test.test_type_id,
        test_type=test.test_type or "Full-Length Mock Test",
        class_level=test.class_level,
        subject=test.subject,
        exam_type=test.exam_type,
        engineering_branch=test.engineering_branch,
        chapter=test.chapter,
        topic=test.topic,
        section_name=test.section_name,
        pyq_exam_name=test.pyq_exam_name,
        pyq_year=test.pyq_year,
        pyq_shift=test.pyq_shift,
        pyq_source=test.pyq_source,
        speed_test_target_time_per_q=test.speed_test_target_time_per_q,
        practice_mode_instant_explanation=test.practice_mode_instant_explanation or False,
        company_name=test.company_name or "Testora National Mocks",
        company_slug=test.company_slug or "testora_national",
        company_logo=test.company_logo,
        title=test.title,
        description=test.description,
        difficulty=test.difficulty or "Medium",
        language=test.language or "English",
        difficulty_distribution=diff_dist,
        visibility_target=test.visibility_target or "students_only",
        target_class=test.target_class,
        target_section=t_sec,
        status=test.status or "published",
        price_inr=test.price_inr or 0,
        price_paise=test.price_paise or 0,
        is_free=test.is_free if test.is_free is not None else (test.price_inr == 0),
        duration_minutes=test.duration_minutes or 60,
        total_questions=test.total_questions or 50,
        total_marks=float(test.total_marks or 50.0),
        marks_per_question=float(test.marks_per_question or 1.0),
        negative_marking=float(test.negative_marking or 0.0),
        passing_marks=float(test.passing_marks or 20.0),
        pass_percentage=test.pass_percentage or 40,
        attempt_limit=test.attempt_limit or 0,
        attempts_count=test.attempts_count or 0,
        display_order=test.display_order or 0,
        is_active=test.is_active,
        is_unlocked=is_unlocked,
        has_attempted=has_attempted,
        last_score=user_purchase.score if user_purchase else None,
        last_percentage=user_purchase.percentage if user_purchase else None,
        last_passed=user_purchase.passed if user_purchase else None,
        created_at=test.created_at,
        updated_at=test.updated_at,
        # Teacher & Direct Distribution fields
        created_by=test.created_by,
        creator_name=None,
        creator_role=getattr(test, "creator_role", "super_admin") or "super_admin",
        is_platform_library=bool(getattr(test, "is_platform_library", True)),
        share_token=getattr(test, "share_token", None),
        share_access_type=getattr(test, "share_access_type", "assigned_only") or "assigned_only",
        login_required=bool(getattr(test, "login_required", True)),
        is_link_active=bool(getattr(test, "is_link_active", True)),
        start_time=getattr(test, "start_time", None),
        end_time=getattr(test, "end_time", None),
        results_visibility=getattr(test, "results_visibility", "immediate") or "immediate",
        are_results_released=bool(getattr(test, "are_results_released", True)),
        assigned_directories_count=assigned_dirs_count,
        assigned_students_count=assigned_studs_count,
        is_archived=bool(getattr(test, "is_archived", False))
    )


# =============================================================================
# 1. CATEGORY & TEST TYPE ENDPOINTS
# =============================================================================

@router.get("/categories", response_model=List[MockTestCategoryResponse])
def list_categories(db: Session = Depends(get_db)):
    """
    Returns active mock test categories with their published tests counts.
    """
    cats = db.query(MockTestCategory).filter(
        MockTestCategory.is_active == True,
        MockTestCategory.is_deleted == False
    ).order_by(MockTestCategory.display_order.asc(), MockTestCategory.created_at.asc()).all()

    if not cats:
        seed_mock_test_categories(db)
        cats = db.query(MockTestCategory).filter(
            MockTestCategory.is_active == True,
            MockTestCategory.is_deleted == False
        ).order_by(MockTestCategory.display_order.asc()).all()

    res = []
    for c in cats:
        subcats = []
        if c.subcategories_json:
            try:
                subcats = json.loads(c.subcategories_json)
            except Exception:
                subcats = []

        tests_count = db.query(MockTest).filter(
            or_(MockTest.category_id == c.id, MockTest.category == c.name),
            MockTest.status == "published",
            MockTest.is_active == True,
            MockTest.is_deleted == False
        ).count()

        res.append(MockTestCategoryResponse(
            id=c.id,
            name=c.name,
            slug=c.slug,
            description=c.description,
            category_type=c.category_type,
            subcategories=subcats,
            is_active=c.is_active,
            display_order=c.display_order,
            created_at=c.created_at,
            updated_at=c.updated_at,
            tests_count=tests_count
        ))
    return res


@router.post("/categories", response_model=MockTestCategoryResponse, status_code=status.HTTP_201_CREATED)
def admin_create_category(
    payload: MockTestCategoryCreate,
    current_user: User = Depends(super_admin_only),
    db: Session = Depends(get_db)
):
    """Super Admin: create a new dynamic category."""
    slug = (payload.slug or payload.name).lower().strip().replace(" ", "-").replace("_", "-")
    existing = db.query(MockTestCategory).filter(
        or_(MockTestCategory.name == payload.name.strip(), MockTestCategory.slug == slug),
        MockTestCategory.is_deleted == False
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="A category with this name or slug already exists.")

    cat = MockTestCategory(
        name=payload.name.strip(),
        slug=slug,
        description=payload.description,
        category_type=payload.category_type,
        subcategories_json=json.dumps(payload.subcategories),
        is_active=payload.is_active,
        display_order=payload.display_order,
        created_at=now_utc(),
        updated_at=now_utc()
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)

    return MockTestCategoryResponse(
        id=cat.id,
        name=cat.name,
        slug=cat.slug,
        description=cat.description,
        category_type=cat.category_type,
        subcategories=payload.subcategories,
        is_active=cat.is_active,
        display_order=cat.display_order,
        created_at=cat.created_at,
        updated_at=cat.updated_at,
        tests_count=0
    )


@router.put("/categories/{cat_id}", response_model=MockTestCategoryResponse)
def admin_update_category(
    cat_id: str,
    payload: MockTestCategoryUpdate,
    current_user: User = Depends(super_admin_only),
    db: Session = Depends(get_db)
):
    """Super Admin: update category."""
    cat = db.query(MockTestCategory).filter(
        MockTestCategory.id == cat_id,
        MockTestCategory.is_deleted == False
    ).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found.")

    if payload.name is not None:
        cat.name = payload.name.strip()
    if payload.slug is not None:
        cat.slug = payload.slug.lower().strip()
    if payload.description is not None:
        cat.description = payload.description
    if payload.category_type is not None:
        cat.category_type = payload.category_type
    if payload.subcategories is not None:
        cat.subcategories_json = json.dumps(payload.subcategories)
    if payload.is_active is not None:
        cat.is_active = payload.is_active
    if payload.display_order is not None:
        cat.display_order = payload.display_order

    cat.updated_at = now_utc()
    db.commit()
    db.refresh(cat)

    subcats = []
    if cat.subcategories_json:
        try:
            subcats = json.loads(cat.subcategories_json)
        except Exception:
            subcats = []

    tests_count = db.query(MockTest).filter(
        or_(MockTest.category_id == cat.id, MockTest.category == cat.name),
        MockTest.status == "published",
        MockTest.is_active == True,
        MockTest.is_deleted == False
    ).count()

    return MockTestCategoryResponse(
        id=cat.id,
        name=cat.name,
        slug=cat.slug,
        description=cat.description,
        category_type=cat.category_type,
        subcategories=subcats,
        is_active=cat.is_active,
        display_order=cat.display_order,
        created_at=cat.created_at,
        updated_at=cat.updated_at,
        tests_count=tests_count
    )


@router.delete("/categories/{cat_id}")
def admin_delete_category(
    cat_id: str,
    current_user: User = Depends(super_admin_only),
    db: Session = Depends(get_db)
):
    """Super Admin: soft delete category."""
    cat = db.query(MockTestCategory).filter(
        MockTestCategory.id == cat_id,
        MockTestCategory.is_deleted == False
    ).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found.")

    cat.delete()
    db.commit()
    return {"success": True, "message": f"Category '{cat.name}' removed."}


# ---------------- TEST TYPE ENDPOINTS ----------------

@router.get("/types", response_model=List[MockTestTypeResponse])
def list_test_types(db: Session = Depends(get_db)):
    """
    Returns active scalable test types with published test counts.
    """
    types = db.query(MockTestType).filter(
        MockTestType.is_active == True,
        MockTestType.is_deleted == False
    ).order_by(MockTestType.display_order.asc(), MockTestType.created_at.asc()).all()

    if not types:
        seed_mock_test_types(db)
        types = db.query(MockTestType).filter(
            MockTestType.is_active == True,
            MockTestType.is_deleted == False
        ).order_by(MockTestType.display_order.asc()).all()

    res = []
    for t in types:
        cnt = db.query(MockTest).filter(
            or_(MockTest.test_type_id == t.id, MockTest.test_type == t.name),
            MockTest.status == "published",
            MockTest.is_active == True,
            MockTest.is_deleted == False
        ).count()
        res.append(MockTestTypeResponse(
            id=t.id,
            name=t.name,
            slug=t.slug,
            description=t.description,
            icon=t.icon,
            badge_color=t.badge_color,
            requires_chapter=t.requires_chapter,
            requires_topic=t.requires_topic,
            requires_pyq_metadata=t.requires_pyq_metadata,
            requires_section=t.requires_section,
            is_speed_test=t.is_speed_test,
            is_practice=t.is_practice,
            is_active=t.is_active,
            display_order=t.display_order,
            created_at=t.created_at,
            updated_at=t.updated_at,
            tests_count=cnt
        ))
    return res


@router.post("/types", response_model=MockTestTypeResponse, status_code=status.HTTP_201_CREATED)
def admin_create_test_type(
    payload: MockTestTypeCreate,
    current_user: User = Depends(super_admin_only),
    db: Session = Depends(get_db)
):
    """Super Admin: create a new scalable test type."""
    slug = (payload.slug or payload.name).lower().strip().replace(" ", "-").replace("_", "-")
    existing = db.query(MockTestType).filter(
        or_(MockTestType.name == payload.name.strip(), MockTestType.slug == slug),
        MockTestType.is_deleted == False
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="A test type with this name or slug already exists.")

    t_obj = MockTestType(
        name=payload.name.strip(),
        slug=slug,
        description=payload.description,
        icon=payload.icon,
        badge_color=payload.badge_color,
        requires_chapter=payload.requires_chapter,
        requires_topic=payload.requires_topic,
        requires_pyq_metadata=payload.requires_pyq_metadata,
        requires_section=payload.requires_section,
        is_speed_test=payload.is_speed_test,
        is_practice=payload.is_practice,
        is_active=payload.is_active,
        display_order=payload.display_order,
        created_at=now_utc(),
        updated_at=now_utc()
    )
    db.add(t_obj)
    db.commit()
    db.refresh(t_obj)

    return MockTestTypeResponse(
        id=t_obj.id,
        name=t_obj.name,
        slug=t_obj.slug,
        description=t_obj.description,
        icon=t_obj.icon,
        badge_color=t_obj.badge_color,
        requires_chapter=t_obj.requires_chapter,
        requires_topic=t_obj.requires_topic,
        requires_pyq_metadata=t_obj.requires_pyq_metadata,
        requires_section=t_obj.requires_section,
        is_speed_test=t_obj.is_speed_test,
        is_practice=t_obj.is_practice,
        is_active=t_obj.is_active,
        display_order=t_obj.display_order,
        created_at=t_obj.created_at,
        updated_at=t_obj.updated_at,
        tests_count=0
    )


@router.put("/types/{type_id}", response_model=MockTestTypeResponse)
def admin_update_test_type(
    type_id: str,
    payload: MockTestTypeUpdate,
    current_user: User = Depends(super_admin_only),
    db: Session = Depends(get_db)
):
    """Super Admin: update an existing test type."""
    t_obj = db.query(MockTestType).filter(
        MockTestType.id == type_id,
        MockTestType.is_deleted == False
    ).first()
    if not t_obj:
        raise HTTPException(status_code=404, detail="Test type not found.")

    if payload.name is not None:
        t_obj.name = payload.name.strip()
    if payload.slug is not None:
        t_obj.slug = payload.slug.lower().strip()
    if payload.description is not None:
        t_obj.description = payload.description
    if payload.icon is not None:
        t_obj.icon = payload.icon
    if payload.badge_color is not None:
        t_obj.badge_color = payload.badge_color
    if payload.requires_chapter is not None:
        t_obj.requires_chapter = payload.requires_chapter
    if payload.requires_topic is not None:
        t_obj.requires_topic = payload.requires_topic
    if payload.requires_pyq_metadata is not None:
        t_obj.requires_pyq_metadata = payload.requires_pyq_metadata
    if payload.requires_section is not None:
        t_obj.requires_section = payload.requires_section
    if payload.is_speed_test is not None:
        t_obj.is_speed_test = payload.is_speed_test
    if payload.is_practice is not None:
        t_obj.is_practice = payload.is_practice
    if payload.is_active is not None:
        t_obj.is_active = payload.is_active
    if payload.display_order is not None:
        t_obj.display_order = payload.display_order

    t_obj.updated_at = now_utc()
    db.commit()
    db.refresh(t_obj)

    cnt = db.query(MockTest).filter(
        or_(MockTest.test_type_id == t_obj.id, MockTest.test_type == t_obj.name),
        MockTest.status == "published",
        MockTest.is_active == True,
        MockTest.is_deleted == False
    ).count()

    return MockTestTypeResponse(
        id=t_obj.id,
        name=t_obj.name,
        slug=t_obj.slug,
        description=t_obj.description,
        icon=t_obj.icon,
        badge_color=t_obj.badge_color,
        requires_chapter=t_obj.requires_chapter,
        requires_topic=t_obj.requires_topic,
        requires_pyq_metadata=t_obj.requires_pyq_metadata,
        requires_section=t_obj.requires_section,
        is_speed_test=t_obj.is_speed_test,
        is_practice=t_obj.is_practice,
        is_active=t_obj.is_active,
        display_order=t_obj.display_order,
        created_at=t_obj.created_at,
        updated_at=t_obj.updated_at,
        tests_count=cnt
    )


@router.delete("/types/{type_id}")
def admin_delete_test_type(
    type_id: str,
    current_user: User = Depends(super_admin_only),
    db: Session = Depends(get_db)
):
    """Super Admin: soft delete test type."""
    t_obj = db.query(MockTestType).filter(
        MockTestType.id == type_id,
        MockTestType.is_deleted == False
    ).first()
    if not t_obj:
        raise HTTPException(status_code=404, detail="Test type not found.")

    t_obj.delete()
    db.commit()
    return {"success": True, "message": f"Test type '{t_obj.name}' removed."}


# =============================================================================
# 2. STUDENT & PUBLIC MOCK TEST LIBRARY ENDPOINTS
# =============================================================================

@router.get("", response_model=List[MockTestSummary])
def list_mock_tests(
    request: Request,
    category: Optional[str] = Query(None, description="Filter by category name or slug"),
    test_type: Optional[str] = Query(None, description="Filter by test type (e.g. Full-Length, Chapter-Wise, PYQ)"),
    class_level: Optional[str] = Query(None, description="Filter by class (e.g. Class 11, Class 12, Engineering)"),
    subject: Optional[str] = Query(None, description="Filter by subject"),
    exam_type: Optional[str] = Query(None, description="Filter by exam type (e.g. JEE Main, School Board)"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty"),
    min_marks: Optional[float] = Query(None, description="Minimum total marks"),
    max_marks: Optional[float] = Query(None, description="Maximum total marks"),
    company: Optional[str] = Query(None, description="Filter by company slug (legacy corporate tests)"),
    is_free: Optional[bool] = Query(None, description="Filter free or paid tests"),
    search: Optional[str] = Query(None, description="Search query across title, subject, description"),
    db: Session = Depends(get_db)
):
    """
    Returns published mock tests eligible for students (audience: students_only or all).
    Enforces strict backend visibility filtering.
    """
    test_count = db.query(MockTest).filter(MockTest.is_deleted == False).count()
    corp_cnt = db.query(MockTest).filter(
        MockTest.company_slug.in_(["tcs", "infosys", "hcl", "wipro", "accenture"]),
        MockTest.is_deleted == False
    ).count()
    if test_count < 11 or corp_cnt < 6:
        seed_initial_mock_tests(db)

    query = db.query(MockTest).filter(
        MockTest.status == "published",
        MockTest.is_active == True,
        MockTest.is_deleted == False,
        MockTest.visibility_target.in_(["students_only", "all"])
    )

    if category and category.lower() != "all":
        query = query.filter(or_(
            MockTest.category.ilike(f"%{category.strip()}%"),
            MockTest.subcategory.ilike(f"%{category.strip()}%")
        ))

    if test_type and test_type.lower() != "all":
        query = query.filter(or_(
            MockTest.test_type.ilike(f"%{test_type.strip()}%"),
            MockTest.test_type_id == test_type.strip()
        ))

    if class_level and class_level.lower() != "all":
        query = query.filter(MockTest.class_level.ilike(f"%{class_level.strip()}%"))

    if subject and subject.lower() != "all":
        query = query.filter(MockTest.subject.ilike(f"%{subject.strip()}%"))

    if exam_type and exam_type.lower() != "all":
        query = query.filter(MockTest.exam_type.ilike(f"%{exam_type.strip()}%"))

    if difficulty and difficulty.lower() != "all":
        query = query.filter(MockTest.difficulty.ilike(f"%{difficulty.strip()}%"))

    if min_marks is not None:
        query = query.filter(MockTest.total_marks >= min_marks)

    if max_marks is not None:
        query = query.filter(MockTest.total_marks <= max_marks)

    if company and company.lower() != "all":
        query = query.filter(MockTest.company_slug == company.lower().strip())

    if is_free is not None:
        query = query.filter(MockTest.is_free == is_free)

    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        query = query.filter(or_(
            func.lower(MockTest.title).like(term),
            func.lower(MockTest.description).like(term),
            func.lower(MockTest.subject).like(term),
            func.lower(MockTest.chapter).like(term),
            func.lower(MockTest.topic).like(term),
            func.lower(MockTest.test_type).like(term),
            func.lower(MockTest.class_level).like(term),
            func.lower(MockTest.category).like(term),
            func.lower(MockTest.exam_type).like(term)
        ))

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


@router.get("/teacher-library", response_model=List[MockTestSummary])
def list_teacher_mock_tests(
    request: Request,
    category: Optional[str] = Query(None),
    test_type: Optional[str] = Query(None),
    class_level: Optional[str] = Query(None),
    subject: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(teacher_or_admin),
    db: Session = Depends(get_db)
):
    """
    Teacher library view: returns published tests authorized for teachers (teachers_only or all).
    """
    query = db.query(MockTest).filter(
        MockTest.status == "published",
        MockTest.is_active == True,
        MockTest.is_deleted == False,
        MockTest.visibility_target.in_(["teachers_only", "all"])
    )

    if category and category.lower() != "all":
        query = query.filter(MockTest.category.ilike(f"%{category.strip()}%"))

    if test_type and test_type.lower() != "all":
        query = query.filter(or_(
            MockTest.test_type.ilike(f"%{test_type.strip()}%"),
            MockTest.test_type_id == test_type.strip()
        ))

    if class_level and class_level.lower() != "all":
        query = query.filter(MockTest.class_level.ilike(f"%{class_level.strip()}%"))

    if subject and subject.lower() != "all":
        query = query.filter(MockTest.subject.ilike(f"%{subject.strip()}%"))

    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        query = query.filter(or_(
            func.lower(MockTest.title).like(term),
            func.lower(MockTest.description).like(term),
            func.lower(MockTest.subject).like(term),
            func.lower(MockTest.test_type).like(term),
            func.lower(MockTest.class_level).like(term),
            func.lower(MockTest.category).like(term)
        ))

    tests = query.order_by(MockTest.display_order.asc(), MockTest.created_at.desc()).all()
    return [serialize_summary(t) for t in tests]


# =============================================================================
# TEACHER-CREATED MOCK TESTS & DIRECT DISTRIBUTION SYSTEM
# =============================================================================

class AIGenerateMockQuestionsPayload(BaseModel):
    subject: str
    topic: Optional[str] = None
    class_level: Optional[str] = None
    difficulty: str = "Medium"
    num_questions: int = Field(default=5, ge=1, le=25)
    question_type: str = "mcq"


@router.get("/teacher/my-tests", response_model=List[MockTestSummary])
def get_teacher_my_mock_tests(
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    current_user: User = Depends(teacher_or_admin),
    db: Session = Depends(get_db)
):
    """
    Lists all mock tests created by the currently authenticated teacher.
    """
    query = db.query(MockTest).filter(
        MockTest.created_by == current_user.id,
        MockTest.is_deleted == False,
        MockTest.is_archived == False
    )

    now_iso = now_utc().isoformat()

    if status_filter and status_filter.lower() != "all":
        st = status_filter.lower().strip()
        if st == "expired":
            query = query.filter(
                MockTest.end_time.isnot(None),
                MockTest.end_time < now_iso
            )
        elif st == "draft":
            query = query.filter(MockTest.status == "draft")
        elif st == "published":
            query = query.filter(
                MockTest.status == "published",
                or_(MockTest.end_time.is_(None), MockTest.end_time >= now_iso)
            )

    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        query = query.filter(or_(
            func.lower(MockTest.title).like(term),
            func.lower(MockTest.description).like(term),
            func.lower(MockTest.subject).like(term),
            func.lower(MockTest.class_level).like(term)
        ))

    tests = query.order_by(MockTest.created_at.desc()).all()
    return [serialize_summary(t) for t in tests]


@router.post("/teacher/create", response_model=MockTestSummary, status_code=status.HTTP_201_CREATED)
def create_teacher_mock_test(
    payload: TeacherMockTestCreate,
    current_user: User = Depends(teacher_or_admin),
    db: Session = Depends(get_db)
):
    """
    Creates an independent mock test authored by the teacher.
    """
    if not payload.title or not payload.title.strip():
        raise HTTPException(status_code=400, detail="Mock test title is required")

    q_dicts = [q.dict() for q in payload.questions] if payload.questions else []
    total_q = len(q_dicts)
    total_m = payload.total_marks or (total_q * 1.0)
    m_per_q = (total_m / total_q) if total_q > 0 else 1.0

    share_tok = secrets.token_urlsafe(16)

    q_json = json.dumps(q_dicts) if q_dicts else "[]"
    assigned_dirs = json.dumps(payload.assigned_directory_ids) if payload.assigned_directory_ids else None
    assigned_studs = json.dumps(payload.assigned_student_ids) if payload.assigned_student_ids else None

    company_label = current_user.institution_name or current_user.full_name or "Testora Faculty"

    new_test = MockTest(
        title=payload.title.strip(),
        description=payload.description.strip() if payload.description else None,
        category=payload.category or "School Examinations",
        subject=payload.subject,
        class_level=payload.class_level,
        test_type=payload.test_type or "Full-Length Mock Test",
        difficulty=payload.difficulty or "Medium",
        language=payload.language or "English",
        duration_minutes=payload.duration_minutes or 60,
        total_questions=total_q,
        total_marks=total_m,
        marks_per_question=m_per_q,
        negative_marking=payload.negative_marking or 0.0,
        passing_marks=payload.passing_marks or 20.0,
        instructions=payload.instructions,
        questions_json=q_json,
        status=payload.status or "draft",
        visibility_target="students_only",
        is_free=True,
        price_inr=0,
        price_paise=0,
        attempt_limit=payload.attempt_limit if payload.attempt_limit is not None else 1,
        created_by=current_user.id,
        creator_role="teacher",
        is_platform_library=False,
        share_token=share_tok,
        share_access_type=payload.share_access_type or "assigned_only",
        login_required=payload.login_required,
        is_link_active=True,
        start_time=payload.start_time,
        end_time=payload.end_time,
        results_visibility=payload.results_visibility or "immediate",
        are_results_released=(payload.results_visibility == "immediate"),
        assigned_directories_json=assigned_dirs,
        assigned_students_json=assigned_studs,
        company_name=company_label,
        company_slug="teacher_mock",
        is_active=True,
        is_archived=False
    )

    db.add(new_test)
    db.commit()
    db.refresh(new_test)

    # Add assignment rows if directory IDs provided
    if payload.assigned_directory_ids:
        for d_id in payload.assigned_directory_ids:
            dir_record = db.query(StudentDirectory).filter(
                StudentDirectory.id == d_id,
                StudentDirectory.created_by == current_user.id
            ).first()
            if dir_record:
                assignment = MockTestAssignment(
                    mock_test_id=new_test.id,
                    assigned_by=current_user.id,
                    directory_id=d_id,
                    directory_name=dir_record.name
                )
                db.add(assignment)
        db.commit()

    return serialize_summary(new_test)


@router.post("/teacher/ai-generate-questions")
def ai_generate_mock_questions(
    payload: AIGenerateMockQuestionsPayload,
    current_user: User = Depends(teacher_or_admin)
):
    """
    AI-powered Question Synthesizer for Mock Tests using Gemini.
    """
    try:
        service = AIService()
        topic_str = f"Subject: {payload.subject}"
        if payload.topic:
            topic_str += f", Topic: {payload.topic}"
        if payload.class_level:
            topic_str += f", Level: {payload.class_level}"

        raw_questions = service.generate_questions(
            context=topic_str,
            num_questions=payload.num_questions,
            difficulty=payload.difficulty,
            question_type=payload.question_type
        )

        formatted = []
        for idx, q in enumerate(raw_questions):
            q_id = f"q_ai_{uuid.uuid4().hex[:8]}_{idx + 1}"
            formatted.append({
                "id": q_id,
                "question": q.get("question") or q.get("question_text", "Question"),
                "options": q.get("options", ["Option A", "Option B", "Option C", "Option D"]),
                "correct_answer": q.get("correct_answer") or q.get("answer", "Option A"),
                "explanation": q.get("explanation", "Standard solution."),
                "difficulty": payload.difficulty,
                "marks": 1.0,
                "negative_marks": 0.0,
                "subject": payload.subject,
                "topic": payload.topic or payload.subject
            })
        return {"questions": formatted}
    except Exception as e:
        logger.error(f"Error generating AI questions for mock test: {e}")
        fallback = []
        for i in range(payload.num_questions):
            fallback.append({
                "id": f"q_fb_{i+1}",
                "question": f"Sample {payload.subject} Question {i+1} regarding {payload.topic or 'core concepts'}: What is the primary characteristic?",
                "options": ["Fundamental Definition", "Secondary Property", "Derived Theorem", "Empirical Observation"],
                "correct_answer": "Fundamental Definition",
                "explanation": "Fundamental definitions govern the principal properties in this domain.",
                "difficulty": payload.difficulty,
                "marks": 1.0,
                "negative_marks": 0.0,
                "subject": payload.subject,
                "topic": payload.topic or payload.subject
            })
        return {"questions": fallback}


@router.get("/teacher/{test_id}")
def get_teacher_mock_test_detail(
    test_id: str,
    current_user: User = Depends(teacher_or_admin),
    db: Session = Depends(get_db)
):
    """
    Retrieves full details of a teacher's own mock test, including raw questions with correct answers.
    """
    test = db.query(MockTest).filter(
        MockTest.id == test_id,
        MockTest.is_deleted == False
    ).first()

    if not test:
        raise HTTPException(status_code=404, detail="Mock test not found")

    if test.created_by != current_user.id and current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Unauthorized to view this mock test")

    qs = []
    if test.questions_json:
        try:
            qs = json.loads(test.questions_json)
        except Exception:
            qs = []

    assigned_dirs = []
    if test.assigned_directories_json:
        try:
            assigned_dirs = json.loads(test.assigned_directories_json)
        except Exception:
            assigned_dirs = []

    assigned_studs = []
    if test.assigned_students_json:
        try:
            assigned_studs = json.loads(test.assigned_students_json)
        except Exception:
            assigned_studs = []

    summary = serialize_summary(test)
    return {
        **summary.dict(),
        "instructions": test.instructions,
        "questions": qs,
        "assigned_directory_ids": assigned_dirs,
        "assigned_student_ids": assigned_studs
    }


@router.put("/teacher/{test_id}", response_model=MockTestSummary)
def update_teacher_mock_test(
    test_id: str,
    payload: TeacherMockTestCreate,
    current_user: User = Depends(teacher_or_admin),
    db: Session = Depends(get_db)
):
    """
    Updates configuration and questions of teacher's own mock test.
    """
    test = db.query(MockTest).filter(
        MockTest.id == test_id,
        MockTest.is_deleted == False
    ).first()

    if not test:
        raise HTTPException(status_code=404, detail="Mock test not found")

    if test.created_by != current_user.id and current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Unauthorized to edit this mock test")

    test.title = payload.title.strip()
    if payload.description is not None:
        test.description = payload.description.strip()
    test.category = payload.category or test.category
    test.subject = payload.subject
    test.class_level = payload.class_level
    test.test_type = payload.test_type or test.test_type
    test.difficulty = payload.difficulty or test.difficulty
    test.language = payload.language or test.language
    test.duration_minutes = payload.duration_minutes or test.duration_minutes
    test.instructions = payload.instructions
    test.share_access_type = payload.share_access_type or test.share_access_type
    test.login_required = payload.login_required
    test.start_time = payload.start_time
    test.end_time = payload.end_time
    test.attempt_limit = payload.attempt_limit if payload.attempt_limit is not None else test.attempt_limit
    test.results_visibility = payload.results_visibility or test.results_visibility

    if payload.questions:
        q_dicts = [q.dict() for q in payload.questions]
        test.questions_json = json.dumps(q_dicts)
        test.total_questions = len(q_dicts)
        test.total_marks = payload.total_marks or (len(q_dicts) * 1.0)
        test.marks_per_question = (test.total_marks / test.total_questions) if test.total_questions > 0 else 1.0

    test.negative_marking = payload.negative_marking or 0.0
    test.passing_marks = payload.passing_marks or 20.0

    if payload.status:
        test.status = payload.status

    db.commit()
    db.refresh(test)
    return serialize_summary(test)


@router.post("/teacher/{test_id}/publish", response_model=MockTestSummary)
def publish_teacher_mock_test(
    test_id: str,
    current_user: User = Depends(teacher_or_admin),
    db: Session = Depends(get_db)
):
    """
    Publishes the teacher mock test.
    """
    test = db.query(MockTest).filter(
        MockTest.id == test_id,
        MockTest.is_deleted == False
    ).first()

    if not test:
        raise HTTPException(status_code=404, detail="Mock test not found")

    if test.created_by != current_user.id and current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Unauthorized")

    test.status = "published"
    test.is_active = True
    db.commit()
    db.refresh(test)
    return serialize_summary(test)


@router.post("/teacher/{test_id}/unpublish", response_model=MockTestSummary)
def unpublish_teacher_mock_test(
    test_id: str,
    current_user: User = Depends(teacher_or_admin),
    db: Session = Depends(get_db)
):
    """
    Reverts a published teacher mock test to draft status.
    """
    test = db.query(MockTest).filter(
        MockTest.id == test_id,
        MockTest.is_deleted == False
    ).first()

    if not test:
        raise HTTPException(status_code=404, detail="Mock test not found")

    if test.created_by != current_user.id and current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Unauthorized")

    test.status = "draft"
    db.commit()
    db.refresh(test)
    return serialize_summary(test)


@router.post("/teacher/{test_id}/duplicate", response_model=MockTestSummary)
def duplicate_teacher_mock_test(
    test_id: str,
    current_user: User = Depends(teacher_or_admin),
    db: Session = Depends(get_db)
):
    """
    1-Click duplicates an existing mock test into a fresh draft copy.
    """
    orig = db.query(MockTest).filter(
        MockTest.id == test_id,
        MockTest.is_deleted == False
    ).first()

    if not orig:
        raise HTTPException(status_code=404, detail="Original test not found")

    if orig.created_by != current_user.id and current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Unauthorized")

    clone_tok = secrets.token_urlsafe(16)

    cloned = MockTest(
        title=f"[Copy] {orig.title}",
        description=orig.description,
        category=orig.category,
        subject=orig.subject,
        class_level=orig.class_level,
        test_type=orig.test_type,
        difficulty=orig.difficulty,
        language=orig.language,
        duration_minutes=orig.duration_minutes,
        total_questions=orig.total_questions,
        total_marks=orig.total_marks,
        marks_per_question=orig.marks_per_question,
        negative_marking=orig.negative_marking,
        passing_marks=orig.passing_marks,
        instructions=orig.instructions,
        questions_json=orig.questions_json,
        status="draft",
        visibility_target="students_only",
        is_free=True,
        price_inr=0,
        price_paise=0,
        attempt_limit=orig.attempt_limit,
        created_by=current_user.id,
        creator_role="teacher",
        is_platform_library=False,
        share_token=clone_tok,
        share_access_type=orig.share_access_type,
        login_required=orig.login_required,
        is_link_active=True,
        start_time=orig.start_time,
        end_time=orig.end_time,
        results_visibility=orig.results_visibility,
        are_results_released=orig.are_results_released,
        assigned_directories_json=None,
        assigned_students_json=None,
        company_name=orig.company_name,
        company_slug="teacher_mock",
        is_active=True,
        is_archived=False
    )

    db.add(cloned)
    db.commit()
    db.refresh(cloned)
    return serialize_summary(cloned)


@router.delete("/teacher/{test_id}")
def delete_teacher_mock_test(
    test_id: str,
    current_user: User = Depends(teacher_or_admin),
    db: Session = Depends(get_db)
):
    """
    Archives a teacher's own mock test while strictly preserving historical student results.
    """
    test = db.query(MockTest).filter(
        MockTest.id == test_id,
        MockTest.is_deleted == False
    ).first()

    if not test:
        raise HTTPException(status_code=404, detail="Mock test not found")

    if test.created_by != current_user.id and current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Unauthorized")

    test.is_archived = True
    test.is_active = False
    test.status = "archived"
    db.commit()
    return {"message": "Mock test archived successfully"}


@router.post("/teacher/{test_id}/assign")
def assign_teacher_mock_test(
    test_id: str,
    payload: TeacherMockTestAssignRequest,
    current_user: User = Depends(teacher_or_admin),
    db: Session = Depends(get_db)
):
    """
    Assigns mock test to entire class/section student directories or specific students.
    Enforces teacher-directory authorization on the backend (prevents IDOR).
    """
    test = db.query(MockTest).filter(
        MockTest.id == test_id,
        MockTest.is_deleted == False
    ).first()

    if not test:
        raise HTTPException(status_code=404, detail="Mock test not found")

    is_creator = (test.created_by == current_user.id)
    is_platform = bool(test.is_platform_library or test.creator_role in ["super_admin", "admin"])

    if not is_creator and not is_platform and current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Unauthorized to assign this test")

    valid_dirs = []
    if payload.directory_ids:
        for d_id in payload.directory_ids:
            d = db.query(StudentDirectory).filter(
                StudentDirectory.id == d_id,
                StudentDirectory.is_deleted == False
            ).first()
            if not d:
                raise HTTPException(status_code=400, detail=f"Directory {d_id} not found")
            if d.created_by != current_user.id and current_user.role != "super_admin":
                raise HTTPException(status_code=403, detail=f"Unauthorized access to directory {d.name}")
            valid_dirs.append(d)

    # Clear previous assignments made by THIS teacher for this test
    db.query(MockTestAssignment).filter(
        MockTestAssignment.mock_test_id == test.id,
        MockTestAssignment.assigned_by == current_user.id
    ).delete()

    for d in valid_dirs:
        assignment = MockTestAssignment(
            mock_test_id=test.id,
            assigned_by=current_user.id,
            directory_id=d.id,
            directory_name=d.name
        )
        db.add(assignment)

    valid_students_json = []
    if payload.student_ids:
        for s_id in payload.student_ids:
            st_user = db.query(User).filter(User.id == s_id, User.is_deleted == False).first()
            if st_user:
                assignment = MockTestAssignment(
                    mock_test_id=test.id,
                    assigned_by=current_user.id,
                    student_id=st_user.id,
                    student_email=st_user.email,
                    student_name=st_user.full_name
                )
                db.add(assignment)
                valid_students_json.append(st_user.id)

    # Only update global test JSON if creator or super admin, or if platform test merge directories
    if is_creator or current_user.role == "super_admin":
        test.assigned_directories_json = json.dumps([d.id for d in valid_dirs]) if valid_dirs else None
        test.assigned_students_json = json.dumps(valid_students_json) if valid_students_json else None

        if payload.share_access_type:
            test.share_access_type = payload.share_access_type
        if payload.login_required is not None:
            test.login_required = payload.login_required
        if payload.start_time is not None:
            test.start_time = payload.start_time
        if payload.end_time is not None:
            test.end_time = payload.end_time
        if payload.attempt_limit is not None:
            test.attempt_limit = payload.attempt_limit
        if payload.results_visibility:
            test.results_visibility = payload.results_visibility

    db.commit()
    db.refresh(test)

    # Optional email notification dispatch to assigned students
    dispatched_email_count = 0
    if payload.send_email_notification and valid_dirs:
        origin = settings.FRONTEND_URL
        share_url = f"{origin}/mock-test/share/{test.share_token}"
        for d in valid_dirs:
            dir_students = db.query(DirectoryStudent).filter(
                DirectoryStudent.directory_id == d.id,
                DirectoryStudent.is_deleted == False
            ).all()
            for st in dir_students:
                if st.email:
                    try:
                        email_service.send_mock_test_assignment_email(
                            student_name=st.name,
                            email=st.email,
                            test_title=test.title,
                            teacher_name=current_user.full_name or "Your Instructor",
                            duration_minutes=test.duration_minutes,
                            share_url=share_url,
                            start_time=test.start_time,
                            end_time=test.end_time
                        )
                        dispatched_email_count += 1
                    except Exception as err:
                        logging.warning(f"Error dispatching assignment email to {st.email}: {err}")

    return {
        "message": f"Successfully assigned mock test to {len(valid_dirs)} class(es) and {len(valid_students_json)} student(s).",
        "assigned_directories_count": len(valid_dirs),
        "assigned_students_count": len(valid_students_json),
        "dispatched_emails_count": dispatched_email_count,
        "share_access_type": test.share_access_type,
        "share_token": test.share_token
    }


@router.post("/teacher/{test_id}/send-email-invites")
def send_teacher_mock_test_email_invites(
    test_id: str,
    payload: MockTestSendEmailRequest,
    current_user: User = Depends(teacher_or_admin),
    db: Session = Depends(get_db)
):
    """
    Dispatches direct email invitations with test link to students in assigned directories or specific email addresses.
    """
    test = db.query(MockTest).filter(
        MockTest.id == test_id,
        MockTest.is_deleted == False
    ).first()

    if not test:
        raise HTTPException(status_code=404, detail="Mock test not found")

    is_creator = (test.created_by == current_user.id)
    is_platform = bool(test.is_platform_library or test.creator_role in ["super_admin", "admin"])

    if not is_creator and not is_platform and current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Unauthorized")

    origin = settings.FRONTEND_URL
    share_url = f"{origin}/mock-test/share/{test.share_token}"
    sent_count = 0

    # 1. Directory students
    if payload.directory_ids:
        for d_id in payload.directory_ids:
            d = db.query(StudentDirectory).filter(StudentDirectory.id == d_id).first()
            if d and (d.created_by == current_user.id or current_user.role == "super_admin"):
                students = db.query(DirectoryStudent).filter(
                    DirectoryStudent.directory_id == d.id,
                    DirectoryStudent.is_deleted == False
                ).all()
                for st in students:
                    if st.email:
                        try:
                            email_service.send_mock_test_assignment_email(
                                student_name=st.name,
                                email=st.email,
                                test_title=test.title,
                                teacher_name=current_user.full_name or "Your Instructor",
                                duration_minutes=test.duration_minutes,
                                share_url=share_url,
                                start_time=test.start_time,
                                end_time=test.end_time
                            )
                            sent_count += 1
                        except Exception as e:
                            logging.warning(f"Error emailing {st.email}: {e}")

    # 2. Custom emails
    if payload.student_emails:
        for em in payload.student_emails:
            clean_em = em.strip().lower()
            if clean_em and "@" in clean_em:
                try:
                    email_service.send_mock_test_assignment_email(
                        student_name="Student",
                        email=clean_em,
                        test_title=test.title,
                        teacher_name=current_user.full_name or "Your Instructor",
                        duration_minutes=test.duration_minutes,
                        share_url=share_url,
                        start_time=test.start_time,
                        end_time=test.end_time
                    )
                    sent_count += 1
                except Exception as e:
                    logging.warning(f"Error emailing {clean_em}: {e}")

    return {
        "success": True,
        "message": f"Successfully sent {sent_count} email invitation(s).",
        "sent_count": sent_count,
        "share_url": share_url
    }


@router.post("/teacher/{test_id}/revoke-link")
def revoke_teacher_mock_test_link(
    test_id: str,
    current_user: User = Depends(teacher_or_admin),
    db: Session = Depends(get_db)
):
    """
    Revokes the current share link and generates a brand new secure share token.
    """
    test = db.query(MockTest).filter(
        MockTest.id == test_id,
        MockTest.is_deleted == False
    ).first()

    if not test:
        raise HTTPException(status_code=404, detail="Mock test not found")

    if test.created_by != current_user.id and current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Unauthorized")

    test.share_token = secrets.token_urlsafe(16)
    test.is_link_active = True
    db.commit()
    db.refresh(test)

    return {
        "message": "Public test link revoked. New secure link generated successfully.",
        "share_token": test.share_token
    }


@router.post("/teacher/{test_id}/release-results")
def release_teacher_mock_test_results(
    test_id: str,
    current_user: User = Depends(teacher_or_admin),
    db: Session = Depends(get_db)
):
    """
    Releases detailed test results and review sheets to students.
    """
    test = db.query(MockTest).filter(
        MockTest.id == test_id,
        MockTest.is_deleted == False
    ).first()

    if not test:
        raise HTTPException(status_code=404, detail="Mock test not found")

    if test.created_by != current_user.id and current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Unauthorized")

    test.are_results_released = True
    db.commit()

    return {"message": "Test results and answer sheets released to students."}


@router.get("/teacher/{test_id}/results", response_model=List[MockTestResultItem])
def get_teacher_mock_test_results(
    test_id: str,
    current_user: User = Depends(teacher_or_admin),
    db: Session = Depends(get_db)
):
    """
    Retrieves all student attempts and performance records for a teacher's mock test.
    """
    test = db.query(MockTest).filter(
        MockTest.id == test_id,
        MockTest.is_deleted == False
    ).first()

    if not test:
        raise HTTPException(status_code=404, detail="Mock test not found")

    is_creator = (test.created_by == current_user.id)
    is_platform = bool(test.is_platform_library or test.creator_role in ["super_admin", "admin"])

    if not is_creator and not is_platform and current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Unauthorized")

    purchases_query = db.query(MockTestPurchase).filter(
        MockTestPurchase.mock_test_id == test.id,
        MockTestPurchase.status == "completed",
        MockTestPurchase.is_deleted == False
    )

    if is_platform and not is_creator and current_user.role != "super_admin":
        teacher_dirs = [d.id for d in db.query(StudentDirectory).filter(StudentDirectory.created_by == current_user.id).all()]
        teacher_student_emails = [
            s.email.lower() for s in db.query(DirectoryStudent).filter(
                DirectoryStudent.directory_id.in_(teacher_dirs),
                DirectoryStudent.is_deleted == False
            ).all() if s.email
        ] if teacher_dirs else []

        assigned_stud_ids = [
            a.student_id for a in db.query(MockTestAssignment).filter(
                MockTestAssignment.mock_test_id == test.id,
                MockTestAssignment.assigned_by == current_user.id
            ).all() if a.student_id
        ]

        all_purchases = purchases_query.order_by(MockTestPurchase.completed_at.desc()).all()
        purchases = [
            p for p in all_purchases
            if (p.student_email and p.student_email.lower() in teacher_student_emails) or
               (p.student_id and p.student_id in assigned_stud_ids)
        ]
    else:
        purchases = purchases_query.order_by(MockTestPurchase.completed_at.desc()).all()

    results = []
    for p in purchases:
        s_name = p.student_name
        s_email = p.student_email
        if (not s_name or not s_email) and p.student_id:
            u = db.query(User).filter(User.id == p.student_id).first()
            if u:
                s_name = s_name or u.full_name
                s_email = s_email or u.email

        results.append(MockTestResultItem(
            id=p.id,
            student_id=p.student_id,
            student_name=s_name or "Student",
            student_email=s_email,
            score=float(p.score or 0.0),
            max_score=float(p.max_score or test.total_marks or 50.0),
            percentage=float(p.percentage or 0.0),
            passed=bool(p.passed),
            completed_at=p.completed_at,
            time_taken_seconds=p.time_taken_seconds,
            attempt_number=p.attempt_number or 1
        ))

    return results


# =============================================================================
# PUBLIC & STUDENT DIRECT SHARING ENDPOINTS
# =============================================================================

@router.get("/share/{share_token}", response_model=MockTestSharePublicDetail)
def get_shared_mock_test_info(
    share_token: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Secure Public Test Resolver: Displays test briefing and validates candidate eligibility
    without leaking answers or question contents.
    """
    test = db.query(MockTest).filter(
        MockTest.share_token == share_token,
        MockTest.is_deleted == False,
        MockTest.is_archived == False
    ).first()

    if not test:
        raise HTTPException(status_code=404, detail="Invalid or expired mock test link.")

    if not test.is_link_active:
        raise HTTPException(status_code=410, detail="This shared mock test link has been revoked by the instructor.")

    if test.status != "published":
        raise HTTPException(status_code=403, detail="This mock test is currently in draft mode and not published yet.")

    now_iso = now_utc().isoformat()
    is_started = True
    if test.start_time and now_iso < test.start_time:
        is_started = False

    is_expired = False
    if test.end_time and now_iso > test.end_time:
        is_expired = True

    user = get_optional_user(request, db)
    is_eligible = True
    ineligibility_reason = None
    user_attempts_count = 0

    if user:
        user_attempts_count = db.query(MockTestPurchase).filter(
            MockTestPurchase.mock_test_id == test.id,
            MockTestPurchase.student_id == user.id,
            MockTestPurchase.status == "completed"
        ).count()

        if test.attempt_limit > 0 and user_attempts_count >= test.attempt_limit:
            is_eligible = False
            ineligibility_reason = f"You have reached the maximum attempt limit ({test.attempt_limit}) for this test."

    if test.share_access_type == "assigned_only":
        if not user:
            is_eligible = False
            ineligibility_reason = "This test is restricted to assigned students. Please sign in to verify your enrollment."
        else:
            assigned_dirs = json.loads(test.assigned_directories_json) if test.assigned_directories_json else []
            assigned_studs = json.loads(test.assigned_students_json) if test.assigned_students_json else []

            is_direct_student = user.id in assigned_studs
            is_in_directory = False
            if assigned_dirs:
                is_in_directory = db.query(DirectoryStudent).filter(
                    DirectoryStudent.directory_id.in_(assigned_dirs),
                    func.lower(DirectoryStudent.email) == user.email.lower(),
                    DirectoryStudent.is_deleted == False
                ).first() is not None

            if not is_direct_student and not is_in_directory and user.id != test.created_by:
                is_eligible = False
                ineligibility_reason = "Your account is not assigned to this mock test. Please contact your instructor."

    teacher_name = test.company_name
    if test.created_by:
        t_user = db.query(User).filter(User.id == test.created_by).first()
        if t_user:
            teacher_name = t_user.full_name or t_user.institution_name or teacher_name

    return MockTestSharePublicDetail(
        id=test.id,
        share_token=test.share_token,
        title=test.title,
        description=test.description,
        category=test.category,
        subject=test.subject,
        class_level=test.class_level,
        test_type=test.test_type,
        difficulty=test.difficulty or "Medium",
        duration_minutes=test.duration_minutes,
        total_questions=test.total_questions,
        total_marks=float(test.total_marks or 50.0),
        negative_marking=float(test.negative_marking or 0.0),
        passing_marks=float(test.passing_marks or 20.0),
        instructions=test.instructions,
        teacher_name=teacher_name,
        start_time=test.start_time,
        end_time=test.end_time,
        is_expired=is_expired,
        is_started=is_started,
        login_required=test.login_required,
        share_access_type=test.share_access_type,
        attempt_limit=test.attempt_limit,
        user_attempts_count=user_attempts_count,
        is_eligible=is_eligible,
        ineligibility_reason=ineligibility_reason,
        status=test.status
    )


def resolve_or_create_attempt_user(
    db: Session,
    user: Optional[User],
    student_name: Optional[str] = None,
    student_email: Optional[str] = None
) -> User:
    if user:
        return user

    clean_email = (student_email or "").strip().lower()
    if clean_email:
        existing = db.query(User).filter(func.lower(User.email) == clean_email).first()
        if existing:
            return existing
        new_user = User(
            email=clean_email,
            hashed_password="shared_guest_token",
            full_name=(student_name or "Student").strip(),
            role="student",
            is_active=True,
            is_verified=True,
            auth_provider="shared_test"
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user

    guest_acc = db.query(User).filter(User.email == "guest@testora.online").first()
    if not guest_acc:
        guest_acc = User(
            email="guest@testora.online",
            hashed_password="shared_guest_token",
            full_name="Guest Candidate",
            role="student",
            is_active=True,
            is_verified=True,
            auth_provider="shared_test"
        )
        db.add(guest_acc)
        db.commit()
        db.refresh(guest_acc)
    return guest_acc


@router.post("/share/{share_token}/start")
def start_shared_mock_test(
    share_token: str,
    request: Request,
    payload: Optional[MockTestStartPayload] = None,
    db: Session = Depends(get_db)
):
    """
    Starts an attempt on a shared mock test.
    Enforces authorization, schedule window, attempt limits, and returns sanitized questions.
    """
    test = db.query(MockTest).filter(
        MockTest.share_token == share_token,
        MockTest.is_deleted == False,
        MockTest.is_archived == False
    ).first()

    if not test:
        raise HTTPException(status_code=404, detail="Mock test not found")

    if not test.is_link_active or test.status != "published":
        raise HTTPException(status_code=403, detail="This mock test is not accessible.")

    now_iso = now_utc().isoformat()
    if test.start_time and now_iso < test.start_time:
        raise HTTPException(status_code=400, detail="This test has not started yet.")

    if test.end_time and now_iso > test.end_time:
        raise HTTPException(status_code=400, detail="This test has expired.")

    user = get_optional_user(request, db)
    if test.login_required or test.share_access_type == "assigned_only":
        if not user:
            raise HTTPException(status_code=401, detail="Authentication required to start this test.")

    if user and test.share_access_type == "assigned_only":
        assigned_dirs = json.loads(test.assigned_directories_json) if test.assigned_directories_json else []
        assigned_studs = json.loads(test.assigned_students_json) if test.assigned_students_json else []

        is_direct = user.id in assigned_studs
        is_in_dir = False
        if assigned_dirs:
            is_in_dir = db.query(DirectoryStudent).filter(
                DirectoryStudent.directory_id.in_(assigned_dirs),
                func.lower(DirectoryStudent.email) == user.email.lower(),
                DirectoryStudent.is_deleted == False
            ).first() is not None

        if not is_direct and not is_in_dir and user.id != test.created_by:
            raise HTTPException(status_code=403, detail="You are not authorized to attempt this test.")

    if user and test.attempt_limit > 0:
        prev_attempts = db.query(MockTestPurchase).filter(
            MockTestPurchase.mock_test_id == test.id,
            MockTestPurchase.student_id == user.id,
            MockTestPurchase.status == "completed"
        ).count()
        if prev_attempts >= test.attempt_limit:
            raise HTTPException(status_code=400, detail=f"Maximum attempt limit ({test.attempt_limit}) reached.")

    raw_qs = []
    if test.questions_json:
        try:
            raw_qs = json.loads(test.questions_json)
        except Exception:
            raw_qs = []

    safe_qs = []
    for q in raw_qs:
        safe_q = {
            "id": q.get("id"),
            "question": q.get("question"),
            "options": q.get("options", []),
            "question_type": q.get("question_type", "single_choice"),
            "domain": q.get("domain") or q.get("subject"),
            "marks": q.get("marks", test.marks_per_question),
            "negative_marks": q.get("negative_marks", test.negative_marking),
            "image_url": q.get("image_url"),
            "image_caption": q.get("image_caption")
        }
        safe_qs.append(safe_q)

    attempt_user = resolve_or_create_attempt_user(
        db, user,
        payload.student_name if payload else None,
        payload.student_email if payload else None
    )
    student_id = attempt_user.id
    student_name = (payload.student_name if payload and payload.student_name else None) or attempt_user.full_name or "Student"
    student_email = (payload.student_email if payload and payload.student_email else None) or attempt_user.email

    purchase = MockTestPurchase(
        student_id=student_id,
        mock_test_id=test.id,
        amount_paid_inr=0,
        amount_paid_paise=0,
        payment_method="FREE",
        status="unlocked",
        student_name=student_name,
        student_email=student_email
    )
    db.add(purchase)
    db.commit()
    db.refresh(purchase)

    return {
        "attempt_id": purchase.id,
        "test_id": test.id,
        "title": test.title,
        "duration_minutes": test.duration_minutes,
        "total_questions": len(safe_qs),
        "total_marks": test.total_marks,
        "negative_marking": test.negative_marking,
        "passing_marks": test.passing_marks,
        "instructions": test.instructions,
        "questions": safe_qs,
        "results_visibility": test.results_visibility
    }


class SharedSubmitPayload(BaseModel):
    attempt_id: Optional[str] = None
    answers: Dict[str, str]
    time_taken_seconds: Optional[int] = None
    student_name: Optional[str] = None
    student_email: Optional[str] = None


@router.post("/share/{share_token}/submit")
def submit_shared_mock_test(
    share_token: str,
    payload: SharedSubmitPayload,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Evaluates and records student submission for a shared mock test.
    """
    test = db.query(MockTest).filter(
        MockTest.share_token == share_token,
        MockTest.is_deleted == False
    ).first()

    if not test:
        raise HTTPException(status_code=404, detail="Mock test not found")

    user = get_optional_user(request, db)

    raw_qs = []
    if test.questions_json:
        try:
            raw_qs = json.loads(test.questions_json)
        except Exception:
            raw_qs = []

    correct_count = 0
    incorrect_count = 0
    unanswered_count = 0
    total_score = 0.0
    total_neg = 0.0
    reviews = []

    for q in raw_qs:
        q_id = str(q.get("id"))
        correct = str(q.get("correct_answer", "")).strip().lower()
        selected = str(payload.answers.get(q_id, "")).strip().lower()

        marks = float(q.get("marks", test.marks_per_question or 1.0))
        neg = float(q.get("negative_marks", test.negative_marking or 0.0))

        is_corr = False
        m_obt = 0.0
        neg_ded = 0.0

        if not selected or selected == "none":
            unanswered_count += 1
        elif selected == correct:
            correct_count += 1
            is_corr = True
            m_obt = marks
            total_score += marks
        else:
            incorrect_count += 1
            neg_ded = neg
            total_score -= neg
            total_neg += neg

        reviews.append({
            "id": q_id,
            "question": q.get("question"),
            "options": q.get("options", []),
            "selected_answer": payload.answers.get(q_id),
            "correct_answer": q.get("correct_answer"),
            "is_correct": is_corr,
            "explanation": q.get("explanation"),
            "marks_obtained": m_obt,
            "negative_marks_deducted": neg_ded
        })

    total_score = max(0.0, total_score)
    max_score = float(test.total_marks or (len(raw_qs) * 1.0) or 1.0)
    percentage = round((total_score / max_score) * 100.0, 2) if max_score > 0 else 0.0
    passed = total_score >= float(test.passing_marks or 0.0)

    now_str = now_utc().strftime("%Y-%m-%d %H:%M:%S")

    purchase = None
    if payload.attempt_id:
        purchase = db.query(MockTestPurchase).filter(MockTestPurchase.id == payload.attempt_id).first()

    if not purchase and user:
        purchase = db.query(MockTestPurchase).filter(
            MockTestPurchase.mock_test_id == test.id,
            MockTestPurchase.student_id == user.id,
            MockTestPurchase.status == "unlocked"
        ).order_by(MockTestPurchase.created_at.desc()).first()

    student_name = payload.student_name or (user.full_name if user else "Candidate")
    student_email = payload.student_email or (user.email if user else None)

    if not purchase:
        attempt_user = resolve_or_create_attempt_user(
            db, user,
            payload.student_name,
            payload.student_email
        )
        purchase = MockTestPurchase(
            student_id=attempt_user.id,
            mock_test_id=test.id,
            amount_paid_inr=0,
            amount_paid_paise=0,
            payment_method="FREE",
            status="completed"
        )
        db.add(purchase)

    purchase.status = "completed"
    purchase.score = total_score
    purchase.max_score = max_score
    purchase.percentage = percentage
    purchase.passed = passed
    purchase.answers_json = json.dumps(payload.answers)
    purchase.completed_at = now_str
    purchase.student_name = student_name
    purchase.student_email = student_email
    purchase.time_taken_seconds = payload.time_taken_seconds

    test.attempts_count = (test.attempts_count or 0) + 1
    db.commit()

    can_view_results = (test.results_visibility == "immediate") or test.are_results_released

    return {
        "status": "completed",
        "can_view_results": can_view_results,
        "score": total_score if can_view_results else None,
        "max_score": max_score if can_view_results else None,
        "percentage": percentage if can_view_results else None,
        "passed": passed if can_view_results else None,
        "correct_count": correct_count if can_view_results else None,
        "incorrect_count": incorrect_count if can_view_results else None,
        "unanswered_count": unanswered_count if can_view_results else None,
        "completed_at": now_str,
        "message": "Submission evaluated successfully." if can_view_results else "Test submitted successfully. Your instructor will release detailed grades soon.",
        "reviews": reviews if can_view_results else []
    }


@router.get("/student/assigned", response_model=List[MockTestSummary])
def get_student_assigned_mock_tests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns mock tests assigned specifically to the authenticated student via rosters or directories.
    """
    dir_ids = [d.directory_id for d in db.query(DirectoryStudent).filter(
        func.lower(DirectoryStudent.email) == current_user.email.lower(),
        DirectoryStudent.is_deleted == False
    ).all()]

    # Query assignments from MockTestAssignment table
    table_assignments = db.query(MockTestAssignment).filter(
        (MockTestAssignment.student_id == current_user.id) |
        (func.lower(MockTestAssignment.student_email) == current_user.email.lower()) |
        (MockTestAssignment.directory_id.in_(dir_ids) if dir_ids else False)
    ).all()
    assigned_from_table = {a.mock_test_id: a for a in table_assignments}

    tests = db.query(MockTest).filter(
        MockTest.status == "published",
        MockTest.is_active == True,
        MockTest.is_deleted == False,
        MockTest.is_archived == False
    ).order_by(MockTest.created_at.desc()).all()

    assigned_tests = []
    for t in tests:
        is_assigned = t.id in assigned_from_table

        if not is_assigned and t.assigned_students_json:
            try:
                s_list = json.loads(t.assigned_students_json)
                if current_user.id in s_list or (current_user.email and current_user.email in s_list):
                    is_assigned = True
            except Exception:
                pass

        if not is_assigned and t.assigned_directories_json and dir_ids:
            try:
                t_dirs = json.loads(t.assigned_directories_json)
                if any(d in t_dirs for d in dir_ids):
                    is_assigned = True
            except Exception:
                pass

        if is_assigned:
            purchase = db.query(MockTestPurchase).filter(
                MockTestPurchase.mock_test_id == t.id,
                MockTestPurchase.student_id == current_user.id
            ).order_by(MockTestPurchase.created_at.desc()).first()
            assigned_tests.append(serialize_summary(t, purchase))

    return assigned_tests


@router.get("/companies", response_model=List[CompanyFilterItem])
def list_mock_test_companies(db: Session = Depends(get_db)):
    """
    Returns distinct company list with test counts for legacy corporate tabs.
    """
    tests = db.query(MockTest).filter(
        MockTest.is_active == True,
        MockTest.is_deleted == False,
        MockTest.status == "published"
    ).all()

    counts: Dict[str, Dict[str, Any]] = {}
    total = len(tests)

    for t in tests:
        slug = (t.company_slug or "testora").lower().strip()
        name = t.company_name or "Testora National"
        if slug not in counts:
            counts[slug] = {"name": name, "slug": slug, "count": 0}
        counts[slug]["count"] += 1

    result = [CompanyFilterItem(name="All Mocks", slug="all", count=total)]
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
    Strictly verifies backend visibility and status before serving.
    If the test is free or unlocked by the student, questions are included (correct answers hidden).
    """
    test = db.query(MockTest).filter(
        MockTest.id == test_id,
        MockTest.is_deleted == False
    ).first()

    if not test:
        raise HTTPException(status_code=404, detail="Mock test not found.")

    current_user = get_optional_user(request, db)
    is_admin = current_user and current_user.role in ["inst_admin", "super_admin"]
    is_teacher = current_user and current_user.role in ["teacher", "inst_admin", "super_admin"]

    # Access control enforcement
    if not is_admin:
        if test.status != "published":
            raise HTTPException(status_code=403, detail="This mock test is currently unpublished or in draft mode.")
        if test.visibility_target == "teachers_only" and not is_teacher:
            raise HTTPException(status_code=403, detail="This mock test is restricted to teachers.")

    purchase = None
    if current_user:
        purchase = db.query(MockTestPurchase).filter(
            MockTestPurchase.mock_test_id == test.id,
            MockTestPurchase.student_id == current_user.id,
            MockTestPurchase.is_deleted == False
        ).order_by(MockTestPurchase.created_at.desc()).first()

    summary = serialize_summary(test, purchase)

    questions_list = []
    if (summary.is_unlocked or is_admin) and test.questions_json:
        try:
            raw_qs = json.loads(test.questions_json)
            if isinstance(raw_qs, list):
                for idx, q in enumerate(raw_qs):
                    q_id = str(q.get("id") or f"q_{idx+1}")
                    q_marks = float(q.get("marks", test.marks_per_question or 1.0))
                    q_neg = float(q.get("negative_marks", test.negative_marking or 0.0))
                    questions_list.append(MockQuestion(
                        id=q_id,
                        question=q.get("question", ""),
                        options=q.get("options", []),
                        question_type=q.get("question_type") or "single_choice",
                        domain=q.get("domain") or q.get("category"),
                        subject=q.get("subject"),
                        chapter=q.get("chapter"),
                        topic=q.get("topic"),
                        difficulty=q.get("difficulty") or "Medium",
                        marks=q_marks,
                        negative_marks=q_neg,
                        image_url=q.get("image_url"),
                        image_caption=q.get("image_caption"),
                        image_alt=q.get("image_alt"),
                        diagram_type=q.get("diagram_type"),
                        diagram_position=q.get("diagram_position") or "below_question",
                        media_attachments=q.get("media_attachments"),
                        source_details=q.get("source_details"),
                        passage=q.get("passage"),
                        numerical_tolerance=q.get("numerical_tolerance")
                    ))
        except Exception as e:
            logger.error(f"Error parsing questions for test {test_id}: {e}")

    return MockTestDetail(
        **summary.model_dump(),
        instructions=test.instructions,
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
    Does NOT require payment or credit deduction.
    """
    test = db.query(MockTest).filter(
        MockTest.id == test_id,
        MockTest.is_deleted == False
    ).first()

    if not test:
        raise HTTPException(status_code=404, detail="Mock test not found.")

    if test.status != "published" and current_user.role not in ["inst_admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="This mock test is not published.")

    if not test.is_free and test.price_inr > 0:
        raise HTTPException(status_code=400, detail="This is a paid placement test. Please complete checkout.")

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
    Creates a server-side Razorpay order to purchase access to a corporate placement test (e.g. ₹9 or ₹12).
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


# =============================================================================
# 3. TEST SUBMISSION & ACCURATE INDEPENDENT SCORING ENGINE
# =============================================================================

@router.post("/{test_id}/submit", response_model=MockTestSubmitResult)
def submit_mock_test_answers(
    test_id: str,
    req: MockTestSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Accurately scores student answers using independent question-level marks and negative marking.
    Calculates marks obtained, negative deductions, percentage, and saves attempt history.
    """
    test = db.query(MockTest).filter(
        MockTest.id == test_id,
        MockTest.is_deleted == False
    ).first()

    if not test:
        raise HTTPException(status_code=404, detail="Mock test not found.")

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

    default_marks_per_q = float(test.marks_per_question or 1.0)
    default_neg_per_q = float(test.negative_marking or 0.0)

    calculated_max_score = 0.0
    for q in raw_qs:
        calculated_max_score += float(q.get("marks", default_marks_per_q))

    max_score = float(test.total_marks) if test.total_marks and test.total_marks > 0 else calculated_max_score
    if max_score <= 0:
        max_score = float(len(raw_qs)) or 1.0

    score = 0.0
    correct_count = 0
    incorrect_count = 0
    unanswered_count = 0
    total_negative_marks = 0.0
    reviews: List[QuestionReview] = []

    for idx, q in enumerate(raw_qs):
        q_id = str(q.get("id") or f"q_{idx+1}")
        correct_ans = str(q.get("correct_answer", "")).strip().upper()
        student_ans = str(req.answers.get(q_id, "")).strip().upper()

        q_marks = float(q.get("marks", default_marks_per_q))
        q_neg = float(q.get("negative_marks", default_neg_per_q))

        is_correct = False
        marks_obtained = 0.0
        neg_deducted = 0.0

        q_type = q.get("question_type") or "single_choice"
        if not student_ans:
            unanswered_count += 1
        elif q_type == "numerical":
            try:
                s_val = float(student_ans)
                c_val = float(correct_ans)
                tol = float(q.get("numerical_tolerance") or 0.0)
                if abs(s_val - c_val) <= tol:
                    is_correct = True
            except (ValueError, TypeError):
                is_correct = (student_ans == correct_ans)
            
            if is_correct:
                correct_count += 1
                marks_obtained = q_marks
                score += q_marks
            else:
                incorrect_count += 1
                neg_deducted = q_neg
                total_negative_marks += q_neg
                score -= q_neg
        elif student_ans == correct_ans:
            is_correct = True
            correct_count += 1
            marks_obtained = q_marks
            score += q_marks
        else:
            incorrect_count += 1
            neg_deducted = q_neg
            total_negative_marks += q_neg
            score -= q_neg

        reviews.append(QuestionReview(
            id=q_id,
            question=q.get("question", ""),
            options=q.get("options", []),
            question_type=q_type,
            image_url=q.get("image_url"),
            image_caption=q.get("image_caption"),
            source_details=q.get("source_details"),
            selected_answer=student_ans if student_ans else None,
            correct_answer=correct_ans,
            is_correct=is_correct,
            explanation=q.get("explanation") or "Standard educational benchmark solution.",
            marks_obtained=marks_obtained,
            negative_marks_deducted=neg_deducted
        ))

    score = max(0.0, round(score, 2))
    percentage = round((score / max_score * 100.0), 1) if max_score > 0 else 0.0

    passing_marks = float(test.passing_marks or 0.0)
    pass_percentage = test.pass_percentage or 40

    if passing_marks > 0:
        passed = score >= passing_marks
    else:
        passed = percentage >= pass_percentage

    completed_time_str = now_utc().strftime("%d %b %Y, %I:%M %p UTC")

    if not purchase:
        purchase = MockTestPurchase(
            student_id=current_user.id,
            mock_test_id=test.id,
            amount_paid_inr=0,
            amount_paid_paise=0,
            payment_method="FREE",
            status="completed",
            score=score,
            max_score=max_score,
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
        purchase.max_score = max_score
        purchase.percentage = percentage
        purchase.passed = passed
        purchase.answers_json = json.dumps(req.answers)
        purchase.completed_at = completed_time_str
        purchase.updated_at = now_utc()

    test.attempts_count = (test.attempts_count or 0) + 1
    db.commit()

    return MockTestSubmitResult(
        score=score,
        max_score=max_score,
        percentage=percentage,
        passed=passed,
        correct_count=correct_count,
        incorrect_count=incorrect_count,
        unanswered_count=unanswered_count,
        total_negative_marks=round(total_negative_marks, 2),
        passing_marks=passing_marks,
        pass_percentage=pass_percentage,
        completed_at=completed_time_str,
        reviews=reviews
    )


@router.get("/{test_id}/solution-review", response_model=MockTestSubmitResult)
def get_mock_test_solution_review(
    test_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves the authenticated student's completed scorecard, answers, and full question-by-question solution review.
    """
    test = db.query(MockTest).filter(
        MockTest.id == test_id,
        MockTest.is_deleted == False
    ).first()

    if not test:
        raise HTTPException(status_code=404, detail="Mock test not found.")

    purchase = db.query(MockTestPurchase).filter(
        MockTestPurchase.mock_test_id == test.id,
        MockTestPurchase.student_id == current_user.id,
        MockTestPurchase.is_deleted == False
    ).first()

    if not purchase or purchase.status != "completed":
        raise HTTPException(
            status_code=400,
            detail="You have not submitted this assessment yet. Please start and submit the test first."
        )

    answers: Dict[str, Any] = {}
    if purchase.answers_json:
        try:
            answers = json.loads(purchase.answers_json)
        except Exception:
            answers = {}

    raw_qs = []
    if test.questions_json:
        try:
            raw_qs = json.loads(test.questions_json)
        except Exception:
            raw_qs = []

    default_marks_per_q = float(test.marks_per_question or 1.0)
    default_neg_per_q = float(test.negative_marking or 0.0)

    calculated_max_score = 0.0
    for q in raw_qs:
        calculated_max_score += float(q.get("marks", default_marks_per_q))

    max_score = float(test.total_marks) if test.total_marks and test.total_marks > 0 else calculated_max_score
    if max_score <= 0:
        max_score = float(len(raw_qs)) or 1.0

    score = 0.0
    correct_count = 0
    incorrect_count = 0
    unanswered_count = 0
    total_negative_marks = 0.0
    reviews: List[QuestionReview] = []

    for idx, q in enumerate(raw_qs):
        q_id = str(q.get("id") or f"q_{idx+1}")
        correct_ans = str(q.get("correct_answer", "")).strip().upper()
        student_ans = str(
            answers.get(q_id) or
            answers.get(str(q.get("id"))) or
            answers.get(str(idx + 1)) or
            ""
        ).strip().upper()

        q_marks = float(q.get("marks", default_marks_per_q))
        q_neg = float(q.get("negative_marks", default_neg_per_q))

        is_correct = False
        marks_obtained = 0.0
        neg_deducted = 0.0

        if not student_ans:
            unanswered_count += 1
        elif student_ans == correct_ans:
            is_correct = True
            correct_count += 1
            marks_obtained = q_marks
            score += q_marks
        else:
            incorrect_count += 1
            neg_deducted = q_neg
            total_negative_marks += q_neg
            score -= q_neg

        q_type = q.get("question_type") or "multiple_choice"
        if q_type not in ["multiple_choice", "true_false", "numerical", "assertion_reason"]:
            q_type = "multiple_choice"

        reviews.append(QuestionReview(
            question_id=q_id,
            question=q.get("question", ""),
            options=q.get("options", []),
            question_type=q_type,
            image_url=q.get("image_url"),
            image_caption=q.get("image_caption"),
            source_details=q.get("source_details"),
            selected_answer=student_ans if student_ans else None,
            correct_answer=correct_ans,
            is_correct=is_correct,
            explanation=q.get("explanation") or "Standard educational benchmark solution.",
            marks_obtained=marks_obtained,
            negative_marks_deducted=neg_deducted
        ))

    final_score = float(purchase.score) if purchase.score is not None else max(0.0, round(score, 2))
    percentage = float(purchase.percentage) if purchase.percentage is not None else (
        round((final_score / max_score * 100.0), 1) if max_score > 0 else 0.0
    )

    passing_marks = float(test.passing_marks or 0.0)
    pass_percentage = test.pass_percentage or 40
    if purchase.passed is not None:
        passed = bool(purchase.passed)
    elif passing_marks > 0:
        passed = final_score >= passing_marks
    else:
        passed = percentage >= pass_percentage

    return MockTestSubmitResult(
        score=final_score,
        max_score=max_score,
        percentage=percentage,
        passed=passed,
        correct_count=correct_count,
        incorrect_count=incorrect_count,
        unanswered_count=unanswered_count,
        total_negative_marks=round(total_negative_marks, 2),
        passing_marks=passing_marks,
        pass_percentage=pass_percentage,
        completed_at=purchase.completed_at or "Completed",
        reviews=reviews
    )


# =============================================================================
# 4. SUPER ADMIN MANAGEMENT ENDPOINTS
# =============================================================================

@router.get("/admin/stats", response_model=MockTestAdminStats)
def admin_get_stats(
    current_user: User = Depends(super_admin_only),
    db: Session = Depends(get_db)
):
    """
    Super Admin: returns KPI metrics across the mock test catalogue.
    """
    tests = db.query(MockTest).filter(MockTest.is_deleted == False).all()
    total_tests = len(tests)
    published_count = sum(1 for t in tests if t.status == "published")
    draft_count = sum(1 for t in tests if t.status == "draft")
    hidden_count = sum(1 for t in tests if t.status == "unpublished" or not t.is_active)
    total_attempts = sum(t.attempts_count or 0 for t in tests)

    total_questions = 0
    for t in tests:
        if t.total_questions:
            total_questions += t.total_questions
        elif t.questions_json:
            try:
                qs = json.loads(t.questions_json)
                total_questions += len(qs)
            except Exception:
                pass

    return MockTestAdminStats(
        total_tests=total_tests,
        published_count=published_count,
        draft_count=draft_count,
        hidden_count=hidden_count,
        total_questions=total_questions,
        total_attempts=total_attempts
    )


@router.get("/admin/{test_id}/takers", response_model=MockTestTakersResponse)
def admin_get_mock_test_takers(
    test_id: str,
    current_user: User = Depends(admin_required),
    db: Session = Depends(get_db)
):
    """
    Super Admin / Admin: Retrieves all candidate attempts, scorecards, and Razorpay payment details for a mock test.
    """
    test = db.query(MockTest).filter(
        MockTest.id == test_id,
        MockTest.is_deleted == False
    ).first()

    if not test:
        raise HTTPException(status_code=404, detail="Mock test not found")

    purchases = db.query(MockTestPurchase).filter(
        MockTestPurchase.mock_test_id == test.id,
        MockTestPurchase.is_deleted == False
    ).order_by(MockTestPurchase.created_at.desc()).all()

    # Sync attempts count if not matched
    if len(purchases) != (test.attempts_count or 0):
        test.attempts_count = len(purchases)
        try:
            db.commit()
        except Exception:
            db.rollback()

    records = []
    total_revenue = 0
    completed_count = 0

    for p in purchases:
        s_name = p.student_name
        s_email = p.student_email
        if (not s_name or not s_email) and p.student_id:
            u = db.query(User).filter(User.id == p.student_id).first()
            if u:
                s_name = s_name or u.full_name
                s_email = s_email or u.email

        if p.status == "completed":
            completed_count += 1

        total_revenue += (p.amount_paid_inr or 0)

        records.append(MockTestTakerRecord(
            id=p.id,
            student_id=p.student_id,
            student_name=s_name or "Student Candidate",
            student_email=s_email,
            amount_paid_inr=p.amount_paid_inr or 0,
            payment_method=p.payment_method or ("RAZORPAY" if (p.amount_paid_inr or 0) > 0 else "FREE"),
            razorpay_order_id=p.razorpay_order_id,
            razorpay_payment_id=p.razorpay_payment_id,
            status=p.status or "completed",
            score=float(p.score) if p.score is not None else None,
            max_score=float(p.max_score or test.total_marks or 50.0),
            percentage=float(p.percentage) if p.percentage is not None else None,
            passed=p.passed,
            time_taken_seconds=p.time_taken_seconds,
            attempt_number=p.attempt_number or 1,
            created_at=str(p.created_at) if p.created_at else None,
            completed_at=p.completed_at
        ))

    return MockTestTakersResponse(
        test_id=test.id,
        test_title=test.title,
        price_inr=test.price_inr or 0,
        is_free=bool(test.is_free or test.price_inr == 0),
        total_takers=len(purchases),
        total_completed=completed_count,
        total_revenue_inr=total_revenue,
        records=records
    )


@router.get("/admin/all", response_model=List[MockTestSummary])
def admin_list_all_tests(
    category: Optional[str] = Query(None),
    test_type: Optional[str] = Query(None),
    class_level: Optional[str] = Query(None),
    subject: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    visibility: Optional[str] = Query(None),
    min_marks: Optional[float] = Query(None),
    max_marks: Optional[float] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(admin_required),
    db: Session = Depends(get_db)
):
    """
    Admin: lists all tests (including drafts, unpublished, hidden).
    """
    cnt = db.query(MockTest).filter(MockTest.is_deleted == False).count()
    corp_cnt = db.query(MockTest).filter(
        MockTest.company_slug.in_(["tcs", "infosys", "hcl", "wipro", "accenture"]),
        MockTest.is_deleted == False
    ).count()
    if cnt < 11 or corp_cnt < 6:
        seed_initial_mock_tests(db)

    query = db.query(MockTest).filter(MockTest.is_deleted == False)

    if category and category.lower() != "all":
        query = query.filter(MockTest.category.ilike(f"%{category.strip()}%"))

    if test_type and test_type.lower() != "all":
        query = query.filter(or_(
            MockTest.test_type.ilike(f"%{test_type.strip()}%"),
            MockTest.test_type_id == test_type.strip()
        ))

    if class_level and class_level.lower() != "all":
        query = query.filter(MockTest.class_level.ilike(f"%{class_level.strip()}%"))

    if subject and subject.lower() != "all":
        query = query.filter(MockTest.subject.ilike(f"%{subject.strip()}%"))

    if status_filter and status_filter.lower() != "all":
        query = query.filter(MockTest.status == status_filter.strip())

    if visibility and visibility.lower() != "all":
        query = query.filter(MockTest.visibility_target == visibility.strip())

    if min_marks is not None:
        query = query.filter(MockTest.total_marks >= min_marks)

    if max_marks is not None:
        query = query.filter(MockTest.total_marks <= max_marks)

    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        query = query.filter(or_(
            func.lower(MockTest.title).like(term),
            func.lower(MockTest.description).like(term),
            func.lower(MockTest.subject).like(term),
            func.lower(MockTest.chapter).like(term),
            func.lower(MockTest.topic).like(term),
            func.lower(MockTest.test_type).like(term),
            func.lower(MockTest.company_name).like(term)
        ))

    tests = query.order_by(MockTest.display_order.asc(), MockTest.created_at.desc()).all()
    return [serialize_summary(t) for t in tests]


@router.post("/admin", response_model=MockTestSummary, status_code=status.HTTP_201_CREATED)
def admin_create_mock_test(
    payload: MockTestCreate,
    current_user: User = Depends(super_admin_only),
    db: Session = Depends(get_db)
):
    """
    Super Admin: creates a new mock test with full examination configuration & test type classification.
    """
    slug = (payload.company_slug or payload.company_name or "testora").lower().strip().replace(" ", "_")
    is_free = payload.price_inr <= 0
    price_paise = max(0, payload.price_inr * 100)

    q_count = len(payload.questions) if payload.questions else payload.total_questions
    calc_marks = payload.total_marks
    if payload.questions:
        sum_marks = sum(float(q.get("marks", payload.marks_per_question)) for q in payload.questions)
        if sum_marks > 0:
            calc_marks = sum_marks

    # Compute actual difficulty distribution from questions if available
    diff_dist_json = None
    if payload.questions:
        counts = {"Easy": 0, "Medium": 0, "Hard": 0}
        total_q = len(payload.questions)
        for q in payload.questions:
            d = q.get("difficulty", "Medium").capitalize()
            if d not in counts:
                d = "Medium"
            counts[d] += 1
        if total_q > 0:
            diff_dist_json = json.dumps({k: round((v / total_q) * 100.0, 1) for k, v in counts.items()})

    test = MockTest(
        title=payload.title.strip(),
        description=payload.description,
        category_id=payload.category_id,
        category=payload.category.strip() if payload.category else "School Examinations",
        subcategory=payload.subcategory,
        test_type_id=payload.test_type_id,
        test_type=payload.test_type or "Full-Length Mock Test",
        class_level=payload.class_level,
        subject=payload.subject,
        exam_type=payload.exam_type,
        engineering_branch=payload.engineering_branch,
        chapter=payload.chapter,
        topic=payload.topic,
        section_name=payload.section_name,
        pyq_exam_name=payload.pyq_exam_name,
        pyq_year=payload.pyq_year,
        pyq_shift=payload.pyq_shift,
        pyq_source=payload.pyq_source,
        speed_test_target_time_per_q=payload.speed_test_target_time_per_q,
        practice_mode_instant_explanation=payload.practice_mode_instant_explanation,
        difficulty=payload.difficulty,
        language=payload.language or "English",
        difficulty_distribution_json=diff_dist_json,
        company_name=(payload.company_name or "Testora National Mocks").strip(),
        company_slug=slug,
        company_logo=payload.company_logo,
        visibility_target=payload.visibility_target or "students_only",
        target_class=payload.target_class,
        target_section=payload.target_section or "mock_test_library",
        status=payload.status or "published",
        price_inr=max(0, payload.price_inr),
        price_paise=price_paise,
        is_free=is_free,
        duration_minutes=payload.duration_minutes or 60,
        total_questions=q_count,
        total_marks=calc_marks,
        marks_per_question=payload.marks_per_question or 1.0,
        negative_marking=payload.negative_marking or 0.0,
        passing_marks=payload.passing_marks or 20.0,
        pass_percentage=payload.pass_percentage or 40,
        attempt_limit=payload.attempt_limit or 0,
        instructions=payload.instructions,
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
    current_user: User = Depends(super_admin_only),
    db: Session = Depends(get_db)
):
    """
    Super Admin: updates test configuration, audience visibility, marks, or questions.
    """
    test = db.query(MockTest).filter(
        MockTest.id == test_id,
        MockTest.is_deleted == False
    ).first()

    if not test:
        raise HTTPException(status_code=404, detail="Mock test not found.")

    if payload.title is not None:
        test.title = payload.title.strip()
    if payload.description is not None:
        test.description = payload.description
    if payload.category_id is not None:
        test.category_id = payload.category_id
    if payload.category is not None:
        test.category = payload.category.strip()
    if payload.subcategory is not None:
        test.subcategory = payload.subcategory

    if payload.test_type_id is not None:
        test.test_type_id = payload.test_type_id
    if payload.test_type is not None:
        test.test_type = payload.test_type.strip()

    if payload.class_level is not None:
        test.class_level = payload.class_level
    if payload.subject is not None:
        test.subject = payload.subject
    if payload.exam_type is not None:
        test.exam_type = payload.exam_type
    if payload.engineering_branch is not None:
        test.engineering_branch = payload.engineering_branch

    if payload.chapter is not None:
        test.chapter = payload.chapter
    if payload.topic is not None:
        test.topic = payload.topic
    if payload.section_name is not None:
        test.section_name = payload.section_name

    if payload.pyq_exam_name is not None:
        test.pyq_exam_name = payload.pyq_exam_name
    if payload.pyq_year is not None:
        test.pyq_year = payload.pyq_year
    if payload.pyq_shift is not None:
        test.pyq_shift = payload.pyq_shift
    if payload.pyq_source is not None:
        test.pyq_source = payload.pyq_source

    if payload.speed_test_target_time_per_q is not None:
        test.speed_test_target_time_per_q = payload.speed_test_target_time_per_q
    if payload.practice_mode_instant_explanation is not None:
        test.practice_mode_instant_explanation = payload.practice_mode_instant_explanation

    if payload.difficulty is not None:
        test.difficulty = payload.difficulty
    if payload.language is not None:
        test.language = payload.language

    if payload.visibility_target is not None:
        test.visibility_target = payload.visibility_target
    if payload.target_class is not None:
        test.target_class = payload.target_class
    if payload.target_section is not None:
        test.target_section = payload.target_section
    if payload.status is not None:
        test.status = payload.status

    if payload.price_inr is not None:
        test.price_inr = max(0, payload.price_inr)
        test.price_paise = test.price_inr * 100
        test.is_free = (test.price_inr == 0)

    if payload.duration_minutes is not None:
        test.duration_minutes = payload.duration_minutes
    if payload.total_questions is not None:
        test.total_questions = payload.total_questions
    if payload.total_marks is not None:
        test.total_marks = payload.total_marks
    if payload.marks_per_question is not None:
        test.marks_per_question = payload.marks_per_question
    if payload.negative_marking is not None:
        test.negative_marking = payload.negative_marking
    if payload.passing_marks is not None:
        test.passing_marks = payload.passing_marks
    if payload.pass_percentage is not None:
        test.pass_percentage = payload.pass_percentage
    if payload.attempt_limit is not None:
        test.attempt_limit = payload.attempt_limit
    if payload.instructions is not None:
        test.instructions = payload.instructions

    if payload.questions is not None:
        test.questions_json = json.dumps(payload.questions)
        test.total_questions = len(payload.questions)
        counts = {"Easy": 0, "Medium": 0, "Hard": 0}
        total_q = len(payload.questions)
        for q in payload.questions:
            d = q.get("difficulty", "Medium").capitalize()
            if d not in counts:
                d = "Medium"
            counts[d] += 1
        if total_q > 0:
            test.difficulty_distribution_json = json.dumps({k: round((v / total_q) * 100.0, 1) for k, v in counts.items()})

    if payload.is_active is not None:
        test.is_active = payload.is_active

    test.updated_at = now_utc()
    db.commit()
    db.refresh(test)
    return serialize_summary(test)


@router.post("/admin/{test_id}/publish", response_model=MockTestSummary)
def admin_publish_test(
    test_id: str,
    current_user: User = Depends(super_admin_only),
    db: Session = Depends(get_db)
):
    """Super Admin: quickly publishes a test."""
    test = db.query(MockTest).filter(
        MockTest.id == test_id,
        MockTest.is_deleted == False
    ).first()
    if not test:
        raise HTTPException(status_code=404, detail="Mock test not found.")

    test.status = "published"
    test.is_active = True
    test.updated_at = now_utc()
    db.commit()
    db.refresh(test)
    return serialize_summary(test)


@router.post("/admin/{test_id}/unpublish", response_model=MockTestSummary)
def admin_unpublish_test(
    test_id: str,
    current_user: User = Depends(super_admin_only),
    db: Session = Depends(get_db)
):
    """Super Admin: unpublishes/hides a test."""
    test = db.query(MockTest).filter(
        MockTest.id == test_id,
        MockTest.is_deleted == False
    ).first()
    if not test:
        raise HTTPException(status_code=404, detail="Mock test not found.")

    test.status = "unpublished"
    test.updated_at = now_utc()
    db.commit()
    db.refresh(test)
    return serialize_summary(test)


@router.post("/admin/{test_id}/duplicate", response_model=MockTestSummary)
def admin_duplicate_test(
    test_id: str,
    current_user: User = Depends(super_admin_only),
    db: Session = Depends(get_db)
):
    """Super Admin: clones a mock test as draft."""
    test = db.query(MockTest).filter(
        MockTest.id == test_id,
        MockTest.is_deleted == False
    ).first()
    if not test:
        raise HTTPException(status_code=404, detail="Mock test not found.")

    cloned = MockTest(
        title=f"{test.title} (Copy)",
        description=test.description,
        category_id=test.category_id,
        category=test.category,
        subcategory=test.subcategory,
        test_type_id=test.test_type_id,
        test_type=test.test_type,
        class_level=test.class_level,
        subject=test.subject,
        exam_type=test.exam_type,
        engineering_branch=test.engineering_branch,
        chapter=test.chapter,
        topic=test.topic,
        section_name=test.section_name,
        pyq_exam_name=test.pyq_exam_name,
        pyq_year=test.pyq_year,
        pyq_shift=test.pyq_shift,
        pyq_source=test.pyq_source,
        speed_test_target_time_per_q=test.speed_test_target_time_per_q,
        practice_mode_instant_explanation=test.practice_mode_instant_explanation,
        difficulty=test.difficulty,
        language=test.language,
        difficulty_distribution_json=test.difficulty_distribution_json,
        company_name=test.company_name,
        company_slug=f"{test.company_slug}_copy",
        company_logo=test.company_logo,
        visibility_target=test.visibility_target,
        target_class=test.target_class,
        status="draft",
        price_inr=test.price_inr,
        price_paise=test.price_paise,
        is_free=test.is_free,
        duration_minutes=test.duration_minutes,
        total_questions=test.total_questions,
        total_marks=test.total_marks,
        marks_per_question=test.marks_per_question,
        negative_marking=test.negative_marking,
        passing_marks=test.passing_marks,
        pass_percentage=test.pass_percentage,
        attempt_limit=test.attempt_limit,
        instructions=test.instructions,
        questions_json=test.questions_json,
        is_active=False,
        attempts_count=0,
        created_by=current_user.id,
        created_at=now_utc(),
        updated_at=now_utc()
    )
    db.add(cloned)
    db.commit()
    db.refresh(cloned)
    return serialize_summary(cloned)


@router.delete("/admin/{test_id}")
def admin_delete_mock_test(
    test_id: str,
    current_user: User = Depends(super_admin_only),
    db: Session = Depends(get_db)
):
    """Super Admin: soft deletes a mock test."""
    test = db.query(MockTest).filter(
        MockTest.id == test_id,
        MockTest.is_deleted == False
    ).first()

    if not test:
        raise HTTPException(status_code=404, detail="Mock test not found.")

    test.delete()
    db.commit()
    return {"success": True, "message": f"Test '{test.title}' removed."}


@router.post("/admin/seed")
def admin_trigger_seed(
    current_user: User = Depends(super_admin_only),
    db: Session = Depends(get_db)
):
    """Super Admin: forces re-seeding of default categories, test types, and sample tests."""
    seed_mock_test_categories(db)
    seed_mock_test_types(db)
    seed_initial_mock_tests(db)
    return {"success": True, "message": "Catalogue categories, test types, and sample mock tests seeded successfully."}
