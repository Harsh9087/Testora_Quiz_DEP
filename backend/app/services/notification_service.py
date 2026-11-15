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
        is_universal=False,
        link=link
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


def create_universal_notification(
    db: Session,
    title: str,
    message: str,
    notification_type: str = "system",
    link: Optional[str] = None,
    author_user_id: Optional[str] = None
) -> Optional[Notification]:
    """
    Dispatches a broadcast notification visible to all students and instructors.
    Universal notifications are dispatched for:
    - Mock test completion
    - Placement / assessment submission
    - Premium plan / credit wallet recharge
    """
    import uuid
    from app.models.user import User

    if not author_user_id:
        sys_admin = db.query(User).filter(User.role == "super_admin").first()
        author_user_id = sys_admin.id if sys_admin else None

    if not author_user_id:
        first_user = db.query(User).first()
        author_user_id = first_user.id if first_user else str(uuid.uuid4())

    notification = Notification(
        id=str(uuid.uuid4()),
        user_id=author_user_id,
        title=title,
        message=message,
        type=notification_type,
        is_read=False,
        is_universal=True,
        link=link
    )
    db.add(notification)
    try:
        db.commit()
        db.refresh(notification)
        return notification
    except Exception as e:
        db.rollback()
        logger_warn = f"Failed to commit universal notification: {e}"
        print(logger_warn)
        return None
