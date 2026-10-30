import os
import json
import random
import string
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, or_

from app.database import get_db
from app.config import settings
from app.models.institutional_request import InstitutionalRequest
from app.models.institution import Institution
from app.models.exam import AuditLog
from app.models.user import User
from app.schemas.institutional_request import (
    InstitutionalRequestCreate,
    InstitutionalRequestUpdate,
    InstitutionalRequestResponse,
    InstitutionalRequestStats
)
from app.services.email_service import email_service
from app.utils.security import RoleChecker, get_current_user
from app.utils.timezone import now_utc

router = APIRouter(prefix="/institutional-requests", tags=["institutional-requests"])

super_admin_required = RoleChecker(["super_admin"])
admin_required = RoleChecker(["super_admin", "inst_admin"])

def generate_reference_id(db: Session) -> str:
    """Generates a collision-free human-readable Reference ID: e.g. INST-2026-7K2X9"""
    year = datetime.now().year
    while True:
        suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
        ref_id = f"INST-{year}-{suffix}"
        exists = db.query(InstitutionalRequest).filter(InstitutionalRequest.reference_id == ref_id).first()
        if not exists:
            return ref_id

def serialize_request(req: InstitutionalRequest) -> dict:
    """Serializes InstitutionalRequest into dict matching response schema."""
    features = req.get_features_list()
    try:
        history = json.loads(req.status_history) if req.status_history else []
    except Exception:
        history = []

    return {
        "id": req.id,
        "reference_id": req.reference_id,
        "full_name": req.full_name,
        "email": req.email,
        "phone": req.phone,
        "designation": req.designation,
        "institution_name": req.institution_name,
        "institution_type": req.institution_type,
        "website_url": req.website_url,
        "state": req.state,
        "city": req.city,
        "department_count": req.department_count,
        "faculty_count": req.faculty_count,
        "student_count": req.student_count,
        "vouchers_requested": req.vouchers_requested,
        "credits_per_voucher": req.credits_per_voucher,
        "expected_implementation_date": req.expected_implementation_date,
        "selected_features": features,
        "additional_notes": req.additional_notes,
        "status": req.status,
        "assigned_admin_id": req.assigned_admin_id,
        "assigned_admin_name": req.assigned_admin_name,
        "admin_notes": req.admin_notes,
        "proposed_pricing": req.proposed_pricing,
        "approved_vouchers": req.approved_vouchers,
        "negotiated_terms": req.negotiated_terms,
        "proposal_sent_at": req.proposal_sent_at,
        "decision_reason": req.decision_reason,
        "decided_at": req.decided_at,
        "decided_by_id": req.decided_by_id,
        "decided_by_name": req.decided_by_name,
        "applicant_email_sent": req.applicant_email_sent,
        "admin_email_sent": req.admin_email_sent,
        "email_delivery_error": req.email_delivery_error,
        "status_history": history,
        "institution_id": req.institution_id,
        "created_at": req.created_at,
        "updated_at": req.updated_at,
    }


# =============================================================================
# 1. PUBLIC: Submit New Institutional Plan & Proposal Request
# =============================================================================
@router.post("", status_code=status.HTTP_201_CREATED)
def submit_institutional_request(
    data: InstitutionalRequestCreate,
    db: Session = Depends(get_db)
):
    """
    Public entry point for academic colleges, universities, and coaching institutes
    to submit a formal Institutional Plan and FDP Grant Proposal request.
    """
    ref_id = generate_reference_id(db)

    # Initial Status History entry
    initial_history = [{
        "timestamp": now_utc().isoformat(),
        "action": "Request Submitted",
        "actor": data.full_name,
        "status": "Pending Review",
        "notes": "Application received via public institutional portal."
    }]

    new_req = InstitutionalRequest(
        reference_id=ref_id,
        full_name=data.full_name.strip(),
        email=data.email.strip().lower(),
        phone=data.phone.strip(),
        designation=data.designation.strip(),
        institution_name=data.institution_name.strip(),
        institution_type=data.institution_type.strip(),
        website_url=data.website_url.strip() if data.website_url else None,
        state=data.state.strip(),
        city=data.city.strip(),
        department_count=data.department_count,
        faculty_count=data.faculty_count,
        student_count=data.student_count,
        vouchers_requested=data.vouchers_requested,
        credits_per_voucher=data.credits_per_voucher or 10000,
        expected_implementation_date=data.expected_implementation_date.strip() if data.expected_implementation_date else None,
        selected_features=json.dumps(data.selected_features),
        additional_notes=data.additional_notes.strip() if data.additional_notes else None,
        status="Pending Review",
        status_history=json.dumps(initial_history),
        applicant_email_sent=False,
        admin_email_sent=False
    )

    db.add(new_req)
    db.commit()
    db.refresh(new_req)

    # Attempt Email Dispatches (Applicant Confirmation & Super Admin Alert)
    email_payload = {
        "id": new_req.id,
        "reference_id": new_req.reference_id,
        "full_name": new_req.full_name,
        "email": new_req.email,
        "phone": new_req.phone,
        "designation": new_req.designation,
        "institution_name": new_req.institution_name,
        "institution_type": new_req.institution_type,
        "website_url": new_req.website_url,
        "state": new_req.state,
        "city": new_req.city,
        "department_count": new_req.department_count,
        "faculty_count": new_req.faculty_count,
        "student_count": new_req.student_count,
        "vouchers_requested": new_req.vouchers_requested,
        "credits_per_voucher": new_req.credits_per_voucher,
        "selected_features": data.selected_features,
        "additional_notes": new_req.additional_notes,
        "created_at": new_req.created_at.strftime("%Y-%m-%d %H:%M:%S UTC") if new_req.created_at else None
    }

    applicant_sent = False
    admin_sent = False
    delivery_errors = []

    try:
        applicant_sent = email_service.send_institutional_applicant_confirmation(email_payload)
    except Exception as e:
        delivery_errors.append(f"Applicant email error: {str(e)}")

    try:
        super_admin_email = os.getenv("SUPER_ADMIN_EMAIL", "admin@aegeus.edu").strip()
        admin_sent = email_service.send_institutional_admin_notification(email_payload, super_admin_email)
    except Exception as e:
        delivery_errors.append(f"Admin email error: {str(e)}")

    # Update email dispatch status
    new_req.applicant_email_sent = applicant_sent
    new_req.admin_email_sent = admin_sent
    if delivery_errors:
        new_req.email_delivery_error = " | ".join(delivery_errors)

    db.commit()
    db.refresh(new_req)

    return {
        "success": True,
        "message": "Institutional plan request received successfully. Our team will review your application and reach out shortly.",
        "reference_id": new_req.reference_id,
        "request": serialize_request(new_req)
    }


# =============================================================================
# 2. SUPER ADMIN: Aggregate KPI Metrics & Statistics
# =============================================================================
@router.get("/stats", response_model=InstitutionalRequestStats)
def get_institutional_stats(
    current_user: User = Depends(super_admin_required),
    db: Session = Depends(get_db)
):
    """Returns real-time institutional plan application KPIs for the Super Admin."""
    total = db.query(InstitutionalRequest).filter(InstitutionalRequest.is_deleted == False).count()
    pending = db.query(InstitutionalRequest).filter(
        InstitutionalRequest.is_deleted == False,
        InstitutionalRequest.status == "Pending Review"
    ).count()
    under_review = db.query(InstitutionalRequest).filter(
        InstitutionalRequest.is_deleted == False,
        InstitutionalRequest.status == "Under Review"
    ).count()
    proposal_sent = db.query(InstitutionalRequest).filter(
        InstitutionalRequest.is_deleted == False,
        InstitutionalRequest.status == "Proposal Sent"
    ).count()
    approved = db.query(InstitutionalRequest).filter(
        InstitutionalRequest.is_deleted == False,
        InstitutionalRequest.status == "Approved"
    ).count()
    rejected = db.query(InstitutionalRequest).filter(
        InstitutionalRequest.is_deleted == False,
        InstitutionalRequest.status == "Rejected"
    ).count()
    closed = db.query(InstitutionalRequest).filter(
        InstitutionalRequest.is_deleted == False,
        InstitutionalRequest.status == "Closed"
    ).count()

    total_vouchers = db.query(func.sum(InstitutionalRequest.vouchers_requested)).filter(
        InstitutionalRequest.is_deleted == False
    ).scalar() or 0

    return {
        "total_requests": total,
        "pending_review": pending,
        "under_review": under_review,
        "proposal_sent": proposal_sent,
        "approved": approved,
        "rejected": rejected,
        "closed": closed,
        "total_vouchers_requested": total_vouchers
    }


# =============================================================================
# 3. SUPER ADMIN: List All Institutional Requests (Search & Filter)
# =============================================================================
@router.get("")
def list_institutional_requests(
    q: Optional[str] = Query(None, description="Search query across Reference ID, Institution, Contact Name, Email"),
    status: Optional[str] = Query(None, description="Filter by status: Pending Review, Under Review, Proposal Sent, Approved, Rejected, Closed"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(super_admin_required),
    db: Session = Depends(get_db)
):
    """Lists institutional plan requests with full text search and status filtering."""
    query = db.query(InstitutionalRequest).filter(InstitutionalRequest.is_deleted == False)

    if status and status != "All":
        query = query.filter(InstitutionalRequest.status == status)

    if q and q.strip():
        term = f"%{q.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(InstitutionalRequest.reference_id).like(term),
                func.lower(InstitutionalRequest.institution_name).like(term),
                func.lower(InstitutionalRequest.full_name).like(term),
                func.lower(InstitutionalRequest.email).like(term),
                func.lower(InstitutionalRequest.city).like(term),
                func.lower(InstitutionalRequest.state).like(term),
            )
        )

    total = query.count()
    items = query.order_by(desc(InstitutionalRequest.created_at)).offset(skip).limit(limit).all()

    return {
        "items": [serialize_request(item) for item in items],
        "total": total,
        "skip": skip,
        "limit": limit
    }


# =============================================================================
# 4. SUPER ADMIN: Get Single Request Detail
# =============================================================================
@router.get("/{id}")
def get_institutional_request_detail(
    id: str,
    current_user: User = Depends(super_admin_required),
    db: Session = Depends(get_db)
):
    """Retrieves full details of an institutional plan proposal application."""
    req = db.query(InstitutionalRequest).filter(
        InstitutionalRequest.id == id,
        InstitutionalRequest.is_deleted == False
    ).first()

    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Institutional request not found")

    return serialize_request(req)


# =============================================================================
# 5. SUPER ADMIN: Update Status, Notes, Pricing & Decision
# =============================================================================
@router.patch("/{id}")
def update_institutional_request(
    id: str,
    payload: InstitutionalRequestUpdate,
    current_user: User = Depends(super_admin_required),
    db: Session = Depends(get_db)
):
    """
    Updates status, adds administrative notes, records proposed pricing,
    negotiated terms, or approves/rejects the application.
    """
    req = db.query(InstitutionalRequest).filter(
        InstitutionalRequest.id == id,
        InstitutionalRequest.is_deleted == False
    ).first()

    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Institutional request not found")

    action_label = "Updated Details"

    if payload.status and payload.status != req.status:
        old_status = req.status
        req.status = payload.status
        action_label = f"Status changed: {old_status} → {payload.status}"

        # If Proposal Sent: record timestamp
        if payload.status == "Proposal Sent":
            req.proposal_sent_at = now_utc()

        # If Approved / Rejected: record decision metadata
        if payload.status in ("Approved", "Rejected"):
            req.decided_at = now_utc()
            req.decided_by_id = current_user.id
            req.decided_by_name = current_user.full_name

            # If Approved: connect to existing Institution record if name matches
            if payload.status == "Approved":
                existing_inst = db.query(Institution).filter(
                    func.lower(Institution.name) == func.lower(req.institution_name),
                    Institution.is_deleted == False
                ).first()
                if existing_inst:
                    req.institution_id = existing_inst.id

            # Create an AuditLog entry
            audit = AuditLog(
                user_id=current_user.id,
                action=f"INSTITUTIONAL_REQUEST_{payload.status.upper().replace(' ', '_')}",
                details=f"Super Admin {current_user.full_name} marked request {req.reference_id} ({req.institution_name}) as {payload.status}. Approved vouchers: {payload.approved_vouchers or req.vouchers_requested}."
            )
            db.add(audit)

    if payload.assigned_admin_id is not None:
        req.assigned_admin_id = payload.assigned_admin_id
        req.assigned_admin_name = payload.assigned_admin_name

    if payload.admin_notes is not None:
        req.admin_notes = payload.admin_notes

    if payload.proposed_pricing is not None:
        req.proposed_pricing = payload.proposed_pricing

    if payload.approved_vouchers is not None:
        req.approved_vouchers = payload.approved_vouchers

    if payload.negotiated_terms is not None:
        req.negotiated_terms = payload.negotiated_terms

    if payload.decision_reason is not None:
        req.decision_reason = payload.decision_reason

    # Add audit log to status history
    req.add_history_entry(
        action=action_label,
        actor_name=current_user.full_name,
        notes=payload.admin_notes or payload.decision_reason
    )

    db.commit()
    db.refresh(req)

    return {
        "success": True,
        "message": f"Institutional request {req.reference_id} successfully updated.",
        "request": serialize_request(req)
    }


# =============================================================================
# 6. SUPER ADMIN: Retry Failed Email Dispatches
# =============================================================================
@router.post("/{id}/retry-emails")
def retry_institutional_request_emails(
    id: str,
    current_user: User = Depends(super_admin_required),
    db: Session = Depends(get_db)
):
    """Retries sending applicant confirmation and admin notification emails."""
    req = db.query(InstitutionalRequest).filter(
        InstitutionalRequest.id == id,
        InstitutionalRequest.is_deleted == False
    ).first()

    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Institutional request not found")

    email_payload = {
        "id": req.id,
        "reference_id": req.reference_id,
        "full_name": req.full_name,
        "email": req.email,
        "phone": req.phone,
        "designation": req.designation,
        "institution_name": req.institution_name,
        "institution_type": req.institution_type,
        "website_url": req.website_url,
        "state": req.state,
        "city": req.city,
        "department_count": req.department_count,
        "faculty_count": req.faculty_count,
        "student_count": req.student_count,
        "vouchers_requested": req.vouchers_requested,
        "credits_per_voucher": req.credits_per_voucher,
        "selected_features": req.get_features_list(),
        "additional_notes": req.additional_notes,
        "created_at": req.created_at.strftime("%Y-%m-%d %H:%M:%S UTC") if req.created_at else None
    }

    errors = []
    applicant_sent = req.applicant_email_sent
    admin_sent = req.admin_email_sent

    if not applicant_sent:
        try:
            applicant_sent = email_service.send_institutional_applicant_confirmation(email_payload)
        except Exception as e:
            errors.append(f"Applicant retry failed: {str(e)}")

    if not admin_sent:
        try:
            super_admin_email = os.getenv("SUPER_ADMIN_EMAIL", "admin@aegeus.edu").strip()
            admin_sent = email_service.send_institutional_admin_notification(email_payload, super_admin_email)
        except Exception as e:
            errors.append(f"Admin retry failed: {str(e)}")

    req.applicant_email_sent = applicant_sent
    req.admin_email_sent = admin_sent
    req.email_delivery_error = " | ".join(errors) if errors else None

    req.add_history_entry(
        action="Email Retry Dispatched",
        actor_name=current_user.full_name,
        notes=f"Applicant sent: {applicant_sent}, Admin sent: {admin_sent}"
    )

    db.commit()
    db.refresh(req)

    return {
        "success": True,
        "applicant_email_sent": req.applicant_email_sent,
        "admin_email_sent": req.admin_email_sent,
        "email_delivery_error": req.email_delivery_error,
        "message": "Email delivery retry completed."
    }

