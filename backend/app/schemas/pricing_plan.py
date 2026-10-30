from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class PricingPlanBase(BaseModel):
    plan_code: str = Field(..., min_length=2, max_length=50, description="Unique plan code")
    name: str = Field(..., min_length=2, max_length=100, description="Plan display name")
    plan_type: str = Field(default="RECHARGE", pattern="^(FREE_SIGNUP|RECHARGE|INSTITUTIONAL)$")
    
    price_inr: int = Field(default=0, ge=0, description="Price in INR")
    price_paise: int = Field(default=0, ge=0, description="Price in paise")
    formatted_price: str = Field(default="₹0", max_length=50)
    price_subtext: Optional[str] = Field(None, max_length=100)
    
    base_credits: int = Field(default=0, ge=0)
    bonus_credits: int = Field(default=0, ge=0)
    total_credits: int = Field(default=0, ge=0)
    
    validity_days: Optional[int] = Field(None, ge=1, le=3650)
    credits_never_expire: bool = Field(default=True)
    
    badge: Optional[str] = Field(None, max_length=50)
    is_featured: bool = Field(default=False)
    is_recommended: bool = Field(default=False)
    is_active: bool = Field(default=True)
    display_order: int = Field(default=1, ge=1)
    color_accent: str = Field(default="blue", max_length=50)
    
    button_label: str = Field(default="Get Started", max_length=100)
    button_action: str = Field(default="recharge", max_length=50)
    
    description: Optional[str] = Field(None, max_length=255)
    features: List[str] = Field(default_factory=list)

class PricingPlanCreate(PricingPlanBase):
    pass

class PricingPlanUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    plan_type: Optional[str] = Field(None, pattern="^(FREE_SIGNUP|RECHARGE|INSTITUTIONAL)$")
    price_inr: Optional[int] = Field(None, ge=0)
    price_paise: Optional[int] = Field(None, ge=0)
    formatted_price: Optional[str] = Field(None, max_length=50)
    price_subtext: Optional[str] = Field(None, max_length=100)
    base_credits: Optional[int] = Field(None, ge=0)
    bonus_credits: Optional[int] = Field(None, ge=0)
    total_credits: Optional[int] = Field(None, ge=0)
    validity_days: Optional[int] = Field(None)
    credits_never_expire: Optional[bool] = None
    badge: Optional[str] = Field(None, max_length=50)
    is_featured: Optional[bool] = None
    is_recommended: Optional[bool] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = Field(None, ge=1)
    color_accent: Optional[str] = Field(None, max_length=50)
    button_label: Optional[str] = Field(None, max_length=100)
    button_action: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = Field(None, max_length=255)
    features: Optional[List[str]] = None

class PricingPlanResponse(PricingPlanBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PlanOrderItem(BaseModel):
    id: str
    display_order: int

class PricingPlanReorderRequest(BaseModel):
    orders: List[PlanOrderItem]

