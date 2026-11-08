from sqlalchemy import Column, String, Integer, Text, Boolean, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.models.base import TimeStampedModel

class MockTest(TimeStampedModel):
    __tablename__ = "mock_tests"

    company_name = Column(String(100), nullable=False, index=True) # e.g. "TCS", "Infosys", "HCLTech", "Wipro", "Accenture"
    company_slug = Column(String(50), nullable=False, index=True)  # "tcs", "infosys", "hcl", "wipro", "accenture"
    company_logo = Column(String(255), nullable=True)
    
    title = Column(String(255), nullable=False) # e.g. "TCS NQT 2026 - Numerical & Reasoning Qualifier"
    description = Column(Text, nullable=True)
    category = Column(String(100), default="Aptitude & Cognitive", nullable=False) # "Aptitude & Cognitive", "Technical Core", "Coding & DSA"
    difficulty = Column(String(20), default="Medium", nullable=False) # "Easy", "Medium", "Hard"
    
    price_inr = Column(Integer, default=9, nullable=False) # 0 for free, 9, 12, etc.
    price_paise = Column(Integer, default=900, nullable=False) # price_inr * 100
    is_free = Column(Boolean, default=False, nullable=False)
    
    duration_minutes = Column(Integer, default=30, nullable=False)
    total_questions = Column(Integer, default=25, nullable=False)
    pass_percentage = Column(Integer, default=50, nullable=False)
    
    questions_json = Column(Text, nullable=True) # JSON array of questions
    display_order = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    attempts_count = Column(Integer, default=0, nullable=False)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=True)

    purchases = relationship("MockTestPurchase", back_populates="mock_test", cascade="all, delete-orphan")


class MockTestPurchase(TimeStampedModel):
    __tablename__ = "mock_test_purchases"

    student_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    mock_test_id = Column(String(36), ForeignKey("mock_tests.id"), nullable=False, index=True)
    
    amount_paid_inr = Column(Integer, default=0, nullable=False)
    amount_paid_paise = Column(Integer, default=0, nullable=False)
    payment_method = Column(String(50), default="FREE", nullable=False) # "FREE", "RAZORPAY", "WALLET_CREDITS"
    
    razorpay_order_id = Column(String(100), nullable=True, index=True)
    razorpay_payment_id = Column(String(100), nullable=True)
    razorpay_signature = Column(String(255), nullable=True)
    
    status = Column(String(50), default="unlocked", nullable=False) # "unlocked", "completed"
    score = Column(Float, nullable=True)
    max_score = Column(Float, nullable=True)
    percentage = Column(Float, nullable=True)
    passed = Column(Boolean, nullable=True)
    
    answers_json = Column(Text, nullable=True) # JSON dict of user answers
    completed_at = Column(String(50), nullable=True)
    
    mock_test = relationship("MockTest", back_populates="purchases")
    student = relationship("User")
