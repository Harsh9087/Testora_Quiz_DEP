from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr

class FeedbackCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    user_type: Optional[str] = Field(default="Teacher", pattern="^(Teacher|Student|College or Institution|Other)$")
    category: Optional[str] = Field(default="General Feedback", max_length=100)
    rating: Optional[int] = Field(None, ge=1, le=5)
    subject: Optional[str] = Field(None, max_length=255)
    title: Optional[str] = Field(None, max_length=255)
    message: str = Field(..., min_length=3, max_length=5000)
    screenshot_url: Optional[str] = Field(None, max_length=500)
    submission_type: Optional[str] = Field(default="EXPERIENCE")
    role: Optional[str] = Field(default="Educator", max_length=50)
    severity: Optional[str] = Field(None, pattern="^(Low|Normal|Medium|High|Critical)$")
    secondary_text: Optional[str] = Field(None, max_length=5000)
    is_public_testimonial: Optional[bool] = False

class FeedbackUpdate(BaseModel):
    status: Optional[str] = Field(None, pattern="^(New|Under Review|In Progress|Resolved|Rejected|Archived|Reviewed|Under Consideration|Implemented|Closed)$")
    admin_notes: Optional[str] = None
    assigned_to_id: Optional[str] = None
    assigned_to_name: Optional[str] = None
    resolution_details: Optional[str] = None
    is_public_testimonial: Optional[bool] = None

class FeedbackResponse(BaseModel):
    id: str
    feedback_code: str
    submission_type: str
    user_id: Optional[str] = None
    name: str
    email: str
    role: str
    user_type: Optional[str] = "Teacher"
    subject: Optional[str] = None
    title: Optional[str] = None
    category: Optional[str] = None
    rating: Optional[int] = None
    severity: Optional[str] = None
    message: str
    secondary_text: Optional[str] = None
    screenshot_url: Optional[str] = None
    status: str
    admin_notes: Optional[str] = None
    assigned_to_id: Optional[str] = None
    assigned_to_name: Optional[str] = None
    resolution_details: Optional[str] = None
    reviewed_by_id: Optional[str] = None
    reviewed_by_name: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    is_public_testimonial: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class FeedbackStats(BaseModel):
    total_submissions: int
    new_count: int
    in_progress_count: int
    resolved_count: int
    average_rating: float
    bug_count: int
    feature_count: int
    experience_count: int
    rating_count: int
