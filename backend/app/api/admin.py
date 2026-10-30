import os
import json
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status, Response
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import func, text, desc

from app.database import get_db
from app.models.user import User, Student
from app.models.institution import Institution, Department, Course, Subject
from app.models.exam import Exam, ExamSubmission, AuditLog
from app.models.payment import PaymentOrder, CreditTransaction
from app.models.coupon import CouponCampaign, Coupon, SystemSetting
from app.models.custom_form import CustomForm
from app.models.registration_form import StudentRegistrationForm
from app.models.workspace import Workspace

from app.models.credit_request import CreditRequest
from app.models.institutional_request import InstitutionalRequest
from app.models.support_ticket import SupportTicket, SupportTicketReply
from app.models.notification import Notification
import uuid
from app.utils.security import RoleChecker, get_current_user, get_password_hash
from app.utils.timezone import now_utc
from app.services.coupon_service import coupon_service
from app.schemas.coupon import (
    CouponCampaignCreate,
    CouponCampaignResponse,
    CouponCampaignDetailResponse,
    CouponResponse,
    SystemSettingResponse,
    SystemSettingUpdate
)

router = APIRouter(prefix="/admin", tags=["admin"])

super_admin_required = RoleChecker(["super_admin"])
admin_required = RoleChecker(["super_admin", "inst_admin"])


# =============================================================================
# Request & Response Schemas
# =============================================================================
class UserStatusUpdate(BaseModel):
    is_active: bool

class CreditAdjustmentRequest(BaseModel):
    amount: int = Field(..., description="Credits to add (positive) or deduct (negative)")
    credit_type: str = Field(default="PAID", pattern="^(PAID|BONUS)$")
    reason: str = Field(..., min_length=3, max_length=255)

class InstitutionCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)

class InstitutionUpdateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)

class EmergencyStopRequest(BaseModel):
    reason: str = Field(..., min_length=3, max_length=255)


# =============================================================================
# 1. Overview & Platform Analytics
# =============================================================================
@router.get("/overview")
def get_admin_overview(
    current_user: User = Depends(admin_required),
    db: Session = Depends(get_db)
):
    """
    Returns high-level platform KPI summary metrics for the Admin Dashboard.
    Scoped by institution for inst_admin, global for super_admin.
    """
    user_query = db.query(User).filter(User.is_deleted == False)
    exam_query = db.query(Exam).filter(Exam.is_deleted == False)
    inst_query = db.query(Institution).filter(Institution.is_deleted == False)

    if current_user.role != "super_admin" and current_user.institution_id:
        user_query = user_query.filter(User.institution_id == current_user.institution_id)
        exam_query = exam_query.filter(Exam.institution_id == current_user.institution_id)
        inst_query = inst_query.filter(Institution.id == current_user.institution_id)

    total_users = user_query.count()
    total_teachers = user_query.filter(User.role.in_(["teacher", "inst_admin"])).count()
    total_students = user_query.filter(User.role == "student").count()
    total_admins = user_query.filter(User.role == "super_admin").count()
    total_institutions = inst_query.count()

    total_exams = exam_query.count()
    published_exams = exam_query.filter(Exam.is_published == True).count()
    completed_submissions = db.query(ExamSubmission).filter(ExamSubmission.status == "submitted").count()

    # Financial / Credits totals
    circulating_credits = db.query(func.sum(User.credits_balance)).filter(User.is_deleted == False).scalar() or 0
    circulating_bonus = db.query(func.sum(User.bonus_credits)).filter(User.is_deleted == False).scalar() or 0
    
    total_paid_orders = db.query(PaymentOrder).filter(PaymentOrder.status == "paid").count()
    total_revenue_paise = db.query(func.sum(PaymentOrder.amount)).filter(PaymentOrder.status == "paid").scalar() or 0

    # Coupon totals
    total_campaigns = db.query(CouponCampaign).filter(CouponCampaign.is_deleted == False).count()
    total_coupons = db.query(Coupon).filter(Coupon.is_deleted == False).count()
    redeemed_coupons = db.query(Coupon).filter(Coupon.status == "REDEEMED").count()

    # Recent Audit Events
    recent_audits = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(8).all()
    audit_list = []
    for a in recent_audits:
        actor = db.query(User).filter(User.id == a.user_id).first() if a.user_id else None
        audit_list.append({
            "id": a.id,
            "action": a.action,
            "actor_name": actor.full_name if actor else "System / Anonymous",
            "actor_email": actor.email if actor else "system",
            "details": a.details,
            "timestamp": a.timestamp.isoformat() if a.timestamp else None
        })

    return {
        "stats": {
            "total_users": total_users,
            "total_teachers": total_teachers,
            "total_students": total_students,
            "total_admins": total_admins,
            "total_institutions": total_institutions,
            "total_exams": total_exams,
            "published_exams": published_exams,
            "completed_submissions": completed_submissions,
            "circulating_regular_credits": circulating_credits,
            "circulating_bonus_credits": circulating_bonus,
            "total_available_credits": circulating_credits + circulating_bonus,
            "total_paid_orders": total_paid_orders,
            "total_revenue_inr": round(total_revenue_paise / 100, 2),
            "total_coupon_campaigns": total_campaigns,
            "total_coupons_generated": total_coupons,
            "total_coupons_redeemed": redeemed_coupons,
            # Credit Requests & Support KPIs
            "pending_credit_requests": db.query(CreditRequest).filter(CreditRequest.status == "Pending", CreditRequest.is_deleted == False).count(),
            "under_review_credit_requests": db.query(CreditRequest).filter(CreditRequest.status == "Under Review", CreditRequest.is_deleted == False).count(),
            "approved_credit_requests": db.query(CreditRequest).filter(CreditRequest.status == "Approved", CreditRequest.is_deleted == False).count(),
            "issued_credit_requests": db.query(CreditRequest).filter(CreditRequest.status == "Credits Issued", CreditRequest.is_deleted == False).count(),
            "total_credit_requests": db.query(CreditRequest).filter(CreditRequest.is_deleted == False).count(),
            "total_credits_granted": db.query(func.sum(CreditRequest.approved_credits)).filter(CreditRequest.credits_issued == True, CreditRequest.is_deleted == False).scalar() or 0,
            "new_support_tickets": db.query(SupportTicket).filter(SupportTicket.status == "New", SupportTicket.is_deleted == False).count(),
            "open_support_tickets": db.query(SupportTicket).filter(SupportTicket.status.in_(["Open", "In Progress"]), SupportTicket.is_deleted == False).count(),
            "urgent_support_tickets": db.query(SupportTicket).filter(SupportTicket.priority == "Urgent", SupportTicket.status.notin_(["Resolved", "Closed"]), SupportTicket.is_deleted == False).count(),
            "resolved_support_tickets": db.query(SupportTicket).filter(SupportTicket.status == "Resolved", SupportTicket.is_deleted == False).count(),
            "total_support_tickets": db.query(SupportTicket).filter(SupportTicket.is_deleted == False).count(),
            # Institutional Plan Requests KPIs
            "total_institutional_requests": db.query(InstitutionalRequest).filter(InstitutionalRequest.is_deleted == False).count(),
            "pending_institutional_requests": db.query(InstitutionalRequest).filter(InstitutionalRequest.status == "Pending Review", InstitutionalRequest.is_deleted == False).count(),
            "under_review_institutional_requests": db.query(InstitutionalRequest).filter(InstitutionalRequest.status == "Under Review", InstitutionalRequest.is_deleted == False).count(),
            "proposal_sent_institutional_requests": db.query(InstitutionalRequest).filter(InstitutionalRequest.status == "Proposal Sent", InstitutionalRequest.is_deleted == False).count(),
            "approved_institutional_requests": db.query(InstitutionalRequest).filter(InstitutionalRequest.status == "Approved", InstitutionalRequest.is_deleted == False).count(),
            "rejected_institutional_requests": db.query(InstitutionalRequest).filter(InstitutionalRequest.status == "Rejected", InstitutionalRequest.is_deleted == False).count(),
            "total_vouchers_requested": db.query(func.sum(InstitutionalRequest.vouchers_requested)).filter(InstitutionalRequest.is_deleted == False).scalar() or 0,
        },
        "recent_activity": audit_list,
        "recent_credit_requests": [
            {
                "id": cr.id,
                "request_code": cr.request_code,
                "name": cr.name,
                "email": cr.email,
                "institution_name": cr.institution_name,
                "requested_credits": cr.requested_credits,
                "approved_credits": cr.approved_credits,
                "status": cr.status,
                "credits_issued": cr.credits_issued,
                "created_at": cr.created_at.isoformat() if cr.created_at else None
            }
            for cr in db.query(CreditRequest).filter(CreditRequest.is_deleted == False).order_by(CreditRequest.created_at.desc()).limit(5).all()
        ],
        "recent_support_tickets": [
            {
                "id": st.id,
                "ticket_code": st.ticket_code,
                "name": st.name,
                "email": st.email,
                "subject": st.subject,
                "category": st.category,
                "priority": st.priority,
                "status": st.status,
                "created_at": st.created_at.isoformat() if st.created_at else None
            }
            for st in db.query(SupportTicket).filter(SupportTicket.is_deleted == False).order_by(SupportTicket.created_at.desc()).limit(5).all()
        ]
    }


# =============================================================================
# 2. User Management
# =============================================================================
@router.get("/users")
def list_admin_users(
    role: Optional[str] = None,
    status_filter: Optional[str] = None, # "active", "inactive"
    institution_id: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=5, le=100),
    current_user: User = Depends(admin_required),
    db: Session = Depends(get_db)
):
    """
    Searchable, filterable, and paginated directory of all platform users.
    """
    query = db.query(User).filter(User.is_deleted == False)

    if current_user.role != "super_admin" and current_user.institution_id:
        query = query.filter(User.institution_id == current_user.institution_id)
    elif institution_id:
        query = query.filter(User.institution_id == institution_id)

    if role:
        query = query.filter(User.role == role)

    if status_filter == "active":
        query = query.filter(User.is_active == True)
    elif status_filter == "inactive":
        query = query.filter(User.is_active == False)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (User.email.ilike(s)) |
            (User.full_name.ilike(s))
        )

    total_count = query.count()
    offset = (page - 1) * page_size
    users = query.order_by(User.created_at.desc()).offset(offset).limit(page_size).all()

    items = []
    for u in users:
        inst = db.query(Institution).filter(Institution.id == u.institution_id).first() if u.institution_id else None
        items.append({
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "is_active": u.is_active,
            "institution_id": u.institution_id,
            "institution_name": u.institution_name or (inst.name if inst else None),
            "department": u.department,
            "class_name": u.class_name,
            "section": u.section,
            "batch": u.batch,
            "phone": u.phone,
            "avatar_url": u.avatar_url,
            "auth_provider": u.auth_provider,
            "credits_balance": u.credits_balance or 0,
            "bonus_credits": u.bonus_credits or 0,
            "total_credits": u.total_available_credits,
            "bonus_credits_expires_at": u.bonus_credits_expires_at.isoformat() if u.bonus_credits_expires_at else None,
            "last_login_at": u.last_login_at.isoformat() if u.last_login_at else None,
            "created_at": u.created_at.isoformat() if u.created_at else None
        })

    return {
        "items": items,
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": (total_count + page_size - 1) // page_size
    }


@router.get("/users/{user_id}")
def get_user_detail(
    user_id: str,
    current_user: User = Depends(admin_required),
    db: Session = Depends(get_db)
):
    """Fetches full profile, wallet balances, workspaces, and exams for a user."""
    user = db.query(User).filter(User.id == user_id, User.is_deleted == False).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if current_user.role != "super_admin" and user.institution_id != current_user.institution_id:
        raise HTTPException(status_code=403, detail="Access denied to this user")

    inst = db.query(Institution).filter(Institution.id == user.institution_id).first() if user.institution_id else None
    student_profile = db.query(Student).filter(Student.user_id == user.id).first()

    # Recent credit transactions
    txs = db.query(CreditTransaction).filter(
        CreditTransaction.user_id == user.id
    ).order_by(CreditTransaction.created_at.desc()).limit(10).all()

    # User exams (if teacher)
    exams_created = db.query(Exam).filter(Exam.created_by == user.id, Exam.is_deleted == False).count()

    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "is_active": user.is_active,
        "institution_id": user.institution_id,
        "institution_name": user.institution_name or (inst.name if inst else "Personal / None"),
        "department": user.department,
        "class_name": user.class_name,
        "section": user.section,
        "batch": user.batch,
        "phone": user.phone,
        "auth_provider": user.auth_provider,
        "avatar_url": user.avatar_url,
        "credits_balance": user.credits_balance or 0,
        "bonus_credits": user.bonus_credits or 0,
        "total_available_credits": user.total_available_credits,
        "bonus_credits_expires_at": user.bonus_credits_expires_at.isoformat() if user.bonus_credits_expires_at else None,
        "bonus_days_remaining": user.bonus_days_remaining,
        "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "student_profile": {
            "roll_number": student_profile.roll_number,
            "status": student_profile.status,
            "division": student_profile.division,
            "batch": student_profile.batch
        } if student_profile else None,
        "exams_created_count": exams_created,
        "recent_transactions": [
            {
                "id": t.id,
                "type": t.transaction_type,
                "amount": t.amount_credits,
                "balance_after": t.balance_after,
                "description": t.description,
                "created_at": t.created_at.isoformat()
            } for t in txs
        ]
    }


@router.patch("/users/{user_id}/status")
def update_user_status(
    user_id: str,
    payload: UserStatusUpdate,
    current_user: User = Depends(super_admin_required),
    db: Session = Depends(get_db)
):
    """Activates or deactivates a user account."""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Administrators cannot deactivate their own account")

    user = db.query(User).filter(User.id == user_id, User.is_deleted == False).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    old_status = user.is_active
    user.is_active = payload.is_active
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="USER_STATUS_UPDATED",
        details=json.dumps({
            "target_user_id": user.id,
            "target_email": user.email,
            "old_active": old_status,
            "new_active": user.is_active
        })
    )
    db.add(audit)
    db.commit()
    return {"success": True, "message": f"User '{user.email}' is now {'active' if user.is_active else 'inactive'}."}


@router.post("/users/{user_id}/adjust-credits")
def adjust_user_credits(
    user_id: str,
    payload: CreditAdjustmentRequest,
    current_user: User = Depends(super_admin_required),
    db: Session = Depends(get_db)
):
    """
    Manually grants or deducts credits from a user wallet.
    Maintains financial ledger integrity by recording an immutable CreditTransaction and AuditLog.
    """
    user = db.query(User).filter(User.id == user_id, User.is_deleted == False).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.credit_type == "BONUS":
        if payload.amount < 0 and abs(payload.amount) > (user.bonus_credits or 0):
            raise HTTPException(status_code=400, detail="Cannot deduct more bonus credits than user possesses")
        user.bonus_credits = max(0, (user.bonus_credits or 0) + payload.amount)
        if payload.amount > 0 and not user.bonus_credits_expires_at:
            from datetime import timedelta
            user.bonus_credits_expires_at = now_utc() + timedelta(days=30)
    else:
        if payload.amount < 0 and abs(payload.amount) > (user.credits_balance or 0):
            raise HTTPException(status_code=400, detail="Cannot deduct more credits than user balance")
        user.credits_balance = max(0, (user.credits_balance or 0) + payload.amount)

    new_total = user.total_available_credits

    # Record CreditTransaction
    credit_tx = CreditTransaction(
        user_id=user.id,
        transaction_type="ADMIN_ADJUSTMENT",
        amount_credits=payload.amount,
        balance_after=new_total,
        description=f"Admin credit adjustment: {payload.reason} (by {current_user.email})"
    )
    db.add(credit_tx)

    # Record AuditLog
    audit = AuditLog(
        user_id=current_user.id,
        action="USER_CREDITS_ADJUSTED",
        details=json.dumps({
            "target_user_id": user.id,
            "target_email": user.email,
            "amount": payload.amount,
            "credit_type": payload.credit_type,
            "reason": payload.reason,
            "new_balance": new_total
        })
    )
    db.add(audit)
    db.commit()
    db.refresh(user)

    return {
        "success": True,
        "message": f"Successfully adjusted {payload.amount:+d} credits. New total available: {new_total:,} credits.",
        "new_balance": new_total
    }


@router.delete("/users/{user_id}")
def delete_user(
    user_id: str,
    force: bool = Query(False),
    current_user: User = Depends(super_admin_required),
    db: Session = Depends(get_db)
):
    """
    Safely soft-deletes a user.
    Prevents accidental deletion of users associated with active exams or paid orders unless force=True.
    """
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Administrators cannot delete their own account")

    user = db.query(User).filter(User.id == user_id, User.is_deleted == False).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Dependency validation
    has_active_exams = db.query(Exam).filter(Exam.created_by == user.id, Exam.status == "published", Exam.is_deleted == False).count()
    if has_active_exams > 0 and not force:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete user: User owns {has_active_exams} active published assessment(s). Archive or unpublish exams first, or pass force=true."
        )

    user.is_deleted = True
    user.is_active = False

    audit = AuditLog(
        user_id=current_user.id,
        action="USER_DELETED",
        details=json.dumps({"deleted_user_id": user.id, "email": user.email, "role": user.role})
    )
    db.add(audit)
    db.commit()
    return {"success": True, "message": f"User '{user.email}' has been safely archived/soft-deleted."}


# =============================================================================
# 3. Institutions & Academic Governance
# =============================================================================
@router.get("/institutions")
def list_admin_institutions(
    current_user: User = Depends(admin_required),
    db: Session = Depends(get_db)
):
    """Lists institutions with member counts and department breakdown."""
    query = db.query(Institution).filter(Institution.is_deleted == False)
    if current_user.role != "super_admin" and current_user.institution_id:
        query = query.filter(Institution.id == current_user.institution_id)

    institutions = query.order_by(Institution.name.asc()).all()
    res = []
    for inst in institutions:
        teachers_count = db.query(User).filter(User.institution_id == inst.id, User.role.in_(["teacher", "inst_admin"]), User.is_deleted == False).count()
        students_count = db.query(User).filter(User.institution_id == inst.id, User.role == "student", User.is_deleted == False).count()
        depts_count = db.query(Department).filter(Department.institution_id == inst.id, Department.is_deleted == False).count()
        exams_count = db.query(Exam).filter(Exam.institution_id == inst.id, Exam.is_deleted == False).count()

        res.append({
            "id": inst.id,
            "name": inst.name,
            "teachers_count": teachers_count,
            "students_count": students_count,
            "departments_count": depts_count,
            "exams_count": exams_count,
            "created_at": inst.created_at.isoformat() if inst.created_at else None
        })
    return res


@router.post("/institutions")
def create_institution(
    payload: InstitutionCreateRequest,
    current_user: User = Depends(super_admin_required),
    db: Session = Depends(get_db)
):
    """Creates a new educational institution."""
    existing = db.query(Institution).filter(
        Institution.name.ilike(payload.name.strip()),
        Institution.is_deleted == False
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="An institution with this name already exists")

    inst = Institution(name=payload.name.strip())
    db.add(inst)
    db.flush()

    audit = AuditLog(
        user_id=current_user.id,
        action="INSTITUTION_CREATED",
        details=json.dumps({"institution_id": inst.id, "name": inst.name})
    )
    db.add(audit)
    db.commit()
    db.refresh(inst)
    return {"id": inst.id, "name": inst.name, "message": "Institution created successfully."}


# =============================================================================
# 4. Assessment Governance
# =============================================================================
@router.get("/exams")
def list_admin_exams(
    status_filter: Optional[str] = None,
    institution_id: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=5, le=100),
    current_user: User = Depends(admin_required),
    db: Session = Depends(get_db)
):
    """Platform-wide assessment governance view."""
    query = db.query(Exam).filter(Exam.is_deleted == False)

    if current_user.role != "super_admin" and current_user.institution_id:
        query = query.filter(Exam.institution_id == current_user.institution_id)
    elif institution_id:
        query = query.filter(Exam.institution_id == institution_id)

    if status_filter == "published":
        query = query.filter(Exam.is_published == True)
    elif status_filter == "draft":
        query = query.filter(Exam.is_published == False)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter((Exam.name.ilike(s)) | (Exam.exam_code.ilike(s)))

    total_count = query.count()
    offset = (page - 1) * page_size
    exams = query.order_by(Exam.created_at.desc()).offset(offset).limit(page_size).all()

    items = []
    now = now_utc()
    for e in exams:
        creator = db.query(User).filter(User.id == e.created_by).first()
        inst = db.query(Institution).filter(Institution.id == e.institution_id).first() if e.institution_id else None
        submissions_count = db.query(ExamSubmission).filter(ExamSubmission.exam_id == e.id, ExamSubmission.status == "submitted").count()

        end = e.end_time
        if end.tzinfo is None:
            end = end.replace(tzinfo=now.tzinfo)
        computed_status = "completed" if now > end else ("published" if e.is_published else "draft")

        q_count = len(e.questions) if e.questions else 0
        items.append({
            "id": e.id,
            "name": e.name,
            "exam_code": e.exam_code,
            "status": computed_status,
            "creator_name": creator.full_name if creator else "Unknown",
            "creator_email": creator.email if creator else "unknown",
            "institution_name": inst.name if inst else "Personal",
            "questions_count": q_count,
            "duration_minutes": e.duration_minutes,
            "total_marks": e.total_marks,
            "is_paid": e.is_paid,
            "submissions_count": submissions_count,
            "created_at": e.created_at.isoformat() if e.created_at else None
        })

    return {
        "items": items,
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": (total_count + page_size - 1) // page_size
    }


@router.post("/exams/{exam_id}/emergency-stop")
def emergency_stop_exam(
    exam_id: str,
    payload: EmergencyStopRequest,
    current_user: User = Depends(super_admin_required),
    db: Session = Depends(get_db)
):
    """Immediately stops and closes an assessment across all active testing candidates."""
    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.is_deleted == False).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Assessment not found")

    exam.is_published = False
    exam.end_time = now_utc()

    audit = AuditLog(
        user_id=current_user.id,
        action="EXAM_EMERGENCY_STOPPED",
        details=json.dumps({
            "exam_id": exam.id,
            "name": exam.name,
            "exam_code": exam.exam_code,
            "reason": payload.reason
        })
    )
    db.add(audit)
    db.commit()
    return {"success": True, "message": f"Assessment '{exam.name}' has been terminated."}


# =============================================================================
# 5. Financial & Credit Ledger Governance
# =============================================================================
@router.get("/credits/transactions")
def list_admin_credit_transactions(
    transaction_type: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=10, le=100),
    current_user: User = Depends(super_admin_required),
    db: Session = Depends(get_db)
):
    """Global immutable credit transaction ledger."""
    query = db.query(CreditTransaction).join(User, CreditTransaction.user_id == User.id)

    if transaction_type:
        query = query.filter(CreditTransaction.transaction_type == transaction_type)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (User.email.ilike(s)) |
            (User.full_name.ilike(s)) |
            (CreditTransaction.description.ilike(s))
        )

    total_count = query.count()
    offset = (page - 1) * page_size
    txs = query.order_by(CreditTransaction.created_at.desc()).offset(offset).limit(page_size).all()

    items = []
    for t in txs:
        u = db.query(User).filter(User.id == t.user_id).first()
        items.append({
            "id": t.id,
            "user_id": t.user_id,
            "user_email": u.email if u else "unknown",
            "user_name": u.full_name if u else "Unknown",
            "transaction_type": t.transaction_type,
            "amount_credits": t.amount_credits,
            "balance_after": t.balance_after,
            "description": t.description,
            "created_at": t.created_at.isoformat() if t.created_at else None
        })

    return {
        "items": items,
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": (total_count + page_size - 1) // page_size
    }


# =============================================================================
# 6. Coupon Campaign Management
# =============================================================================
@router.get("/coupons/campaigns", response_model=List[CouponCampaignResponse])
def list_coupon_campaigns(
    current_user: User = Depends(super_admin_required),
    db: Session = Depends(get_db)
):
    """Lists all coupon and voucher campaigns."""
    campaigns = db.query(CouponCampaign).filter(
        CouponCampaign.is_deleted == False
    ).order_by(CouponCampaign.created_at.desc()).all()
    return campaigns


@router.post("/coupons/campaigns", response_model=CouponCampaignResponse)
def create_coupon_campaign(
    payload: CouponCampaignCreate,
    current_user: User = Depends(super_admin_required),
    db: Session = Depends(get_db)
):
    """
    Creates a new campaign and bulk generates unique voucher codes.
    Guarantees exact quantity and uniqueness.
    """
    return coupon_service.create_campaign(payload=payload, creator=current_user, db=db)


@router.get("/coupons/campaigns/{campaign_id}", response_model=CouponCampaignDetailResponse)
def get_coupon_campaign_detail(
    campaign_id: str,
    current_user: User = Depends(super_admin_required),
    db: Session = Depends(get_db)
):
    """Fetches details of a campaign including all generated vouchers."""
    campaign = db.query(CouponCampaign).filter(
        CouponCampaign.id == campaign_id,
        CouponCampaign.is_deleted == False
    ).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    coupons = db.query(Coupon).filter(
        Coupon.campaign_id == campaign.id,
        Coupon.is_deleted == False
    ).order_by(Coupon.created_at.asc()).all()

    resp = CouponCampaignDetailResponse.model_validate(campaign)
    resp.coupons = [CouponResponse.model_validate(c) for c in coupons]
    return resp


@router.get("/coupons/campaigns/{campaign_id}/export-csv")
def export_coupon_campaign_csv(
    campaign_id: str,
    current_user: User = Depends(super_admin_required),
    db: Session = Depends(get_db)
):
    """Exports all vouchers in a campaign as a downloadable CSV."""
    csv_data = coupon_service.export_campaign_csv(campaign_id=campaign_id, db=db)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=coupons_{campaign_id[:8]}.csv"}
    )


@router.post("/coupons/campaigns/{campaign_id}/revoke")
def revoke_coupon_campaign(
    campaign_id: str,
    current_user: User = Depends(super_admin_required),
    db: Session = Depends(get_db)
):
    """Revokes an entire campaign and cancels all unused vouchers."""
    campaign = coupon_service.revoke_campaign(campaign_id=campaign_id, admin_user=current_user, db=db)
    return {"success": True, "message": f"Campaign '{campaign.name}' and all unused vouchers have been revoked."}


@router.post("/coupons/{coupon_id}/revoke")
def revoke_individual_coupon(
    coupon_id: str,
    reason: Optional[str] = Query(None),
    current_user: User = Depends(super_admin_required),
    db: Session = Depends(get_db)
):
    """Revokes an individual voucher."""
    coupon = coupon_service.revoke_coupon(coupon_id=coupon_id, admin_user=current_user, reason=reason, db=db)
    return {"success": True, "message": f"Coupon '{coupon.code}' has been revoked."}


# =============================================================================
# 7. Audit Trail
# =============================================================================
@router.get("/audit-logs")
def list_admin_audit_logs(
    action: Optional[str] = None,
    user_id: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=10, le=100),
    current_user: User = Depends(super_admin_required),
    db: Session = Depends(get_db)
):
    """Filterable administrative audit logs."""
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)

    total_count = query.count()
    offset = (page - 1) * page_size
    logs = query.order_by(AuditLog.timestamp.desc()).offset(offset).limit(page_size).all()

    items = []
    for l in logs:
        actor = db.query(User).filter(User.id == l.user_id).first() if l.user_id else None
        items.append({
            "id": l.id,
            "action": l.action,
            "actor_id": l.user_id,
            "actor_name": actor.full_name if actor else "System",
            "actor_email": actor.email if actor else "system",
            "details": l.details,
            "timestamp": l.timestamp.isoformat() if l.timestamp else None
        })

    return {
        "items": items,
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": (total_count + page_size - 1) // page_size
    }


# =============================================================================
# 8. System Settings
# =============================================================================
@router.get("/settings", response_model=List[SystemSettingResponse])
def get_system_settings(
    current_user: User = Depends(super_admin_required),
    db: Session = Depends(get_db)
):
    """Lists all configurable platform settings."""
    return db.query(SystemSetting).filter(SystemSetting.is_deleted == False).all()


@router.put("/settings/{key}", response_model=SystemSettingResponse)
def update_system_setting(
    key: str,
    payload: SystemSettingUpdate,
    current_user: User = Depends(super_admin_required),
    db: Session = Depends(get_db)
):
    """Updates a system setting value (e.g. signup_bonus_credits)."""
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if not setting:
        raise HTTPException(status_code=404, detail=f"Setting '{key}' not found")

    old_val = setting.value
    setting.value = payload.value.strip()

    audit = AuditLog(
        user_id=current_user.id,
        action="SYSTEM_SETTING_UPDATED",
        details=json.dumps({"key": key, "old_value": old_val, "new_value": setting.value})
    )
    db.add(audit)
    db.commit()
    db.refresh(setting)
    return setting


# =============================================================================
# 9. Operational Diagnostics
# =============================================================================
@router.get("/system/diagnostics")
def get_system_diagnostics(
    current_user: User = Depends(super_admin_required),
    db: Session = Depends(get_db)
):
    """Operational diagnostics, DB file size, table row counts, upload directory size."""
    from app.config import settings as cfg

    # Database size
    db_size_bytes = 0
    db_path = cfg.DATABASE_URL.replace("sqlite:///", "")
    if os.path.exists(db_path):
        db_size_bytes = os.path.getsize(db_path)

    # Uploads size
    uploads_size_bytes = 0
    if os.path.exists(cfg.UPLOAD_DIR):
        for root, dirs, files in os.walk(cfg.UPLOAD_DIR):
            for f in files:
                uploads_size_bytes += os.path.getsize(os.path.join(root, f))

    # Row counts
    table_counts = {
        "users": db.query(User).count(),
        "institutions": db.query(Institution).count(),
        "exams": db.query(Exam).count(),
        "submissions": db.query(ExamSubmission).count(),
        "payment_orders": db.query(PaymentOrder).count(),
        "credit_transactions": db.query(CreditTransaction).count(),
        "coupon_campaigns": db.query(CouponCampaign).count(),
        "coupons": db.query(Coupon).count(),
        "audit_logs": db.query(AuditLog).count()
    }

    return {
        "status": "operational",
        "environment": cfg.ENVIRONMENT,
        "database": {
            "type": "sqlite" if "sqlite" in cfg.DATABASE_URL else "postgresql",
            "size_mb": round(db_size_bytes / (1024 * 1024), 2),
            "table_counts": table_counts
        },
        "storage": {
            "uploads_dir": cfg.UPLOAD_DIR,
            "size_mb": round(uploads_size_bytes / (1024 * 1024), 2)
        },
        "ai_engine": {
            "status": "enabled" if cfg.GEMINI_API_KEY else "disabled"
        }
    }


# =============================================================================
# 10. Teacher Free Credit Requests Management (10,000 Credits)
# =============================================================================

class CreditRequestUpdate(BaseModel):
    status: Optional[str] = Field(None, description="Pending, Under Review, Approved, Rejected, Credits Issued")
    approved_credits: Optional[int] = Field(None, ge=0)
    assigned_to_id: Optional[str] = None
    assigned_to_name: Optional[str] = None
    admin_notes: Optional[str] = None
    decision_reason: Optional[str] = None

class IssueCreditsRequest(BaseModel):
    credits: Optional[int] = Field(None, ge=1, description="Credits to issue (defaults to approved or requested)")
    note: Optional[str] = None


@router.get("/credit-requests")
def list_credit_requests(
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(admin_required),
    db: Session = Depends(get_db)
):
    """
    Search, filter, and paginate teacher free credit / institutional requests.
    Includes comprehensive KPI summary counts.
    """
    base_query = db.query(CreditRequest).filter(CreditRequest.is_deleted == False)

    # Summary metrics across all requests
    total_count = base_query.count()
    pending_count = db.query(CreditRequest).filter(CreditRequest.is_deleted == False, CreditRequest.status == "Pending").count()
    under_review_count = db.query(CreditRequest).filter(CreditRequest.is_deleted == False, CreditRequest.status == "Under Review").count()
    approved_count = db.query(CreditRequest).filter(CreditRequest.is_deleted == False, CreditRequest.status == "Approved").count()
    issued_count = db.query(CreditRequest).filter(CreditRequest.is_deleted == False, CreditRequest.status == "Credits Issued").count()
    rejected_count = db.query(CreditRequest).filter(CreditRequest.is_deleted == False, CreditRequest.status == "Rejected").count()
    
    total_credits_granted = db.query(func.sum(CreditRequest.approved_credits)).filter(
        CreditRequest.is_deleted == False, CreditRequest.credits_issued == True
    ).scalar() or 0

    query = base_query
    if status_filter and status_filter.lower() != "all":
        query = query.filter(CreditRequest.status == status_filter)

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            (CreditRequest.request_code.ilike(search_pattern)) |
            (CreditRequest.name.ilike(search_pattern)) |
            (CreditRequest.email.ilike(search_pattern)) |
            (CreditRequest.institution_name.ilike(search_pattern)) |
            (CreditRequest.department.ilike(search_pattern))
        )

    filtered_total = query.count()
    items = query.order_by(CreditRequest.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    result_items = []
    for r in items:
        # Check if user account exists
        user_account = db.query(User).filter(
            (User.id == r.user_id) | (User.email == r.email.lower().strip())
        ).first() if (r.user_id or r.email) else None

        result_items.append({
            "id": r.id,
            "request_code": r.request_code,
            "user_id": r.user_id or (user_account.id if user_account else None),
            "user_registered": user_account is not None,
            "user_current_balance": user_account.credits_balance if user_account else 0,
            "user_bonus_balance": user_account.bonus_credits if user_account else 0,
            "name": r.name,
            "email": r.email,
            "phone": r.phone,
            "institution_name": r.institution_name,
            "department": r.department,
            "designation": r.designation,
            "institution_email": r.institution_email,
            "requested_credits": r.requested_credits,
            "approved_credits": r.approved_credits,
            "purpose": r.purpose,
            "estimated_students": r.estimated_students,
            "status": r.status,
            "assigned_to_id": r.assigned_to_id,
            "assigned_to_name": r.assigned_to_name,
            "admin_notes": r.admin_notes,
            "decision_reason": r.decision_reason,
            "decision_date": r.decision_date.isoformat() if r.decision_date else None,
            "decided_by_admin_id": r.decided_by_admin_id,
            "credits_issued": r.credits_issued,
            "credits_issued_at": r.credits_issued_at.isoformat() if r.credits_issued_at else None,
            "issued_by_admin_id": r.issued_by_admin_id,
            "credit_transaction_id": r.credit_transaction_id,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "updated_at": r.updated_at.isoformat() if r.updated_at else None
        })

    return {
        "items": result_items,
        "summary": {
            "total_requests": total_count,
            "pending_requests": pending_count,
            "under_review_requests": under_review_count,
            "approved_requests": approved_count,
            "issued_requests": issued_count,
            "rejected_requests": rejected_count,
            "total_credits_granted": int(total_credits_granted)
        },
        "page": page,
        "page_size": page_size,
        "total": filtered_total,
        "total_pages": max(1, (filtered_total + page_size - 1) // page_size)
    }


@router.get("/credit-requests/{request_id}")
def get_credit_request_detail(
    request_id: str,
    current_user: User = Depends(admin_required),
    db: Session = Depends(get_db)
):
    """
    Retrieves full details of a specific credit request, including linked user account,
    wallet balance, and transaction history.
    """
    req = db.query(CreditRequest).filter(CreditRequest.id == request_id, CreditRequest.is_deleted == False).first()
    if not req:
        raise HTTPException(status_code=404, detail="Credit request not found")

    user_account = db.query(User).filter(
        (User.id == req.user_id) | (User.email == req.email.lower().strip())
    ).first() if (req.user_id or req.email) else None

    txn = db.query(CreditTransaction).filter(CreditTransaction.id == req.credit_transaction_id).first() if req.credit_transaction_id else None

    return {
        "id": req.id,
        "request_code": req.request_code,
        "user_id": req.user_id or (user_account.id if user_account else None),
        "user_registered": user_account is not None,
        "user_details": {
            "id": user_account.id,
            "full_name": user_account.full_name,
            "email": user_account.email,
            "role": user_account.role,
            "credits_balance": user_account.credits_balance,
            "bonus_credits": user_account.bonus_credits,
            "is_active": user_account.is_active,
            "created_at": user_account.created_at.isoformat() if user_account.created_at else None
        } if user_account else None,
        "name": req.name,
        "email": req.email,
        "phone": req.phone,
        "institution_name": req.institution_name,
        "department": req.department,
        "designation": req.designation,
        "institution_email": req.institution_email,
        "requested_credits": req.requested_credits,
        "approved_credits": req.approved_credits,
        "purpose": req.purpose,
        "estimated_students": req.estimated_students,
        "status": req.status,
        "assigned_to_id": req.assigned_to_id,
        "assigned_to_name": req.assigned_to_name,
        "admin_notes": req.admin_notes,
        "decision_reason": req.decision_reason,
        "decision_date": req.decision_date.isoformat() if req.decision_date else None,
        "decided_by_admin_id": req.decided_by_admin_id,
        "credits_issued": req.credits_issued,
        "credits_issued_at": req.credits_issued_at.isoformat() if req.credits_issued_at else None,
        "issued_by_admin_id": req.issued_by_admin_id,
        "credit_transaction": {
            "id": txn.id,
            "amount_credits": txn.amount_credits,
            "balance_after": txn.balance_after,
            "transaction_type": txn.transaction_type,
            "description": txn.description,
            "created_at": txn.created_at.isoformat() if txn.created_at else None
        } if txn else None,
        "created_at": req.created_at.isoformat() if req.created_at else None,
        "updated_at": req.updated_at.isoformat() if req.updated_at else None
    }


@router.patch("/credit-requests/{request_id}")
def update_credit_request(
    request_id: str,
    payload: CreditRequestUpdate,
    current_user: User = Depends(admin_required),
    db: Session = Depends(get_db)
):
    """
    Updates status, notes, assignment, or approved credit amount for a credit request.
    Does NOT issue credits directly unless 'issue-credits' endpoint is triggered.
    """
    req = db.query(CreditRequest).filter(CreditRequest.id == request_id, CreditRequest.is_deleted == False).first()
    if not req:
        raise HTTPException(status_code=404, detail="Credit request not found")

    old_status = req.status

    if payload.status is not None:
        valid_statuses = ["Pending", "Under Review", "Approved", "Rejected", "Credits Issued"]
        if payload.status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
        req.status = payload.status

        if payload.status in ["Approved", "Rejected"]:
            req.decision_date = now_utc()
            req.decided_by_admin_id = current_user.id
            if payload.decision_reason:
                req.decision_reason = payload.decision_reason

    if payload.approved_credits is not None:
        req.approved_credits = payload.approved_credits

    if payload.assigned_to_id is not None:
        req.assigned_to_id = payload.assigned_to_id
        if payload.assigned_to_name:
            req.assigned_to_name = payload.assigned_to_name
        else:
            assignee = db.query(User).filter(User.id == payload.assigned_to_id).first()
            if assignee:
                req.assigned_to_name = assignee.full_name or assignee.email

    if payload.admin_notes is not None:
        req.admin_notes = payload.admin_notes

    if payload.decision_reason is not None:
        req.decision_reason = payload.decision_reason

    db.commit()
    db.refresh(req)

    # Audit log
    audit = AuditLog(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        action="UPDATE_CREDIT_REQUEST",
        details=json.dumps({
            "request_code": req.request_code,
            "old_status": old_status,
            "new_status": req.status,
            "approved_credits": req.approved_credits,
            "assigned_to": req.assigned_to_name
        }),
        timestamp=now_utc()
    )
    db.add(audit)

    # In-app notification to teacher if registered
    target_user_id = req.user_id
    if not target_user_id:
        target_user = db.query(User).filter(User.email == req.email.lower().strip()).first()
        if target_user:
            target_user_id = target_user.id

    if target_user_id and old_status != req.status:
        try:
            status_emoji = "✅" if req.status == "Approved" else ("❌" if req.status == "Rejected" else "ℹ️")
            notif = Notification(
                id=str(uuid.uuid4()),
                user_id=target_user_id,
                title=f"{status_emoji} Credit Request {req.status}: {req.request_code}",
                message=f"Your institutional credit application for {req.institution_name} has moved to '{req.status}'.",
                type="success" if req.status == "Approved" else "info",
                link="/dashboard/teacher/profile"
            )
            db.add(notif)
        except Exception:
            pass

    db.commit()

    return {"success": True, "message": f"Credit request updated to '{req.status}'", "request": {"id": req.id, "status": req.status, "approved_credits": req.approved_credits}}


@router.post("/credit-requests/{request_id}/issue-credits")
def issue_credits_to_teacher(
    request_id: str,
    payload: IssueCreditsRequest,
    current_user: User = Depends(super_admin_required),
    db: Session = Depends(get_db)
):
    """
    Traceable & Idempotent Credit Issuance.
    Validates that credits have not been previously issued.
    Increments user wallet balance, records CreditTransaction, AuditLog, and Notification.
    """
    req = db.query(CreditRequest).filter(CreditRequest.id == request_id, CreditRequest.is_deleted == False).first()
    if not req:
        raise HTTPException(status_code=404, detail="Credit request not found")

    # Idempotency check: Cannot issue twice!
    if req.credits_issued:
        raise HTTPException(
            status_code=400,
            detail=f"Credits have already been issued for this request on {req.credits_issued_at}. Transaction ID: {req.credit_transaction_id}"
        )

    # Find the target teacher user
    target_user = None
    if req.user_id:
        target_user = db.query(User).filter(User.id == req.user_id, User.is_deleted == False).first()

    if not target_user and req.email:
        target_user = db.query(User).filter(User.email == req.email.lower().strip(), User.is_deleted == False).first()

    if not target_user:
        raise HTTPException(
            status_code=400,
            detail=f"No active user account found matching email '{req.email}'. The teacher must register on Testora Quiz before credits can be deposited."
        )

    credits_to_grant = payload.credits or req.approved_credits or req.requested_credits or 10000

    # Ensure integer > 0
    if credits_to_grant <= 0:
        raise HTTPException(status_code=400, detail="Credit amount must be greater than zero.")

    # Update teacher balance safely
    target_user.credits_balance = (target_user.credits_balance or 0) + credits_to_grant
    target_user.bonus_credits = (target_user.bonus_credits or 0) + credits_to_grant

    # Record immutable CreditTransaction
    txn = CreditTransaction(
        id=str(uuid.uuid4()),
        user_id=target_user.id,
        amount_credits=credits_to_grant,
        balance_after=target_user.credits_balance,
        transaction_type="BONUS",
        description=f"Institutional Free Grant: {req.institution_name} ({req.request_code})",
        created_at=now_utc()
    )
    db.add(txn)
    db.flush()

    # Update CreditRequest state
    req.user_id = target_user.id
    req.approved_credits = credits_to_grant
    req.status = "Credits Issued"
    req.credits_issued = True
    req.credits_issued_at = now_utc()
    req.issued_by_admin_id = current_user.id
    req.credit_transaction_id = txn.id
    if payload.note:
        req.admin_notes = f"{req.admin_notes or ''}\n[{now_utc().strftime('%Y-%m-%d %H:%M')} {current_user.full_name or 'Admin'}]: {payload.note}".strip()

    # Log Audit
    audit = AuditLog(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        action="ISSUE_FREE_CREDITS",
        details=json.dumps({
            "request_code": req.request_code,
            "credits_granted": credits_to_grant,
            "recipient_id": target_user.id,
            "recipient_email": target_user.email,
            "balance_after": target_user.credits_balance,
            "transaction_id": txn.id
        }),
        timestamp=now_utc()
    )
    db.add(audit)

    # In-app notification to teacher
    notif = Notification(
        id=str(uuid.uuid4()),
        user_id=target_user.id,
        title="🎉 10,000 Institutional Credits Credited!",
        message=f"Congratulations! Your institutional grant for {req.institution_name} ({req.request_code}) has been fulfilled. {credits_to_grant:,} credits are now ready in your wallet.",
        type="success",
        link="/dashboard/teacher/profile"
    )
    db.add(notif)

    db.commit()
    db.refresh(req)

    return {
        "success": True,
        "message": f"Successfully issued {credits_to_grant:,} credits to {target_user.email}.",
        "credits_issued": credits_to_grant,
        "new_balance": target_user.credits_balance,
        "transaction_id": txn.id,
        "request": {
            "id": req.id,
            "request_code": req.request_code,
            "status": req.status,
            "credits_issued": req.credits_issued,
            "credits_issued_at": req.credits_issued_at.isoformat() if req.credits_issued_at else None
        }
    }


# =============================================================================
# 11. Help & Support Center Management
# =============================================================================

class SupportTicketUpdate(BaseModel):
    status: Optional[str] = Field(None, description="New, Open, In Progress, Waiting for User, Resolved, Closed")
    priority: Optional[str] = Field(None, description="Low, Normal, High, Urgent")
    category: Optional[str] = None
    assigned_to_id: Optional[str] = None
    assigned_to_name: Optional[str] = None
    admin_notes: Optional[str] = None
    resolution_notes: Optional[str] = None

class SupportReplyPayload(BaseModel):
    message: str = Field(..., min_length=1)
    is_internal_note: bool = Field(False, description="True for private admin notes; False for user-facing reply")
    update_status: Optional[str] = None


@router.get("/support/tickets")
def list_support_tickets(
    status_filter: Optional[str] = Query(None, alias="status"),
    category: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(admin_required),
    db: Session = Depends(get_db)
):
    """
    Search, filter, and paginate support tickets with KPI summary metrics.
    """
    base_query = db.query(SupportTicket).filter(SupportTicket.is_deleted == False)

    # Metrics
    total_tickets = base_query.count()
    new_tickets = db.query(SupportTicket).filter(SupportTicket.is_deleted == False, SupportTicket.status == "New").count()
    open_tickets = db.query(SupportTicket).filter(SupportTicket.is_deleted == False, SupportTicket.status == "Open").count()
    in_progress_tickets = db.query(SupportTicket).filter(SupportTicket.is_deleted == False, SupportTicket.status == "In Progress").count()
    waiting_tickets = db.query(SupportTicket).filter(SupportTicket.is_deleted == False, SupportTicket.status == "Waiting for User").count()
    resolved_tickets = db.query(SupportTicket).filter(SupportTicket.is_deleted == False, SupportTicket.status == "Resolved").count()
    closed_tickets = db.query(SupportTicket).filter(SupportTicket.is_deleted == False, SupportTicket.status == "Closed").count()
    urgent_tickets = db.query(SupportTicket).filter(SupportTicket.is_deleted == False, SupportTicket.priority == "Urgent", SupportTicket.status.notin_(["Resolved", "Closed"])).count()

    query = base_query
    if status_filter and status_filter.lower() != "all":
        query = query.filter(SupportTicket.status == status_filter)

    if category and category.lower() != "all":
        query = query.filter(SupportTicket.category == category)

    if priority and priority.lower() != "all":
        query = query.filter(SupportTicket.priority == priority)

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            (SupportTicket.ticket_code.ilike(search_pattern)) |
            (SupportTicket.name.ilike(search_pattern)) |
            (SupportTicket.email.ilike(search_pattern)) |
            (SupportTicket.subject.ilike(search_pattern)) |
            (SupportTicket.reference_code.ilike(search_pattern))
        )

    filtered_total = query.count()
    tickets = query.order_by(SupportTicket.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    items = []
    for t in tickets:
        reply_count = db.query(SupportTicketReply).filter(SupportTicketReply.ticket_id == t.id).count()
        last_reply = db.query(SupportTicketReply).filter(SupportTicketReply.ticket_id == t.id).order_by(SupportTicketReply.created_at.desc()).first()

        items.append({
            "id": t.id,
            "ticket_code": t.ticket_code,
            "user_id": t.user_id,
            "user_role": t.user_role or "guest",
            "name": t.name,
            "email": t.email,
            "phone": t.phone,
            "subject": t.subject,
            "category": t.category,
            "priority": t.priority,
            "status": t.status,
            "message": t.message,
            "reference_code": t.reference_code,
            "assigned_to_id": t.assigned_to_id,
            "assigned_to_name": t.assigned_to_name,
            "reply_count": reply_count,
            "last_reply_at": last_reply.created_at.isoformat() if last_reply and last_reply.created_at else None,
            "resolved_at": t.resolved_at.isoformat() if t.resolved_at else None,
            "closed_at": t.closed_at.isoformat() if t.closed_at else None,
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "updated_at": t.updated_at.isoformat() if t.updated_at else None
        })

    return {
        "items": items,
        "summary": {
            "total_tickets": total_tickets,
            "new_tickets": new_tickets,
            "open_tickets": open_tickets,
            "in_progress_tickets": in_progress_tickets,
            "waiting_tickets": waiting_tickets,
            "resolved_tickets": resolved_tickets,
            "closed_tickets": closed_tickets,
            "urgent_tickets": urgent_tickets
        },
        "page": page,
        "page_size": page_size,
        "total": filtered_total,
        "total_pages": max(1, (filtered_total + page_size - 1) // page_size)
    }


@router.get("/support/tickets/{ticket_id}")
def get_support_ticket_detail(
    ticket_id: str,
    current_user: User = Depends(admin_required),
    db: Session = Depends(get_db)
):
    """
    Retrieves full detail of a support ticket including conversation history,
    internal notes, and sender details.
    """
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id, SupportTicket.is_deleted == False).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Support ticket not found")

    user_account = db.query(User).filter(
        (User.id == ticket.user_id) | (User.email == ticket.email.lower().strip())
    ).first() if (ticket.user_id or ticket.email) else None

    replies = db.query(SupportTicketReply).filter(
        SupportTicketReply.ticket_id == ticket.id,
        SupportTicketReply.is_deleted == False
    ).order_by(SupportTicketReply.created_at.asc()).all()

    return {
        "id": ticket.id,
        "ticket_code": ticket.ticket_code,
        "user_id": ticket.user_id or (user_account.id if user_account else None),
        "user_role": ticket.user_role or (user_account.role if user_account else "guest"),
        "user_registered": user_account is not None,
        "user_details": {
            "id": user_account.id,
            "full_name": user_account.full_name,
            "email": user_account.email,
            "role": user_account.role,
            "credits_balance": user_account.credits_balance,
            "bonus_credits": user_account.bonus_credits
        } if user_account else None,
        "name": ticket.name,
        "email": ticket.email,
        "phone": ticket.phone,
        "subject": ticket.subject,
        "category": ticket.category,
        "priority": ticket.priority,
        "status": ticket.status,
        "message": ticket.message,
        "reference_code": ticket.reference_code,
        "assigned_to_id": ticket.assigned_to_id,
        "assigned_to_name": ticket.assigned_to_name,
        "admin_notes": ticket.admin_notes,
        "resolution_notes": ticket.resolution_notes,
        "resolved_at": ticket.resolved_at.isoformat() if ticket.resolved_at else None,
        "closed_at": ticket.closed_at.isoformat() if ticket.closed_at else None,
        "created_at": ticket.created_at.isoformat() if ticket.created_at else None,
        "updated_at": ticket.updated_at.isoformat() if ticket.updated_at else None,
        "replies": [
            {
                "id": r.id,
                "sender_id": r.sender_id,
                "sender_name": r.sender_name,
                "sender_email": r.sender_email,
                "sender_role": r.sender_role,
                "message": r.message,
                "is_internal_note": r.is_internal_note,
                "created_at": r.created_at.isoformat() if r.created_at else None
            }
            for r in replies
        ]
    }


@router.patch("/support/tickets/{ticket_id}")
def update_support_ticket(
    ticket_id: str,
    payload: SupportTicketUpdate,
    current_user: User = Depends(admin_required),
    db: Session = Depends(get_db)
):
    """
    Updates status, priority, category, assignment, or private admin notes.
    """
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id, SupportTicket.is_deleted == False).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Support ticket not found")

    old_status = ticket.status

    if payload.status is not None:
        valid_statuses = ["New", "Open", "In Progress", "Waiting for User", "Resolved", "Closed"]
        if payload.status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
        ticket.status = payload.status

        if payload.status == "Resolved" and not ticket.resolved_at:
            ticket.resolved_at = now_utc()
        elif payload.status == "Closed" and not ticket.closed_at:
            ticket.closed_at = now_utc()

    if payload.priority is not None:
        valid_priorities = ["Low", "Normal", "High", "Urgent"]
        if payload.priority not in valid_priorities:
            raise HTTPException(status_code=400, detail=f"Invalid priority. Must be one of: {valid_priorities}")
        ticket.priority = payload.priority

    if payload.category is not None:
        ticket.category = payload.category

    if payload.assigned_to_id is not None:
        ticket.assigned_to_id = payload.assigned_to_id
        if payload.assigned_to_name:
            ticket.assigned_to_name = payload.assigned_to_name
        else:
            assignee = db.query(User).filter(User.id == payload.assigned_to_id).first()
            if assignee:
                ticket.assigned_to_name = assignee.full_name or assignee.email

    if payload.admin_notes is not None:
        ticket.admin_notes = payload.admin_notes

    if payload.resolution_notes is not None:
        ticket.resolution_notes = payload.resolution_notes

    db.commit()
    db.refresh(ticket)

    # Audit log
    audit = AuditLog(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        action="UPDATE_SUPPORT_TICKET",
        details=json.dumps({
            "ticket_code": ticket.ticket_code,
            "old_status": old_status,
            "new_status": ticket.status,
            "priority": ticket.priority,
            "assigned_to": ticket.assigned_to_name
        }),
        timestamp=now_utc()
    )
    db.add(audit)

    # In-app notification to ticket author if registered
    target_user_id = ticket.user_id
    if not target_user_id:
        target_user = db.query(User).filter(User.email == ticket.email.lower().strip()).first()
        if target_user:
            target_user_id = target_user.id

    if target_user_id and old_status != ticket.status:
        try:
            notif = Notification(
                id=str(uuid.uuid4()),
                user_id=target_user_id,
                title=f"Support Ticket Updated: {ticket.ticket_code}",
                message=f"Status changed to '{ticket.status}' by DPRAMP Support Team.",
                type="info",
                link="/dashboard/support"
            )
            db.add(notif)
        except Exception:
            pass

    db.commit()

    return {"success": True, "message": f"Ticket {ticket.ticket_code} updated successfully.", "ticket": {"id": ticket.id, "status": ticket.status, "priority": ticket.priority}}


@router.post("/support/tickets/{ticket_id}/reply")
def reply_to_support_ticket(
    ticket_id: str,
    payload: SupportReplyPayload,
    current_user: User = Depends(admin_required),
    db: Session = Depends(get_db)
):
    """
    Posts an admin reply to a ticket thread or records a private internal note.
    - If is_internal_note=False, visible to user and triggers user in-app notification.
    - If is_internal_note=True, strictly internal to administrators and masked from users.
    """
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id, SupportTicket.is_deleted == False).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Support ticket not found")

    reply = SupportTicketReply(
        id=str(uuid.uuid4()),
        ticket_id=ticket.id,
        sender_id=current_user.id,
        sender_name=current_user.full_name or "DPRAMP Admin Desk",
        sender_email=current_user.email,
        sender_role="admin",
        message=payload.message.strip(),
        is_internal_note=payload.is_internal_note,
        created_at=now_utc()
    )
    db.add(reply)

    # Status transition
    if payload.update_status:
        valid_statuses = ["New", "Open", "In Progress", "Waiting for User", "Resolved", "Closed"]
        if payload.update_status in valid_statuses:
            ticket.status = payload.update_status
            if payload.update_status == "Resolved" and not ticket.resolved_at:
                ticket.resolved_at = now_utc()
    elif not payload.is_internal_note and ticket.status in ["New", "Open"]:
        # Auto-progress to Waiting for User if responding to user
        ticket.status = "Waiting for User"

    db.commit()

    # If it's a public reply, notify user
    if not payload.is_internal_note:
        target_user_id = ticket.user_id
        if not target_user_id:
            target_user = db.query(User).filter(User.email == ticket.email.lower().strip()).first()
            if target_user:
                target_user_id = target_user.id

        if target_user_id:
            try:
                notif = Notification(
                    id=str(uuid.uuid4()),
                    user_id=target_user_id,
                    title=f"New Response on Ticket: {ticket.ticket_code}",
                    message=f"DPRAMP Support replied: '{payload.message[:80]}...'",
                    type="info",
                    link="/dashboard/support"
                )
                db.add(notif)
                db.commit()
            except Exception:
                pass

    return {
        "success": True,
        "message": "Internal note recorded" if payload.is_internal_note else "Reply sent to user",
        "reply": {
            "id": reply.id,
            "sender_name": reply.sender_name,
            "sender_email": reply.sender_email,
            "message": reply.message,
            "is_internal_note": reply.is_internal_note,
            "created_at": reply.created_at.isoformat() if reply.created_at else None
        },
        "ticket_status": ticket.status
    }
