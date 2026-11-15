from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.user import User
from app.models.notification import Notification
from app.utils.security import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("/")
def get_user_notifications(
    unread_only: bool = False,
    limit: int = 20,
    notification_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch notifications for the logged-in user, including platform-wide universal activity."""
    query = db.query(Notification).filter(
        (Notification.user_id == current_user.id) | (Notification.is_universal == True),
        Notification.is_deleted == False
    )
    if unread_only:
        query = query.filter(Notification.is_read == False)
    
    if notification_type and notification_type.lower() != "all":
        query = query.filter(Notification.type == notification_type.lower())
    
    notifications = query.order_by(Notification.created_at.desc()).limit(limit).all()
    
    return [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "type": n.type or "info",
            "is_read": n.is_read,
            "is_universal": getattr(n, "is_universal", False) or False,
            "link": n.link,
            "created_at": n.created_at.isoformat() if n.created_at else ""
        }
        for n in notifications
    ]

@router.get("/unread-count")
def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Return count of unread notifications for navbar bell badge."""
    count = db.query(Notification).filter(
        (Notification.user_id == current_user.id) | (Notification.is_universal == True),
        Notification.is_read == False,
        Notification.is_deleted == False
    ).count()
    return {"count": count}

@router.get("/history")
def get_notifications_history(
    page: int = 1,
    limit: int = 50,
    filter_type: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns full chronological notification history for teachers and students.
    Includes universal placement, mock test, and payment event feeds.
    """
    query = db.query(Notification).filter(
        (Notification.user_id == current_user.id) | (Notification.is_universal == True),
        Notification.is_deleted == False
    )

    if filter_type and filter_type.lower() != "all":
        query = query.filter(Notification.type == filter_type.lower())

    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        query = query.filter(
            (Notification.title.ilike(term)) | (Notification.message.ilike(term))
        )

    total_count = query.count()
    offset = max(0, (page - 1) * limit)
    items = query.order_by(Notification.created_at.desc()).offset(offset).limit(limit).all()

    return {
        "total": total_count,
        "page": page,
        "limit": limit,
        "items": [
            {
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "type": n.type or "info",
                "is_read": n.is_read,
                "is_universal": getattr(n, "is_universal", False) or False,
                "link": n.link,
                "created_at": n.created_at.isoformat() if n.created_at else ""
            }
            for n in items
        ]
    }

@router.post("/{notification_id}/read")
def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a single notification as read."""
    n = db.query(Notification).filter(
        Notification.id == notification_id,
        (Notification.user_id == current_user.id) | (Notification.is_universal == True)
    ).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    n.is_read = True
    db.commit()
    return {"message": "Notification marked as read", "id": notification_id}

@router.post("/read-all")
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read for current user."""
    db.query(Notification).filter(
        (Notification.user_id == current_user.id) | (Notification.is_universal == True),
        Notification.is_read == False
    ).update({"is_read": True}, synchronize_session=False)
    db.commit()
    return {"message": "All notifications marked as read"}
