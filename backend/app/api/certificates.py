import os
import io
import json
import zipfile
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Response
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.certificate import CertificateConfig, SavedCertificateTemplate, IssuedCertificate
from app.models.exam import Exam, ExamSubmission
from app.models.candidate import ExamCandidate
from app.models.workspace import Workspace
from app.models.user import User
from app.schemas.certificate import (
    CertificateConfigResponse,
    CertificateConfigUpdate,
    SavedCertificateTemplateCreate,
    SavedCertificateTemplateResponse,
    IssuedCertificateResponse,
    CertificatePublicVerifyResponse,
    CertificatePreviewRequest,
    CertificateRevokeRequest,
    ExamCertificatesStatusResponse
)
from app.services.certificate_service import certificate_service, THEME_PALETTES
from app.services.workspace_service import get_current_workspace
from app.utils.security import RoleChecker, get_current_user
from app.utils.timezone import now_utc

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/certificates", tags=["Certificates"])

teacher_required = RoleChecker(["teacher", "inst_admin", "super_admin"])
admin_required = RoleChecker(["super_admin", "inst_admin"])

# Predefined System Themes
PREDEFINED_TEMPLATES = [
    {
        "id": "testora_default",
        "name": "Testora Official Navy & Gold",
        "description": "Crisp white background, dual slate-gold security borders, official verified seal.",
        "badge": "Default Ready-to-Use",
        "is_default": True,
        "accent_color": "#D97706",
        "primary_color": "#0F172A",
    },
    {
        "id": "classic_academic",
        "name": "Classic Academic Maroon & Gold",
        "description": "Warm ivory background, maroon frame, vintage collegiate gold embellishments.",
        "badge": "Formal & Collegiate",
        "is_default": False,
        "accent_color": "#B8860B",
        "primary_color": "#4A0404",
    },
    {
        "id": "modern_navy",
        "name": "Modern Minimal Cyan & Cobalt",
        "description": "Sleek slate background, clean tech typography, cobalt blue accents.",
        "badge": "Modern Tech & STEM",
        "is_default": False,
        "accent_color": "#0284C7",
        "primary_color": "#0B192C",
    },
    {
        "id": "achievement_gold",
        "name": "Prestige Forest Emerald & Gold",
        "description": "Forest emerald borders, gleaming gold honor badge, high distinction awards.",
        "badge": "Prestige Honor",
        "is_default": False,
        "accent_color": "#D97706",
        "primary_color": "#064E3B",
    }
]


# ══════════════════════════════════════════════════════════════════════════════
# 1. EXAM CERTIFICATE CONFIGURATION
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/exam/{exam_id}/config", response_model=CertificateConfigResponse)
def get_exam_certificate_config(
    exam_id: str,
    current_workspace: Workspace = Depends(get_current_workspace),
    current_user: User = Depends(teacher_required),
    db: Session = Depends(get_db)
):
    """Retrieves certificate configuration for an exam. Returns default config if not yet set."""
    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.is_deleted == False).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    config = db.query(CertificateConfig).filter(CertificateConfig.exam_id == exam_id).first()
    if not config:
        # Create default config record automatically so teacher has ready-to-use setup
        config = CertificateConfig(
            id=str(uuid.uuid4()),
            exam_id=exam_id,
            is_enabled=False,
            template_id="testora_default",
            passing_criteria_type="PERCENTAGE",
            passing_criteria_value=round((exam.passing_marks / exam.total_marks * 100.0) if exam.total_marks else 40.0, 1),
            certificate_title="Certificate of Excellence",
            certificate_subtitle="This is to certify that",
            footer_message="Verified & Issued securely via Testora Quiz Examination Platform",
            institute_name=exam.institution_name,
            signatory_name=exam.teacher_name_snapshot or current_user.full_name or "Academic Director",
            signatory_designation="Head of Examination",
            show_marks=False,
            show_percentage=True,
            show_grade=False
        )
        db.add(config)
        db.commit()
        db.refresh(config)

    return config


@router.post("/exam/{exam_id}/config", response_model=CertificateConfigResponse)
def save_exam_certificate_config(
    exam_id: str,
    payload: CertificateConfigUpdate,
    current_workspace: Workspace = Depends(get_current_workspace),
    current_user: User = Depends(teacher_required),
    db: Session = Depends(get_db)
):
    """Saves or updates certificate configuration for an exam."""
    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.is_deleted == False).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    config = db.query(CertificateConfig).filter(CertificateConfig.exam_id == exam_id).first()
    if not config:
        config = CertificateConfig(id=str(uuid.uuid4()), exam_id=exam_id)
        db.add(config)

    # Update configurable fields
    config.is_enabled = payload.is_enabled
    config.template_id = payload.template_id
    config.passing_criteria_type = payload.passing_criteria_type
    config.passing_criteria_value = payload.passing_criteria_value
    config.certificate_title = payload.certificate_title
    config.certificate_subtitle = payload.certificate_subtitle
    config.custom_text = payload.custom_text
    config.footer_message = payload.footer_message
    config.institute_name = payload.institute_name
    config.institute_logo_url = payload.institute_logo_url
    config.signatory_name = payload.signatory_name
    config.signatory_designation = payload.signatory_designation
    config.signature_url = payload.signature_url
    config.stamp_url = payload.stamp_url
    config.secondary_signatory_name = payload.secondary_signatory_name
    config.secondary_signatory_designation = payload.secondary_signatory_designation
    config.secondary_signature_url = payload.secondary_signature_url
    config.show_marks = payload.show_marks
    config.show_percentage = payload.show_percentage
    config.show_grade = payload.show_grade

    db.commit()
    db.refresh(config)
    return config


# ══════════════════════════════════════════════════════════════════════════════
# 2. LIVE SAMPLE CERTIFICATE PREVIEW
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/preview-sample")
def preview_sample_certificate(
    payload: CertificatePreviewRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Renders an instant sample PDF with current designer settings.
    Enables teachers to see the exact landscape A4 output in real time.
    """
    config_dict = payload.model_dump()
    pdf_bytes = certificate_service.generate_certificate_pdf(
        config=config_dict,
        student_name=payload.sample_student_name,
        exam_name=payload.sample_exam_name,
        issue_date=now_utc(),
        certificate_code="TQ-CERT-PREVIEW-SAMPLE",
        verification_token="sample-preview-verification-token",
        score=payload.sample_score,
        total_marks=payload.sample_total_marks,
        percentage=payload.sample_percentage,
        roll_number="STU-2026-PREVIEW",
        grade=payload.sample_grade
    )
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "inline; filename=certificate_sample.pdf"}
    )


# ══════════════════════════════════════════════════════════════════════════════
# 3. TEMPLATES LIBRARY & TEACHER SAVED TEMPLATES
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/templates")
def list_certificate_templates(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns official predefined templates alongside the teacher's saved custom presets."""
    saved = db.query(SavedCertificateTemplate).filter(
        SavedCertificateTemplate.user_id == current_user.id
    ).order_by(SavedCertificateTemplate.created_at.desc()).all()

    saved_list = []
    for s in saved:
        try:
            cfg = json.loads(s.config_json)
        except Exception:
            cfg = {}
        saved_list.append({
            "id": s.id,
            "name": s.name,
            "template_id": s.template_id,
            "config": cfg,
            "created_at": s.created_at
        })

    return {
        "predefined_templates": PREDEFINED_TEMPLATES,
        "saved_templates": saved_list
    }


@router.post("/templates", response_model=SavedCertificateTemplateResponse, status_code=status.HTTP_201_CREATED)
def save_custom_template(
    payload: SavedCertificateTemplateCreate,
    current_workspace: Workspace = Depends(get_current_workspace),
    current_user: User = Depends(teacher_required),
    db: Session = Depends(get_db)
):
    """Saves a teacher's customized certificate design as a named preset for reuse."""
    new_template = SavedCertificateTemplate(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        workspace_id=current_workspace.id if current_workspace else None,
        name=payload.name.strip(),
        template_id=payload.template_id,
        config_json=json.dumps(payload.config)
    )
    db.add(new_template)
    db.commit()
    db.refresh(new_template)
    return {
        "id": new_template.id,
        "name": new_template.name,
        "template_id": new_template.template_id,
        "config": payload.config,
        "created_at": new_template.created_at
    }


@router.delete("/templates/{template_id}")
def delete_saved_template(
    template_id: str,
    current_user: User = Depends(teacher_required),
    db: Session = Depends(get_db)
):
    """Deletes a saved certificate template owned by the teacher."""
    tmpl = db.query(SavedCertificateTemplate).filter(
        SavedCertificateTemplate.id == template_id,
        SavedCertificateTemplate.user_id == current_user.id
    ).first()
    if not tmpl:
        raise HTTPException(status_code=404, detail="Saved template not found or unauthorized")
    db.delete(tmpl)
    db.commit()
    return {"message": "Saved template removed successfully"}


# ══════════════════════════════════════════════════════════════════════════════
# 4. TEACHER EXAM CERTIFICATES STATUS & MANAGEMENT
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/exam/{exam_id}/status", response_model=ExamCertificatesStatusResponse)
def get_exam_certificates_status(
    exam_id: str,
    current_workspace: Workspace = Depends(get_current_workspace),
    current_user: User = Depends(teacher_required),
    db: Session = Depends(get_db)
):
    """
    Returns full certificate status for an exam:
    - Number of eligible students based on passing criteria
    - Total certificates generated
    - Email delivery statistics
    - List of issued certificate records
    """
    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.is_deleted == False).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    config = db.query(CertificateConfig).filter(CertificateConfig.exam_id == exam_id).first()
    is_enabled = bool(config and config.is_enabled)
    template_id = config.template_id if config else "testora_default"
    crit_type = config.passing_criteria_type if config else "PERCENTAGE"
    crit_val = config.passing_criteria_value if config else round((exam.passing_marks / exam.total_marks * 100.0) if exam.total_marks else 40.0, 1)

    # Query counts
    total_candidates = db.query(ExamCandidate).filter(ExamCandidate.exam_id == exam_id).count()
    
    # Submissions counted for results
    submissions = db.query(ExamSubmission).filter(
        ExamSubmission.exam_id == exam_id,
        ExamSubmission.is_counted_for_result == True,
        ExamSubmission.status.in_(["submitted", "auto_submitted", "graded"])
    ).all()
    total_submissions = len(submissions)

    # Compute eligible count
    eligible_count = 0
    for s in submissions:
        if crit_type == "PERCENTAGE":
            if (s.percentage or 0.0) >= crit_val:
                eligible_count += 1
        else:
            if (s.score or 0.0) >= crit_val:
                eligible_count += 1

    # Issued certificates
    issued = db.query(IssuedCertificate).filter(
        IssuedCertificate.exam_id == exam_id
    ).order_by(IssuedCertificate.created_at.desc()).all()

    emails_sent = sum(1 for c in issued if c.email_status == "SENT")
    emails_pending = sum(1 for c in issued if c.email_status in ["PENDING", "NO_EMAIL"])
    emails_failed = sum(1 for c in issued if c.email_status == "FAILED")

    return {
        "exam_id": exam_id,
        "is_enabled": is_enabled,
        "template_id": template_id,
        "passing_criteria_type": crit_type,
        "passing_criteria_value": crit_val,
        "total_candidates": total_candidates,
        "total_submissions": total_submissions,
        "eligible_count": eligible_count,
        "certificates_generated": len(issued),
        "emails_sent": emails_sent,
        "emails_pending": emails_pending,
        "emails_failed": emails_failed,
        "certificates": issued
    }


@router.post("/exam/{exam_id}/generate-now")
def trigger_exam_certificate_generation(
    exam_id: str,
    background_tasks: BackgroundTasks,
    current_workspace: Workspace = Depends(get_current_workspace),
    current_user: User = Depends(teacher_required),
    db: Session = Depends(get_db)
):
    """
    Allows a teacher to manually trigger or resume certificate generation for an exam.
    Enforces passing criteria, avoids duplicate certificates, and deducts credits accurately.
    """
    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.is_deleted == False).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    config = db.query(CertificateConfig).filter(CertificateConfig.exam_id == exam_id).first()
    if not config or not config.is_enabled:
        raise HTTPException(status_code=400, detail="Certificates are not enabled for this exam. Please enable them in Certificate Settings first.")

    res = certificate_service.process_exam_certificates(exam_id=exam_id, db=db, background_tasks=background_tasks)
    return res


# ══════════════════════════════════════════════════════════════════════════════
# 5. CERTIFICATE DOWNLOAD (INDIVIDUAL & BULK ZIP)
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/download/{certificate_id}")
def download_certificate(
    certificate_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Downloads the high-resolution certificate PDF.
    Accessible to the recipient student, the conducting teacher, or an administrator.
    """
    cert = db.query(IssuedCertificate).filter(IssuedCertificate.id == certificate_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")

    # Authorization Check:
    # 1. Super admin can download any certificate
    # 2. Student user who owns the certificate can download
    # 3. Teacher who created the exam can download
    is_owner = (cert.student_user_id and cert.student_user_id == current_user.id)
    is_admin = current_user.role in ["super_admin", "admin"]
    is_exam_creator = False

    if cert.exam and cert.exam.created_by == current_user.id:
        is_exam_creator = True

    if not (is_owner or is_admin or is_exam_creator):
        raise HTTPException(status_code=403, detail="Unauthorized to download this certificate")

    # If file exists on disk, stream it
    if cert.pdf_file_path and os.path.exists(cert.pdf_file_path):
        return FileResponse(
            path=cert.pdf_file_path,
            filename=f"{cert.certificate_code}.pdf",
            media_type="application/pdf"
        )

    # If file is missing on disk, regenerate dynamically on the fly!
    config = db.query(CertificateConfig).filter(CertificateConfig.exam_id == cert.exam_id).first()
    config_dict = {
        "template_id": config.template_id if config else "testora_default",
        "certificate_title": config.certificate_title if config else "Certificate of Excellence",
        "certificate_subtitle": config.certificate_subtitle if config else "This is to certify that",
        "custom_text": config.custom_text if config else None,
        "footer_message": config.footer_message if config else "Verified & Issued securely via Testora Quiz Examination Platform",
        "institute_name": cert.institute_name_snapshot,
        "institute_logo_url": config.institute_logo_url if config else None,
        "signatory_name": config.signatory_name if config else "Academic Director",
        "signatory_designation": config.signatory_designation if config else "Head of Examination",
        "show_marks": config.show_marks if config else False,
        "show_percentage": config.show_percentage if config else True,
        "show_grade": config.show_grade if config else False,
    }

    pdf_bytes = certificate_service.generate_certificate_pdf(
        config=config_dict,
        student_name=cert.recipient_name,
        exam_name=cert.exam_name_snapshot,
        issue_date=cert.issue_date,
        certificate_code=cert.certificate_code,
        verification_token=cert.verification_token,
        score=cert.score_snapshot,
        total_marks=cert.total_marks_snapshot,
        percentage=cert.percentage_snapshot,
        roll_number=cert.recipient_roll_number,
        grade=cert.grade_snapshot
    )
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={cert.certificate_code}.pdf"}
    )


@router.get("/exam/{exam_id}/bulk-download")
def bulk_download_exam_certificates(
    exam_id: str,
    current_workspace: Workspace = Depends(get_current_workspace),
    current_user: User = Depends(teacher_required),
    db: Session = Depends(get_db)
):
    """
    Bundles all issued certificates for an exam into a single ZIP archive for teacher download.
    """
    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.is_deleted == False).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    certs = db.query(IssuedCertificate).filter(IssuedCertificate.exam_id == exam_id).all()
    if not certs:
        raise HTTPException(status_code=400, detail="No certificates have been generated for this exam yet.")

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for c in certs:
            if c.pdf_file_path and os.path.exists(c.pdf_file_path):
                with open(c.pdf_file_path, "rb") as f:
                    file_data = f.read()
            else:
                # Regenerate if missing
                file_data = certificate_service.generate_certificate_pdf(
                    config={"template_id": "testora_default"},
                    student_name=c.recipient_name,
                    exam_name=c.exam_name_snapshot,
                    issue_date=c.issue_date,
                    certificate_code=c.certificate_code,
                    verification_token=c.verification_token,
                    score=c.score_snapshot,
                    total_marks=c.total_marks_snapshot,
                    percentage=c.percentage_snapshot,
                    roll_number=c.recipient_roll_number,
                    grade=c.grade_snapshot
                )
            
            clean_name = c.recipient_name.replace(" ", "_")
            zip_file.writestr(f"{clean_name}_{c.certificate_code}.pdf", file_data)

    zip_buffer.seek(0)
    zip_filename = f"Certificates_{exam.name.replace(' ', '_')[:30]}.zip"
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={zip_filename}"}
    )


@router.post("/{certificate_id}/resend-email")
def resend_certificate_email(
    certificate_id: str,
    current_user: User = Depends(teacher_required),
    db: Session = Depends(get_db)
):
    """
    Retries sending certificate delivery email. Does NOT regenerate certificate or deduct credits.
    """
    cert = db.query(IssuedCertificate).filter(IssuedCertificate.id == certificate_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")

    if not cert.recipient_email:
        raise HTTPException(status_code=400, detail="No registered email address found for this student.")

    success = certificate_service.send_certificate_email(
        cert=cert,
        exam_name=cert.exam_name_snapshot,
        institute_name=cert.institute_name_snapshot
    )
    db.commit()

    if success:
        return {"message": f"Certificate email resent successfully to {cert.recipient_email}."}
    else:
        raise HTTPException(status_code=500, detail=f"Failed to deliver email: {cert.email_error or 'Provider error'}")


# ══════════════════════════════════════════════════════════════════════════════
# 6. STUDENT DASHBOARD: MY CERTIFICATES
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/my-certificates", response_model=List[IssuedCertificateResponse])
def get_my_certificates(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns all valid issued certificates for the logged-in student.
    Matches by student_user_id or candidate email.
    """
    certs = db.query(IssuedCertificate).filter(
        (IssuedCertificate.student_user_id == current_user.id) |
        (IssuedCertificate.recipient_email == current_user.email)
    ).order_by(IssuedCertificate.issue_date.desc()).all()

    return certs


# ══════════════════════════════════════════════════════════════════════════════
# 7. PUBLIC CERTIFICATE VERIFICATION (QR & URL)
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/verify/{token_or_code}", response_model=CertificatePublicVerifyResponse)
def public_verify_certificate(
    token_or_code: str,
    db: Session = Depends(get_db)
):
    """
    Public verification endpoint used by employers, colleges, and QR code scanners.
    Privacy Protection: Displays only academic validity details. NEVER exposes private emails or phone numbers.
    """
    query_str = token_or_code.strip()
    cert = db.query(IssuedCertificate).filter(
        (IssuedCertificate.verification_token == query_str) |
        (IssuedCertificate.certificate_code == query_str)
    ).first()

    if not cert:
        return {
            "is_valid": False,
            "status": "NOT_FOUND",
            "message": "Certificate not found. Please verify the Certificate ID or QR code."
        }

    if cert.is_revoked:
        return {
            "is_valid": False,
            "status": "REVOKED",
            "certificate_code": cert.certificate_code,
            "recipient_name": cert.recipient_name,
            "exam_name": cert.exam_name_snapshot,
            "institute_name": cert.institute_name_snapshot,
            "issue_date": cert.issue_date,
            "is_revoked": True,
            "revocation_reason": cert.revocation_reason or "Revoked by examination authority.",
            "message": "This certificate has been formally REVOKED by the issuing examination authority."
        }

    config = db.query(CertificateConfig).filter(CertificateConfig.exam_id == cert.exam_id).first()
    show_pct = config.show_percentage if config else True
    show_mks = config.show_marks if config else False
    show_grd = config.show_grade if config else False

    return {
        "is_valid": True,
        "status": "VALID",
        "certificate_code": cert.certificate_code,
        "recipient_name": cert.recipient_name,
        "exam_name": cert.exam_name_snapshot,
        "institute_name": cert.institute_name_snapshot,
        "issue_date": cert.issue_date,
        "grade": cert.grade_snapshot if show_grd else None,
        "percentage": cert.percentage_snapshot if show_pct else None,
        "score": cert.score_snapshot if show_mks else None,
        "total_marks": cert.total_marks_snapshot if show_mks else None,
        "show_percentage": show_pct,
        "show_marks": show_mks,
        "show_grade": show_grd,
        "is_revoked": False,
        "message": "Official Testora Quiz Examination Certificate Verified."
    }


# ══════════════════════════════════════════════════════════════════════════════
# 8. SUPER ADMIN CONTROLS & AUDIT
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/admin/overview")
def get_admin_certificates_overview(
    current_user: User = Depends(admin_required),
    db: Session = Depends(get_db)
):
    """Super Admin overview of global certificate issuance, delivery rates, and credit economics."""
    total_issued = db.query(IssuedCertificate).count()
    total_revoked = db.query(IssuedCertificate).filter(IssuedCertificate.is_revoked == True).count()
    total_delivered_email = db.query(IssuedCertificate).filter(IssuedCertificate.email_status == "SENT").count()
    total_failed_email = db.query(IssuedCertificate).filter(IssuedCertificate.email_status == "FAILED").count()

    recent_certs = db.query(IssuedCertificate).order_by(
        IssuedCertificate.created_at.desc()
    ).limit(50).all()

    return {
        "total_certificates_issued": total_issued,
        "total_revoked": total_revoked,
        "total_emails_sent": total_delivered_email,
        "total_emails_failed": total_failed_email,
        "recent_certificates": recent_certs
    }


@router.post("/admin/revoke/{certificate_id}")
def admin_revoke_certificate(
    certificate_id: str,
    payload: CertificateRevokeRequest,
    current_user: User = Depends(admin_required),
    db: Session = Depends(get_db)
):
    """Super Admin or authorized authority revokes a certificate with reason and timestamp."""
    cert = db.query(IssuedCertificate).filter(IssuedCertificate.id == certificate_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")

    cert.is_revoked = True
    cert.revoked_at = now_utc()
    cert.revoked_by = current_user.id
    cert.revocation_reason = payload.revocation_reason.strip()
    db.commit()

    return {
        "message": f"Certificate {cert.certificate_code} has been revoked.",
        "certificate_id": cert.id,
        "revoked_at": cert.revoked_at
    }
