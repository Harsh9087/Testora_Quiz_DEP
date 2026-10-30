import os
import time
import uuid
import shutil
import random
import string
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, or_
from jose import jwt

from app.database import get_db
from app.config import settings
from app.models.feedback import FeedbackSubmission
from app.models.user import User
from app.schemas.feedback import (
    FeedbackCreate,
    FeedbackUpdate,
    FeedbackResponse,
    FeedbackStats
)
from app.utils.security import RoleChecker, get_current_user
from app.utils.timezone import now_utc
from app.services.email_service import email_service

router = APIRouter(prefix="/feedback", tags=["feedback"])
super_admin_required = RoleChecker(["super_admin"])

# In-memory rate limiting tracker (Email -> timestamp)
_recent_submissions = {}

def generate_feedback_code(db: Session) -> str:
    """Generates unique reference code: e.g. FB-2026-K9X2P"""
    year = datetime.now().year
    while True:
        suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
        code = f"FB-{year}-{suffix}"
        exists = db.query(FeedbackSubmission).filter(FeedbackSubmission.feedback_code == code).first()
        if not exists:
            return code

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

def serialize_feedback(item: FeedbackSubmission) -> dict:
    return {
        "id": item.id,
        "feedback_code": item.feedback_code,
        "submission_type": item.submission_type,
        "user_id": item.user_id,
        "name": item.name,
        "email": item.email,
        "role": item.role,
        "user_type": item.user_type,
        "subject": item.subject or item.title,
        "title": item.title or item.subject,
        "category": item.category,
        "rating": item.rating,
        "severity": item.severity,
        "message": item.message,
        "secondary_text": item.secondary_text,
        "screenshot_url": item.screenshot_url,
        "status": item.status,
        "admin_notes": item.admin_notes,
        "assigned_to_id": item.assigned_to_id,
        "assigned_to_name": item.assigned_to_name,
        "resolution_details": item.resolution_details,
        "reviewed_by_id": item.reviewed_by_id,
        "reviewed_by_name": item.reviewed_by_name,
        "reviewed_at": item.reviewed_at,
        "is_public_testimonial": item.is_public_testimonial,
        "created_at": item.created_at,
        "updated_at": item.updated_at
    }


# =============================================================================
# 1. SCREENSHOT UPLOAD (Optional image attachment)
# =============================================================================
@router.post("/upload-screenshot")
async def upload_feedback_screenshot(
    file: UploadFile = File(...)
):
    """
    Securely uploads an optional screenshot attachment (PNG, JPG, JPEG, WEBP <= 5MB).
    Saves to /static/feedback_screenshots/ and returns the relative URL.
    """
    allowed_types = ["image/png", "image/jpeg", "image/jpg", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image format. Allowed formats: PNG, JPG, JPEG, WEBP."
        )

    ext = "png"
    if file.filename and "." in file.filename:
        ext = file.filename.split(".")[-1].lower()
    if ext not in ["png", "jpg", "jpeg", "webp"]:
        ext = "png"

    # Static storage directory for screenshots
    static_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static", "feedback_screenshots")
    os.makedirs(static_dir, exist_ok=True)

    filename = f"fb_shot_{uuid.uuid4().hex[:12]}_{int(time.time())}.{ext}"
    file_path = os.path.join(static_dir, filename)

    # Enforce 5MB limit
    max_size = 5 * 1024 * 1024
    content = await file.read()
    if len(content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds maximum limit of 5 MB."
        )

    with open(file_path, "wb") as buffer:
        buffer.write(content)

    return {
        "success": True,
        "filename": filename,
        "url": f"/static/feedback_screenshots/{filename}"
    }


# =============================================================================
# 2. PUBLIC SUBMISSION ENDPOINT (Both Logged-In and Guests)
# =============================================================================
@router.post("", status_code=status.HTTP_201_CREATED)
def submit_feedback(
    payload: FeedbackCreate,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Saves a feedback submission to the database, generates a reference code,
    and sends asynchronous confirmation emails.
    """
    # Spam protection / rate limiting: reject if same email submitted in last 5 seconds
    now = time.time()
    clean_email = payload.email.strip().lower()
    last_time = _recent_submissions.get(clean_email)
    if last_time and (now - last_time < 5.0):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Please wait a few seconds before submitting another feedback."
        )
    _recent_submissions[clean_email] = now

    user = get_optional_user(request, db)
    code = generate_feedback_code(db)

    # Map submission_type from category if not explicitly set
    sub_type = payload.submission_type or "EXPERIENCE"
    cat_lower = (payload.category or "").lower()
    if "bug" in cat_lower or "issue" in cat_lower:
        sub_type = "BUG"
    elif "feature" in cat_lower or "idea" in cat_lower:
        sub_type = "FEATURE"
    elif "rating" in cat_lower or payload.rating:
        sub_type = "RATING"

    final_subject = (payload.subject or payload.title or "").strip()

    feedback = FeedbackSubmission(
        feedback_code=code,
        submission_type=sub_type,
        user_id=user.id if user else None,
        name=payload.name.strip(),
        email=clean_email,
        role=payload.role or ("Educator" if user and user.role == "teacher" else "User"),
        user_type=payload.user_type or "Teacher",
        subject=final_subject if final_subject else None,
        title=final_subject if final_subject else None,
        category=payload.category or "General Feedback",
        rating=payload.rating,
        severity=payload.severity,
        message=payload.message.strip(),
        secondary_text=payload.secondary_text.strip() if payload.secondary_text else None,
        screenshot_url=payload.screenshot_url,
        is_public_testimonial=bool(payload.is_public_testimonial and payload.rating and payload.rating >= 4),
        status="New"
    )

    db.add(feedback)
    db.commit()
    db.refresh(feedback)

    # Send non-blocking background emails
    def dispatch_emails():
        try:
            # 1. Confirmation to applicant
            email_service.send_feedback_confirmation_email(
                to_email=clean_email,
                applicant_name=payload.name.strip(),
                ref_code=code,
                subject_text=final_subject,
                category=payload.category or "General Feedback"
            )
        except Exception as e:
            pass

        try:
            # 2. Alert to Super Admin
            admin_target = getattr(settings, "SUPERADMIN_EMAIL", None) or getattr(settings, "EMAILS_FROM_EMAIL", None) or "admin@testora.quiz"
            email_service.send_feedback_admin_alert_email(
                admin_email=admin_target,
                ref_code=code,
                applicant_name=payload.name.strip(),
                applicant_email=clean_email,
                user_type=payload.user_type or "Teacher",
                category=payload.category or "General Feedback",
                rating=payload.rating,
                subject_text=final_subject,
                message=payload.message.strip(),
                screenshot_url=payload.screenshot_url
            )
        except Exception as e:
            pass

    background_tasks.add_task(dispatch_emails)

    return {
        "success": True,
        "message": "Thank you for your feedback! Your submission has been securely registered.",
        "feedback_code": code,
        "submission": serialize_feedback(feedback)
    }


# =============================================================================
# 3. SUPER ADMIN: KPI Stats
# =============================================================================
@router.get("/stats", response_model=FeedbackStats)
def get_feedback_stats(
    current_user: User = Depends(super_admin_required),
    db: Session = Depends(get_db)
):
    """Returns analytics for Super Admin overview & feedback portal."""
    base_q = db.query(FeedbackSubmission).filter(FeedbackSubmission.is_deleted == False)

    total = base_q.count()
    new_c = base_q.filter(FeedbackSubmission.status == "New").count()
    in_progress_c = base_q.filter(FeedbackSubmission.status.in_(["In Progress", "Under Review", "Under Consideration"])).count()
    resolved_c = base_q.filter(FeedbackSubmission.status.in_(["Resolved", "Implemented", "Closed"])).count()

    avg_rating = db.query(func.avg(FeedbackSubmission.rating)).filter(
        FeedbackSubmission.is_deleted == False,
        FeedbackSubmission.rating.isnot(None)
    ).scalar() or 0.0

    bug_c = base_q.filter(
        or_(
            FeedbackSubmission.submission_type == "BUG",
            FeedbackSubmission.category == "Bug Report"
        )
    ).count()

    feat_c = base_q.filter(
        or_(
            FeedbackSubmission.submission_type == "FEATURE",
            FeedbackSubmission.category == "Feature Request"
        )
    ).count()

    exp_c = base_q.filter(FeedbackSubmission.submission_type == "EXPERIENCE").count()
    rating_c = base_q.filter(FeedbackSubmission.rating.isnot(None)).count()

    return {
        "total_submissions": total,
        "new_count": new_c,
        "in_progress_count": in_progress_c,
        "resolved_count": resolved_c,
        "average_rating": round(float(avg_rating), 1),
        "bug_count": bug_c,
        "feature_count": feat_c,
        "experience_count": exp_c,
        "rating_count": rating_c
    }


# =============================================================================
# 4. SUPER ADMIN: Filterable & Searchable List
# =============================================================================
@router.get("")
def list_feedback_submissions(
    type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    user_type: Optional[str] = Query(None),
    rating: Optional[int] = Query(None, ge=1, le=5),
    q: Optional[str] = Query(None, description="Search keyword"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(super_admin_required),
    db: Session = Depends(get_db)
):
    """Lists feedback submissions for Super Admin review."""
    query = db.query(FeedbackSubmission).filter(FeedbackSubmission.is_deleted == False)

    if type and type != "ALL":
        query = query.filter(FeedbackSubmission.submission_type == type)

    if status and status != "ALL":
        query = query.filter(FeedbackSubmission.status == status)

    if category and category != "ALL":
        query = query.filter(FeedbackSubmission.category == category)

    if user_type and user_type != "ALL":
        query = query.filter(FeedbackSubmission.user_type == user_type)

    if rating:
        query = query.filter(FeedbackSubmission.rating == rating)

    if q and q.strip():
        term = f"%{q.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(FeedbackSubmission.feedback_code).like(term),
                func.lower(FeedbackSubmission.name).like(term),
                func.lower(FeedbackSubmission.email).like(term),
                func.lower(FeedbackSubmission.subject).like(term),
                func.lower(FeedbackSubmission.title).like(term),
                func.lower(FeedbackSubmission.message).like(term)
            )
        )

    total = query.count()
    items = query.order_by(desc(FeedbackSubmission.created_at)).offset(skip).limit(limit).all()

    return {
        "items": [serialize_feedback(item) for item in items],
        "total": total,
        "skip": skip,
        "limit": limit
    }


# =============================================================================
# 5. SUPER ADMIN: Get Single Detail
# =============================================================================
@router.get("/{id}")
def get_feedback_detail(
    id: str,
    current_user: User = Depends(super_admin_required),
    db: Session = Depends(get_db)
):
    item = db.query(FeedbackSubmission).filter(
        FeedbackSubmission.id == id,
        FeedbackSubmission.is_deleted == False
    ).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feedback submission not found.")
    return serialize_feedback(item)


# =============================================================================
# 6. SUPER ADMIN: Update Status, Notes, Assignment, Resolution
# =============================================================================
@router.patch("/{id}")
def update_feedback_submission(
    id: str,
    payload: FeedbackUpdate,
    current_user: User = Depends(super_admin_required),
    db: Session = Depends(get_db)
):
    item = db.query(FeedbackSubmission).filter(
        FeedbackSubmission.id == id,
        FeedbackSubmission.is_deleted == False
    ).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feedback submission not found.")

    if payload.status is not None:
        item.status = payload.status
        item.reviewed_by_id = current_user.id
        item.reviewed_by_name = current_user.full_name
        item.reviewed_at = now_utc()

    if payload.admin_notes is not None:
        item.admin_notes = payload.admin_notes

    if payload.assigned_to_id is not None:
        item.assigned_to_id = payload.assigned_to_id
        item.assigned_to_name = payload.assigned_to_name

    if payload.resolution_details is not None:
        item.resolution_details = payload.resolution_details

    if payload.is_public_testimonial is not None:
        item.is_public_testimonial = payload.is_public_testimonial

    db.commit()
    db.refresh(item)

    return {
        "success": True,
        "message": f"Feedback {item.feedback_code} updated successfully.",
        "submission": serialize_feedback(item)
    }


# =============================================================================
# 7. SUPER ADMIN: Soft Delete
# =============================================================================
@router.delete("/{id}")
def delete_feedback_submission(
    id: str,
    current_user: User = Depends(super_admin_required),
    db: Session = Depends(get_db)
):
    item = db.query(FeedbackSubmission).filter(
        FeedbackSubmission.id == id,
        FeedbackSubmission.is_deleted == False
    ).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feedback submission not found.")

    item.is_deleted = True
    db.commit()

    return {"success": True, "message": f"Feedback {item.feedback_code} removed."}
