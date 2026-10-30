from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from sqlalchemy.orm import Session
import uuid
from jose import jwt

from app.database import get_db
from app.config import settings
from app.models.user import User
from app.models.support_ticket import SupportTicket
from app.models.notification import Notification
from app.services.email_service import email_service
import logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/support", tags=["support"])

class SupportTicketCreate(BaseModel):
    name: str
    email: EmailStr
    subject: str
    category: str = "General Inquiry"
    priority: str = "Medium"
    message: str
    reference_code: Optional[str] = None

class SupportTicketResponse(BaseModel):
    id: str
    ticket_code: str
    name: str
    email: str
    subject: str
    category: str
    priority: str
    status: str
    message: str
    reference_code: Optional[str] = None
    created_at: str

def get_optional_current_user(request: Request, db: Session = Depends(get_db)) -> Optional[User]:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"], options={"verify_exp": True})
        user_id = payload.get("sub")
        if user_id:
            return db.query(User).filter(User.id == user_id, User.is_deleted == False).first()
    except Exception:
        return None
    return None

@router.get("/info")
def get_support_info():
    """Returns official DPRAMP Tech Solutions customer support contact information."""
    return {
        "company_name": "DPRAMP Tech Solutions",
        "tagline": "AI-Powered Assessment & Educational Infrastructure",
        "support_email": "support@dpramp.com",
        "admin_email": "shaharerohit47@gmail.com",
        "phone_helpline": "+91 91722 00000",
        "whatsapp_helpline": "+91 91722 00000",
        "office_hours": "Monday to Saturday, 9:00 AM – 8:00 PM IST",
        "sla_response_time": "Average response within 2–4 hours",
        "emergency_desk": "24/7 dedicated support for live proctoring & examination disruptions",
        "headquarters": "Nagpur & Pune, Maharashtra, India"
    }

@router.post("/ticket", status_code=status.HTTP_201_CREATED)
def create_support_ticket(
    payload: SupportTicketCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Submits a support ticket to DPRAMP Tech Solutions.
    - Persists ticket in database.
    - Sends a professional confirmation email to the user's registered email.
    - Sends an instant dispatch notification to the DPRAMP Tech Solutions support desk.
    - Generates an in-app notification for the logged-in user.
    """
    current_user = get_optional_current_user(request, db)
    user_id = current_user.id if current_user else None

    # Generate a professional DPRAMP ticket code: DPR-TKT-XXXXXX
    ticket_code = f"DPR-TKT-{uuid.uuid4().hex[:6].upper()}"

    new_ticket = SupportTicket(
        ticket_code=ticket_code,
        user_id=user_id,
        name=payload.name.strip(),
        email=payload.email.lower().strip(),
        subject=payload.subject.strip(),
        category=payload.category.strip(),
        priority=payload.priority.strip(),
        status="Open",
        message=payload.message.strip(),
        reference_code=payload.reference_code.strip() if payload.reference_code else None,
        company_recipient="support@dpramp.com"
    )

    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)

    # If user is authenticated, create an in-app notification
    if user_id:
        try:
            notif = Notification(
                user_id=user_id,
                title=f"Support Ticket Created: {ticket_code}",
                message=f"DPRAMP Tech Solutions received your ticket '{payload.subject}'. Confirmation sent to {payload.email}.",
                type="info",
                link="/dashboard/support"
            )
            db.add(notif)
            db.commit()
        except Exception as e:
            logger.warning(f"Could not create in-app notification for support ticket: {e}")

    # Dispatch email confirmation asynchronously/safely
    try:
        email_service.send_support_ticket_confirmation(
            name=payload.name.strip(),
            user_email=payload.email.lower().strip(),
            ticket_code=ticket_code,
            subject=payload.subject.strip(),
            category=payload.category.strip(),
            priority=payload.priority.strip(),
            message=payload.message.strip(),
            reference_code=payload.reference_code.strip() if payload.reference_code else ""
        )
    except Exception as email_err:
        logger.error(f"Failed to dispatch support emails: {email_err}")

    return {
        "success": True,
        "ticket_code": ticket_code,
        "message": f"Your ticket ({ticket_code}) has been received by DPRAMP Tech Solutions. A confirmation email has been dispatched to {payload.email}.",
        "ticket": {
            "id": new_ticket.id,
            "ticket_code": new_ticket.ticket_code,
            "name": new_ticket.name,
            "email": new_ticket.email,
            "subject": new_ticket.subject,
            "category": new_ticket.category,
            "priority": new_ticket.priority,
            "status": new_ticket.status,
            "created_at": new_ticket.created_at.isoformat() if new_ticket.created_at else ""
        }
    }

@router.get("/tickets")
def get_user_tickets(
    request: Request,
    db: Session = Depends(get_db)
):
    """Retrieves tickets submitted by current user or matching their email."""
    current_user = get_optional_current_user(request, db)
    if not current_user:
        return []

    tickets = db.query(SupportTicket).filter(
        (SupportTicket.user_id == current_user.id) | (SupportTicket.email == current_user.email.lower().strip())
    ).order_by(SupportTicket.created_at.desc()).all()

    return [
        {
            "id": t.id,
            "ticket_code": t.ticket_code,
            "name": t.name,
            "email": t.email,
            "subject": t.subject,
            "category": t.category,
            "priority": t.priority,
            "status": t.status,
            "message": t.message,
            "reference_code": t.reference_code,
            "created_at": t.created_at.isoformat() if t.created_at else ""
        }
        for t in tickets
    ]
