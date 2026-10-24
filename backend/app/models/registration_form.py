from typing import Optional
from sqlalchemy import Column, String, ForeignKey, Boolean, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.models.base import TimeStampedModel

class StudentRegistrationForm(TimeStampedModel):
    __tablename__ = "student_registration_forms"

    workspace_id: str = Column(String(36), ForeignKey("workspaces.id"), nullable=False, index=True) # type: ignore
    created_by: str = Column(String(36), ForeignKey("users.id"), nullable=False) # type: ignore
    title: str = Column(String(255), nullable=False) # type: ignore
    description: Optional[str] = Column(Text, nullable=True) # type: ignore
    share_slug: str = Column(String(64), unique=True, index=True, nullable=False) # type: ignore
    is_active: bool = Column(Boolean, default=True, nullable=False) # type: ignore

    # Relationships
    workspace = relationship("Workspace")
    creator = relationship("User")
    submissions = relationship(
        "StudentFormSubmission", 
        back_populates="form", 
        cascade="all, delete-orphan",
        order_by="desc(StudentFormSubmission.created_at)"
    )

class StudentFormSubmission(TimeStampedModel):
    __tablename__ = "student_form_submissions"

    form_id = Column(String(36), ForeignKey("student_registration_forms.id"), nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    roll_number = Column(String(100), nullable=False, index=True)
    contact_number = Column(String(50), nullable=False)
    section = Column(String(50), nullable=False)
    branch = Column(String(100), nullable=False)
    status = Column(String(50), default="submitted", nullable=False)  # "submitted", "imported", "flagged"
    imported_directory_id = Column(String(36), ForeignKey("student_directories.id"), nullable=True)

    # Relationships
    form = relationship("StudentRegistrationForm", back_populates="submissions")
    imported_directory = relationship("StudentDirectory")

    __table_args__ = (
        UniqueConstraint("form_id", "email", name="uq_form_submission_email"),
        UniqueConstraint("form_id", "roll_number", name="uq_form_submission_roll"),
    )
