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
    image_url: Optional[str] = None
    image_caption: Optional[str] = None
    option_images: Optional[Dict[str, str]] = None

class ImprovePromptRequest(BaseModel):
    prompt: str = Field(..., min_length=2, max_length=2000, description="Raw user prompt to improve")
    focus: Optional[str] = None

class ImprovePromptResponse(BaseModel):
    improved_prompt: str
    suggested_title: Optional[str] = None
    suggested_themes: Optional[List[str]] = None

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
    theme: Optional[str] = "navy_indigo"
    header_image: Optional[str] = None
    theme_settings: Optional[Dict[str, Any]] = None

class CustomFormUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    fields: Optional[List[FormField]] = None
    is_published: Optional[bool] = None
    is_active: Optional[bool] = None
    theme: Optional[str] = None
    header_image: Optional[str] = None
    theme_settings: Optional[Dict[str, Any]] = None

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
    theme: Optional[str] = "navy_indigo"
    header_image: Optional[str] = None
    theme_settings: Optional[Dict[str, Any]] = None
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
    theme: Optional[str] = "navy_indigo"
    header_image: Optional[str] = None
    theme_settings: Optional[Dict[str, Any]] = None
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
