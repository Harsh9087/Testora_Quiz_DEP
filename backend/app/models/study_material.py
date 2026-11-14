from sqlalchemy import Column, String, Integer, Text, Boolean, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.models.base import TimeStampedModel

class StudyMaterial(TimeStampedModel):
    __tablename__ = "study_materials"

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), default="company_notes", nullable=False, index=True)
    category_display = Column(String(150), default="Company Notes (TCS, Wipro & More)", nullable=False)
    
    # Document storage / URL
    file_url = Column(Text, nullable=False)
    file_type = Column(String(20), default="pdf", nullable=False)
    file_size_mb = Column(Float, default=1.5, nullable=True)
    pages_count = Column(Integer, default=10, nullable=True)
    
    # Monetization via Credits
    is_paid = Column(Boolean, default=False, nullable=False, index=True)
    credit_cost = Column(Integer, default=0, nullable=False) # e.g. 0, 49, 99 credits
    
    # UI Badges
    badge_text = Column(String(50), nullable=True) # "NEW", "FREE", "PREMIUM", "POPULAR"
    badge_color = Column(String(50), default="purple", nullable=False) # "purple", "green", "blue", "amber"
    
    # Visibility and ordering
    is_published = Column(Boolean, default=True, nullable=False, index=True)
    display_order = Column(Integer, default=0, nullable=False)
    
    # Usage metrics
    downloads_count = Column(Integer, default=0, nullable=False)
    views_count = Column(Integer, default=0, nullable=False)
    
    # Created by (Super Admin / Admin)
    created_by_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_by = relationship("User")
    
    # Unlocks relationship
    unlocks = relationship("StudyMaterialUnlock", back_populates="material", cascade="all, delete-orphan")


class StudyMaterialUnlock(TimeStampedModel):
    __tablename__ = "study_material_unlocks"

    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    material_id = Column(String(36), ForeignKey("study_materials.id"), nullable=False, index=True)
    credits_spent = Column(Integer, default=0, nullable=False)
    unlocked_at = Column(String(50), nullable=True)

    user = relationship("User")
    material = relationship("StudyMaterial", back_populates="unlocks")

