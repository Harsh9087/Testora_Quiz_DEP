from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any
from app.database import get_db
from app.models.user import User
from app.models.user_preference import UserPreference
from app.schemas.preference import PreferenceResponse, PreferenceUpdate
from app.utils.security import get_current_user

router = APIRouter(prefix="/preferences", tags=["preferences"])

def get_or_create_user_preference(db: Session, user: User) -> UserPreference:
    pref = db.query(UserPreference).filter(
        UserPreference.user_id == user.id,
        UserPreference.is_deleted == False
    ).first()
    
    if not pref:
        pref = UserPreference(
            user_id=user.id,
            font_family="inter",
            text_scale=100,
            interface_density="standard",
            theme="system",
            language="en",
            timezone="Asia/Kolkata",
            date_format="DD/MM/YYYY",
            time_format="12h",
            high_contrast=False,
            reduced_motion=False,
            high_focus=False,
            sound_enabled=True,
            master_notifications=True,
            channel_in_app=True,
            channel_email=True,
            channel_push=False,
            cat_messages=True,
            cat_account=True,
            cat_security=True,
            cat_announcements=True,
            cat_updates=True,
            cat_reminders=True,
            cat_marketing=False,
            search_history_enabled=True,
            search_default_sort="newest",
            search_default_filter="all",
            two_factor_enabled=False,
            profile_visibility="institution"
        )
        db.add(pref)
        db.commit()
        db.refresh(pref)
    return pref

@router.get("", response_model=PreferenceResponse)
@router.get("/", response_model=PreferenceResponse)
def get_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve personal preferences for the authenticated user."""
    pref = get_or_create_user_preference(db, current_user)
    return pref

@router.put("", response_model=PreferenceResponse)
@router.put("/", response_model=PreferenceResponse)
def update_preferences(
    req: PreferenceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update personal preferences with server-side validation."""
    pref = get_or_create_user_preference(db, current_user)
    
    update_data = req.dict(exclude_unset=True)
    
    # Enforce security constraint: Essential security alerts can never be disabled
    if "cat_security" in update_data:
        update_data["cat_security"] = True
        
    for key, value in update_data.items():
        if hasattr(pref, key):
            setattr(pref, key, value)
            
    db.add(pref)
    db.commit()
    db.refresh(pref)
    return pref

@router.post("/reset", response_model=PreferenceResponse)
def reset_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reset preferences to system defaults."""
    pref = get_or_create_user_preference(db, current_user)
    
    pref.font_family = "inter"
    pref.text_scale = 100
    pref.interface_density = "standard"
    pref.theme = "system"
    pref.language = "en"
    pref.timezone = "Asia/Kolkata"
    pref.date_format = "DD/MM/YYYY"
    pref.time_format = "12h"
    pref.high_contrast = False
    pref.reduced_motion = False
    pref.high_focus = False
    pref.sound_enabled = True
    pref.master_notifications = True
    pref.channel_in_app = True
    pref.channel_email = True
    pref.channel_push = False
    pref.cat_messages = True
    pref.cat_account = True
    pref.cat_security = True
    pref.cat_announcements = True
    pref.cat_updates = True
    pref.cat_reminders = True
    pref.cat_marketing = False
    pref.search_history_enabled = True
    pref.search_default_sort = "newest"
    pref.search_default_filter = "all"
    pref.two_factor_enabled = False
    pref.profile_visibility = "institution"
    
    db.add(pref)
    db.commit()
    db.refresh(pref)
    return pref

@router.get("/export-data")
def export_user_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export complete account and preferences data archive for the authenticated user."""
    pref = get_or_create_user_preference(db, current_user)
    
    from app.models.exam import Exam, ExamSubmission
    from app.models.candidate import ExamCandidate
    from app.models.notification import Notification
    
    submissions_list = []
    candidates = db.query(ExamCandidate).filter(
        ExamCandidate.email_snapshot == current_user.email
    ).all()
    candidate_ids = [c.id for c in candidates]
    if candidate_ids:
        subs = db.query(ExamSubmission).filter(
            ExamSubmission.candidate_id.in_(candidate_ids),
            ExamSubmission.is_deleted == False
        ).all()
        submissions_list = [
            {
                "id": s.id,
                "exam_id": s.exam_id,
                "score": s.score,
                "percentage": s.percentage,
                "status": s.status,
                "submitted_at": s.submitted_at.isoformat() if s.submitted_at else ""
            }
            for s in subs[:20]
        ]
        
    created_exams = []
    if current_user.role in ["teacher", "inst_admin", "super_admin"]:
        exams = db.query(Exam).filter(
            Exam.created_by == current_user.id,
            Exam.is_deleted == False
        ).limit(20).all()
        created_exams = [
            {
                "id": e.id,
                "title": getattr(e, "name", "Exam"),
                "exam_code": e.exam_code,
                "created_at": e.created_at.isoformat() if e.created_at else ""
            }
            for e in exams
        ]
    
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).limit(50).all()
    
    data_bundle = {
        "export_metadata": {
            "platform": "Testora Quiz Enterprise",
            "version": "1.5.0",
            "generated_at": current_user.created_at.isoformat() if current_user.created_at else "",
            "account_id": current_user.id
        },
        "user_profile": {
            "email": current_user.email,
            "full_name": current_user.full_name,
            "role": current_user.role,
            "institution_id": current_user.institution_id,
            "credits_balance": current_user.total_available_credits,
            "auth_provider": current_user.auth_provider,
            "is_verified": current_user.is_verified,
            "created_at": current_user.created_at.isoformat() if current_user.created_at else ""
        },
        "preferences": {
            "font_family": pref.font_family,
            "text_scale": pref.text_scale,
            "interface_density": pref.interface_density,
            "theme": pref.theme,
            "language": pref.language,
            "timezone": pref.timezone,
            "high_contrast": pref.high_contrast,
            "reduced_motion": pref.reduced_motion,
            "sound_enabled": pref.sound_enabled,
            "notifications": {
                "master": pref.master_notifications,
                "in_app": pref.channel_in_app,
                "email": pref.channel_email,
                "push": pref.channel_push,
                "categories": {
                    "messages": pref.cat_messages,
                    "account": pref.cat_account,
                    "security": pref.cat_security,
                    "announcements": pref.cat_announcements,
                    "updates": pref.cat_updates,
                    "reminders": pref.cat_reminders,
                    "marketing": pref.cat_marketing
                }
            }
        },
        "activity_summary": {
            "total_submissions": len(submissions_list),
            "recent_submissions": submissions_list,
            "created_exams": created_exams,
            "recent_notifications": [
                {
                    "id": n.id,
                    "title": n.title,
                    "type": n.type,
                    "is_read": n.is_read,
                    "created_at": n.created_at.isoformat() if n.created_at else ""
                }
                for n in notifications[:20]
            ]
        }
    }
    
    return data_bundle
