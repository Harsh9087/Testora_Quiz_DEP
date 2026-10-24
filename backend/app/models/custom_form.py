from typing import Optional
from sqlalchemy import Column, String, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from app.models.base import TimeStampedModel

class CustomForm(TimeStampedModel):
    __tablename__ = "custom_forms"

    workspace_id: str = Column(String(36), ForeignKey("workspaces.id"), nullable=False, index=True) # type: ignore
    created_by: str = Column(String(36), ForeignKey("users.id"), nullable=False) # type: ignore
    title: str = Column(String(255), nullable=False) # type: ignore
    description: Optional[str] = Column(Text, nullable=True) # type: ignore
    prompt: Optional[str] = Column(Text, nullable=True) # type: ignore
    # JSON list of field definitions: [{"id": "f_1", "label": "Full Name", "field_type": "text", "required": true, "options": []}]
    fields_schema: str = Column(Text, nullable=False, default="[]") # type: ignore
    share_slug: str = Column(String(64), unique=True, index=True, nullable=False) # type: ignore
    is_published: bool = Column(Boolean, default=False, nullable=False) # type: ignore
    is_active: bool = Column(Boolean, default=True, nullable=False) # type: ignore

    # Relationships
    workspace = relationship("Workspace")
    creator = relationship("User")
    submissions = relationship(
        "CustomFormSubmission", 
        back_populates="form", 
        cascade="all, delete-orphan",
        order_by="desc(CustomFormSubmission.created_at)"
    )

class CustomFormSubmission(TimeStampedModel):
    __tablename__ = "custom_form_submissions"

    form_id = Column(String(36), ForeignKey("custom_forms.id"), nullable=False, index=True)
    # JSON dict of responses: {"f_1": "John Doe", "f_2": "Excellent", ...}
    responses_json = Column(Text, nullable=False, default="{}")
    respondent_identifier = Column(String(255), nullable=True)
    status = Column(String(50), default="submitted", nullable=False)

    # Relationships
    form = relationship("CustomForm", back_populates="submissions")
