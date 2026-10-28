from fastapi import APIRouter, Depends, HTTPException, Request, Header, status
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.user import User
from app.models.exam import Exam
from app.models.workspace import WorkspaceMember
from app.utils.security import get_current_user, RoleChecker
from app.services.payment_service import payment_service
from app.schemas.payment import (
    SubscriptionPlan,
    CreateOrderRequest,
    CreateOrderResponse,
    VerifyPaymentRequest,
    VerifyPaymentResponse,
    ExamBillPreviewResponse,
    CreateExamOrderRequest,
    CreateExamOrderResponse,
    VerifyExamPaymentRequest,
    VerifyExamPaymentResponse,
    PaymentReceiptResponse,
    PaymentHistoryItem,
    CreditRechargePackage,
    CreditWalletBalanceResponse,
    CreateRechargeOrderRequest,
    CreateRechargeOrderResponse,
    VerifyRechargePaymentRequest,
    VerifyRechargePaymentResponse,
    PayExamWithCreditsResponse,
    CreditTransactionResponse
)
from app.schemas.coupon import RedeemCouponRequest, RedeemCouponResponse
from app.services.coupon_service import coupon_service
from app.utils.rate_limiter import rate_limit_dependency

router = APIRouter(prefix="/payments", tags=["payments"])
teacher_required = RoleChecker(["teacher", "inst_admin", "super_admin"])

# =============================================================================
# Helper: Verify Teacher Exam Access
# =============================================================================
def get_authorized_exam(exam_id: str, user: User, db: Session) -> Exam:
    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.is_deleted == False).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Assessment not found")
        
    if user.role != "super_admin":
        if exam.created_by != user.id:
            if exam.workspace_id:
                is_member = db.query(WorkspaceMember).filter(
                    WorkspaceMember.workspace_id == exam.workspace_id,
                    WorkspaceMember.user_id == user.id
                ).first()
                if not is_member:
                    raise HTTPException(status_code=403, detail="Access denied: You are not authorized to manage payments for this assessment")
            else:
                raise HTTPException(status_code=403, detail="Access denied to this assessment")
    return exam


# =============================================================================
# Per-Test Exam Billing & Razorpay Checkout Endpoints
# =============================================================================
@router.get("/exam/{exam_id}/preview", response_model=ExamBillPreviewResponse)
def get_exam_payment_preview(
    exam_id: str,
    current_user: User = Depends(teacher_required),
    db: Session = Depends(get_db)
):
    """
    Returns trusted server-side price preview for an individual exam:
    billable_units = student_count * question_count.
    Includes subtotal, GST breakdown, current payment status, can_publish flag,
    and user prepaid credit balance info.
    """
    exam = get_authorized_exam(exam_id, current_user, db)
    return payment_service.get_exam_preview(exam, db, current_user)


@router.post("/exam/{exam_id}/create-order", response_model=CreateExamOrderResponse)
def create_exam_payment_order(
    exam_id: str,
    req: Optional[CreateExamOrderRequest] = None,
    current_user: User = Depends(teacher_required),
    db: Session = Depends(get_db)
):
    """
    Creates a server-side Razorpay payment order for this specific test.
    The final amount is calculated exclusively on the backend from enrolled student count and question count.
    """
    exam = get_authorized_exam(exam_id, current_user, db)
    notes = req.notes if req else None
    return payment_service.create_exam_payment_order(
        exam=exam,
        user=current_user,
        notes=notes,
        db=db
    )


@router.post("/exam/verify-payment", response_model=VerifyExamPaymentResponse)
def verify_exam_payment(
    req: VerifyExamPaymentRequest,
    current_user: User = Depends(teacher_required),
    db: Session = Depends(get_db)
):
    """
    Validates Razorpay payment signature (HMAC-SHA256) and unlocks the examination.
    Guaranteed idempotent: duplicate submissions or retries return success without re-charging.
    """
    return payment_service.verify_exam_payment(
        user=current_user,
        razorpay_order_id=req.razorpay_order_id,
        razorpay_payment_id=req.razorpay_payment_id,
        razorpay_signature=req.razorpay_signature,
        db=db
    )


# =============================================================================
# Prepaid Credits & Wallet Management Endpoints
# =============================================================================
@router.get("/credits/balance", response_model=CreditWalletBalanceResponse)
def get_credit_wallet_balance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns the current credit balance of the authenticated user,
    pricing rate per unit, and available recharge packages.
    """
    return payment_service.get_credits_balance(user=current_user, db=db)


@router.get("/credits/packages", response_model=List[CreditRechargePackage])
def get_credit_recharge_packages(
    current_user: User = Depends(teacher_required)
):
    """
    Returns the list of configurable prepaid credit recharge packages.
    """
    return payment_service.get_recharge_packages()


@router.post("/credits/recharge-order", response_model=CreateRechargeOrderResponse)
def create_credit_recharge_order(
    req: CreateRechargeOrderRequest,
    current_user: User = Depends(teacher_required),
    db: Session = Depends(get_db)
):
    """
    Creates a server-side Razorpay order to recharge prepaid credits.
    """
    return payment_service.create_recharge_order(
        user=current_user,
        package_id=req.package_id,
        db=db
    )


@router.post("/credits/verify-recharge", response_model=VerifyRechargePaymentResponse)
def verify_credit_recharge_payment(
    req: VerifyRechargePaymentRequest,
    current_user: User = Depends(teacher_required),
    db: Session = Depends(get_db)
):
    """
    Verifies payment signature for a credit recharge order and credits user's wallet.
    Idempotent and atomic.
    """
    return payment_service.verify_recharge_payment(
        user=current_user,
        razorpay_order_id=req.razorpay_order_id,
        razorpay_payment_id=req.razorpay_payment_id,
        razorpay_signature=req.razorpay_signature,
        db=db
    )


@router.post("/exam/{exam_id}/pay-with-credits", response_model=PayExamWithCreditsResponse)
def pay_exam_with_prepaid_credits(
    exam_id: str,
    current_user: User = Depends(teacher_required),
    db: Session = Depends(get_db)
):
    """
    Unlocks an assessment by atomically deducting the required credits from the teacher's wallet.
    Alternative to direct per-test Razorpay payment.
    """
    exam = get_authorized_exam(exam_id, current_user, db)
    return payment_service.pay_exam_with_credits(
        exam=exam,
        user=current_user,
        db=db
    )


@router.get("/credits/transactions", response_model=List[CreditTransactionResponse])
def get_credit_transaction_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns the chronological credit ledger transactions for the user (recharges, exam deductions, refunds, grants).
    """
    return payment_service.get_credit_transactions(user=current_user, db=db)


@router.post("/credits/redeem-coupon", response_model=RedeemCouponResponse, dependencies=[Depends(rate_limit_dependency(max_requests=10, window_seconds=600))])
def redeem_credit_coupon(
    req: RedeemCouponRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Redeems a unique voucher code, crediting the user's wallet atomically and logging an immutable CreditTransaction.
    Protected with rate limiting against brute-force code enumeration.
    """
    return coupon_service.redeem_coupon(code=req.code, user=current_user, db=db)


@router.post("/webhook")
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: Optional[str] = Header(None, alias="X-Razorpay-Signature"),
    db: Session = Depends(get_db)
):
    """
    Webhook handler for asynchronous Razorpay events (order.paid, payment.captured, payment.failed).
    Validates HMAC-SHA256 signature against the raw request body.
    Handles duplicate events safely and idempotently.
    """
    raw_body = await request.body()
    result = payment_service.handle_webhook(
        raw_body=raw_body,
        signature_header=x_razorpay_signature,
        db=db
    )
    return result


@router.get("/receipt/{order_id}", response_model=PaymentReceiptResponse)
def get_payment_receipt(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetches structured payment receipt details for an authorized instructor.
    """
    return payment_service.get_receipt(order_id, current_user, db)


@router.get("/receipt/{order_id}/html", response_class=HTMLResponse)
def get_payment_receipt_html(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Renders an official, printable Tax Invoice & Payment Receipt HTML document.
    """
    receipt = payment_service.get_receipt(order_id, current_user, db)
    
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Tax Invoice - {receipt.invoice_number}</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #1f2937;
            background: #f9fafb;
            margin: 0;
            padding: 40px 20px;
        }}
        .receipt-card {{
            max-width: 680px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.06);
            border: 1px solid #e5e7eb;
        }}
        .header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #f3f4f6;
            padding-bottom: 24px;
            margin-bottom: 24px;
        }}
        .brand {{
            font-size: 22px;
            font-weight: 800;
            color: #c84b18;
            letter-spacing: -0.5px;
        }}
        .invoice-title {{
            text-align: right;
        }}
        .invoice-title h2 {{
            margin: 0;
            font-size: 18px;
            color: #111827;
        }}
        .invoice-title p {{
            margin: 4px 0 0;
            font-size: 12px;
            color: #6b7280;
        }}
        .grid {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 24px;
            font-size: 13px;
        }}
        .grid dt {{
            color: #6b7280;
            font-weight: 500;
        }}
        .grid dd {{
            margin: 2px 0 0;
            font-weight: 600;
            color: #111827;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin: 24px 0;
            font-size: 13px;
        }}
        th {{
            background: #f9fafb;
            text-align: left;
            padding: 10px 12px;
            border-bottom: 1px solid #e5e7eb;
            color: #4b5563;
        }}
        td {{
            padding: 12px;
            border-bottom: 1px solid #f3f4f6;
        }}
        .totals {{
            margin-left: auto;
            width: 260px;
            margin-top: 16px;
        }}
        .totals-row {{
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            font-size: 13px;
            color: #4b5563;
        }}
        .totals-row.grand {{
            font-size: 16px;
            font-weight: 800;
            color: #111827;
            border-top: 2px solid #e5e7eb;
            padding-top: 12px;
            margin-top: 6px;
        }}
        .badge {{
            display: inline-block;
            background: #ecfdf5;
            color: #059669;
            font-weight: 700;
            font-size: 11px;
            padding: 4px 10px;
            border-radius: 9999px;
            border: 1px solid #a7f3d0;
        }}
        .footer {{
            text-align: center;
            font-size: 11px;
            color: #9ca3af;
            margin-top: 36px;
            border-top: 1px solid #f3f4f6;
            padding-top: 16px;
        }}
        @media print {{
            body {{
                background: #ffffff;
                padding: 0;
            }}
            .receipt-card {{
                box-shadow: none;
                border: none;
                padding: 0;
            }}
            .no-print {{
                display: none;
            }}
        }}
    </style>
</head>
<body>
    <div class="receipt-card">
        <div class="header">
            <div>
                <div class="brand">Testora Quiz</div>
                <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">AI Examination & Assessment Cloud</div>
            </div>
            <div class="invoice-title">
                <h2>TAX INVOICE</h2>
                <p>Invoice #: <strong>{receipt.invoice_number}</strong></p>
                <p>Date: {receipt.created_at.strftime('%d %b %Y, %I:%M %p UTC') if receipt.created_at else 'N/A'}</p>
            </div>
        </div>

        <div class="grid">
            <div>
                <dt>Billed To:</dt>
                <dd>{receipt.user_name}</dd>
                <dd style="font-weight: normal; color: #4b5563;">{receipt.user_email}</dd>
                <dd style="font-weight: normal; color: #4b5563;">{receipt.institution_name}</dd>
            </div>
            <div style="text-align: right;">
                <dt>Payment Status:</dt>
                <dd><span class="badge">PAID • VERIFIED</span></dd>
                <dt style="margin-top: 10px;">Payment Gateway:</dt>
                <dd style="font-family: monospace; font-size: 11px;">Razorpay ({receipt.payment_id or 'N/A'})</dd>
                <dt style="margin-top: 4px;">Order ID:</dt>
                <dd style="font-family: monospace; font-size: 11px;">{receipt.order_id}</dd>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Item Description</th>
                    <th style="text-align: center;">Students</th>
                    <th style="text-align: center;">Questions</th>
                    <th style="text-align: center;">Units</th>
                    <th style="text-align: right;">Rate / Unit</th>
                    <th style="text-align: right;">Amount (INR)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        <strong>{receipt.exam_name or 'Assessment Publishing'}</strong>
                        <div style="font-size: 11px; color: #6b7280;">Exam Code: {receipt.exam_code or 'N/A'}</div>
                    </td>
                    <td style="text-align: center;">{receipt.student_count}</td>
                    <td style="text-align: center;">{receipt.question_count}</td>
                    <td style="text-align: center;">{receipt.billable_units}</td>
                    <td style="text-align: right;">₹{receipt.rate_per_unit_paise / 100:.2f}</td>
                    <td style="text-align: right;">₹{receipt.subtotal_paise / 100:.2f}</td>
                </tr>
            </tbody>
        </table>

        <div class="totals">
            <div class="totals-row">
                <span>Subtotal:</span>
                <span>₹{receipt.subtotal_paise / 100:.2f}</span>
            </div>
            <div class="totals-row">
                <span>GST ({receipt.tax_percentage}%):</span>
                <span>₹{receipt.tax_paise / 100:.2f}</span>
            </div>
            <div class="totals-row grand">
                <span>Total Paid:</span>
                <span>{receipt.formatted_total}</span>
            </div>
        </div>

        <div class="footer">
            <p>This is a computer-generated tax invoice. Thank you for using Testora Quiz!</p>
            <button class="no-print" onclick="window.print()" style="margin-top: 12px; padding: 8px 18px; background: #c84b18; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">
                Print / Save PDF
            </button>
        </div>
    </div>
</body>
</html>
"""
    return HTMLResponse(content=html_content)


@router.get("/history", response_model=List[PaymentHistoryItem])
def get_payment_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetches full payment transaction history for the authenticated user,
    including both per-test exam payments and subscription orders.
    """
    return payment_service.get_user_history(user=current_user, db=db)


# =============================================================================
# Subscription Plans (Preserved Legacy Catalog)
# =============================================================================
@router.get("/plans", response_model=List[SubscriptionPlan])
def list_subscription_plans():
    return payment_service.get_plans()

@router.post("/create-order", response_model=CreateOrderResponse)
def create_subscription_order(
    req: CreateOrderRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return payment_service.create_subscription_order(
        user=current_user,
        plan_id=req.plan_id,
        notes=req.notes,
        db=db
    )

@router.post("/verify-payment", response_model=VerifyPaymentResponse)
def verify_subscription_payment(
    req: VerifyPaymentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return payment_service.verify_payment(
        user=current_user,
        razorpay_order_id=req.razorpay_order_id,
        razorpay_payment_id=req.razorpay_payment_id,
        razorpay_signature=req.razorpay_signature,
        db=db
    )
