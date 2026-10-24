from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field

# ──────── FORM SCHEMAS ────────

class StudentRegistrationFormCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Name of the form (e.g. Section C AIML)")
    description: Optional[str] = Field(None, max_length=2000, description="Optional brief instructions or description")

class StudentRegistrationFormUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    is_active: Optional[bool] = None

class StudentRegistrationFormResponse(BaseModel):
    id: str
    workspace_id: str
    created_by: str
    title: str
    description: Optional[str] = None
    share_slug: str
    is_active: bool
    submission_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True

# ──────── PUBLIC METADATA SCHEMA ────────

class PublicFormMetaResponse(BaseModel):
    title: str
    description: Optional[str] = None
    share_slug: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# ──────── 6 MANDATORY FIELDS SUBMISSION SCHEMAS ────────

class StudentFormSubmissionCreate(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255, description="Full Name of the student")
    email: EmailStr = Field(..., description="Valid institutional or personal email address")
    roll_number: str = Field(..., min_length=1, max_length=100, description="Unique student roll number / ID")
    contact_number: str = Field(..., min_length=5, max_length=50, description="Contact Phone / Mobile number")
    section: str = Field(..., min_length=1, max_length=50, description="Section / Division (e.g. Section A, C)")
    branch: str = Field(..., min_length=1, max_length=100, description="Branch / Department (e.g. AIML, CSE, IT)")

class StudentFormSubmissionResponse(BaseModel):
    id: str
    form_id: str
    full_name: str
    email: str
    roll_number: str
    contact_number: str
    section: str
    branch: str
    status: str
    imported_directory_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class StudentRegistrationFormDetailResponse(BaseModel):
    id: str
    workspace_id: str
    created_by: str
    title: str
    description: Optional[str] = None
    share_slug: str
    is_active: bool
    submission_count: int = 0
    created_at: datetime
    submissions: List[StudentFormSubmissionResponse] = []

    class Config:
        from_attributes = True

# ──────── DIRECTORY INTEGRATION SCHEMAS ────────

class ImportToDirectoryRequest(BaseModel):
    target_mode: str = Field("new", description="'existing' to add to existing directory or 'new' to create one")
    directory_id: Optional[str] = Field(None, description="Directory ID if target_mode is 'existing'")
    new_directory_name: Optional[str] = Field(None, description="Name for new directory if target_mode is 'new'")
    new_directory_description: Optional[str] = Field(None, description="Optional description for new directory")
    submission_ids: Optional[List[str]] = Field(None, description="List of submission IDs to import, or None for all")

class ImportToDirectoryResponse(BaseModel):
    directory_id: str
    directory_name: str
    imported_count: int
    skipped_duplicate_count: int
    total_selected: int
    messages: List[str] = []
