from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class CouponCampaignCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    code_prefix: str = Field(default="TESTORA-", max_length=20)
    credits_per_coupon: int = Field(..., gt=0, le=1000000)
    credit_type: str = Field(default="PAID", pattern="^(PAID|BONUS)$")
    bonus_expiry_days: Optional[int] = Field(default=30, gt=0, le=365)
    total_coupons: int = Field(..., gt=0, le=10000)
    expires_at: Optional[datetime] = None
    allowed_roles: str = Field(default="teacher", max_length=100)
    max_redemptions_per_user: int = Field(default=1, gt=0, le=10)

class CouponResponse(BaseModel):
    id: str
    campaign_id: str
    code: str
    credits: int
    status: str
    redeemed_by_user_id: Optional[str] = None
    redeemed_at: Optional[datetime] = None
    revoked_at: Optional[datetime] = None
    revoked_reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class CouponCampaignResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    code_prefix: str
    credits_per_coupon: int
    credit_type: str
    bonus_expiry_days: Optional[int] = None
    total_coupons: int
    redeemed_count: int
    revoked_count: int
    expires_at: Optional[datetime] = None
    is_active: bool
    allowed_roles: str
    max_redemptions_per_user: int
    created_at: datetime

    class Config:
        from_attributes = True

class CouponCampaignDetailResponse(CouponCampaignResponse):
    coupons: List[CouponResponse] = []

class RedeemCouponRequest(BaseModel):
    code: str = Field(..., min_length=4, max_length=100)

class RedeemCouponResponse(BaseModel):
    success: bool
    credits_added: int
    credit_type: str
    new_balance: int
    campaign_name: str
    message: str

class SystemSettingResponse(BaseModel):
    key: str
    value: str
    description: Optional[str] = None
    value_type: str

    class Config:
        from_attributes = True

class SystemSettingUpdate(BaseModel):
    value: str
