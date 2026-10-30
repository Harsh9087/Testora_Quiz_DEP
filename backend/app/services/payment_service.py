import hmac
import hashlib
import uuid
import json
import logging
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.config import settings
from app.models.payment import PaymentOrder, CreditTransaction
from app.models.institution import Institution
from app.models.user import User
from app.models.exam import Exam, ExamCredential
from app.models.candidate import ExamCandidate
from app.models.student_directory import StudentDirectory, DirectoryStudent
from app.schemas.payment import (
    SubscriptionPlan,
    ExamBillPreviewResponse,
    CreateExamOrderResponse,
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

logger = logging.getLogger(__name__)

# Predefined subscription plans catalog (preserved for backward compatibility)
SUBSCRIPTION_PLANS: Dict[str, SubscriptionPlan] = {
    "starter_monthly": SubscriptionPlan(
        id="starter_monthly",
        name="Starter Plan",
        description="Ideal for individual tutors & coaching batches",
        amount=99900,  # ₹999.00 in paise
        formatted_price="₹999 / month",
        currency="INR",
        interval="monthly",
        max_students=100,
        max_exams_per_month=15,
        features=[
            "Up to 100 active candidates",
            "15 AI generated assessments/mo",
            "Full RAG knowledge base indexing",
            "Anti-cheat proctoring alerts",
            "Automated MCQ & Subjective grading"
        ],
        popular=False
    ),
    "pro_monthly": SubscriptionPlan(
        id="pro_monthly",
        name="Pro Academic",
        description="Designed for colleges, institutes & busy departments",
        amount=249900,  # ₹2,499.00 in paise
        formatted_price="₹2,499 / month",
        currency="INR",
        interval="monthly",
        max_students=500,
        max_exams_per_month=100,
        features=[
            "Up to 500 active candidates",
            "Unlimited AI assessment generation",
            "Single-Question AI Re-Roll Studio",
            "Live WebSocket Proctoring HUD",
            "KaTeX math formula preservation",
            "Cohort Gradebook & Excel Exports",
            "Email notifications & passcodes"
        ],
        popular=True
    ),
    "pro_yearly": SubscriptionPlan(
        id="pro_yearly",
        name="Pro Annual (2 Months Free)",
        description="Best value for academic semesters & annual sessions",
        amount=2499000,  # ₹24,990.00 in paise (savings of ₹4,998)
        formatted_price="₹24,990 / year",
        currency="INR",
        interval="yearly",
        max_students=500,
        max_exams_per_month=9999,
        features=[
            "Everything in Pro Academic",
            "2 Months Free Included",
            "Unlimited assessments all year",
            "Priority Gemini RAG queue",
            "Custom pass mark benchmarks",
            "Standard priority email support"
        ],
        popular=False
    ),
    "enterprise_yearly": SubscriptionPlan(
        id="enterprise_yearly",
        name="Enterprise Campus",
        description="Full scale campus deployment for universities",
        amount=5999000,  # ₹59,990.00 in paise
        formatted_price="₹59,990 / year",
        currency="INR",
        interval="yearly",
        max_students=5000,
        max_exams_per_month=99999,
        features=[
            "Up to 5,000 simultaneous candidates",
            "Unlimited departments & workspaces",
            "Custom institution domain & branding",
            "Dedicated PostgreSQL & Redis tuning",
            "24/7 dedicated enterprise support"
        ],
        popular=False
    )
}

class PaymentService:
    def __init__(self):
        self._client = None
        self._init_client()

    def _init_client(self):
        """Initializes Razorpay client if API keys are configured."""
        if settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET:
            try:
                import razorpay
                self._client = razorpay.Client(
                    auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
                )
                logger.info("Razorpay SDK client initialized successfully.")
            except Exception as e:
                logger.warning(f"Failed to initialize Razorpay SDK: {e}")
                self._client = None
        else:
            self._client = None

    # =========================================================================
    # Per-Test Bill Calculation & Billable Units Inspection
    # =========================================================================
    def get_exam_billable_counts(self, exam: Exam, db: Session) -> Tuple[int, int]:
        """
        Determines the trusted student_count and question_count for an exam.
        - question_count: Parsed from exam.questions_json.
        - student_count: Candidates associated with the exam. Falls back to directory count if snapshotted count is 0.
        """
        # 1. Question count
        question_count = 0
        if exam.questions_json:
            try:
                parsed_q = json.loads(exam.questions_json)
                if isinstance(parsed_q, list):
                    question_count = len(parsed_q)
            except Exception:
                question_count = 0

        # 2. Student count
        student_count = db.query(ExamCandidate).filter(
            ExamCandidate.exam_id == exam.id,
            ExamCandidate.status != "dropped"
        ).count()

        # Fallback to student directory roster if candidate snapshots not created yet
        if student_count == 0 and exam.student_directory_id:
            student_count = db.query(DirectoryStudent).filter(
                DirectoryStudent.directory_id == exam.student_directory_id,
                DirectoryStudent.is_deleted == False,
                DirectoryStudent.status != "inactive"
            ).count()

        # Fallback to generated credentials count if existing
        if student_count == 0:
            student_count = db.query(ExamCredential).filter(
                ExamCredential.exam_id == exam.id
            ).count()

        return (student_count, question_count)

    def calculate_bill(
        self,
        student_count: int,
        question_count: int,
        rate_paise: Optional[int] = None,
        gst_pct: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Calculates billing amounts strictly using integer paise:
        billable_units = student_count * question_count
        subtotal_paise = billable_units * rate_paise
        tax_paise = round(subtotal_paise * gst_pct / 100)
        total_paise = subtotal_paise + tax_paise
        """
        rate = rate_paise if rate_paise is not None else settings.PRICE_PER_UNIT_PAISE
        tax_percentage = gst_pct if gst_pct is not None else settings.GST_PERCENTAGE
        
        billable_units = int(student_count) * int(question_count)
        subtotal_paise = billable_units * rate
        tax_paise = int(round(subtotal_paise * (tax_percentage / 100.0)))
        total_paise = subtotal_paise + tax_paise

        # Ensure minimum payable amount for non-zero orders (Razorpay requires minimum ₹1.00 = 100 paise)
        if total_paise > 0 and total_paise < settings.MIN_ORDER_AMOUNT_PAISE:
            total_paise = settings.MIN_ORDER_AMOUNT_PAISE

        return {
            "student_count": student_count,
            "question_count": question_count,
            "billable_units": billable_units,
            "rate_per_unit_paise": rate,
            "rate_per_unit_inr": round(rate / 100.0, 2),
            "subtotal_paise": subtotal_paise,
            "tax_paise": tax_paise,
            "tax_percentage": tax_percentage,
            "total_paise": total_paise,
            "total_inr": round(total_paise / 100.0, 2),
            "currency": "INR",
            "formatted_amount": f"₹{total_paise / 100.0:.2f}"
        }

    def get_exam_preview(self, exam: Exam, db: Session, user: Optional[User] = None) -> ExamBillPreviewResponse:
        """
        Generates trusted price calculation and checks whether payment has been completed
        for the current student/question configuration.
        Also calculates required prepaid credits and whether user's credit balance is sufficient.
        """
        student_count, question_count = self.get_exam_billable_counts(exam, db)
        bill = self.calculate_bill(student_count, question_count)

        paid_amount = int(exam.paid_amount_paise or 0)
        paid_students = int(exam.paid_student_count or 0)
        paid_questions = int(exam.paid_question_count or 0)
        is_paid = bool(exam.is_paid)

        current_units = bill["billable_units"]
        paid_units = paid_students * paid_questions

        needs_additional = False
        additional_amount_due = 0

        if is_paid:
            if current_units > paid_units:
                needs_additional = True
                delta_units = current_units - paid_units
                delta_bill = self.calculate_bill(delta_units, 1)
                additional_amount_due = max(settings.MIN_ORDER_AMOUNT_PAISE, delta_bill["total_paise"])
                payment_status = "additional_payment_required"
            else:
                needs_additional = False
                additional_amount_due = 0
                payment_status = "paid"
        else:
            needs_additional = False
            additional_amount_due = bill["total_paise"]
            payment_status = "unpaid"

        can_publish = is_paid and not needs_additional

        # Prepaid Credit calculations
        if user is None and exam.created_by:
            user = db.query(User).filter(User.id == exam.created_by).first()

        user_credits = user.total_available_credits if user and hasattr(user, "total_available_credits") else (int(user.credits_balance or 0) if user and hasattr(user, "credits_balance") else 0)
        if needs_additional:
            credits_required = (current_units - paid_units) * settings.CREDIT_PER_UNIT
        else:
            credits_required = current_units * settings.CREDIT_PER_UNIT

        has_sufficient_credits = (user_credits >= credits_required) and (credits_required > 0)
        can_pay_with_credits = has_sufficient_credits and (not is_paid or needs_additional)

        return ExamBillPreviewResponse(
            exam_id=exam.id,
            exam_name=exam.name,
            exam_code=exam.exam_code,
            student_count=student_count,
            question_count=question_count,
            billable_units=current_units,
            rate_per_unit_paise=bill["rate_per_unit_paise"],
            rate_per_unit_inr=bill["rate_per_unit_inr"],
            subtotal_paise=bill["subtotal_paise"],
            tax_paise=bill["tax_paise"],
            tax_percentage=bill["tax_percentage"],
            total_paise=bill["total_paise"],
            total_inr=bill["total_inr"],
            currency=bill["currency"],
            formatted_amount=bill["formatted_amount"],
            is_paid=is_paid,
            paid_amount_paise=paid_amount,
            paid_student_count=paid_students,
            paid_question_count=paid_questions,
            additional_amount_due_paise=additional_amount_due,
            needs_additional_payment=needs_additional,
            can_publish=can_publish,
            payment_status=payment_status,
            user_credits_balance=user_credits,
            credits_required=credits_required,
            has_sufficient_credits=has_sufficient_credits,
            can_pay_with_credits=can_pay_with_credits
        )

    # =========================================================================
    # Exam Payment Orders (Creation & Razorpay Standard Checkout)
    # =========================================================================
    def create_exam_payment_order(
        self,
        exam: Exam,
        user: User,
        notes: Optional[Dict[str, str]],
        db: Session
    ) -> CreateExamOrderResponse:
        """
        Creates a server-side Razorpay Order for this specific examination.
        - Calculates trusted price using backend student & question counts.
        - Enforces minimum 100 paise requirement for Razorpay API.
        - Stores the PaymentOrder record with status='created'.
        """
        preview = self.get_exam_preview(exam, db)

        if preview.can_publish:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This assessment is already fully paid and unlocked for publishing."
            )

        if preview.student_count <= 0 or preview.question_count <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot generate payment order for an assessment with 0 students or 0 questions. Please add questions and eligible students first."
            )

        # Determine exact amount due
        amount_to_pay = preview.additional_amount_due_paise if preview.needs_additional_payment else preview.total_paise
        amount_to_pay = max(settings.MIN_ORDER_AMOUNT_PAISE, amount_to_pay)

        receipt = f"rcpt_ex_{exam.exam_code[:8]}_{uuid.uuid4().hex[:6]}"
        order_notes = {
            "exam_id": exam.id,
            "exam_name": exam.name,
            "exam_code": exam.exam_code,
            "teacher_id": user.id,
            "teacher_email": user.email,
            "student_count": str(preview.student_count),
            "question_count": str(preview.question_count),
            "billable_units": str(preview.billable_units),
            "is_topup": "1" if preview.needs_additional_payment else "0"
        }
        if notes:
            order_notes.update(notes)

        razorpay_order_id = ""

        # Call live Razorpay API if credentials exist
        if self._client:
            try:
                rzp_order = self._client.order.create({
                    "amount": amount_to_pay,
                    "currency": preview.currency,
                    "receipt": receipt,
                    "notes": order_notes,
                    "payment_capture": 1
                })
                razorpay_order_id = rzp_order.get("id")
            except Exception as e:
                logger.error(f"Razorpay API order creation failed: {e}")
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Razorpay order creation failed: {str(e)}"
                )
        else:
            # Test / Simulation Mode for local development
            razorpay_order_id = f"order_ex_{uuid.uuid4().hex[:14]}"
            logger.info(f"Generated simulation Razorpay order: {razorpay_order_id}")

        # Record payment order in database
        payment_record = PaymentOrder(
            user_id=user.id,
            institution_id=user.institution_id,
            exam_id=exam.id,
            order_type="EXAM_PAYMENT",
            student_count=preview.student_count,
            question_count=preview.question_count,
            rate_per_unit_paise=preview.rate_per_unit_paise,
            billable_units=preview.billable_units,
            amount=amount_to_pay,
            subtotal_amount=preview.subtotal_paise,
            tax_amount=preview.tax_paise,
            currency=preview.currency,
            razorpay_order_id=razorpay_order_id,
            status="created",
            receipt=receipt,
            notes=json.dumps(order_notes)
        )
        db.add(payment_record)
        db.commit()
        db.refresh(payment_record)

        return CreateExamOrderResponse(
            order_id=razorpay_order_id,
            amount=amount_to_pay,
            currency=preview.currency,
            key_id=settings.RAZORPAY_KEY_ID or "rzp_test_placeholder",
            exam_id=exam.id,
            exam_name=exam.name,
            exam_code=exam.exam_code,
            student_count=preview.student_count,
            question_count=preview.question_count,
            billable_units=preview.billable_units,
            rate_per_unit_paise=preview.rate_per_unit_paise,
            receipt=receipt,
            user_name=user.full_name,
            user_email=user.email
        )

    # =========================================================================
    # Payment Verification (HMAC-SHA256 & Idempotency)
    # =========================================================================
    def verify_exam_payment(
        self,
        user: User,
        razorpay_order_id: str,
        razorpay_payment_id: str,
        razorpay_signature: str,
        db: Session
    ) -> VerifyExamPaymentResponse:
        """
        Validates the Razorpay HMAC-SHA256 payment signature.
        Idempotent: duplicate callbacks will not double charge or error out.
        Updates Exam.is_paid to True and unlocks publishing and student access.
        """
        payment_record = db.query(PaymentOrder).filter(
            PaymentOrder.razorpay_order_id == razorpay_order_id
        ).first()

        if not payment_record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment order not found in database."
            )

        # Authorization: caller must own this payment order or be super_admin
        if payment_record.user_id != user.id and user.role != "super_admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You do not have permission to verify this payment order."
            )

        # IDEMPOTENCY CHECK: If already paid, return success immediately
        if payment_record.status == "paid":
            logger.info(f"Payment order {razorpay_order_id} was already marked as paid. Returning idempotent response.")
            exam = payment_record.exam
            return VerifyExamPaymentResponse(
                success=True,
                message="Payment already verified successfully (idempotent callback).",
                exam_id=payment_record.exam_id,
                order_id=payment_record.razorpay_order_id,
                payment_id=payment_record.razorpay_payment_id or razorpay_payment_id,
                invoice_number=payment_record.invoice_number,
                amount=payment_record.amount,
                currency=payment_record.currency,
                is_paid=True,
                can_publish=True
            )

        # Signature verification
        if self._client and settings.RAZORPAY_KEY_SECRET:
            try:
                data = f"{razorpay_order_id}|{razorpay_payment_id}"
                expected_signature = hmac.new(
                    settings.RAZORPAY_KEY_SECRET.encode("utf-8"),
                    data.encode("utf-8"),
                    hashlib.sha256
                ).hexdigest()

                if not hmac.compare_digest(expected_signature, razorpay_signature):
                    payment_record.status = "failed"
                    db.commit()
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Invalid Razorpay payment signature. Payment verification failed."
                    )
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Error during signature verification: {e}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Verification error: {str(e)}"
                )
        else:
            # Demo verification in simulation mode
            logger.info(f"Signature verified in simulation mode for order {razorpay_order_id}")

        # Update Payment Record
        payment_record.status = "paid"
        payment_record.razorpay_payment_id = razorpay_payment_id
        payment_record.razorpay_signature = razorpay_signature

        # Generate unique invoice reference if not already present
        if not payment_record.invoice_number:
            date_prefix = datetime.now(timezone.utc).strftime("%Y%m")
            payment_record.invoice_number = f"INV-{date_prefix}-{uuid.uuid4().hex[:6].upper()}"

        # Update Exam Model Status
        exam = payment_record.exam
        if exam:
            exam.is_paid = True
            exam.paid_student_count = max(exam.paid_student_count or 0, payment_record.student_count)
            exam.paid_question_count = max(exam.paid_question_count or 0, payment_record.question_count)
            exam.paid_amount_paise = (exam.paid_amount_paise or 0) + payment_record.amount
            db.add(exam)

        db.add(payment_record)
        db.commit()
        db.refresh(payment_record)

        logger.info(f"[PAYMENT_CONFIRMED] Exam {payment_record.exam_id} unlocked! Order: {razorpay_order_id}, Amount: ₹{payment_record.amount/100:.2f}")

        return VerifyExamPaymentResponse(
            success=True,
            message="Payment verified successfully! Examination unlocked and ready for publishing.",
            exam_id=payment_record.exam_id,
            order_id=payment_record.razorpay_order_id,
            payment_id=payment_record.razorpay_payment_id,
            invoice_number=payment_record.invoice_number,
            amount=payment_record.amount,
            currency=payment_record.currency,
            is_paid=True,
            can_publish=True
        )

    # =========================================================================
    # Razorpay Webhook Handler (Raw Body HMAC-SHA256 & Idempotency)
    # =========================================================================
    def handle_webhook(self, raw_body: bytes, signature_header: Optional[str], db: Session) -> Dict[str, Any]:
        """
        Validates incoming Razorpay Webhook signature and processes asynchronous payment events.
        Guaranteed idempotent: duplicate deliveries return safely without re-crediting.
        """
        if settings.RAZORPAY_WEBHOOK_SECRET:
            if not signature_header:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Missing X-Razorpay-Signature webhook header."
                )
            expected_sig = hmac.new(
                settings.RAZORPAY_WEBHOOK_SECRET.encode("utf-8"),
                raw_body,
                hashlib.sha256
            ).hexdigest()

            if not hmac.compare_digest(expected_sig, signature_header):
                logger.warning("Razorpay webhook signature mismatch.")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid webhook signature."
                )

        try:
            event_payload = json.loads(raw_body.decode("utf-8"))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Malformed JSON body: {e}")

        event = event_payload.get("event")
        logger.info(f"Processing Razorpay webhook event: {event}")

        if event in ["payment.captured", "order.paid"]:
            payment_entity = event_payload.get("payload", {}).get("payment", {}).get("entity", {})
            order_entity = event_payload.get("payload", {}).get("order", {}).get("entity", {})
            
            razorpay_order_id = payment_entity.get("order_id") or order_entity.get("id")
            razorpay_payment_id = payment_entity.get("id")

            if not razorpay_order_id:
                return {"status": "ignored", "reason": "No order_id found in event"}

            payment_record = db.query(PaymentOrder).filter(
                PaymentOrder.razorpay_order_id == razorpay_order_id
            ).first()

            if not payment_record:
                logger.warning(f"Payment order {razorpay_order_id} not found in database for webhook event.")
                return {"status": "not_found", "order_id": razorpay_order_id}

            # IDEMPOTENCY: If already paid, return cleanly
            if payment_record.status == "paid":
                return {"status": "already_processed", "order_id": razorpay_order_id}

            payment_record.status = "paid"
            if razorpay_payment_id:
                payment_record.razorpay_payment_id = razorpay_payment_id

            if not payment_record.invoice_number:
                date_prefix = datetime.now(timezone.utc).strftime("%Y%m")
                payment_record.invoice_number = f"INV-{date_prefix}-{uuid.uuid4().hex[:6].upper()}"

            # Activate exam if linked
            exam = payment_record.exam
            if exam:
                exam.is_paid = True
                exam.paid_student_count = max(exam.paid_student_count or 0, payment_record.student_count)
                exam.paid_question_count = max(exam.paid_question_count or 0, payment_record.question_count)
                exam.paid_amount_paise = (exam.paid_amount_paise or 0) + payment_record.amount
                db.add(exam)

            # Process Credit Recharge order if applicable
            if payment_record.order_type == "CREDIT_RECHARGE" and payment_record.credits_added > 0:
                user = payment_record.user
                if user:
                    user.credits_balance = (user.credits_balance or 0) + payment_record.credits_added
                    credit_tx = CreditTransaction(
                        user_id=user.id,
                        payment_order_id=payment_record.id,
                        transaction_type="RECHARGE",
                        amount_credits=payment_record.credits_added,
                        balance_after=user.credits_balance,
                        description=f"Wallet recharge: +{payment_record.credits_added} credits ({payment_record.plan_id}) via Webhook"
                    )
                    db.add(credit_tx)
                    db.add(user)
                    logger.info(f"[WEBHOOK_RECHARGE] Credited {payment_record.credits_added} to user {user.id}")

            db.add(payment_record)
            db.commit()
            logger.info(f"[WEBHOOK_CONFIRMED] Order {razorpay_order_id} marked as paid via webhook.")
            return {"status": "processed", "order_id": razorpay_order_id}

        elif event == "payment.failed":
            payment_entity = event_payload.get("payload", {}).get("payment", {}).get("entity", {})
            razorpay_order_id = payment_entity.get("order_id")
            if razorpay_order_id:
                payment_record = db.query(PaymentOrder).filter(
                    PaymentOrder.razorpay_order_id == razorpay_order_id
                ).first()
                if payment_record and payment_record.status != "paid":
                    payment_record.status = "failed"
                    db.commit()
            return {"status": "payment_failure_logged"}

        return {"status": "event_unhandled", "event": event}

    # =========================================================================
    # Backend Authorization & Payment Enforcement Gate
    # =========================================================================
    def is_exam_payment_sufficient(self, exam: Exam, db: Session) -> Tuple[bool, str]:
        """
        Authoritative backend gate: verifies that an exam has a verified payment
        sufficient for its current student count and question count.
        """
        if not exam.is_paid:
            return (False, "Payment required before this examination can be published or accessed. Please complete the test billing order.")

        student_count, question_count = self.get_exam_billable_counts(exam, db)
        current_units = student_count * question_count
        paid_units = (exam.paid_student_count or 0) * (exam.paid_question_count or 0)

        if current_units > paid_units:
            return (False, f"Test configuration expanded ({current_units} billable units required, but only {paid_units} units paid for). Additional payment is required.")

        return (True, "Exam payment is verified and sufficient.")

    # =========================================================================
    # Receipts & Teacher Transaction History
    # =========================================================================
    def get_receipt(self, order_id: str, user: User, db: Session) -> PaymentReceiptResponse:
        """
        Generates structured payment receipt details for an authorized user.
        """
        order = db.query(PaymentOrder).filter(
            (PaymentOrder.id == order_id) | (PaymentOrder.razorpay_order_id == order_id)
        ).first()

        if not order:
            raise HTTPException(status_code=404, detail="Payment receipt not found.")

        # Access check
        if order.user_id != user.id and user.role != "super_admin":
            raise HTTPException(status_code=403, detail="Access denied: You do not have permission to view this receipt.")

        exam = order.exam
        inst = order.institution or (user.institution if user else None)

        return PaymentReceiptResponse(
            order_id=order.razorpay_order_id,
            invoice_number=order.invoice_number or f"INV-GEN-{order.id[:8].upper()}",
            receipt=order.receipt,
            payment_id=order.razorpay_payment_id,
            status=order.status,
            amount_paise=order.amount,
            subtotal_paise=order.subtotal_amount,
            tax_paise=order.tax_amount,
            tax_percentage=settings.GST_PERCENTAGE,
            currency=order.currency,
            formatted_total=f"₹{order.amount / 100.0:.2f}",
            student_count=order.student_count,
            question_count=order.question_count,
            billable_units=order.billable_units,
            rate_per_unit_paise=order.rate_per_unit_paise,
            exam_id=order.exam_id,
            exam_name=exam.name if exam else None,
            exam_code=exam.exam_code if exam else None,
            user_name=order.user.full_name if order.user else user.full_name,
            user_email=order.user.email if order.user else user.email,
            institution_name=inst.name if inst else "Independent Academic Instructor",
            created_at=order.created_at
        )

    def get_user_history(self, user: User, db: Session) -> List[PaymentHistoryItem]:
        """Returns the user's past payment transactions (both per-test and subscriptions)."""
        orders = db.query(PaymentOrder).filter(
            PaymentOrder.user_id == user.id
        ).order_by(PaymentOrder.created_at.desc()).all()

        results = []
        for o in orders:
            exam = o.exam
            results.append(PaymentHistoryItem(
                id=o.id,
                order_type=o.order_type or "EXAM_PAYMENT",
                plan_id=o.plan_id,
                exam_id=o.exam_id,
                exam_name=exam.name if exam else None,
                exam_code=exam.exam_code if exam else None,
                student_count=o.student_count or 0,
                question_count=o.question_count or 0,
                billable_units=o.billable_units or 0,
                amount=o.amount,
                currency=o.currency,
                status=o.status,
                razorpay_order_id=o.razorpay_order_id,
                razorpay_payment_id=o.razorpay_payment_id,
                invoice_number=o.invoice_number,
                receipt=o.receipt,
                created_at=o.created_at
            ))
        return results

    # =========================================================================
    # Subscription Support (Preserved Catalog)
    # =========================================================================
    def get_plans(self) -> List[SubscriptionPlan]:
        return list(SUBSCRIPTION_PLANS.values())

    def get_plan(self, plan_id: str) -> Optional[SubscriptionPlan]:
        return SUBSCRIPTION_PLANS.get(plan_id)

    def create_subscription_order(self, user: User, plan_id: str, notes: Optional[Dict[str, str]], db: Session) -> Dict:
        plan = self.get_plan(plan_id)
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid subscription plan '{plan_id}'."
            )

        receipt = f"rcpt_sub_{uuid.uuid4().hex[:12]}"
        order_notes = {
            "user_id": user.id,
            "user_email": user.email,
            "plan_id": plan.id,
            "plan_name": plan.name
        }
        if notes:
            order_notes.update(notes)

        razorpay_order_id = ""
        if self._client:
            try:
                rzp_order = self._client.order.create({
                    "amount": plan.amount,
                    "currency": plan.currency,
                    "receipt": receipt,
                    "notes": order_notes,
                    "payment_capture": 1
                })
                razorpay_order_id = rzp_order.get("id")
            except Exception as e:
                logger.error(f"Razorpay API order creation failed: {e}")
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Razorpay order creation failed: {str(e)}"
                )
        else:
            razorpay_order_id = f"order_demo_{uuid.uuid4().hex[:14]}"

        payment_record = PaymentOrder(
            user_id=user.id,
            institution_id=user.institution_id,
            order_type="SUBSCRIPTION",
            plan_id=plan.id,
            amount=plan.amount,
            currency=plan.currency,
            razorpay_order_id=razorpay_order_id,
            status="created",
            receipt=receipt,
            notes=str(order_notes)
        )
        db.add(payment_record)
        db.commit()
        db.refresh(payment_record)

        return {
            "order_id": razorpay_order_id,
            "amount": plan.amount,
            "currency": plan.currency,
            "key_id": settings.RAZORPAY_KEY_ID or "rzp_test_placeholder",
            "plan_id": plan.id,
            "plan_name": plan.name,
            "user_name": user.full_name,
            "user_email": user.email
        }

    # =========================================================================
    # Prepaid Credit System & Wallet Management
    # =========================================================================
    def get_credits_balance(self, user: User, db: Session) -> CreditWalletBalanceResponse:
        """Returns the current credit wallet balance and configured recharge packages."""
        fresh_user = db.query(User).filter(User.id == user.id).first()
        total_balance = fresh_user.total_available_credits if fresh_user else 0
        purchased = int(fresh_user.credits_balance or 0) if fresh_user else 0
        active_bonus = fresh_user.active_bonus_credits if fresh_user else 0
        bonus_exp = fresh_user.bonus_credits_expires_at if fresh_user else None
        bonus_days = fresh_user.bonus_days_remaining if fresh_user else 0
        packages = self.get_recharge_packages(db=db)
        return CreditWalletBalanceResponse(
            credits_balance=total_balance,
            purchased_credits=purchased,
            bonus_credits=active_bonus,
            bonus_credits_expires_at=bonus_exp,
            bonus_days_remaining=bonus_days,
            rate_per_unit_paise=settings.PRICE_PER_UNIT_PAISE,
            credit_per_unit=settings.CREDIT_PER_UNIT,
            packages=packages
        )

    def get_recharge_packages(self, db: Optional[Session] = None) -> List[CreditRechargePackage]:
        """Returns all configured credit recharge packages from database pricing plans, falling back to config."""
        if db:
            try:
                from app.models.pricing_plan import PricingPlan
                plans = db.query(PricingPlan).filter(
                    PricingPlan.plan_type == "RECHARGE",
                    PricingPlan.is_active == True,
                    PricingPlan.is_deleted == False
                ).order_by(PricingPlan.display_order.asc(), PricingPlan.price_inr.asc()).all()
                if plans:
                    results = []
                    for p in plans:
                        rate = f"₹{round(p.price_inr / max(p.total_credits, 1), 2)}" if p.price_inr else "₹0.10"
                        results.append(CreditRechargePackage(
                            id=p.plan_code,
                            name=p.name,
                            credits=p.total_credits,
                            amount_paise=p.price_paise or (p.price_inr * 100),
                            formatted_amount=p.formatted_price or f"₹{p.price_inr}",
                            rate_per_credit=rate,
                            popular=p.is_recommended or p.is_featured,
                            badge=p.badge,
                            description=p.description or f"{p.total_credits:,} Credits"
                        ))
                    return results
            except Exception as e:
                logger.warning(f"Failed to query PricingPlan from DB: {e}")
        return [CreditRechargePackage(**pkg) for pkg in settings.RECHARGE_PACKAGES]

    def create_recharge_order(
        self,
        user: User,
        package_id: str,
        db: Session
    ) -> CreateRechargeOrderResponse:
        """
        Creates a server-side Razorpay order to recharge the teacher's credit wallet.
        """
        # Check DB pricing plans first (Database is single authoritative source of truth)
        from app.models.pricing_plan import PricingPlan
        # Aliases mapping (e.g. pkg_100 -> starter_recharge, pkg_2200 -> standard_recharge, pkg_6000 -> professional_recharge)
        plan_code_query = package_id
        if package_id == "pkg_1000" or package_id == "pkg_100":
            plan_code_query = "starter_recharge"
        elif package_id == "pkg_2200" or package_id == "pkg_199":
            plan_code_query = "standard_recharge"
        elif package_id == "pkg_6000" or package_id == "pkg_499":
            plan_code_query = "professional_recharge"

        db_plan = db.query(PricingPlan).filter(
            (PricingPlan.plan_code == plan_code_query) | (PricingPlan.id == package_id) | (PricingPlan.plan_code == package_id),
            PricingPlan.is_active == True,
            PricingPlan.is_deleted == False
        ).first()

        if db_plan:
            amount_paise = db_plan.price_paise or (db_plan.price_inr * 100)
            credits_to_add = db_plan.total_credits
            pkg_name = db_plan.name
            formatted_amount = db_plan.formatted_price or f"₹{db_plan.price_inr}"
            actual_plan_code = db_plan.plan_code
        else:
            pkg_dict = next((p for p in settings.RECHARGE_PACKAGES if p["id"] == package_id), None)
            if not pkg_dict:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid recharge package '{package_id}'. Please select a valid package."
                )
            amount_paise = pkg_dict["amount_paise"]
            credits_to_add = pkg_dict["credits"]
            pkg_name = pkg_dict["name"]
            formatted_amount = pkg_dict["formatted_amount"]
            actual_plan_code = package_id

        receipt = f"rcpt_rec_{actual_plan_code}_{uuid.uuid4().hex[:6]}"
        order_notes = {
            "order_type": "CREDIT_RECHARGE",
            "package_id": actual_plan_code,
            "package_name": pkg_name,
            "credits_added": str(credits_to_add),
            "teacher_id": user.id,
            "teacher_email": user.email
        }

        razorpay_order_id = ""
        if self._client:
            try:
                rzp_order = self._client.order.create({
                    "amount": amount_paise,
                    "currency": "INR",
                    "receipt": receipt,
                    "notes": order_notes,
                    "payment_capture": 1
                })
                razorpay_order_id = rzp_order.get("id")
            except Exception as e:
                logger.error(f"Razorpay credit recharge order creation failed: {e}")
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Razorpay order creation failed: {str(e)}"
                )
        else:
            razorpay_order_id = f"order_rec_{uuid.uuid4().hex[:14]}"
            logger.info(f"Generated simulation Razorpay recharge order: {razorpay_order_id}")

        payment_record = PaymentOrder(
            user_id=user.id,
            institution_id=user.institution_id,
            order_type="CREDIT_RECHARGE",
            plan_id=package_id,
            amount=amount_paise,
            subtotal_amount=amount_paise,
            tax_amount=0,
            currency="INR",
            credits_added=credits_to_add,
            razorpay_order_id=razorpay_order_id,
            status="created",
            receipt=receipt,
            notes=json.dumps(order_notes)
        )
        db.add(payment_record)
        db.commit()
        db.refresh(payment_record)

        return CreateRechargeOrderResponse(
            order_id=razorpay_order_id,
            amount=amount_paise,
            currency="INR",
            key_id=settings.RAZORPAY_KEY_ID or "rzp_test_placeholder",
            package_id=actual_plan_code,
            package_name=pkg_name,
            credits_added=credits_to_add,
            formatted_amount=formatted_amount,
            user_name=user.full_name,
            user_email=user.email
        )

    def verify_recharge_payment(
        self,
        user: User,
        razorpay_order_id: str,
        razorpay_payment_id: str,
        razorpay_signature: str,
        db: Session
    ) -> VerifyRechargePaymentResponse:
        """
        Validates Razorpay payment signature and credits the user's wallet atomically.
        Idempotent: duplicate callbacks will not double-credit.
        """
        order = db.query(PaymentOrder).filter(
            PaymentOrder.razorpay_order_id == razorpay_order_id,
            PaymentOrder.order_type == "CREDIT_RECHARGE"
        ).first()

        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recharge order not found in database."
            )

        if order.user_id != user.id and user.role != "super_admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You do not have permission to verify this recharge order."
            )

        # IDEMPOTENCY: If already marked paid, return cleanly
        fresh_user = db.query(User).filter(User.id == order.user_id).first()
        if order.status == "paid":
            logger.info(f"Recharge order {razorpay_order_id} already verified. Returning idempotent response.")
            return VerifyRechargePaymentResponse(
                success=True,
                message="Recharge already credited successfully (idempotent callback).",
                credits_added=order.credits_added,
                new_balance=fresh_user.credits_balance if fresh_user else 0,
                order_id=order.razorpay_order_id,
                payment_id=order.razorpay_payment_id or razorpay_payment_id,
                invoice_number=order.invoice_number
            )

        if not fresh_user:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="User account not found during recharge verification.")

        # Signature verification
        if self._client and settings.RAZORPAY_KEY_SECRET:
            try:
                data = f"{razorpay_order_id}|{razorpay_payment_id}"
                expected_signature = hmac.new(
                    settings.RAZORPAY_KEY_SECRET.encode("utf-8"),
                    data.encode("utf-8"),
                    hashlib.sha256
                ).hexdigest()

                if not hmac.compare_digest(expected_signature, razorpay_signature):
                    order.status = "failed"
                    db.commit()
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Invalid Razorpay payment signature. Recharge verification failed."
                    )
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Error during recharge signature verification: {e}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Verification error: {str(e)}"
                )
        else:
            logger.info(f"Recharge signature verified in simulation mode for order {razorpay_order_id}")

        # Mark order paid & generate invoice number
        order.status = "paid"
        order.razorpay_payment_id = razorpay_payment_id
        order.razorpay_signature = razorpay_signature
        date_prefix = datetime.now(timezone.utc).strftime("%Y%m")
        order.invoice_number = f"INV-REC-{date_prefix}-{uuid.uuid4().hex[:6].upper()}"

        # Atomic credit balance addition & transaction ledger logging
        fresh_user.credits_balance = (fresh_user.credits_balance or 0) + order.credits_added
        
        credit_tx = CreditTransaction(
            user_id=fresh_user.id,
            payment_order_id=order.id,
            transaction_type="RECHARGE",
            amount_credits=order.credits_added,
            balance_after=fresh_user.credits_balance,
            description=f"Wallet recharge: +{order.credits_added} credits ({order.plan_id})"
        )
        db.add(credit_tx)
        db.add(order)
        db.add(fresh_user)
        db.commit()
        db.refresh(fresh_user)

        logger.info(f"[WALLET_RECHARGED] User {fresh_user.id} credited {order.credits_added} credits. New balance: {fresh_user.credits_balance}")

        return VerifyRechargePaymentResponse(
            success=True,
            message=f"Successfully credited {order.credits_added} credits to your wallet!",
            credits_added=order.credits_added,
            new_balance=fresh_user.credits_balance,
            order_id=order.razorpay_order_id,
            payment_id=order.razorpay_payment_id,
            invoice_number=order.invoice_number
        )

    def pay_exam_with_credits(
        self,
        exam: Exam,
        user: User,
        db: Session
    ) -> PayExamWithCreditsResponse:
        """
        Deducts required credits atomically to unlock and pay for an assessment.
        Guarantees:
        - Prevents double charging if already paid.
        - Prevents negative credit balance.
        - Creates an immutable CreditTransaction record.
        - Creates a zero-cash PaymentOrder record for invoice/receipt generation.
        - Unlocks Exam.is_paid = True.
        """
        preview = self.get_exam_preview(exam, db, user)

        if preview.can_publish:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This assessment is already fully paid and unlocked for publishing."
            )

        if preview.student_count <= 0 or preview.question_count <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot pay for an assessment with 0 students or 0 questions. Please add questions and eligible students first."
            )

        credits_needed = preview.credits_required
        if credits_needed <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No credits required for this assessment configuration."
            )

        # Refresh user from DB
        fresh_user = db.query(User).filter(User.id == user.id).first()
        if not fresh_user:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="User account not found. Please try again.")
        available_balance = fresh_user.total_available_credits

        if available_balance < credits_needed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient credits. You need {credits_needed} credits, but your total available balance is {available_balance} credits. Please recharge your wallet."
            )

        # Deduct balance: use expiring bonus credits first before purchased credits
        active_bonus = fresh_user.active_bonus_credits
        bonus_deducted = min(active_bonus, credits_needed)
        if bonus_deducted > 0:
            fresh_user.bonus_credits = max(0, fresh_user.bonus_credits - bonus_deducted)

        remainder_needed = credits_needed - bonus_deducted
        if remainder_needed > 0:
            fresh_user.credits_balance = max(0, (fresh_user.credits_balance or 0) - remainder_needed)

        new_balance = fresh_user.total_available_credits

        date_prefix = datetime.now(timezone.utc).strftime("%Y%m")
        invoice_number = f"INV-CRD-{date_prefix}-{uuid.uuid4().hex[:6].upper()}"
        razorpay_order_id = f"crd_order_{uuid.uuid4().hex[:14]}"
        razorpay_payment_id = f"crd_pay_{uuid.uuid4().hex[:14]}"
        receipt = f"rcpt_crd_{exam.exam_code[:8]}_{uuid.uuid4().hex[:4]}"

        # Record PaymentOrder for consistency in receipts and history
        payment_order = PaymentOrder(
            user_id=fresh_user.id,
            institution_id=fresh_user.institution_id,
            exam_id=exam.id,
            order_type="CREDIT_EXAM_PAYMENT",
            plan_id="prepaid_credits",
            amount=0,
            subtotal_amount=0,
            tax_amount=0,
            currency="INR",
            student_count=preview.student_count,
            question_count=preview.question_count,
            rate_per_unit_paise=0,
            billable_units=preview.billable_units,
            credits_added=0,
            razorpay_order_id=razorpay_order_id,
            razorpay_payment_id=razorpay_payment_id,
            status="paid",
            receipt=receipt,
            invoice_number=invoice_number,
            notes=json.dumps({
                "exam_id": exam.id,
                "exam_name": exam.name,
                "credits_deducted": credits_needed,
                "units": preview.billable_units,
                "payment_mode": "PREPAID_CREDITS"
            })
        )
        db.add(payment_order)
        db.flush()

        # Record immutable ledger transaction
        credit_tx = CreditTransaction(
            user_id=fresh_user.id,
            exam_id=exam.id,
            payment_order_id=payment_order.id,
            transaction_type="EXAM_PAYMENT",
            amount_credits=-credits_needed,
            balance_after=new_balance,
            description=f"Paid assessment '{exam.name}' ({preview.billable_units} student-question units)"
        )
        db.add(credit_tx)

        # Unlock exam
        exam.is_paid = True
        exam.paid_student_count = max(exam.paid_student_count or 0, preview.student_count)
        exam.paid_question_count = max(exam.paid_question_count or 0, preview.question_count)
        db.add(exam)

        db.commit()
        db.refresh(fresh_user)
        db.refresh(exam)

        logger.info(f"[EXAM_PAID_WITH_CREDITS] Exam {exam.id} paid using {credits_needed} credits by user {fresh_user.id}. Balance: {new_balance}")

        return PayExamWithCreditsResponse(
            success=True,
            message=f"Assessment unlocked successfully! Deducted {credits_needed} credits from your wallet.",
            exam_id=exam.id,
            credits_deducted=credits_needed,
            remaining_credits=new_balance,
            is_paid=True,
            can_publish=True,
            invoice_number=invoice_number
        )

    def get_credit_transactions(self, user: User, db: Session) -> List[CreditTransactionResponse]:
        """Returns the chronological credit ledger transactions for the teacher."""
        txs = db.query(CreditTransaction).filter(
            CreditTransaction.user_id == user.id
        ).order_by(CreditTransaction.created_at.desc()).all()
        return [CreditTransactionResponse.model_validate(t) for t in txs]

    def verify_payment(
        self,
        user: User,
        razorpay_order_id: str,
        razorpay_payment_id: str,
        razorpay_signature: str,
        db: Session
    ) -> Dict:
        """Subscription verification (preserved for backward compatibility)."""
        payment_record = db.query(PaymentOrder).filter(
            PaymentOrder.razorpay_order_id == razorpay_order_id
        ).first()
        if not payment_record:
            raise HTTPException(status_code=404, detail="Order not found")

        payment_record.status = "paid"
        payment_record.razorpay_payment_id = razorpay_payment_id
        payment_record.razorpay_signature = razorpay_signature
        db.commit()
        return {
            "success": True,
            "message": "Subscription activated successfully",
            "plan_id": payment_record.plan_id or "starter_monthly",
            "institution_id": payment_record.institution_id,
            "subscription_status": "active"
        }

payment_service = PaymentService()
