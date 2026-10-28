from sqlalchemy import Column, String, Integer, ForeignKey, Text, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.models.base import TimeStampedModel

class CouponCampaign(TimeStampedModel):
    __tablename__ = "coupon_campaigns"

    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    code_prefix = Column(String(50), default="TESTORA-", nullable=False)
    credits_per_coupon = Column(Integer, nullable=False)
    credit_type = Column(String(20), default="PAID", nullable=False)  # "PAID" (regular) or "BONUS" (promotional)
    bonus_expiry_days = Column(Integer, default=30, nullable=True)     # validity days if credit_type == "BONUS"
    total_coupons = Column(Integer, default=0, nullable=False)
    redeemed_count = Column(Integer, default=0, nullable=False)
    revoked_count = Column(Integer, default=0, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    allowed_roles = Column(String(100), default="teacher", nullable=False) # e.g. "teacher" or "teacher,inst_admin"
    max_redemptions_per_user = Column(Integer, default=1, nullable=False)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=True)

    # Relationships
    creator = relationship("User", foreign_keys=[created_by])
    coupons = relationship("Coupon", back_populates="campaign", cascade="all, delete-orphan")


class Coupon(TimeStampedModel):
    __tablename__ = "coupons"

    campaign_id = Column(String(36), ForeignKey("coupon_campaigns.id"), nullable=False, index=True)
    code = Column(String(100), unique=True, index=True, nullable=False)
    credits = Column(Integer, nullable=False)
    status = Column(String(20), default="UNUSED", nullable=False, index=True)  # "UNUSED", "REDEEMED", "EXPIRED", "REVOKED"
    redeemed_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    redeemed_at = Column(DateTime(timezone=True), nullable=True)
    revoked_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    revoked_reason = Column(String(255), nullable=True)

    # Relationships
    campaign = relationship("CouponCampaign", back_populates="coupons")
    redeemed_by = relationship("User", foreign_keys=[redeemed_by_user_id])


class SystemSetting(TimeStampedModel):
    __tablename__ = "system_settings"

    key = Column(String(100), unique=True, index=True, nullable=False)
    value = Column(Text, nullable=False)
    description = Column(String(255), nullable=True)
    value_type = Column(String(20), default="string", nullable=False) # "string", "int", "bool", "json"
