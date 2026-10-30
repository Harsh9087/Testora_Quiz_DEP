from sqlalchemy.orm import Session
from typing import Optional
from app.models.notification import Notification
from app.models.user_preference import UserPreference

def create_notification(
    db: Session,
    user_id: str,
    title: str,
    message: str,
    notification_type: str = "info",
    link: Optional[str] = None
) -> Optional[Notification]:
    """
    Helper to dispatch in-app notifications for users.
    Enforces user notification preferences and channel toggles.
    Security alerts are strictly protected and can never be suppressed.
    """
    pref = db.query(UserPreference).filter(
        UserPreference.user_id == user_id,
        UserPreference.is_deleted == False
    ).first()
    
    if pref:
        # Essential security alerts bypass user silencing
        if notification_type != "security":
            # 1. Master toggle check
            if not pref.master_notifications:
                return None
            
            # 2. In-app channel check
            if not pref.channel_in_app:
                return None
            
            # 3. Category checks
            norm_type = notification_type.lower()
            if norm_type in ["marketing", "promo"] and not pref.cat_marketing:
                return None
            if norm_type in ["exam", "reminder"] and not pref.cat_reminders:
                return None
            if norm_type in ["update", "feature"] and not pref.cat_updates:
                return None
            if norm_type in ["announcement", "system"] and not pref.cat_announcements:
                return None
            if norm_type in ["account", "profile"] and not pref.cat_account:
                return None
            if norm_type in ["message", "mention", "reply"] and not pref.cat_messages:
                return None

    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=notification_type,
        is_read=False,
        link=link
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification
