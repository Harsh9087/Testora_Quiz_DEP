from sqlalchemy import Column, String, Integer, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import TimeStampedModel
from app.utils.timezone import now_utc

class FeedbackSubmission(TimeStampedModel):
    __tablename__ = "feedback_submissions"

    feedback_code = Column(String(50), unique=True, index=True, nullable=False) # e.g. "FB-2026-7K2X9"
    submission_type = Column(String(50), index=True, default="EXPERIENCE", nullable=False) # "EXPERIENCE", "FEATURE", "BUG", "RATING", etc.

    # User Information (authenticated user or guest)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), index=True, nullable=False)
    role = Column(String(50), default="Educator", nullable=False)
    user_type = Column(String(50), default="Teacher", nullable=False) # "Teacher", "Student", "College or Institution", "Other"

    # Content
    subject = Column(String(255), nullable=True) # Short feedback title
    title = Column(String(255), nullable=True) # Alias / backward compatibility for subject
    category = Column(String(100), default="General Feedback", nullable=False) # "General Feedback", "Feature Request", "Bug Report", "UI/UX Suggestion", "Payment Issue", "Other"
    rating = Column(Integer, nullable=True) # 1 to 5 stars
    severity = Column(String(50), nullable=True) # "Low", "Normal", "Medium", "High", "Critical" (for bugs)
    message = Column(Text, nullable=False) # Detailed feedback text
    secondary_text = Column(Text, nullable=True) # Optional extra notes
    screenshot_url = Column(String(500), nullable=True) # Optional attached screenshot URL

    # Workflow & Super Admin Management
    # Statuses: "New", "Under Review", "In Progress", "Resolved", "Rejected", "Archived"
    status = Column(String(50), default="New", index=True, nullable=False)
    admin_notes = Column(Text, nullable=True) # Internal Super Admin notes
    assigned_to_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    assigned_to_name = Column(String(255), nullable=True)
    resolution_details = Column(Text, nullable=True) # Details of how issue/feedback was addressed

    reviewed_by_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    reviewed_by_name = Column(String(255), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    is_public_testimonial = Column(Boolean, default=False, nullable=False)

    # Soft Delete
    is_deleted = Column(Boolean, default=False, nullable=False)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_id])
    assigned_to = relationship("User", foreign_keys=[assigned_to_id])
