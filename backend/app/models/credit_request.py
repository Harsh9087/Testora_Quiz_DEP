from sqlalchemy import Column, String, Integer, ForeignKey, Text, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.models.base import TimeStampedModel

class CreditRequest(TimeStampedModel):
    __tablename__ = "credit_requests"

    request_code = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    
    # Applicant details
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(50), nullable=True)
    
    # Institution details
    institution_name = Column(String(255), nullable=False, index=True)
    department = Column(String(255), nullable=True)
    designation = Column(String(255), nullable=True)
    institution_email = Column(String(255), nullable=True)
    
    # Request details
    requested_credits = Column(Integer, default=10000, nullable=False)
    approved_credits = Column(Integer, nullable=True)
    purpose = Column(Text, nullable=False)
    estimated_students = Column(Integer, default=0, nullable=False)
    
    # Workflow status: "Pending", "Under Review", "Approved", "Rejected", "Credits Issued"
    status = Column(String(50), default="Pending", index=True, nullable=False)
    
    # Administrative Assignment & Review
    assigned_to_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    assigned_to_name = Column(String(255), nullable=True)
    admin_notes = Column(Text, nullable=True)
    decision_reason = Column(Text, nullable=True)
    decision_date = Column(DateTime, nullable=True)
    decided_by_admin_id = Column(String(36), nullable=True)
    
    # Separate Traceable Credit Issuance
    credits_issued = Column(Boolean, default=False, nullable=False)
    credits_issued_at = Column(DateTime, nullable=True)
    issued_by_admin_id = Column(String(36), nullable=True)
    credit_transaction_id = Column(String(36), ForeignKey("credit_transactions.id"), nullable=True)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    assigned_to = relationship("User", foreign_keys=[assigned_to_id])
    credit_transaction = relationship("CreditTransaction", foreign_keys=[credit_transaction_id])

