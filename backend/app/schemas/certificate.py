from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

class CertificateConfigBase(BaseModel):
    is_enabled: bool = False
    template_id: str = "testora_default" # testora_default, classic_academic, modern_navy, achievement_gold
    passing_criteria_type: str = "PERCENTAGE" # "PERCENTAGE" or "MARKS"
    passing_criteria_value: float = 40.0
    
    certificate_title: str = "Certificate of Excellence"
    certificate_subtitle: str = "This is to certify that"
    custom_text: Optional[str] = None
    footer_message: str = "Verified & Issued securely via Testora Quiz Examination Platform"
    
    institute_name: Optional[str] = None
    institute_logo_url: Optional[str] = None
    
    signatory_name: Optional[str] = "Academic Director"
    signatory_designation: Optional[str] = "Head of Examination"
    signature_url: Optional[str] = None
    stamp_url: Optional[str] = None
    
    secondary_signatory_name: Optional[str] = None
    secondary_signatory_designation: Optional[str] = None
    secondary_signature_url: Optional[str] = None
    
    show_marks: bool = False
    show_percentage: bool = True
    show_grade: bool = False

class CertificateConfigUpdate(CertificateConfigBase):
    pass

class CertificateConfigResponse(CertificateConfigBase):
    id: str
    exam_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SavedCertificateTemplateCreate(BaseModel):
    name: str
    template_id: str = "testora_default"
    config: Dict[str, Any]

class SavedCertificateTemplateResponse(BaseModel):
    id: str
    name: str
    template_id: str
    config: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


class IssuedCertificateResponse(BaseModel):
    id: str
    certificate_code: str
    verification_token: str
    exam_id: str
    submission_id: str
    candidate_id: Optional[str] = None
    student_user_id: Optional[str] = None
    
    recipient_name: str
    recipient_email: Optional[str] = None
    recipient_roll_number: Optional[str] = None
    
    exam_name_snapshot: str
    institute_name_snapshot: Optional[str] = None
    
    score_snapshot: float
    total_marks_snapshot: float
    percentage_snapshot: float
    passing_marks_snapshot: float
    grade_snapshot: Optional[str] = None
    
    issue_date: datetime
    pdf_file_size: int
    
    email_status: str
    email_sent_at: Optional[datetime] = None
    email_error: Optional[str] = None
    
    is_revoked: bool = False
    revoked_at: Optional[datetime] = None
    revocation_reason: Optional[str] = None
    
    created_at: datetime

    class Config:
        from_attributes = True


class CertificatePublicVerifyResponse(BaseModel):
    is_valid: bool
    status: str # "VALID", "REVOKED", "NOT_FOUND"
    certificate_code: Optional[str] = None
    recipient_name: Optional[str] = None
    exam_name: Optional[str] = None
    institute_name: Optional[str] = None
    issue_date: Optional[datetime] = None
    grade: Optional[str] = None
    percentage: Optional[float] = None
    score: Optional[float] = None
    total_marks: Optional[float] = None
    show_percentage: bool = False
    show_marks: bool = False
    show_grade: bool = False
    is_revoked: bool = False
    revocation_reason: Optional[str] = None
    message: str


class CertificatePreviewRequest(BaseModel):
    template_id: str = "testora_default"
    certificate_title: str = "Certificate of Excellence"
    certificate_subtitle: str = "This is to certify that"
    custom_text: Optional[str] = None
    institute_name: Optional[str] = "Greenwood International College"
    institute_logo_url: Optional[str] = None
    signatory_name: Optional[str] = "Dr. Robert Vance"
    signatory_designation: Optional[str] = "Principal & Examination Controller"
    signature_url: Optional[str] = None
    stamp_url: Optional[str] = None
    secondary_signatory_name: Optional[str] = "Prof. Anita Sharma"
    secondary_signatory_designation: Optional[str] = "Academic Dean"
    secondary_signature_url: Optional[str] = None
    show_marks: bool = False
    show_percentage: bool = True
    show_grade: bool = True
    footer_message: str = "Verified & Issued securely via Testora Quiz Examination Platform"
    
    # Sample Mock Recipient
    sample_student_name: str = "Aarav Sharma"
    sample_exam_name: str = "Higher Secondary Mathematics Examination"
    sample_score: float = 88.0
    sample_total_marks: float = 100.0
    sample_percentage: float = 88.0
    sample_grade: str = "A+"


class CertificateRevokeRequest(BaseModel):
    revocation_reason: str = Field(..., min_length=3, max_length=500)


class ExamCertificatesStatusResponse(BaseModel):
    exam_id: str
    is_enabled: bool
    template_id: str
    passing_criteria_type: str
    passing_criteria_value: float
    total_candidates: int
    total_submissions: int
    eligible_count: int
    certificates_generated: int
    emails_sent: int
    emails_pending: int
    emails_failed: int
    certificates: List[IssuedCertificateResponse] = []

