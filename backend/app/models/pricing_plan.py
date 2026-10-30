import json
from typing import List, Optional
from sqlalchemy import Column, String, Integer, Boolean, Text
from app.models.base import TimeStampedModel

class PricingPlan(TimeStampedModel):
    __tablename__ = "pricing_plans"

    # Unique code for routing and payment reference (e.g. "teacher_signup_bonus", "starter_recharge", "standard_recharge", "professional_recharge", "institutional_plan")
    plan_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    plan_type = Column(String(50), default="RECHARGE", nullable=False)  # "FREE_SIGNUP", "RECHARGE", "INSTITUTIONAL"

    # Financial fields in integer paise and rupee presentation
    price_inr = Column(Integer, default=0, nullable=False)        # In Rupees (e.g. 0, 100, 199, 499)
    price_paise = Column(Integer, default=0, nullable=False)      # In Paise (e.g. 0, 10000, 19900, 49900)
    formatted_price = Column(String(50), default="₹0", nullable=False) # e.g. "₹0", "₹100", "₹199", "₹499", "Custom"
    price_subtext = Column(String(100), nullable=True)            # e.g. "100% Free", "/ 1,000 Credits", "/ 2,200 Credits", "/ FDP Vouchers"

    # Credit Economics
    base_credits = Column(Integer, default=0, nullable=False)     # Base purchased credits
    bonus_credits = Column(Integer, default=0, nullable=False)    # Additional bonus credits
    total_credits = Column(Integer, default=0, nullable=False)    # base_credits + bonus_credits

    # Validity & Expiry Rules
    validity_days = Column(Integer, nullable=True)                # e.g. 15 for signup bonus; null for never expire
    credits_never_expire = Column(Boolean, default=True, nullable=False)

    # UI presentation & badges
    badge = Column(String(50), nullable=True)                     # e.g. "100% Free", "Starter", "10% Extra", "20% Extra", "Institutional"
    is_featured = Column(Boolean, default=False, nullable=False)
    is_recommended = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    display_order = Column(Integer, default=1, nullable=False)
    color_accent = Column(String(50), default="blue", nullable=False) # "blue", "indigo", "purple", "teal", "emerald"

    # Call-to-action
    button_label = Column(String(100), default="Get Started", nullable=False)
    button_action = Column(String(50), default="recharge", nullable=False) # "signup", "recharge", "institutional_modal"

    # Content
    description = Column(String(255), nullable=True)
    features_json = Column(Text, nullable=True)  # JSON array of strings

    # Soft delete
    is_deleted = Column(Boolean, default=False, nullable=False)

    def get_features_list(self) -> List[str]:
        if not self.features_json:
            return []
        try:
            val = json.loads(self.features_json)
            return val if isinstance(val, list) else []
        except Exception:
            return []

    def set_features_list(self, features: List[str]) -> None:
        self.features_json = json.dumps(features or [])

