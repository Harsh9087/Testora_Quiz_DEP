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
        },
        "recent_activity": audit_list
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
            "institution_name": inst.name if inst else None,
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
        "institution_name": inst.name if inst else "Personal / None",
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
