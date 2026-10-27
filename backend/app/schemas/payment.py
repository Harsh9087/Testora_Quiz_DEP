from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

# ==========================================
# Subscription Plans (Existing Catalog)
# ==========================================
class SubscriptionPlan(BaseModel):
    id: str
    name: str
    description: str
    amount: int  # amount in paise (e.g. 199900 = ₹1,999)
    formatted_price: str
    currency: str = "INR"
    interval: str  # monthly or yearly
    max_students: int
    max_exams_per_month: int
    features: List[str]
    popular: bool = False

class CreateOrderRequest(BaseModel):
    plan_id: str = Field(..., description="Target plan identifier e.g. starter_monthly, pro_monthly, enterprise_yearly")
    notes: Optional[Dict[str, str]] = None

class CreateOrderResponse(BaseModel):
    order_id: str
    amount: int
    currency: str
    key_id: str
    plan_id: str
    plan_name: str
    user_name: Optional[str] = None
    user_email: Optional[str] = None

class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

class VerifyPaymentResponse(BaseModel):
    success: bool
    message: str
    plan_id: str
    institution_id: Optional[str] = None
    subscription_status: str

# ==========================================
# Per-Test Exam Billing Schemas
# ==========================================
class ExamBillPreviewResponse(BaseModel):
    exam_id: str
    exam_name: str
    exam_code: str
    student_count: int
    question_count: int
    billable_units: int # student_count * question_count
    rate_per_unit_paise: int
    rate_per_unit_inr: float
    subtotal_paise: int
    tax_paise: int
    tax_percentage: int
    total_paise: int
    total_inr: float
    currency: str = "INR"
    formatted_amount: str
    is_paid: bool
    paid_amount_paise: int
    paid_student_count: int
    paid_question_count: int
    additional_amount_due_paise: int
    needs_additional_payment: bool
    can_publish: bool
    payment_status: str # "paid", "unpaid", "additional_payment_required"
    
    # Prepaid Credits wallet fields
    user_credits_balance: int = 0
    credits_required: int = 0
    has_sufficient_credits: bool = False
    can_pay_with_credits: bool = False

class CreditRechargePackage(BaseModel):
    id: str
    name: str
    credits: int
    amount_paise: int
    formatted_amount: str
    rate_per_credit: str
    popular: bool = False
    badge: Optional[str] = None
    description: str

class CreditWalletBalanceResponse(BaseModel):
    credits_balance: int
    purchased_credits: int = 0
    bonus_credits: int = 0
    bonus_credits_expires_at: Optional[datetime] = None
    bonus_days_remaining: int = 0
    rate_per_unit_paise: int
    credit_per_unit: int
    packages: List[CreditRechargePackage]

class CreateRechargeOrderRequest(BaseModel):
    package_id: str

class CreateRechargeOrderResponse(BaseModel):
    order_id: str
    amount: int
    currency: str
    key_id: str
    package_id: str
    package_name: str
    credits_added: int
    formatted_amount: str
    user_name: Optional[str] = None
    user_email: Optional[str] = None

class VerifyRechargePaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

class VerifyRechargePaymentResponse(BaseModel):
    success: bool
    message: str
    credits_added: int
    new_balance: int
    order_id: str
    payment_id: str
    invoice_number: Optional[str] = None

class PayExamWithCreditsResponse(BaseModel):
    success: bool
    message: str
    exam_id: str
    credits_deducted: int
    remaining_credits: int
    is_paid: bool
    can_publish: bool
    invoice_number: str

class CreditTransactionResponse(BaseModel):
    id: str
    transaction_type: str
    amount_credits: int
    balance_after: int
    description: str
    exam_id: Optional[str] = None
    payment_order_id: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CreateExamOrderRequest(BaseModel):
    notes: Optional[Dict[str, str]] = None

class CreateExamOrderResponse(BaseModel):
    order_id: str
    amount: int # Amount in paise to pay
    currency: str
    key_id: str
    exam_id: str
    exam_name: str
    exam_code: str
    student_count: int
    question_count: int
    billable_units: int
    rate_per_unit_paise: int
    receipt: str
    user_name: Optional[str] = None
    user_email: Optional[str] = None

class VerifyExamPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

class VerifyExamPaymentResponse(BaseModel):
    success: bool
    message: str
    exam_id: str
    order_id: str
    payment_id: str
    invoice_number: Optional[str] = None
    amount: int
    currency: str
    is_paid: bool
    can_publish: bool

class PaymentReceiptResponse(BaseModel):
    order_id: str
    invoice_number: Optional[str] = None
    receipt: Optional[str] = None
    payment_id: Optional[str] = None
    status: str
    amount_paise: int
    subtotal_paise: int
    tax_paise: int
    tax_percentage: int
    currency: str
    formatted_total: str
    student_count: int
    question_count: int
    billable_units: int
    rate_per_unit_paise: int
    exam_id: Optional[str] = None
    exam_name: Optional[str] = None
    exam_code: Optional[str] = None
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    institution_name: Optional[str] = None
    created_at: datetime

class PaymentHistoryItem(BaseModel):
    id: str
    order_type: str = "EXAM_PAYMENT"
    plan_id: Optional[str] = None
    exam_id: Optional[str] = None
    exam_name: Optional[str] = None
    exam_code: Optional[str] = None
    student_count: int = 0
    question_count: int = 0
    billable_units: int = 0
    amount: int
    currency: str
    status: str
    razorpay_order_id: str
    razorpay_payment_id: Optional[str] = None
    invoice_number: Optional[str] = None
    receipt: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
