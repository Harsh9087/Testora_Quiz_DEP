from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

class FormField(BaseModel):
    id: str = Field(..., description="Unique field ID e.g. f_1")
    label: str = Field(..., description="Field question or label")
    field_type: str = Field("text", description="text, email, phone, number, textarea, select, radio, checkbox, rating")
    placeholder: Optional[str] = None
    required: bool = True
    options: Optional[List[str]] = []
    description: Optional[str] = None

class GenerateCustomFormRequest(BaseModel):
    prompt: str = Field(..., min_length=3, max_length=2000, description="Natural language description of the form")

class GeneratedFormPreviewResponse(BaseModel):
    title: str
    description: str
    fields: List[FormField]

class CustomFormCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    prompt: Optional[str] = None
    fields: List[FormField] = []
    is_published: bool = True

class CustomFormUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    fields: Optional[List[FormField]] = None
    is_published: Optional[bool] = None
    is_active: Optional[bool] = None

class CustomFormResponse(BaseModel):
    id: str
    workspace_id: str
    created_by: str
    title: str
    description: Optional[str] = None
    prompt: Optional[str] = None
    fields: List[FormField] = []
    share_slug: str
    is_published: bool
    is_active: bool
    submission_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True

class PublicCustomFormMetaResponse(BaseModel):
    title: str
    description: Optional[str] = None
    fields: List[FormField] = []
    share_slug: str
    is_active: bool
    is_published: bool
    created_at: datetime

class CustomFormSubmissionCreate(BaseModel):
    responses: Dict[str, Any] = Field(..., description="Key-value mapping of field id to submitted answer")

class CustomFormSubmissionResponse(BaseModel):
    id: str
    form_id: str
    responses: Dict[str, Any]
    respondent_identifier: Optional[str] = None
    created_at: datetime
    status: str

    class Config:
        from_attributes = True

class CustomFormDetailResponse(CustomFormResponse):
    submissions: List[CustomFormSubmissionResponse] = []
