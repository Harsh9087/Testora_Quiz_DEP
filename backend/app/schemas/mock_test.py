from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class MockQuestion(BaseModel):
    id: str
    question: str
    options: List[str]
    domain: Optional[str] = None

class MockQuestionWithAnswer(MockQuestion):
    correct_answer: str
    explanation: Optional[str] = None

class MockTestSummary(BaseModel):
    id: str
    company_name: str
    company_slug: str
    company_logo: Optional[str] = None
    title: str
    description: Optional[str] = None
    category: str
    difficulty: str
    price_inr: int
    price_paise: int
    is_free: bool
    duration_minutes: int
    total_questions: int
    pass_percentage: int
    attempts_count: int = 0
    display_order: int = 0
    is_active: bool = True
    is_unlocked: bool = False
    has_attempted: bool = False
    last_score: Optional[float] = None
    last_percentage: Optional[float] = None
    last_passed: Optional[bool] = None

class MockTestDetail(MockTestSummary):
    questions: List[MockQuestion] = []

class MockTestCreate(BaseModel):
    company_name: str
    company_slug: Optional[str] = None
    company_logo: Optional[str] = None
    title: str
    description: Optional[str] = None
    category: str = "Aptitude & Cognitive"
    difficulty: str = "Medium"
    price_inr: int = 9
    duration_minutes: int = 30
    total_questions: int = 25
    pass_percentage: int = 50
    questions: List[Dict[str, Any]] = []
    is_active: bool = True

class MockTestUpdate(BaseModel):
    company_name: Optional[str] = None
    company_slug: Optional[str] = None
    company_logo: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    difficulty: Optional[str] = None
    price_inr: Optional[int] = None
    duration_minutes: Optional[int] = None
    total_questions: Optional[int] = None
    pass_percentage: Optional[int] = None
    questions: Optional[List[Dict[str, Any]]] = None
    is_active: Optional[bool] = None

class MockTestOrderResponse(BaseModel):
    order_id: str
    amount: int
    currency: str
    key_id: str
    test_id: str
    test_title: str
    company_name: str
    price_inr: int

class MockTestVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

class MockTestSubmitRequest(BaseModel):
    answers: Dict[str, str]

class QuestionReview(BaseModel):
    id: str
    question: str
    options: List[str]
    selected_answer: Optional[str] = None
    correct_answer: str
    is_correct: bool
    explanation: Optional[str] = None

class MockTestSubmitResult(BaseModel):
    score: float
    max_score: float
    percentage: float
    passed: bool
    correct_count: int
    incorrect_count: int
    unanswered_count: int
    pass_percentage: int
    completed_at: str
    reviews: List[QuestionReview] = []

class CompanyFilterItem(BaseModel):
    name: str
    slug: str
    count: int
