import os
import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel

from app.database import get_db
from app.models.study_material import StudyMaterial, StudyMaterialUnlock
from app.models.payment import CreditTransaction
from app.models.user import User
from app.utils.security import get_current_user, RoleChecker, get_optional_current_user

router = APIRouter(prefix="/study-materials", tags=["study-materials"])
admin_required = RoleChecker(["super_admin", "inst_admin"])

# Predefined standard category mappings
STANDARD_CATEGORIES = [
    {
        "slug": "company_notes",
        "name": "Company Notes (TCS, Wipro & More)",
        "icon": "Building2",
        "badge": "NEW",
        "badge_color": "purple"
    },
    {
        "slug": "dsa",
        "name": "DSA & Problem Solving",
        "icon": "Code2",
        "badge": "HOT",
        "badge_color": "amber"
    },
    {
        "slug": "web_development",
        "name": "Web Development",
        "icon": "Monitor",
        "badge": "POPULAR",
        "badge_color": "blue"
    },
    {
        "slug": "cloud_computing",
        "name": "Cloud Computing",
        "icon": "Cloud",
        "badge": "TECH",
        "badge_color": "indigo"
    },
    {
        "slug": "all",
        "name": "All Study Materials",
        "icon": "FolderOpen",
        "badge": "FREE",
        "badge_color": "green"
    }
]

# Pydantic Schemas
class StudyMaterialCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: str = "company_notes"
    category_display: Optional[str] = None
    file_url: str
    file_type: str = "pdf"
    file_size_mb: Optional[float] = 1.5
    pages_count: Optional[int] = 10
    is_paid: bool = False
    credit_cost: int = 0
    badge_text: Optional[str] = None
    badge_color: Optional[str] = "purple"
    is_published: bool = True
    display_order: int = 0

class StudyMaterialUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    category_display: Optional[str] = None
    file_url: Optional[str] = None
    file_type: Optional[str] = None
    file_size_mb: Optional[float] = None
    pages_count: Optional[int] = None
    is_paid: Optional[bool] = None
    credit_cost: Optional[int] = None
    badge_text: Optional[str] = None
    badge_color: Optional[str] = None
    is_published: Optional[bool] = None
    display_order: Optional[int] = None

# =============================================================================
# PUBLIC & AUTHENTICATED BROWSING ENDPOINTS
# =============================================================================

@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    """Returns available study material categories with published counts."""
    categories_result = []
    total_materials = db.query(StudyMaterial).filter(
        StudyMaterial.is_published == True,
        StudyMaterial.is_deleted == False
    ).count()

    for cat in STANDARD_CATEGORIES:
        if cat["slug"] == "all":
            count = total_materials
        else:
            count = db.query(StudyMaterial).filter(
                StudyMaterial.category == cat["slug"],
                StudyMaterial.is_published == True,
                StudyMaterial.is_deleted == False
            ).count()

        categories_result.append({
            **cat,
            "count": count
        })
    return categories_result


@router.get("/")
def list_study_materials(
    category: Optional[str] = None,
    is_paid: Optional[bool] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    List published study materials.
    Includes 'is_unlocked' flag based on user's wallet unlocks.
    """
    query = db.query(StudyMaterial).filter(StudyMaterial.is_deleted == False)

    # Non-admins only see published materials
    is_admin = current_user and current_user.role in ["super_admin", "inst_admin"]
    if not is_admin:
        query = query.filter(StudyMaterial.is_published == True)

    if category and category != "all":
        query = query.filter(StudyMaterial.category == category)

    if is_paid is not None:
        query = query.filter(StudyMaterial.is_paid == is_paid)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                StudyMaterial.title.ilike(search_term),
                StudyMaterial.description.ilike(search_term),
                StudyMaterial.category_display.ilike(search_term)
            )
        )

    query = query.order_by(StudyMaterial.display_order.asc(), StudyMaterial.created_at.desc())
    materials = query.offset(skip).limit(limit).all()

    # Determine user unlocks
    unlocked_material_ids = set()
    if current_user:
        user_unlocks = db.query(StudyMaterialUnlock.material_id).filter(
            StudyMaterialUnlock.user_id == current_user.id
        ).all()
        unlocked_material_ids = {u[0] for u in user_unlocks}

    result = []
    for item in materials:
        # A material is considered unlocked if:
        # 1. It is free (is_paid == False)
        # 2. User has unlocked it
        # 3. User is super_admin or inst_admin
        is_unlocked = bool((not item.is_paid) or (item.id in unlocked_material_ids) or is_admin)

        result.append({
            "id": item.id,
            "title": item.title,
            "description": item.description,
            "category": item.category,
            "category_display": item.category_display,
            "file_type": item.file_type,
            "file_size_mb": item.file_size_mb,
            "pages_count": item.pages_count,
            "is_paid": item.is_paid,
            "credit_cost": item.credit_cost,
            "badge_text": item.badge_text,
            "badge_color": item.badge_color,
            "is_published": item.is_published,
            "downloads_count": item.downloads_count,
            "views_count": item.views_count,
            "is_unlocked": is_unlocked,
            # Reveal file_url only if unlocked or admin
            "file_url": item.file_url if is_unlocked else None,
            "created_at": item.created_at.isoformat() if item.created_at else None
        })

    return result


@router.get("/{material_id}")
def get_study_material_detail(
    material_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """Get single study material detail and increment view count."""
    material = db.query(StudyMaterial).filter(
        StudyMaterial.id == material_id,
        StudyMaterial.is_deleted == False
    ).first()

    if not material:
        raise HTTPException(status_code=404, detail="Study material not found.")

    is_admin = current_user and current_user.role in ["super_admin", "inst_admin"]
    if not material.is_published and not is_admin:
        raise HTTPException(status_code=403, detail="This material is currently not published.")

    # Increment views
    material.views_count = (material.views_count or 0) + 1
    db.commit()

    is_unlocked = False
    if not material.is_paid or is_admin:
        is_unlocked = True
    elif current_user:
        unlocked = db.query(StudyMaterialUnlock).filter(
            StudyMaterialUnlock.user_id == current_user.id,
            StudyMaterialUnlock.material_id == material.id
        ).first()
        if unlocked:
            is_unlocked = True

    return {
        "id": material.id,
        "title": material.title,
        "description": material.description,
        "category": material.category,
        "category_display": material.category_display,
        "file_type": material.file_type,
        "file_size_mb": material.file_size_mb,
        "pages_count": material.pages_count,
        "is_paid": material.is_paid,
        "credit_cost": material.credit_cost,
        "badge_text": material.badge_text,
        "badge_color": material.badge_color,
        "is_published": material.is_published,
        "downloads_count": material.downloads_count,
        "views_count": material.views_count,
        "is_unlocked": is_unlocked,
        "file_url": material.file_url if is_unlocked else None,
        "created_at": material.created_at.isoformat() if material.created_at else None
    }


# =============================================================================
# CREDIT-BASED UNLOCK ENDPOINT
# =============================================================================

@router.post("/{material_id}/unlock")
def unlock_study_material(
    material_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Unlocks a paid study material by deducting credits from user's wallet.
    """
    material = db.query(StudyMaterial).filter(
        StudyMaterial.id == material_id,
        StudyMaterial.is_deleted == False
    ).first()

    if not material:
        raise HTTPException(status_code=404, detail="Study material not found.")

    # Free check
    if not material.is_paid or material.credit_cost == 0:
        return {
            "success": True,
            "message": f"'{material.title}' is free and ready to access!",
            "is_unlocked": True,
            "download_url": material.file_url,
            "new_balance": current_user.total_available_credits
        }

    # Already unlocked check
    existing_unlock = db.query(StudyMaterialUnlock).filter(
        StudyMaterialUnlock.user_id == current_user.id,
        StudyMaterialUnlock.material_id == material.id
    ).first()

    if existing_unlock:
        return {
            "success": True,
            "message": f"You have already unlocked '{material.title}'!",
            "is_unlocked": True,
            "download_url": material.file_url,
            "new_balance": current_user.total_available_credits
        }

    credits_needed = material.credit_cost
    available_balance = current_user.total_available_credits

    if available_balance < credits_needed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient credits. This notes requires {credits_needed} credits, but your current balance is {available_balance} credits. Please recharge your wallet."
        )

    # Deduct bonus credits first, then main balance
    active_bonus = current_user.active_bonus_credits
    bonus_deducted = min(active_bonus, credits_needed)
    if bonus_deducted > 0:
        current_user.bonus_credits = max(0, current_user.bonus_credits - bonus_deducted)

    remainder_needed = credits_needed - bonus_deducted
    if remainder_needed > 0:
        current_user.credits_balance = max(0, (current_user.credits_balance or 0) - remainder_needed)

    # Record Credit Transaction
    new_balance = current_user.total_available_credits
    transaction = CreditTransaction(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        transaction_type="STUDY_MATERIAL_UNLOCK",
        amount_credits=-credits_needed,
        balance_after=new_balance,
        description=f"Unlocked Notes: {material.title[:50]} ({credits_needed} Credits)"
    )
    db.add(transaction)

    # Record Study Material Unlock
    unlock_record = StudyMaterialUnlock(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        material_id=material.id,
        credits_spent=credits_needed,
        unlocked_at=datetime.now(timezone.utc).isoformat()
    )
    db.add(unlock_record)

    # Increment download / access count
    material.downloads_count = (material.downloads_count or 0) + 1
    db.commit()

    return {
        "success": True,
        "message": f"Successfully unlocked '{material.title}' for {credits_needed} credits!",
        "is_unlocked": True,
        "download_url": material.file_url,
        "new_balance": new_balance
    }


@router.post("/{material_id}/download")
def record_material_download(
    material_id: str,
    db: Session = Depends(get_db)
):
    """Records download count increment."""
    material = db.query(StudyMaterial).filter(
        StudyMaterial.id == material_id,
        StudyMaterial.is_deleted == False
    ).first()

    if material:
        material.downloads_count = (material.downloads_count or 0) + 1
        db.commit()
        return {"success": True, "downloads_count": material.downloads_count}
    return {"success": False}


# =============================================================================
# SUPER ADMIN / ADMIN CRUD & FILE UPLOAD
# =============================================================================

@router.post("/upload-file")
async def upload_study_material_file(
    file: UploadFile = File(...),
    current_user: User = Depends(admin_required)
):
    """
    Super Admin uploads a PDF/Docx study material.
    Saves to static directory and returns direct file URL.
    """
    static_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static", "study_materials")
    os.makedirs(static_dir, exist_ok=True)

    file_ext = os.path.splitext(file.filename)[1].lower() or ".pdf"
    clean_name = "".join(c for c in os.path.splitext(file.filename)[0] if c.isalnum() or c in ("-", "_")).lower()
    unique_filename = f"{clean_name}_{uuid.uuid4().hex[:8]}{file_ext}"
    dest_path = os.path.join(static_dir, unique_filename)

    contents = await file.read()
    with open(dest_path, "wb") as f:
        f.write(contents)

    file_size_mb = round(len(contents) / (1024 * 1024), 2)
    file_url = f"/static/study_materials/{unique_filename}"

    return {
        "success": True,
        "file_url": file_url,
        "file_name": unique_filename,
        "file_size_mb": file_size_mb,
        "file_type": file_ext.replace(".", "")
    }


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_study_material(
    payload: StudyMaterialCreate,
    current_user: User = Depends(admin_required),
    db: Session = Depends(get_db)
):
    """Super Admin creates a new study material."""
    category_display = payload.category_display
    if not category_display:
        matched = next((c["name"] for c in STANDARD_CATEGORIES if c["slug"] == payload.category), None)
        category_display = matched or payload.category.replace("_", " ").title()

    new_item = StudyMaterial(
        id=str(uuid.uuid4()),
        title=payload.title.strip(),
        description=payload.description.strip() if payload.description else None,
        category=payload.category,
        category_display=category_display,
        file_url=payload.file_url.strip(),
        file_type=payload.file_type.lower(),
        file_size_mb=payload.file_size_mb or 1.5,
        pages_count=payload.pages_count or 10,
        is_paid=payload.is_paid,
        credit_cost=payload.credit_cost if payload.is_paid else 0,
        badge_text=payload.badge_text,
        badge_color=payload.badge_color or "purple",
        is_published=payload.is_published,
        display_order=payload.display_order,
        created_by_id=current_user.id
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    return {
        "success": True,
        "message": f"Study material '{new_item.title}' created successfully!",
        "item": {
            "id": new_item.id,
            "title": new_item.title,
            "category": new_item.category,
            "is_paid": new_item.is_paid,
            "credit_cost": new_item.credit_cost,
            "file_url": new_item.file_url
        }
    }


@router.put("/{material_id}")
def update_study_material(
    material_id: str,
    payload: StudyMaterialUpdate,
    current_user: User = Depends(admin_required),
    db: Session = Depends(get_db)
):
    """Super Admin updates an existing study material."""
    material = db.query(StudyMaterial).filter(
        StudyMaterial.id == material_id,
        StudyMaterial.is_deleted == False
    ).first()

    if not material:
        raise HTTPException(status_code=404, detail="Study material not found.")

    update_data = payload.dict(exclude_unset=True)
    if "is_paid" in update_data and not update_data["is_paid"]:
        material.credit_cost = 0

    if "category" in update_data and "category_display" not in update_data:
        matched = next((c["name"] for c in STANDARD_CATEGORIES if c["slug"] == update_data["category"]), None)
        if matched:
            material.category_display = matched

    for key, value in update_data.items():
        setattr(material, key, value)

    db.commit()
    db.refresh(material)

    return {
        "success": True,
        "message": f"Study material '{material.title}' updated successfully!",
        "item": {
            "id": material.id,
            "title": material.title,
            "category": material.category,
            "is_paid": material.is_paid,
            "credit_cost": material.credit_cost,
            "is_published": material.is_published
        }
    }


@router.delete("/{material_id}")
def delete_study_material(
    material_id: str,
    current_user: User = Depends(admin_required),
    db: Session = Depends(get_db)
):
    """Super Admin soft-deletes a study material."""
    material = db.query(StudyMaterial).filter(
        StudyMaterial.id == material_id,
        StudyMaterial.is_deleted == False
    ).first()

    if not material:
        raise HTTPException(status_code=404, detail="Study material not found.")

    material.is_deleted = True
    material.is_published = False
    db.commit()

    return {"success": True, "message": f"Study material '{material.title}' deleted successfully."}

