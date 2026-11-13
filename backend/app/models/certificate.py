import uuid
from sqlalchemy import Column, String, ForeignKey, Integer, Float, Text, Boolean, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from app.models.base import TimeStampedModel
from app.utils.timezone import now_utc

class CertificateConfig(TimeStampedModel):
    """
    Configuration attached to an exam defining whether passing certificates
    are issued, which template is used, and customization parameters.
    """
    __tablename__ = "certificate_configs"
    
    exam_id = Column(String(36), ForeignKey("exams.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    is_enabled = Column(Boolean, default=False, nullable=False)
    
    # Template Selection
    template_id = Column(String(50), default="testora_default", nullable=False) # testora_default, classic_academic, modern_navy, achievement_gold
    
    # Passing & Eligibility Criteria
    passing_criteria_type = Column(String(50), default="PERCENTAGE", nullable=False) # "PERCENTAGE" or "MARKS"
    passing_criteria_value = Column(Float, default=40.0, nullable=False) # e.g. 40% or minimum marks
    
    # Custom Content & Text
    certificate_title = Column(String(255), default="Certificate of Excellence", nullable=False)
    certificate_subtitle = Column(String(255), default="This is to certify that", nullable=False)
    custom_text = Column(Text, nullable=True) # Optional extra statement
    footer_message = Column(String(255), default="Verified & Issued securely via Testora Quiz Examination Platform", nullable=False)
    
    # Institute Branding (Optional overrides alongside official Testora branding)
    institute_name = Column(String(255), nullable=True)
    institute_logo_url = Column(String(500), nullable=True)
    
    # Primary Signatory (e.g., Principal / Examination Controller)
    signatory_name = Column(String(255), default="Academic Director", nullable=True)
    signatory_designation = Column(String(255), default="Head of Examination", nullable=True)
    signature_url = Column(String(500), nullable=True)
    stamp_url = Column(String(500), nullable=True)
    
    # Secondary Signatory (Optional, e.g., Instructor / Course Lead)
    secondary_signatory_name = Column(String(255), nullable=True)
    secondary_signatory_designation = Column(String(255), nullable=True)
    secondary_signature_url = Column(String(500), nullable=True)
    
    # Display Toggles
    show_marks = Column(Boolean, default=False, nullable=False)
    show_percentage = Column(Boolean, default=True, nullable=False)
    show_grade = Column(Boolean, default=False, nullable=False)
    
    # Relationships
    exam = relationship("Exam", backref="certificate_config", uselist=False)


class SavedCertificateTemplate(TimeStampedModel):
    """
    Teacher or institute saved certificate design presets for fast reuse across multiple exams.
    """
    __tablename__ = "saved_certificate_templates"
    
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=True, index=True)
    name = Column(String(255), nullable=False) # e.g. "School Annual Exam Standard"
    template_id = Column(String(50), default="testora_default", nullable=False)
    config_json = Column(Text, nullable=False) # Serialized configuration dictionary
    
    user = relationship("User")
    workspace = relationship("Workspace")


class IssuedCertificate(TimeStampedModel):
    """
    Immutable certificate record for a student who successfully passed an exam.
    Enforces uniqueness: at most ONE certificate per submission to prevent duplicates.
    """
    __tablename__ = "issued_certificates"
    __table_args__ = (
        UniqueConstraint("submission_id", name="uq_issued_cert_submission"),
        UniqueConstraint("certificate_code", name="uq_issued_cert_code"),
        UniqueConstraint("verification_token", name="uq_issued_cert_token"),
    )
    
    certificate_code = Column(String(50), index=True, nullable=False) # e.g. "TQ-CERT-2026-A1B2C3"
    verification_token = Column(String(64), index=True, nullable=False) # Secure non-guessable token for QR / public URL
    
    exam_id = Column(String(36), ForeignKey("exams.id", ondelete="CASCADE"), nullable=False, index=True)
    submission_id = Column(String(36), ForeignKey("exam_submissions.id", ondelete="CASCADE"), nullable=False, index=True)
    candidate_id = Column(String(36), ForeignKey("exam_candidates.id", ondelete="CASCADE"), nullable=True, index=True)
    student_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Immutable Snapshots of Student & Performance Details
    recipient_name = Column(String(255), nullable=False)
    recipient_email = Column(String(255), nullable=True)
    recipient_roll_number = Column(String(100), nullable=True)
    
    exam_name_snapshot = Column(String(255), nullable=False)
    institute_name_snapshot = Column(String(255), nullable=True)
    
    score_snapshot = Column(Float, default=0.0, nullable=False)
    total_marks_snapshot = Column(Float, default=0.0, nullable=False)
    percentage_snapshot = Column(Float, default=0.0, nullable=False)
    passing_marks_snapshot = Column(Float, default=0.0, nullable=False)
    grade_snapshot = Column(String(10), nullable=True)
    
    issue_date = Column(DateTime(timezone=True), default=now_utc, nullable=False)
    
    # Generated PDF Storage
    pdf_file_path = Column(String(500), nullable=True)
    pdf_file_size = Column(Integer, default=0, nullable=False)
    
    # Email Delivery Status
    email_status = Column(String(50), default="PENDING", nullable=False) # "PENDING", "SENT", "FAILED", "NO_EMAIL"
    email_sent_at = Column(DateTime(timezone=True), nullable=True)
    email_error = Column(Text, nullable=True)
    email_attempt_count = Column(Integer, default=0, nullable=False)
    
    # Credits Accounting
    credits_deducted = Column(Integer, default=1, nullable=False)
    
    # Revocation Management
    is_revoked = Column(Boolean, default=False, nullable=False)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    revoked_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    revocation_reason = Column(Text, nullable=True)
    
    # Relationships
    exam = relationship("Exam")
    submission = relationship("ExamSubmission")
    candidate = relationship("ExamCandidate")
    student_user = relationship("User", foreign_keys=[student_user_id])
    revoker = relationship("User", foreign_keys=[revoked_by])

