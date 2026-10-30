import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.pricing_plan import PricingPlan
from app.models.user import User
from app.schemas.pricing_plan import (
    PricingPlanCreate,
    PricingPlanUpdate,
    PricingPlanResponse,
    PricingPlanReorderRequest
)
from app.utils.security import RoleChecker, get_current_user

router = APIRouter(tags=["pricing-plans"])
super_admin_required = RoleChecker(["super_admin"])

def serialize_plan(plan: PricingPlan) -> dict:
    return {
        "id": plan.id,
        "plan_code": plan.plan_code,
        "name": plan.name,
        "plan_type": plan.plan_type,
        "price_inr": plan.price_inr,
        "price_paise": plan.price_paise,
        "formatted_price": plan.formatted_price,
        "price_subtext": plan.price_subtext,
        "base_credits": plan.base_credits,
        "bonus_credits": plan.bonus_credits,
        "total_credits": plan.total_credits,
        "validity_days": plan.validity_days,
        "credits_never_expire": plan.credits_never_expire,
        "badge": plan.badge,
        "is_featured": plan.is_featured,
        "is_recommended": plan.is_recommended,
        "is_active": plan.is_active,
        "display_order": plan.display_order,
        "color_accent": plan.color_accent,
        "button_label": plan.button_label,
        "button_action": plan.button_action,
        "description": plan.description,
        "features": plan.get_features_list(),
        "created_at": plan.created_at,
        "updated_at": plan.updated_at
    }


# =============================================================================
# 1. PUBLIC ENDPOINTS (Homepage & Pricing Page)
# =============================================================================
@router.get("/pricing-plans", response_model=List[PricingPlanResponse])
def get_public_pricing_plans(db: Session = Depends(get_db)):
    """
    Returns all published, active pricing plans ordered by display_order.
    Publicly accessible for the homepage and pricing sections.
    """
    plans = db.query(PricingPlan).filter(
        PricingPlan.is_active == True,
        PricingPlan.is_deleted == False
    ).order_by(PricingPlan.display_order.asc(), PricingPlan.price_inr.asc()).all()

    return [serialize_plan(p) for p in plans]


@router.get("/pricing-plans/{plan_code}", response_model=PricingPlanResponse)
def get_public_pricing_plan_detail(plan_code: str, db: Session = Depends(get_db)):
    """Returns details of a single plan by code or ID."""
    plan = db.query(PricingPlan).filter(
        (PricingPlan.plan_code == plan_code) | (PricingPlan.id == plan_code),
        PricingPlan.is_deleted == False
    ).first()

    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Plan '{plan_code}' not found.")

    return serialize_plan(plan)


# =============================================================================
# 2. SUPER ADMIN ENDPOINTS (Pricing Plans Management)
# =============================================================================
@router.get("/admin/pricing-plans", response_model=List[PricingPlanResponse])
def get_admin_pricing_plans(
    current_user: User = Depends(super_admin_required),
    db: Session = Depends(get_db)
):
    """
    Lists all pricing plans (active and inactive) for Super Admin management.
    """
    plans = db.query(PricingPlan).filter(
        PricingPlan.is_deleted == False
    ).order_by(PricingPlan.display_order.asc()).all()

    return [serialize_plan(p) for p in plans]


@router.post("/admin/pricing-plans", response_model=PricingPlanResponse, status_code=status.HTTP_201_CREATED)
def create_pricing_plan(
    payload: PricingPlanCreate,
    current_user: User = Depends(super_admin_required),
    db: Session = Depends(get_db)
):
    """
    Creates a new custom pricing plan.
    """
    existing = db.query(PricingPlan).filter(
        PricingPlan.plan_code == payload.plan_code,
        PricingPlan.is_deleted == False
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A plan with code '{payload.plan_code}' already exists."
        )

    # Calculate price_paise if not set
    price_paise = payload.price_paise or (payload.price_inr * 100)
    total_credits = payload.total_credits or (payload.base_credits + payload.bonus_credits)

    plan = PricingPlan(
        plan_code=payload.plan_code.strip().lower(),
        name=payload.name.strip(),
        plan_type=payload.plan_type,
        price_inr=payload.price_inr,
        price_paise=price_paise,
        formatted_price=payload.formatted_price or f"₹{payload.price_inr}",
        price_subtext=payload.price_subtext,
        base_credits=payload.base_credits,
        bonus_credits=payload.bonus_credits,
        total_credits=total_credits,
        validity_days=payload.validity_days,
        credits_never_expire=payload.credits_never_expire,
        badge=payload.badge,
        is_featured=payload.is_featured,
        is_recommended=payload.is_recommended,
        is_active=payload.is_active,
        display_order=payload.display_order,
        color_accent=payload.color_accent,
        button_label=payload.button_label,
        button_action=payload.button_action,
        description=payload.description
    )
    plan.set_features_list(payload.features)

    db.add(plan)
    db.commit()
    db.refresh(plan)
    return serialize_plan(plan)


@router.patch("/admin/pricing-plans/{plan_id}", response_model=PricingPlanResponse)
def update_pricing_plan(
    plan_id: str,
    payload: PricingPlanUpdate,
    current_user: User = Depends(super_admin_required),
    db: Session = Depends(get_db)
):
    """
    Updates configuration of a pricing plan.
    """
    plan = db.query(PricingPlan).filter(
        (PricingPlan.id == plan_id) | (PricingPlan.plan_code == plan_id),
        PricingPlan.is_deleted == False
    ).first()

    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pricing plan not found.")

    update_data = payload.model_dump(exclude_unset=True)

    if "features" in update_data:
        plan.set_features_list(update_data.pop("features"))

    for key, value in update_data.items():
        setattr(plan, key, value)

    # Auto-sync paise if INR changed
    if "price_inr" in update_data and "price_paise" not in update_data:
        plan.price_paise = plan.price_inr * 100
        if "formatted_price" not in update_data and plan.plan_type != "INSTITUTIONAL":
            plan.formatted_price = f"₹{plan.price_inr}"

    # Auto-sync total credits if base or bonus changed
    if "base_credits" in update_data or "bonus_credits" in update_data:
        if "total_credits" not in update_data:
            plan.total_credits = (plan.base_credits or 0) + (plan.bonus_credits or 0)

    db.commit()
    db.refresh(plan)
    return serialize_plan(plan)


@router.delete("/admin/pricing-plans/{plan_id}")
def delete_pricing_plan(
    plan_id: str,
    current_user: User = Depends(super_admin_required),
    db: Session = Depends(get_db)
):
    """Soft deletes or deactivates a pricing plan."""
    plan = db.query(PricingPlan).filter(
        (PricingPlan.id == plan_id) | (PricingPlan.plan_code == plan_id),
        PricingPlan.is_deleted == False
    ).first()

    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pricing plan not found.")

    plan.is_deleted = True
    plan.is_active = False
    db.commit()

    return {"success": True, "message": f"Plan '{plan.name}' removed successfully."}


@router.post("/admin/pricing-plans/reorder")
def reorder_pricing_plans(
    payload: PricingPlanReorderRequest,
    current_user: User = Depends(super_admin_required),
    db: Session = Depends(get_db)
):
    """Updates display order of multiple plans."""
    for item in payload.orders:
        plan = db.query(PricingPlan).filter(PricingPlan.id == item.id).first()
        if plan:
            plan.display_order = item.display_order
    db.commit()
    return {"success": True, "message": "Pricing plan display order updated."}


@router.post("/admin/pricing-plans/reset-defaults")
def reset_default_pricing_plans(
    current_user: User = Depends(super_admin_required),
    db: Session = Depends(get_db)
):
    """Resets or re-seeds standard default pricing plans."""
    from scratch.init_pricing_plans import default_plans
    for p in default_plans:
        existing = db.query(PricingPlan).filter(PricingPlan.plan_code == p["plan_code"]).first()
        if existing:
            for k, v in p.items():
                setattr(existing, k, v)
            existing.is_deleted = False
        else:
            db.add(PricingPlan(**p))
    db.commit()
    return {"success": True, "message": "Standard pricing plans restored."}

