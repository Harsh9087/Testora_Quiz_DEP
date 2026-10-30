from sqlalchemy import Column, String, ForeignKey, Text, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.models.base import TimeStampedModel
from app.utils.timezone import now_utc

class SupportTicket(TimeStampedModel):
    __tablename__ = "support_tickets"

    ticket_code = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    user_role = Column(String(50), default="guest", nullable=True) # "teacher", "student", "inst_admin", "guest"
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(50), nullable=True)
    subject = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    priority = Column(String(50), default="Normal") # "Low", "Normal", "High", "Urgent"
    status = Column(String(50), default="New", index=True)  # "New", "Open", "In Progress", "Waiting for User", "Resolved", "Closed"
    message = Column(Text, nullable=False)
    reference_code = Column(String(100), nullable=True)
    company_recipient = Column(String(255), default="support@dpramp.com")
    
    # Admin Assignment & Resolution
    assigned_to_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    assigned_to_name = Column(String(255), nullable=True)
    admin_notes = Column(Text, nullable=True) # strictly private internal notes
    resolution_notes = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)

    user = relationship("User", foreign_keys=[user_id])
    assigned_to = relationship("User", foreign_keys=[assigned_to_id])
    replies = relationship("SupportTicketReply", back_populates="ticket", cascade="all, delete-orphan", order_by="SupportTicketReply.created_at.asc()")


class SupportTicketReply(TimeStampedModel):
    __tablename__ = "support_ticket_replies"

    ticket_id = Column(String(36), ForeignKey("support_tickets.id"), nullable=False, index=True)
    sender_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    sender_name = Column(String(255), nullable=False)
    sender_email = Column(String(255), nullable=False)
    sender_role = Column(String(50), default="admin", nullable=False) # "admin", "teacher", "student", "guest"
    message = Column(Text, nullable=False)
    is_internal_note = Column(Boolean, default=False, nullable=False) # True = private note, False = visible reply

    ticket = relationship("SupportTicket", back_populates="replies")
    sender = relationship("User", foreign_keys=[sender_id])
