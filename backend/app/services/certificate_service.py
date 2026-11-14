import os
import io
import json
import uuid
import secrets
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List, Tuple

from sqlalchemy.orm import Session
from sqlalchemy import func

from reportlab.lib.pagesizes import letter, A4, landscape
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing

from app.models.certificate import CertificateConfig, SavedCertificateTemplate, IssuedCertificate
from app.models.exam import Exam, ExamSubmission
from app.models.candidate import ExamCandidate
from app.models.user import User
from app.models.payment import CreditTransaction
from app.services.storage_service import StorageService
from app.services.email_service import email_service
from app.utils.timezone import now_utc
from app.config import settings

logger = logging.getLogger(__name__)

# Template theme color palettes
THEME_PALETTES = {
    "testora_default": {
        "primary": colors.HexColor("#0F172A"),       # Slate 900
        "accent": colors.HexColor("#B45309"),        # Warm Amber / Gold
        "secondary": colors.HexColor("#1E3A8A"),     # Royal Blue
        "gold": colors.HexColor("#D97706"),          # Bright Gold
        "bg": colors.HexColor("#FFFFFF"),
        "frame": colors.HexColor("#0F172A"),
        "subtext": colors.HexColor("#475569"),
        "seal_color": colors.HexColor("#B45309"),
    },
    "classic_academic": {
        "primary": colors.HexColor("#4A0404"),       # Academic Maroon
        "accent": colors.HexColor("#B8860B"),        # Dark Goldenrod
        "secondary": colors.HexColor("#581C87"),     # Rich Purple
        "gold": colors.HexColor("#CA8A04"),
        "bg": colors.HexColor("#FFFDF8"),            # Warm Ivory
        "frame": colors.HexColor("#4A0404"),
        "subtext": colors.HexColor("#57534E"),
        "seal_color": colors.HexColor("#B8860B"),
    },
    "modern_navy": {
        "primary": colors.HexColor("#0B192C"),       # Deep Navy
        "accent": colors.HexColor("#0284C7"),        # Sky Blue
        "secondary": colors.HexColor("#1D4ED8"),     # Cobalt Blue
        "gold": colors.HexColor("#0284C7"),
        "bg": colors.HexColor("#F8FAFC"),            # Clean Slate
        "frame": colors.HexColor("#0B192C"),
        "subtext": colors.HexColor("#334155"),
        "seal_color": colors.HexColor("#0284C7"),
    },
    "achievement_gold": {
        "primary": colors.HexColor("#064E3B"),       # Forest Emerald
        "accent": colors.HexColor("#D97706"),        # Pure Gold
        "secondary": colors.HexColor("#047857"),     # Emerald 700
        "gold": colors.HexColor("#D97706"),
        "bg": colors.HexColor("#FCFDFB"),
        "frame": colors.HexColor("#064E3B"),
        "subtext": colors.HexColor("#374151"),
        "seal_color": colors.HexColor("#D97706"),
    }
}

# Template name aliases
THEME_PALETTES["modern_professional"] = THEME_PALETTES["testora_default"]
THEME_PALETTES["minimal_blue"] = THEME_PALETTES["modern_navy"]
THEME_PALETTES["achievement_award"] = THEME_PALETTES["achievement_gold"]


def calculate_grade(percentage: float) -> str:
    """Calculates formal letter grade from percentage score."""
    if percentage >= 90:
        return "A+"
    elif percentage >= 80:
        return "A"
    elif percentage >= 70:
        return "B+"
    elif percentage >= 60:
        return "B"
    elif percentage >= 50:
        return "C"
    elif percentage >= 40:
        return "Pass"
    else:
        return "F"


class CertificateService:
    def __init__(self):
        # Base storage path for generated certificates
        self.base_storage_dir = os.getenv("STORAGE_PATH", settings.UPLOAD_DIR)
        self.certificates_dir = os.path.join(self.base_storage_dir, "certificates")
        os.makedirs(self.certificates_dir, exist_ok=True)
        
        # Locate project root and official brand logo asset
        # Looking in frontend/public/images/logo-row-light.png or public/icon.png
        current_dir = os.path.abspath(os.path.dirname(__file__))
        root_dir = os.path.abspath(os.path.join(current_dir, "../../../"))
        self.brand_logo_path = os.path.join(root_dir, "frontend", "public", "images", "logo-row-light.png")
        if not os.path.exists(self.brand_logo_path):
            fallback_logo = os.path.join(root_dir, "frontend", "public", "icon-512.png")
            if os.path.exists(fallback_logo):
                self.brand_logo_path = fallback_logo
            else:
                self.brand_logo_path = None

    def generate_certificate_code(self) -> str:
        """Generates human-readable, unique, verifiable Certificate Code."""
        year = datetime.now().year
        rand_part = secrets.token_hex(4).upper() # 8 characters
        return f"TQ-CERT-{year}-{rand_part}"

    def generate_verification_token(self) -> str:
        """Generates high-entropy, tamper-proof URL verification token."""
        return secrets.token_urlsafe(32)

    def generate_certificate_pdf(
        self,
        config: Dict[str, Any],
        student_name: str,
        exam_name: str,
        issue_date: datetime,
        certificate_code: str,
        verification_token: str,
        score: float,
        total_marks: float,
        percentage: float,
        roll_number: Optional[str] = None,
        grade: Optional[str] = None,
    ) -> bytes:
        """
        Renders a high-resolution, print-ready Landscape A4 Certificate PDF.
        Permanent official Testora Quiz branding is rendered into the vector canvas.
        """
        buffer = io.BytesIO()
        width, height = landscape(A4) # 841.89 x 595.27 points
        
        c = canvas.Canvas(buffer, pagesize=landscape(A4))
        c.setTitle(f"Testora Certificate - {student_name} - {certificate_code}")
        c.setAuthor("Testora Quiz Examination System")
        c.setSubject(f"Official Examination Certificate for {exam_name}")

        theme_id = config.get("template_id", "testora_default")
        palette = THEME_PALETTES.get(theme_id, THEME_PALETTES["testora_default"])

        # ─── 1. BACKGROUND & MULTI-LINE SECURITY BORDER ───
        c.setFillColor(palette["bg"])
        c.rect(0, 0, width, height, fill=True, stroke=False)

        # Outer thick border
        c.setStrokeColor(palette["frame"])
        c.setLineWidth(4.0)
        c.rect(18, 18, width - 36, height - 36, fill=False, stroke=True)

        # Inner delicate gold border
        c.setStrokeColor(palette["gold"])
        c.setLineWidth(1.2)
        c.rect(26, 26, width - 52, height - 52, fill=False, stroke=True)

        # Hairline inner frame
        c.setStrokeColor(palette["subtext"])
        c.setLineWidth(0.4)
        c.rect(30, 30, width - 60, height - 60, fill=False, stroke=True)

        # Corner corner embellishments (Gold corner squares/diamonds)
        corner_size = 14
        c.setFillColor(palette["gold"])
        for cx, cy in [
            (26, 26), 
            (width - 26 - corner_size, 26), 
            (26, height - 26 - corner_size), 
            (width - 26 - corner_size, height - 26 - corner_size)
        ]:
            c.rect(cx, cy, corner_size, corner_size, fill=True, stroke=False)
            c.setFillColor(colors.white)
            c.circle(cx + corner_size/2, cy + corner_size/2, 2.5, fill=True, stroke=False)
            c.setFillColor(palette["gold"])

        # ─── 2. FIXED OFFICIAL TESTORA QUIZ BRANDING (Header) ───
        header_y = height - 72

        # Draw Official Testora Logo or Brand Text
        logo_drawn = False
        if self.brand_logo_path and os.path.exists(self.brand_logo_path):
            try:
                # Target dimensions: height ~38pt, proportional width
                c.drawImage(
                    self.brand_logo_path, 
                    46, 
                    header_y - 8, 
                    width=150, 
                    height=36, 
                    preserveAspectRatio=True, 
                    mask='auto'
                )
                logo_drawn = True
            except Exception as e:
                logger.warning(f"Could not render logo image: {e}")
                logo_drawn = False

        if not logo_drawn:
            c.setFont("Helvetica-Bold", 18)
            c.setFillColor(palette["primary"])
            c.drawString(46, header_y + 10, "TESTORA")
            c.setFillColor(palette["gold"])
            c.drawString(135, header_y + 10, "QUIZ")
            c.setFont("Helvetica", 8)
            c.setFillColor(palette["subtext"])
            c.drawString(46, header_y - 2, "Automated Examination & Assessment Platform")

        # Top Right: Institute Name (if specified) or Official Verification Tagline
        inst_name = config.get("institute_name")
        if inst_name:
            c.setFont("Helvetica-Bold", 11)
            c.setFillColor(palette["primary"])
            c.drawRightString(width - 46, header_y + 10, inst_name.upper())
            c.setFont("Helvetica", 8.5)
            c.setFillColor(palette["subtext"])
            c.drawRightString(width - 46, header_y - 2, "Accredited Examination Centre")
        else:
            c.setFont("Helvetica-Bold", 9.5)
            c.setFillColor(palette["primary"])
            c.drawRightString(width - 46, header_y + 10, "OFFICIAL VERIFIED ASSESSMENT")
            c.setFont("Helvetica", 8)
            c.setFillColor(palette["subtext"])
            c.drawRightString(width - 46, header_y - 2, "Accredited Digital Certificate")

        # Top horizontal divider
        c.setStrokeColor(palette["gold"])
        c.setLineWidth(0.8)
        c.line(46, header_y - 16, width - 46, header_y - 16)

        # ─── 3. CERTIFICATE TITLE & SUBTITLE ───
        title_y = header_y - 54
        cert_title = config.get("certificate_title", "Certificate of Excellence")
        c.setFont("Times-Bold", 26)
        c.setFillColor(palette["primary"])
        c.drawCentredString(width / 2, title_y, cert_title.upper())

        # Decorative title accent line
        c.setStrokeColor(palette["gold"])
        c.setLineWidth(1.5)
        title_width = min(len(cert_title) * 14, 380)
        c.line((width - title_width) / 2, title_y - 8, (width + title_width) / 2, title_y - 8)

        # Subtitle
        c.setFont("Helvetica-Oblique", 11)
        c.setFillColor(palette["subtext"])
        subtitle = config.get("certificate_subtitle", "This is to certify that")
        c.drawCentredString(width / 2, title_y - 26, subtitle)

        # ─── 4. RECIPIENT STUDENT NAME ───
        name_y = title_y - 62
        c.setFont("Times-BoldItalic", 28)
        c.setFillColor(palette["primary"])
        c.drawCentredString(width / 2, name_y, student_name)

        # Student underline
        name_width = min(max(len(student_name) * 16, 260), 500)
        c.setStrokeColor(palette["gold"])
        c.setLineWidth(1.0)
        c.line((width - name_width) / 2, name_y - 6, (width + name_width) / 2, name_y - 6)

        # Optional Roll Number / Candidate ID
        if roll_number:
            c.setFont("Helvetica", 9)
            c.setFillColor(palette["subtext"])
            c.drawCentredString(width / 2, name_y - 18, f"Roll Number: {roll_number}")

        # ─── 5. PRESENTATION STATEMENT & EXAM TITLE ───
        text_y = name_y - (36 if roll_number else 30)
        c.setFont("Helvetica", 11)
        c.setFillColor(palette["subtext"])
        
        main_statement = "has successfully appeared and passed the examination with meritorious performance in"
        c.drawCentredString(width / 2, text_y, main_statement)

        # Examination Title
        c.setFont("Helvetica-Bold", 17)
        c.setFillColor(palette["secondary"])
        c.drawCentredString(width / 2, text_y - 24, f"\"{exam_name}\"")

        # Custom text statement or institute affiliation
        custom_statement = config.get("custom_text")
        if custom_statement:
            c.setFont("Helvetica", 9.5)
            c.setFillColor(palette["subtext"])
            c.drawCentredString(width / 2, text_y - 42, custom_statement[:120])
            score_offset = 60
        else:
            score_offset = 42

        # ─── 6. PERFORMANCE BADGE (Score / Percentage / Grade) ───
        show_pct = config.get("show_percentage", True)
        show_marks = config.get("show_marks", False)
        show_grd = config.get("show_grade", False)

        badge_parts = []
        if show_marks:
            badge_parts.append(f"Score: {int(score) if score.is_integer() else f'{score:.1f}'} / {int(total_marks)}")
        if show_pct:
            badge_parts.append(f"Percentage: {percentage:.1f}%")
        if show_grd:
            badge_parts.append(f"Grade: {grade or calculate_grade(percentage)}")

        if badge_parts:
            badge_text = "   •   ".join(badge_parts)
            badge_y = text_y - score_offset
            
            # Draw pill background for score
            c.setFont("Helvetica-Bold", 10)
            badge_width = c.stringWidth(badge_text, "Helvetica-Bold", 10) + 32
            c.setFillColor(palette["bg"])
            c.setStrokeColor(palette["gold"])
            c.setLineWidth(0.8)
            c.roundRect((width - badge_width) / 2, badge_y - 6, badge_width, 22, 6, fill=True, stroke=True)
            
            c.setFillColor(palette["primary"])
            c.drawCentredString(width / 2, badge_y, badge_text)

        # ─── 7. BOTTOM SIGNATURES & VERIFICATION SECTION ───
        bottom_y = 100

        # Separator line above footer
        c.setStrokeColor(palette["gold"])
        c.setLineWidth(0.8)
        c.line(46, bottom_y + 44, width - 46, bottom_y + 44)

        # ─── LEFT: Primary Signatory ───
        sig_name = config.get("signatory_name", "Academic Director")
        sig_desig = config.get("signatory_designation", "Head of Examination")

        c.setStrokeColor(palette["subtext"])
        c.setLineWidth(0.8)
        c.line(56, bottom_y + 8, 230, bottom_y + 8)

        c.setFont("Times-BoldItalic", 12)
        c.setFillColor(palette["primary"])
        c.drawCentredString(143, bottom_y + 12, sig_name)

        c.setFont("Helvetica", 8.5)
        c.setFillColor(palette["subtext"])
        c.drawCentredString(143, bottom_y - 2, sig_desig)

        # ─── CENTER: Official Accreditation Seal ───
        seal_x = width / 2
        seal_y = bottom_y + 8
        c.setStrokeColor(palette["seal_color"])
        c.setLineWidth(1.5)
        c.circle(seal_x, seal_y, 24, fill=False, stroke=True)
        c.setLineWidth(0.5)
        c.circle(seal_x, seal_y, 21, fill=False, stroke=True)

        c.setFont("Helvetica-Bold", 6.5)
        c.setFillColor(palette["seal_color"])
        c.drawCentredString(seal_x, seal_y + 7, "OFFICIAL")
        c.setFont("Helvetica-Bold", 7.5)
        c.drawCentredString(seal_x, seal_y - 2, "VERIFIED")
        c.setFont("Helvetica-Bold", 6)
        c.drawCentredString(seal_x, seal_y - 11, "TESTORA")

        # ─── RIGHT: Secondary Signatory or Issue Authority ───
        sec_name = config.get("secondary_signatory_name")
        sec_desig = config.get("secondary_signatory_designation")

        if sec_name:
            c.setStrokeColor(palette["subtext"])
            c.setLineWidth(0.8)
            c.line(width - 230, bottom_y + 8, width - 56, bottom_y + 8)

            c.setFont("Times-BoldItalic", 12)
            c.setFillColor(palette["primary"])
            c.drawCentredString(width - 143, bottom_y + 12, sec_name)

            c.setFont("Helvetica", 8.5)
            c.setFillColor(palette["subtext"])
            c.drawCentredString(width - 143, bottom_y - 2, sec_desig or "Examiner")
        else:
            # Fallback to Authorized Signature
            c.setStrokeColor(palette["subtext"])
            c.setLineWidth(0.8)
            c.line(width - 230, bottom_y + 8, width - 56, bottom_y + 8)

            c.setFont("Times-BoldItalic", 12)
            c.setFillColor(palette["primary"])
            c.drawCentredString(width - 143, bottom_y + 12, "Examination Authority")

            c.setFont("Helvetica", 8.5)
            c.setFillColor(palette["subtext"])
            c.drawCentredString(width - 143, bottom_y - 2, "Testora Quiz Accreditation")

        # ─── 8. QR CODE & VERIFICATION DETAILS (Bottom Left/Center) ───
        qr_size = 46
        qr_x = 48
        qr_y = 38

        verify_url = f"https://testoraquiz.com/verify-certificate/{verification_token}"
        try:
            qr_widget = QrCodeWidget(verify_url)
            qr_widget.barWidth = qr_size
            qr_widget.barHeight = qr_size
            qr_widget.qrVersion = 1
            d = Drawing(qr_size, qr_size)
            d.add(qr_widget)
            d.drawOn(c, qr_x, qr_y)
        except Exception as e:
            logger.warning(f"Could not render vector QR: {e}")
            c.rect(qr_x, qr_y, qr_size, qr_size, fill=False, stroke=True)

        # Verification details text next to QR
        c.setFont("Helvetica-Bold", 8)
        c.setFillColor(palette["primary"])
        c.drawString(qr_x + qr_size + 8, qr_y + 32, f"Certificate ID: {certificate_code}")

        c.setFont("Helvetica", 7.5)
        c.setFillColor(palette["subtext"])
        formatted_date = issue_date.strftime("%d %B %Y")
        c.drawString(qr_x + qr_size + 8, qr_y + 20, f"Issued Date: {formatted_date}")
        c.drawString(qr_x + qr_size + 8, qr_y + 8, "Verification: Scan QR or visit testoraquiz.com/verify-certificate")

        # Bottom Footer Message
        footer_msg = config.get("footer_message", "Verified & Issued securely via Testora Quiz Examination Platform")
        c.setFont("Helvetica", 7.5)
        c.setFillColor(palette["subtext"])
        c.drawRightString(width - 48, 42, footer_msg)

        c.showPage()
        c.save()
        
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes

    def save_certificate_file(self, exam_id: str, cert_code: str, pdf_bytes: bytes) -> str:
        """Saves generated PDF to storage disk and returns relative/absolute file path."""
        exam_dir = os.path.join(self.certificates_dir, exam_id)
        os.makedirs(exam_dir, exist_ok=True)
        file_path = os.path.join(exam_dir, f"{cert_code}.pdf")
        with open(file_path, "wb") as f:
            f.write(pdf_bytes)
        return file_path

    def process_exam_certificates(
        self,
        exam_id: str,
        db: Session,
        background_tasks: Optional[Any] = None
    ) -> Dict[str, Any]:
        """
        Automated certificate generation triggered when examination results are finalized.
        - Checks if certificates are enabled for this exam.
        - Evaluates passing criteria for all candidate submissions.
        - Generates unique vector PDF certificate per eligible student.
        - Enforces idempotency (no duplicate certificates or duplicate credit deductions).
        - Deducts credit from teacher's wallet per generated certificate.
        - Sends congratulatory notification email.
        """
        exam = db.query(Exam).filter(Exam.id == exam_id, Exam.is_deleted == False).first()
        if not exam:
            return {"status": "error", "message": "Exam not found"}

        config = db.query(CertificateConfig).filter(CertificateConfig.exam_id == exam_id).first()
        if not config or not config.is_enabled:
            return {
                "status": "skipped",
                "message": "Certificate generation is disabled for this exam."
            }

        # Retrieve teacher user to check credits
        teacher = db.query(User).filter(User.id == exam.created_by).first() if exam.created_by else None
        
        # Calculate passing criteria
        # Criteria can be PERCENTAGE or MARKS
        passing_val = config.passing_criteria_value or (exam.passing_marks / exam.total_marks * 100.0 if exam.total_marks else 40.0)
        is_pct = config.passing_criteria_type == "PERCENTAGE"

        # Query all valid final submissions for this exam
        submissions = db.query(ExamSubmission).filter(
            ExamSubmission.exam_id == exam_id,
            ExamSubmission.is_counted_for_result == True,
            ExamSubmission.status.in_(["submitted", "auto_submitted", "graded"])
        ).all()

        eligible_count = 0
        generated_count = 0
        skipped_existing = 0
        failed_count = 0

        # Convert config model to dictionary for PDF rendering
        config_dict = {
            "template_id": config.template_id,
            "certificate_title": config.certificate_title,
            "certificate_subtitle": config.certificate_subtitle,
            "custom_text": config.custom_text,
            "footer_message": config.footer_message,
            "institute_name": config.institute_name or exam.institution_name,
            "institute_logo_url": config.institute_logo_url,
            "signatory_name": config.signatory_name,
            "signatory_designation": config.signatory_designation,
            "signature_url": config.signature_url,
            "stamp_url": config.stamp_url,
            "secondary_signatory_name": config.secondary_signatory_name,
            "secondary_signatory_designation": config.secondary_signatory_designation,
            "secondary_signature_url": config.secondary_signature_url,
            "show_marks": config.show_marks,
            "show_percentage": config.show_percentage,
            "show_grade": config.show_grade,
        }

        # Check teacher credit balance (1 credit per certificate)
        credits_per_cert = 1

        for sub in submissions:
            # 1. Eligibility Check
            is_passed = False
            if is_pct:
                is_passed = (sub.percentage or 0.0) >= passing_val
            else:
                is_passed = (sub.score or 0.0) >= passing_val

            if not is_passed:
                continue

            eligible_count += 1

            # 2. Duplicate Check: Ensure certificate not already issued for this submission
            existing_cert = db.query(IssuedCertificate).filter(
                IssuedCertificate.submission_id == sub.id
            ).first()
            if existing_cert:
                skipped_existing += 1
                continue

            # 3. Check teacher available credits
            if teacher and teacher.total_available_credits < credits_per_cert:
                logger.warning(f"Teacher {teacher.id} has insufficient credits to generate certificate for submission {sub.id}.")
                continue

            # 4. Resolve Student Details
            student_name = "Candidate"
            student_email = None
            roll_number = None

            if sub.candidate:
                student_name = sub.candidate.name_snapshot or student_name
                student_email = sub.candidate.email_snapshot
                roll_number = sub.candidate.roll_number_snapshot
            elif sub.student_user:
                student_name = sub.student_user.full_name or student_name
                student_email = sub.student_user.email
            elif sub.student:
                student_name = getattr(sub.student, "name", student_name)
                student_email = getattr(sub.student, "email", None)

            cert_code = self.generate_certificate_code()
            verify_token = self.generate_verification_token()
            issue_dt = now_utc()
            letter_grade = calculate_grade(sub.percentage or 0.0)

            try:
                # 5. Generate Vector PDF
                pdf_bytes = self.generate_certificate_pdf(
                    config=config_dict,
                    student_name=student_name,
                    exam_name=exam.name,
                    issue_date=issue_dt,
                    certificate_code=cert_code,
                    verification_token=verify_token,
                    score=sub.score or 0.0,
                    total_marks=float(exam.total_marks or 100),
                    percentage=sub.percentage or 0.0,
                    roll_number=roll_number,
                    grade=letter_grade
                )

                # 6. Save PDF to local persistent storage
                pdf_path = self.save_certificate_file(exam_id, cert_code, pdf_bytes)
                pdf_size = len(pdf_bytes)

                # 7. Deduct credit atomically if teacher is charged
                if teacher:
                    teacher.credits_balance = max(0, (teacher.credits_balance or 0) - credits_per_cert)
                    credit_tx = CreditTransaction(
                        id=str(uuid.uuid4()),
                        user_id=teacher.id,
                        exam_id=exam.id,
                        transaction_type="CERTIFICATE_GENERATION",
                        amount_credits=-credits_per_cert,
                        balance_after=teacher.total_available_credits,
                        description=f"Passing certificate issued to {student_name} for '{exam.name}' ({cert_code})"
                    )
                    db.add(credit_tx)

                # 8. Store Issued Certificate record
                new_cert = IssuedCertificate(
                    id=str(uuid.uuid4()),
                    certificate_code=cert_code,
                    verification_token=verify_token,
                    exam_id=exam_id,
                    submission_id=sub.id,
                    candidate_id=sub.candidate_id,
                    student_user_id=sub.student_user_id,
                    recipient_name=student_name,
                    recipient_email=student_email,
                    recipient_roll_number=roll_number,
                    exam_name_snapshot=exam.name,
                    institute_name_snapshot=config_dict["institute_name"],
                    score_snapshot=sub.score or 0.0,
                    total_marks_snapshot=float(exam.total_marks or 100),
                    percentage_snapshot=sub.percentage or 0.0,
                    passing_marks_snapshot=float(exam.passing_marks or 0),
                    grade_snapshot=letter_grade,
                    issue_date=issue_dt,
                    pdf_file_path=pdf_path,
                    pdf_file_size=pdf_size,
                    email_status="PENDING" if student_email else "NO_EMAIL",
                    credits_deducted=credits_per_cert
                )
                db.add(new_cert)
                db.commit()
                db.refresh(new_cert)
                generated_count += 1

                # 9. Dispatch Delivery Email
                if student_email:
                    self.send_certificate_email(new_cert, exam.name, config_dict["institute_name"])
                    db.commit()

            except Exception as e:
                db.rollback()
                logger.error(f"Failed to generate certificate for submission {sub.id}: {e}", exc_info=True)
                failed_count += 1

        return {
            "status": "success",
            "exam_id": exam_id,
            "eligible_count": eligible_count,
            "generated_count": generated_count,
            "skipped_existing": skipped_existing,
            "failed_count": failed_count,
        }

    def send_certificate_email(self, cert: IssuedCertificate, exam_name: str, institute_name: Optional[str]) -> bool:
        """Sends professional congratulatory certificate delivery email to student."""
        if not cert.recipient_email:
            cert.email_status = "NO_EMAIL"
            return False

        # Use human-friendly certificate_code in link to eliminate token homoglyph OCR corruption
        verify_url = f"https://testoraquiz.com/verify-certificate/{cert.certificate_code}"
        inst_display = institute_name or "Testora Quiz Examination Academy"
        
        subject = f"Congratulations! Your Examination Certificate Is Ready — {exam_name}"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 24px; color: #1E293B; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }}
            .header {{ background: linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%); padding: 32px 24px; text-align: center; color: #ffffff; }}
            .badge {{ display: inline-block; padding: 4px 12px; background: rgba(217, 119, 6, 0.2); border: 1px solid #D97706; border-radius: 9999px; font-size: 11px; font-weight: 700; color: #FBBF24; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; }}
            .content {{ padding: 32px 24px; }}
            .cert-box {{ background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 18px; margin: 20px 0; }}
            .cert-row {{ display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; border-bottom: 1px solid #EDF2F7; }}
            .btn {{ display: inline-block; padding: 12px 28px; background: #2563EB; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 14px; border-radius: 10px; text-align: center; margin: 18px 0; }}
            .footer {{ background: #F1F5F9; padding: 18px; text-align: center; font-size: 11px; color: #64748B; border-top: 1px solid #E2E8F0; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="badge">Official Accredited Passing Certificate</div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 800;">Congratulations, {cert.recipient_name}!</h1>
              <p style="margin: 8px 0 0; font-size: 13px; opacity: 0.9;">You have successfully passed your examination.</p>
            </div>
            
            <div class="content">
              <p style="font-size: 14px; line-height: 1.6;">
                We are delighted to inform you that you have met all passing criteria for <b>{exam_name}</b> conducted by <b>{inst_display}</b>.
              </p>
              
              <div class="cert-box">
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                  <tr>
                    <td style="color: #64748B; padding: 6px 0;">Certificate ID:</td>
                    <td style="font-weight: 700; text-align: right; color: #0F172A;">{cert.certificate_code}</td>
                  </tr>
                  <tr>
                    <td style="color: #64748B; padding: 6px 0;">Examination:</td>
                    <td style="font-weight: 700; text-align: right; color: #0F172A;">{exam_name}</td>
                  </tr>
                  <tr>
                    <td style="color: #64748B; padding: 6px 0;">Score Achieved:</td>
                    <td style="font-weight: 700; text-align: right; color: #059669;">{cert.score_snapshot:.1f} / {cert.total_marks_snapshot:.0f} ({cert.percentage_snapshot:.1f}%)</td>
                  </tr>
                  <tr>
                    <td style="color: #64748B; padding: 6px 0;">Issue Date:</td>
                    <td style="font-weight: 700; text-align: right; color: #0F172A;">{cert.issue_date.strftime("%d %B %Y")}</td>
                  </tr>
                </table>
              </div>
              
              <div style="text-align: center;">
                <a href="{verify_url}" class="btn" target="_blank">View & Download Certificate</a>
              </div>
              
              <p style="font-size: 12px; color: #64748B; line-height: 1.5; margin-top: 20px;">
                Your certificate is permanently secured with a unique cryptographic verification identifier. You can share your verification link with colleges, employers, or on LinkedIn.
              </p>
            </div>
            
            <div class="footer">
              <p style="margin: 0;">Issued by Testora Quiz Automated Examination Platform on behalf of {inst_display}.</p>
              <p style="margin: 4px 0 0;">Verification URL: <a href="{verify_url}" style="color: #2563EB;">{verify_url}</a></p>
            </div>
          </div>
        </body>
        </html>
        """

        try:
            cert.email_attempt_count += 1
            # Primary: Deliver via configured SMTP (with vector PDF certificate attached)
            success = email_service._send_smtp_email(
                to_email=cert.recipient_email,
                subject=subject,
                html_content=html_body,
                attachment_path=cert.pdf_file_path,
                attachment_name=f"{cert.certificate_code}.pdf"
            )
            # Secondary fallback: Resend HTTP REST API
            if not success and getattr(settings, "RESEND_API_KEY", None):
                success = email_service._send_email_via_resend(cert.recipient_email, subject, html_body)
            # Tertiary fallback: SendGrid HTTP API
            if not success and getattr(settings, "SENDGRID_API_KEY", None):
                success = email_service._send_email_via_sendgrid(cert.recipient_email, subject, html_body)

            if success:
                cert.email_status = "SENT"
                cert.email_sent_at = now_utc()
                cert.email_error = None
                return True
            else:
                cert.email_status = "FAILED"
                cert.email_error = "All email delivery channels failed to dispatch."
                return False
        except Exception as e:
            cert.email_status = "FAILED"
            cert.email_error = str(e)[:255]
            logger.error(f"Error dispatching certificate email to {cert.recipient_email}: {e}")
            return False


certificate_service = CertificateService()

