from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, EmailStr
from datetime import datetime

class InstitutionalRequestCreate(BaseModel):
    # Contact Person Details
    full_name: str = Field(..., min_length=2, max_length=255, description="Full Name of the applicant")
    email: str = Field(..., min_length=5, max_length=255, description="Official institutional email address")
    phone: str = Field(..., min_length=7, max_length=50, description="Contact mobile number")
    designation: str = Field(..., min_length=2, max_length=255, description="Designation (e.g. Dean, HOD, Principal)")

    # Institution Details
    institution_name: str = Field(..., min_length=2, max_length=255, description="College or Institution Name")
    institution_type: str = Field(..., min_length=2, max_length=100, description="Type (College, University, Coaching, School, Other)")
    website_url: Optional[str] = Field(None, max_length=255, description="Official college website URL")
    state: str = Field(..., min_length=2, max_length=100, description="State")
    city: str = Field(..., min_length=2, max_length=100, description="City")
    department_count: int = Field(..., ge=1, le=500, description="Number of departments")
    faculty_count: int = Field(..., ge=1, le=100000, description="Approximate number of faculty members")
    student_count: int = Field(..., ge=1, le=1000000, description="Approximate number of students")

    # Requirement Details
    vouchers_requested: int = Field(..., ge=1, le=10000, description="Number of faculty grant vouchers requested")
    credits_per_voucher: int = Field(default=10000, ge=1000, le=100000, description="Standard 10,000 credits per voucher")
    expected_implementation_date: Optional[str] = Field(None, max_length=100, description="Expected timeline/date")
    selected_features: List[str] = Field(..., min_items=1, description="List of required features")
    additional_notes: Optional[str] = Field(None, max_length=3000, description="Additional custom requirements or notes")

class InstitutionalRequestUpdate(BaseModel):
    status: Optional[str] = Field(None, pattern="^(Pending Review|Under Review|Proposal Sent|Approved|Rejected|Closed)$")
    assigned_admin_id: Optional[str] = None
    assigned_admin_name: Optional[str] = None
    admin_notes: Optional[str] = None
    proposed_pricing: Optional[str] = None
    approved_vouchers: Optional[int] = Field(None, ge=1)
    negotiated_terms: Optional[str] = None
    decision_reason: Optional[str] = None
    send_email_update: Optional[bool] = False
    custom_email_message: Optional[str] = None

class InstitutionalRequestResponse(BaseModel):
    id: str
    reference_id: str
    full_name: str
    email: str
    phone: str
    designation: str
    institution_name: str
    institution_type: str
    website_url: Optional[str] = None
    state: str
    city: str
    department_count: int
    faculty_count: int
    student_count: int
    vouchers_requested: int
    credits_per_voucher: int
    expected_implementation_date: Optional[str] = None
    selected_features: List[str]
    additional_notes: Optional[str] = None
    status: str
    assigned_admin_id: Optional[str] = None
    assigned_admin_name: Optional[str] = None
    admin_notes: Optional[str] = None
    proposed_pricing: Optional[str] = None
    approved_vouchers: Optional[int] = None
    negotiated_terms: Optional[str] = None
    proposal_sent_at: Optional[datetime] = None
    decision_reason: Optional[str] = None
    decided_at: Optional[datetime] = None
    decided_by_id: Optional[str] = None
    decided_by_name: Optional[str] = None
    applicant_email_sent: bool
    admin_email_sent: bool
    email_delivery_error: Optional[str] = None
    status_history: Optional[List[Dict[str, Any]]] = None
    institution_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class InstitutionalRequestStats(BaseModel):
    total_requests: int
    pending_review: int
    under_review: int
    proposal_sent: int
    approved: int
    rejected: int
    closed: int
    total_vouchers_requested: int

