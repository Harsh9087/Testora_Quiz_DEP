from sqlalchemy import Column, String, Integer, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.models.base import TimeStampedModel

class PaymentOrder(TimeStampedModel):
    __tablename__ = "payment_orders"
    
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    institution_id = Column(String(36), ForeignKey("institutions.id"), nullable=True, index=True)
    exam_id = Column(String(36), ForeignKey("exams.id"), nullable=True, index=True)
    
    order_type = Column(String(50), default="EXAM_PAYMENT", nullable=False) # "EXAM_PAYMENT", "CREDIT_RECHARGE", "SUBSCRIPTION"
    plan_id = Column(String(50), nullable=True) # e.g. "pkg_1000", "pkg_2200", "pkg_6000", "pro_monthly"
    
    # Financial fields in integer paise
    amount = Column(Integer, nullable=False) # Final payable amount in paise (e.g. 11800 = INR 118.00)
    subtotal_amount = Column(Integer, default=0, nullable=False) # Base price before tax in paise
    tax_amount = Column(Integer, default=0, nullable=False) # Tax (GST) in paise
    currency = Column(String(10), default="INR", nullable=False)
    
    # Bill details
    student_count = Column(Integer, default=0, nullable=False)
    question_count = Column(Integer, default=0, nullable=False)
    rate_per_unit_paise = Column(Integer, default=10, nullable=False) # e.g. 10 paise (₹0.10) per student-question unit
    billable_units = Column(Integer, default=0, nullable=False) # student_count * question_count
    credits_added = Column(Integer, default=0, nullable=False) # Credits purchased if recharge
    
    # Razorpay Gateway Identifiers
    razorpay_order_id = Column(String(100), unique=True, nullable=False, index=True)
    razorpay_payment_id = Column(String(100), nullable=True, index=True)
    razorpay_signature = Column(String(255), nullable=True)
    
    # Status and Document references
    status = Column(String(50), default="created", nullable=False) # created, paid, failed, refunded
    receipt = Column(String(100), nullable=True)
    invoice_number = Column(String(100), unique=True, nullable=True, index=True)
    notes = Column(Text, nullable=True)
    
    # Relationships
    user = relationship("User")
    institution = relationship("Institution")
    exam = relationship("Exam", back_populates="payments")
    credit_transactions = relationship("CreditTransaction", back_populates="payment_order")


class CreditTransaction(TimeStampedModel):
    __tablename__ = "credit_transactions"
    
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    exam_id = Column(String(36), ForeignKey("exams.id"), nullable=True, index=True)
    payment_order_id = Column(String(36), ForeignKey("payment_orders.id"), nullable=True, index=True)
    
    transaction_type = Column(String(50), nullable=False) # "RECHARGE", "EXAM_PAYMENT", "REFUND", "BONUS"
    amount_credits = Column(Integer, nullable=False) # Positive (added) or negative (deducted)
    balance_after = Column(Integer, nullable=False) # Balance immediately after transaction
    description = Column(String(255), nullable=False)
    
    # Relationships
    user = relationship("User")
    exam = relationship("Exam")
    payment_order = relationship("PaymentOrder", back_populates="credit_transactions")
