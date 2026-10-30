import logging
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Union
from datetime import datetime
from app.config import settings
from app.utils.timezone import format_ist_datetime, format_ist_time

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.enabled = True

    def _send_email_via_resend(self, to_email: str, subject: str, html_content: str) -> bool:
        """Transmits email via Resend HTTP REST API over Port 443 (bypasses all cloud SMTP firewall blocks)."""
        try:
            import httpx
            from_addr = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
            # If using free Resend default domain, fallback to onboarding@resend.dev if custom domain not verified
            if "gmail.com" in settings.EMAILS_FROM_EMAIL.lower() and not getattr(settings, "RESEND_FROM_EMAIL", None):
                from_addr = f"{settings.EMAILS_FROM_NAME} <onboarding@resend.dev>"
            elif hasattr(settings, "RESEND_FROM_EMAIL") and getattr(settings, "RESEND_FROM_EMAIL", None):
                from_addr = getattr(settings, "RESEND_FROM_EMAIL")

            res = httpx.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "from": from_addr,
                    "to": [to_email],
                    "subject": subject,
                    "html": html_content
                },
                timeout=12.0
            )
            if res.status_code in (200, 201):
                logger.info(f"⚡ Real Resend HTTP API (Port 443) email delivered to {to_email}")
                print(f"⚡ Real Resend HTTP API (Port 443) email delivered to {to_email}")
                return True
            else:
                logger.warning(f"⚠️ Resend HTTP API rejected with status {res.status_code}: {res.text}")
                print(f"⚠️ Resend HTTP API rejected with status {res.status_code}: {res.text}")
                return False
        except Exception as e:
            logger.warning(f"⚠️ Resend HTTP API exception: {e}")
            print(f"⚠️ Resend HTTP API exception: {e}")
            return False

    def _send_email_via_sendgrid(self, to_email: str, subject: str, html_content: str) -> bool:
        """Transmits email via SendGrid HTTP API over Port 443."""
        try:
            import httpx
            res = httpx.post(
                "https://api.sendgrid.com/v3/mail/send",
                headers={
                    "Authorization": f"Bearer {settings.SENDGRID_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "personalizations": [{"to": [{"email": to_email}]}],
                    "from": {"email": settings.EMAILS_FROM_EMAIL, "name": settings.EMAILS_FROM_NAME},
                    "subject": subject,
                    "content": [{"type": "text/html", "value": html_content}]
                },
                timeout=12.0
            )
            if res.status_code in (200, 202):
                logger.info(f"⚡ Real SendGrid HTTP API (Port 443) email delivered to {to_email}")
                print(f"⚡ Real SendGrid HTTP API (Port 443) email delivered to {to_email}")
                return True
            else:
                logger.warning(f"⚠️ SendGrid HTTP API rejected with status {res.status_code}: {res.text}")
                print(f"⚠️ SendGrid HTTP API rejected with status {res.status_code}: {res.text}")
                return False
        except Exception as e:
            logger.warning(f"⚠️ SendGrid HTTP API exception: {e}")
            return False

    def _send_smtp_email(self, to_email: str, subject: str, html_content: str):
        """Transmits HTML email via Resend HTTP API (primary for Render) or SMTP server."""
        # 1. Primary for Cloud: Resend HTTP REST API (Never blocked by cloud firewalls on Render/Vercel)
        if getattr(settings, "RESEND_API_KEY", None):
            if self._send_email_via_resend(to_email, subject, html_content):
                return True

        # 2. Secondary HTTP: SendGrid API
        if getattr(settings, "SENDGRID_API_KEY", None):
            if self._send_email_via_sendgrid(to_email, subject, html_content):
                return True

        # 3. Direct SMTP Server (SSL 465 then STARTTLS 587)
        if settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD and not to_email.endswith("@aegeus.edu"):
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
            msg["To"] = to_email
            msg.attach(MIMEText(html_content, "html"))
            
            # Primary Attempt: SSL Port 465
            try:
                context = ssl.create_default_context()
                with smtplib.SMTP_SSL(settings.SMTP_HOST, 465, context=context, timeout=30) as server:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                    server.send_message(msg)
                logger.info(f"[SUCCESS] Real SMTP SSL (Port 465) email transmitted to {to_email}")
                print(f"[SUCCESS] Real SMTP SSL (Port 465) email transmitted to {to_email}")
                return True
            except Exception as primary_err:
                logger.warning(f"[WARNING] Primary SSL 465 failed ({primary_err}), attempting STARTTLS 587 fallback...")
                print(f"[WARNING] Primary SSL 465 failed ({primary_err}), attempting STARTTLS 587 fallback...")
                try:
                    # Fallback Attempt: STARTTLS Port 587
                    with smtplib.SMTP(settings.SMTP_HOST, 587, timeout=30) as server:
                        server.starttls()
                        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                        server.send_message(msg)
                    logger.info(f"[SUCCESS] Fallback STARTTLS (Port 587) email transmitted to {to_email}")
                    print(f"[SUCCESS] Fallback STARTTLS (Port 587) email transmitted to {to_email}")
                    return True
                except Exception as fallback_err:
                    logger.error(
                        f"[ERROR] Cloud Email Delivery Alert: Outbound SMTP blocked on server for {to_email}. "
                        f"Errors: SSL 465={primary_err}, STARTTLS 587={fallback_err}. "
                        f"NOTE: Render Free Tier blocks outbound SMTP ports 25/465/587 by default. "
                        f"To enable email delivery on Render, add RESEND_API_KEY (free at resend.com) to your Render Environment Variables."
                    )
                    print(
                        f"[ERROR] Cloud Email Delivery Alert: Outbound SMTP blocked on server for {to_email}. "
                        f"Render Free Tier blocks outbound SMTP ports 25/465/587. "
                        f"Set RESEND_API_KEY in Render Environment Variables for instant HTTPS delivery."
                    )
                    return False
        else:
            if not to_email.endswith("@aegeus.edu"):
                logger.warning(
                    f"[WARNING] SMTP credentials not configured. Missing SMTP_HOST ('{settings.SMTP_HOST}') or SMTP_USER ('{settings.SMTP_USER}'). "
                    f"Set RESEND_API_KEY or SMTP credentials in your Render Environment Variables."
                )
            return False

    def send_student_authorization_email(self, student_name: str, email: str, verification_token: str, roll_number: Optional[str] = None):
        """Dispatches an authorization email requesting the student to verify their account or authorize with Google."""
        verify_url = f"{settings.FRONTEND_URL}/verify-student?token={verification_token}"
        subject = "Action Required: Authorize Your Testora Quiz Student Account"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F7F4EF; padding: 24px; color: #242321;">
            <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #E5E0D8;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                    <div style="background-color: #C84B18; color: #ffffff; padding: 8px 12px; border-radius: 8px; font-weight: bold; font-size: 16px;">Testora Quiz</div>
                    <span style="font-size: 12px; color: #716D67;">Academic Authorization Portal</span>
                </div>

                <h2 style="color: #242321; margin-top: 0; font-size: 20px; font-weight: 700;">Authorize Your Student Account</h2>
                <p style="font-size: 14px; line-height: 1.6;">Hello <b>{student_name}</b>,</p>
                <p style="font-size: 14px; line-height: 1.6;">Your teacher has enrolled you into the institutional student directory. Please authorize your email to activate your account and generate your secure portal access password.</p>
                
                <div style="background-color: #F0ECE4; border: 1px solid #E5E0D8; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 13px;">
                    <p style="margin: 4px 0;"><b>Enrolled Email:</b> <span style="color: #C84B18; font-family: monospace;">{email}</span></p>
                    {f'<p style="margin: 4px 0;"><b>Roll Number:</b> {roll_number}</p>' if roll_number else ''}
                    <p style="margin: 4px 0;"><b>Status:</b> <span style="color: #D97706; font-weight: 600;">Pending Authorization</span></p>
                </div>
                
                <div style="margin: 28px 0; text-align: center;">
                    <a href="{verify_url}" style="display: inline-block; background-color: #C84B18; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin-bottom: 12px;">Authorize Student Account</a>
                    <div style="margin-top: 8px;">
                        <span style="font-size: 12px; color: #716D67;">or authorize instantly with your Google Workspace account:</span>
                    </div>
                    <a href="{verify_url}&provider=google" style="display: inline-block; background-color: #ffffff; color: #374151; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 13px; border: 1px solid #D1D5DB; margin-top: 8px;">
                        Sign in & Authorize with Google
                    </a>
                </div>
                
                <p style="font-size: 12px; color: #716D67; line-height: 1.5;">Once authorized, a unique secure password will automatically be generated and delivered to your inbox for direct email sign-in.</p>
                
                <hr style="border: none; border-top: 1px solid #E5E0D8; margin-top: 28px;" />
                <p style="font-size: 11px; color: #716D67; margin-bottom: 0;">Testora Quiz Autonomous Examination System • Verification Request</p>
            </div>
        </body>
        </html>
        """
        
        logger.info(f"📧 [AUTHORIZATION EMAIL] Sent authorization email to {student_name} (email={email})")
        self._send_smtp_email(email, subject, html_content)

    def send_student_credentials_email(self, student_name: str, email: str, password: str):
        """Dispatches generated student portal password after authorization is completed."""
        portal_url = settings.FRONTEND_URL
        subject = "Your Testora Quiz Student Portal Password & Credentials"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F7F4EF; padding: 24px; color: #242321;">
            <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #E5E0D8;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                    <div style="background-color: #059669; color: #ffffff; padding: 8px 12px; border-radius: 8px; font-weight: bold; font-size: 16px;">Verified</div>
                    <span style="font-size: 12px; color: #716D67;">Testora Quiz Student Portal</span>
                </div>

                <h2 style="color: #242321; margin-top: 0; font-size: 20px; font-weight: 700;">Account Authorized Successfully!</h2>
                <p style="font-size: 14px; line-height: 1.6;">Hello <b>{student_name}</b>,</p>
                <p style="font-size: 14px; line-height: 1.6;">Your student account is now fully verified. Your secure student portal password has been generated below:</p>
                
                <div style="background-color: #F0ECE4; border: 1px solid #E5E0D8; border-radius: 8px; padding: 20px; margin: 20px 0; font-size: 14px;">
                    <p style="margin: 6px 0;"><b>Portal Login Email:</b> <span style="color: #C84B18; font-family: monospace; font-size: 15px;">{email}</span></p>
                    <p style="margin: 6px 0;"><b>Generated Password:</b> <span style="color: #047857; font-family: monospace; font-size: 17px; font-weight: bold; background: #ECFDF5; padding: 3px 8px; border-radius: 4px; border: 1px solid #A7F3D0;">{password}</span></p>
                </div>
                
                <p style="font-size: 13px; line-height: 1.6;">You can sign in anytime using your email and generated password, or by clicking <b>"Continue with Google"</b> with your authorized email address:</p>
                
                <div style="margin: 24px 0; text-align: center;">
                    <a href="{portal_url}" style="display: inline-block; background-color: #C84B18; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">Sign in to Student Portal</a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #E5E0D8; margin-top: 28px;" />
                <p style="font-size: 11px; color: #716D67; margin-bottom: 0;">Testora Quiz Autonomous Examination System • Confidential Access Credentials</p>
            </div>
        </body>
        </html>
        """
        
        logger.info(f"📧 [CREDENTIALS EMAIL] Dispatched generated credentials to {student_name} (email={email})")
        self._send_smtp_email(email, subject, html_content)

    def send_password_reset_email(self, user_name: str, email: str, reset_token: str):
        """Dispatches a password reset recovery email containing a secure tokenized reset link."""
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
        subject = "Testora Quiz — Password Reset Request"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F7F4EF; padding: 24px; color: #242321;">
            <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #E5E0D8;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                    <div style="background-color: #C84B18; color: #ffffff; padding: 8px 12px; border-radius: 8px; font-weight: bold; font-size: 16px;">Testora Quiz</div>
                    <span style="font-size: 12px; color: #716D67;">Password Recovery</span>
                </div>

                <h2 style="color: #242321; margin-top: 0; font-size: 20px; font-weight: 700;">Password Reset Request</h2>
                <p style="font-size: 14px; line-height: 1.6;">Hello <b>{user_name}</b>,</p>
                <p style="font-size: 14px; line-height: 1.6;">We received a request to reset your password. Click the secure button below to set a new password for your account:</p>
                
                <div style="margin: 24px 0; text-align: center;">
                    <a href="{reset_url}" style="display: inline-block; background-color: #C84B18; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">Reset Account Password</a>
                </div>
                
                <p style="font-size: 12px; color: #716D67;">Or copy and paste this link in your browser: <br/><span style="font-family: monospace; font-size: 11px; word-break: break-all;">{reset_url}</span></p>
                
                <hr style="border: none; border-top: 1px solid #E5E0D8; margin-top: 28px;" />
                <p style="font-size: 11px; color: #716D67; margin-bottom: 0;">Testora Quiz Autonomous Examination System • If you did not request this, please ignore this email.</p>
            </div>
        </body>
        </html>
        """
        
        logger.info(f"📧 [PASSWORD RESET EMAIL] Dispatched reset link email to {user_name} (email={email})")
        self._send_smtp_email(email, subject, html_content)

    def send_student_welcome_email(self, student_name: str, email: str, password: str, roll_number: Optional[str] = None):
        """Legacy helper maintained for backward compatibility."""
        self.send_student_credentials_email(student_name, email, password)

    def send_exam_credentials_email(
        self, 
        student_name: str, 
        email: str, 
        exam_name: str, 
        exam_code: str, 
        username: str, 
        password: str,
        start_time: Optional[Union[datetime, str]] = None,
        end_time: Optional[Union[datetime, str]] = None
    ):
        """Dispatches an automated email to student containing test link, exam username, passcode PIN, and IST schedule."""
        exam_link = f"{settings.FRONTEND_URL}/exam/{exam_code}"
        subject = f"Exam Notification & Access Credentials — {exam_name}"
        
        schedule_html = ""
        if start_time:
            start_str = format_ist_datetime(start_time)
            end_str = format_ist_datetime(end_time) if end_time else None
            schedule_html = f"""
            <div style="background-color: #FEF3C7; border: 1px solid #FDE68A; border-radius: 8px; padding: 12px 16px; margin: 15px 0; font-size: 13px;">
                <p style="margin: 3px 0; color: #92400E; font-weight: bold;">Official Schedule (Indian Standard Time - IST):</p>
                <p style="margin: 3px 0; color: #78350F;"><b>Starts:</b> {start_str}</p>
                {f'<p style="margin: 3px 0; color: #78350F;"><b>Ends:</b> {end_str}</p>' if end_str else ''}
            </div>
            """
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #FAF7F2; padding: 20px; color: #1C1917;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 30px; border: 1px solid #E7E0D3;">
                <h2 style="color: #9A3412; margin-top: 0;">Secured Exam Credentials & Portal Link</h2>
                <p>Hello <b>{student_name}</b>,</p>
                <p>You have been enrolled for the examination: <b>{exam_name}</b> (Code: <b style="color: #9A3412;">{exam_code}</b>).</p>
                
                {schedule_html}

                <div style="background-color: #FBF9F5; border: 1px solid #E7E0D3; border-radius: 12px; padding: 20px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><b>Exam Session Username:</b> <span style="color: #9A3412; font-family: monospace; font-size: 16px;">{username}</span></p>
                    <p style="margin: 5px 0;"><b>Exam Passcode / PIN:</b> <span style="color: #047857; font-family: monospace; font-size: 16px; background: #ECFDF5; padding: 2px 8px; border-radius: 4px;">{password}</span></p>
                    <p style="margin: 5px 0;"><b>Exam Code:</b> {exam_code}</p>
                </div>
                
                <p>Click the link below to enter the secure exam gateway when your exam window opens:</p>
                <p><a href="{exam_link}" style="display: inline-block; background: #9A3412; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: bold;">Open Exam Portal Link</a></p>
                
                <hr style="border: none; border-top: 1px solid #E7E0D3; margin-top: 30px;" />
                <p style="font-size: 11px; color: #78716C;">Testora Quiz Proctoring Portal • Confidential Student Credentials • All Times in Indian Standard Time (IST)</p>
            </div>
        </body>
        </html>
        """
        
        logger.info(f"📧 [EMAIL DISPATCHED] Exam credentials email dispatched for candidate {student_name} (email={email}, exam_code={exam_code}, username={username})")
        self._send_smtp_email(email, subject, html_content)

    def send_exam_reminder_15min_email(
        self, 
        student_name: str, 
        email: str, 
        exam_name: str, 
        exam_code: str, 
        username: str, 
        password: str,
        start_time_str: Union[datetime, str]
    ):
        """Dispatches an automated 15-minute pre-exam schedule reminder email."""
        exam_link = f"{settings.FRONTEND_URL}/exam/{exam_code}"
        subject = f"⏰ 15-Minute Exam Reminder — {exam_name}"
        
        display_start = format_ist_datetime(start_time_str) if isinstance(start_time_str, datetime) or "T" in str(start_time_str) else str(start_time_str)
        if not display_start.endswith("IST"):
            display_start = f"{display_start} IST"
            
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #FAF7F2; padding: 20px; color: #1C1917;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 30px; border: 1px solid #E7E0D3;">
                <span style="background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A; padding: 4px 12px; border-radius: 99px; font-size: 11px; font-weight: bold; text-transform: uppercase;">Upcoming Exam Starting Soon</span>
                <h2 style="color: #9A3412; margin-top: 10px;">Your Exam Begins in 15 Minutes</h2>
                <p>Hello <b>{student_name}</b>,</p>
                <p>This is an automated schedule reminder that your examination <b>{exam_name}</b> (Code: <b style="color: #9A3412;">{exam_code}</b>) is starting at <b>{display_start}</b>.</p>
                
                <div style="background-color: #FBF9F5; border: 1px solid #E7E0D3; border-radius: 12px; padding: 20px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><b>Session Username:</b> <span style="color: #9A3412; font-family: monospace; font-size: 16px;">{username}</span></p>
                    <p style="margin: 5px 0;"><b>Passcode / PIN:</b> <span style="color: #047857; font-family: monospace; font-size: 16px; background: #ECFDF5; padding: 2px 8px; border-radius: 4px;">{password}</span></p>
                </div>
                
                <p>Click below to join the waiting room countdown:</p>
                <p><a href="{exam_link}" style="display: inline-block; background: #9A3412; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: bold;">Open Live Exam Gateway</a></p>
                
                <hr style="border: none; border-top: 1px solid #E7E0D3; margin-top: 30px;" />
                <p style="font-size: 11px; color: #78716C;">Testora Quiz Proctoring Portal • Scheduled Window Notification • All Times in Indian Standard Time (IST)</p>
            </div>
        </body>
        </html>
        """
        
        logger.info(f"⏰ [REMINDER SENT] 15-min reminder sent to {student_name} (email={email}) for exam {exam_code}")
        self._send_smtp_email(email, subject, html_content)


    def send_support_ticket_confirmation(
        self,
        name: str,
        user_email: str,
        ticket_code: str,
        subject: str,
        category: str,
        priority: str,
        message: str,
        reference_code: str = ""
    ):
        """Dispatches support ticket confirmation to the user and alert to DPRAMP Tech Solutions support desk."""
        user_subject = f"[DPRAMP Support] Ticket Received: {ticket_code} — {subject}"
        ref_row = f'<tr><td style="padding: 6px 0; color: #64748B; font-weight: 600;">Exam / Reference:</td><td style="padding: 6px 0; color: #1E293B;">{reference_code}</td></tr>' if reference_code else ''
        
        user_html = f"""<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 24px; color: #0F172A;">
  <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
    <div style="background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%); padding: 28px; text-align: left;">
      <div style="display: inline-block; background: rgba(255,255,255,0.15); color: #FFFFFF; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 4px 10px; border-radius: 9999px; margin-bottom: 8px;">
        DPRAMP Tech Solutions • Official Support Desk
      </div>
      <h1 style="color: #FFFFFF; margin: 0 0 6px 0; font-size: 22px; font-weight: 700;">We Have Received Your Ticket</h1>
      <p style="color: #DBEAFE; margin: 0; font-size: 14px;">Ticket Reference: <strong style="color: #FFFFFF;">{ticket_code}</strong></p>
    </div>

    <div style="padding: 28px;">
      <p style="font-size: 15px; line-height: 1.6; margin-top: 0;">Dear <strong>{name}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6; color: #334155;">
        Thank you for contacting <strong>DPRAMP Tech Solutions</strong>. We have logged your request into our customer support queue. Our dedicated technical support specialists will review your issue and respond directly to this email shortly.
      </p>

      <div style="background: #F1F5F9; border-radius: 12px; border: 1px solid #E2E8F0; padding: 18px 20px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #64748B; font-weight: 600; width: 35%;">Ticket Code:</td>
            <td style="padding: 6px 0; color: #1E293B; font-weight: 700; font-family: monospace;">{ticket_code}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748B; font-weight: 600;">Category:</td>
            <td style="padding: 6px 0; color: #1E293B;">{category}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748B; font-weight: 600;">Priority:</td>
            <td style="padding: 6px 0; color: #2563EB; font-weight: 600;">{priority}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748B; font-weight: 600;">Registered Email:</td>
            <td style="padding: 6px 0; color: #1E293B;">{user_email}</td>
          </tr>
          {ref_row}
          <tr>
            <td style="padding: 6px 0; color: #64748B; font-weight: 600; vertical-align: top;">Subject:</td>
            <td style="padding: 6px 0; color: #1E293B; font-weight: 600;">{subject}</td>
          </tr>
        </table>
      </div>

      <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
        <div style="font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; margin-bottom: 6px;">Message Details:</div>
        <p style="font-size: 13px; color: #334155; line-height: 1.6; margin: 0; white-space: pre-wrap;">{message}</p>
      </div>

      <p style="font-size: 13px; color: #64748B; line-height: 1.6;">
        If you have any urgent attachments or updates, you can reply directly to this email or reach our support helpline at <a href="mailto:support@dpramp.com" style="color: #2563EB; text-decoration: none; font-weight: 600;">support@dpramp.com</a>.
      </p>

      <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;" />

      <div>
        <div style="font-weight: 700; color: #0F172A; font-size: 13px;">DPRAMP Tech Solutions</div>
        <div style="color: #64748B; font-size: 11px; margin-top: 2px;">AI-Powered Assessment & Educational Infrastructure</div>
        <div style="color: #64748B; font-size: 11px;">Support Desk: support@dpramp.com • Hours: Mon–Sat, 9:00 AM – 8:00 PM IST</div>
      </div>
    </div>
  </div>
</body>
</html>"""

        admin_subject = f"🚨 [DPRAMP TICKET {ticket_code}] {name} ({user_email}) — {subject}"
        ref_admin_p = f"<p><strong>Exam/Ref Code:</strong> {reference_code}</p>" if reference_code else ""
        
        admin_html = f"""<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F1F5F9; padding: 20px; color: #0F172A;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #CBD5E1;">
    <div style="border-bottom: 2px solid #E2E8F0; padding-bottom: 12px; margin-bottom: 16px;">
      <span style="background: #DC2626; color: #ffffff; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">NEW SUPPORT TICKET</span>
      <h2 style="margin: 8px 0 0 0; color: #0F172A;">Ticket: {ticket_code}</h2>
      <p style="margin: 4px 0 0 0; color: #64748B; font-size: 13px;">DPRAMP Tech Solutions Customer Support Dispatch</p>
    </div>
    
    <p><strong>Customer Name:</strong> {name}</p>
    <p><strong>Registered Email:</strong> <a href="mailto:{user_email}">{user_email}</a></p>
    <p><strong>Category:</strong> {category}</p>
    <p><strong>Priority:</strong> {priority}</p>
    {ref_admin_p}
    <p><strong>Subject:</strong> {subject}</p>
    
    <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px; margin: 16px 0;">
      <strong>User Inquiry:</strong>
      <p style="margin-top: 6px; white-space: pre-wrap; color: #334155;">{message}</p>
    </div>
    
    <p style="font-size: 12px; color: #64748B;">To respond to this customer, reply to: <a href="mailto:{user_email}">{user_email}</a></p>
  </div>
</body>
</html>"""

        # 1. Send confirmation to user
        logger.info(f"📨 Sending ticket confirmation for {ticket_code} to user {user_email}")
        self._send_smtp_email(user_email, user_subject, user_html)

        # 2. Send dispatch alert to company support
        company_recipients = ["support@dpramp.com"]
        if user_email and "shaharerohit47@gmail.com" not in company_recipients and user_email != "shaharerohit47@gmail.com":
            company_recipients.append("shaharerohit47@gmail.com")

        for comp_email in company_recipients:
            logger.info(f"🏢 Sending support alert for {ticket_code} to company support {comp_email}")
            self._send_smtp_email(comp_email, admin_subject, admin_html)

    def send_institutional_applicant_confirmation(self, req: dict) -> bool:
        """Sends confirmation email to the institutional applicant."""
        to_email = req.get("email")
        if not to_email:
            return False

        applicant_name = req.get("full_name", "Applicant")
        inst_name = req.get("institution_name", "Your Institution")
        ref_id = req.get("reference_id", "REQ-INST")
        vouchers = req.get("vouchers_requested", 1)
        credits_per_voucher = req.get("credits_per_voucher", 10000)
        total_credits = vouchers * credits_per_voucher

        subject = "Institutional Plan Request Received — Testora Quiz"
        html = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Institutional Plan Request Received</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 24px; color: #0F172A;">
  <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
    <div style="background: linear-gradient(135deg, #0A2E7A 0%, #1765F5 100%); padding: 32px 28px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Testora<span style="color: #93C5FD;">Quiz</span></h1>
      <p style="margin: 8px 0 0 0; font-size: 13px; color: #BFDBFE; font-weight: 500;">Academic & College Solutions Program</p>
    </div>

    <div style="padding: 32px 28px;">
      <div style="display: inline-block; padding: 4px 12px; background: #EEF5FF; border: 1px solid #BFDBFE; border-radius: 999px; font-size: 12px; font-weight: bold; color: #1765F5; margin-bottom: 16px;">
        Request Reference: {ref_id}
      </div>

      <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #0F172A;">Institutional Plan Application Received</h2>
      <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
        Dear <strong>{applicant_name}</strong>,<br><br>
        Thank you for submitting an Institutional Plan &amp; Faculty Grant Proposal request for <strong>{inst_name}</strong>. Your application has been logged into our central portal and is currently <strong>Under Review</strong> by the Testora Quiz Super Admin team.
      </p>

      <div style="background: #F1F5F9; border-radius: 12px; padding: 20px; border: 1px solid #E2E8F0; margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: #0F172A; text-transform: uppercase; letter-spacing: 0.5px;">Application Summary</h3>
        <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748B; width: 45%;"><strong>Reference ID:</strong></td>
            <td style="padding: 6px 0; color: #0F172A; font-family: monospace; font-weight: bold;">{ref_id}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748B;"><strong>Institution Name:</strong></td>
            <td style="padding: 6px 0; color: #0F172A; font-weight: 600;">{inst_name}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748B;"><strong>Requested Faculty Vouchers:</strong></td>
            <td style="padding: 6px 0; color: #0F172A; font-weight: 600;">{vouchers} Vouchers</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748B;"><strong>Credits per Voucher:</strong></td>
            <td style="padding: 6px 0; color: #059669; font-weight: bold;">{credits_per_voucher:,} Credits</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748B;"><strong>Total Allocation Volume:</strong></td>
            <td style="padding: 6px 0; color: #1765F5; font-weight: bold;">{total_credits:,} Question Credits</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748B;"><strong>Application Status:</strong></td>
            <td style="padding: 6px 0;"><span style="background: #FEF3C7; color: #92400E; padding: 2px 8px; border-radius: 6px; font-weight: bold; font-size: 11px;">Pending Review</span></td>
          </tr>
        </table>
      </div>

      <div style="background: #EFF6FF; border-left: 4px solid #1765F5; padding: 14px 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
        <h4 style="margin: 0 0 6px 0; font-size: 13px; color: #1E40AF; font-weight: 700;">What happens next?</h4>
        <p style="margin: 0; font-size: 13px; color: #1E3A8A; line-height: 1.5;">
          Our Institutional Onboarding Team will evaluate your department requirements and verify institutional email domain eligibility. A senior representative will reach out directly to your registered email and mobile number regarding customized institutional pricing and implementation timelines.
        </p>
      </div>

      <p style="margin: 0; font-size: 13px; color: #64748B; line-height: 1.6;">
        For any immediate questions, feel free to reply to this email or contact our institutional desk at <a href="mailto:contact@testoraquiz.com" style="color: #1765F5; text-decoration: none; font-weight: 600;">contact@testoraquiz.com</a> with your reference ID <strong>{ref_id}</strong>.
      </p>
    </div>

    <div style="background: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 20px 28px; text-align: center; font-size: 11px; color: #94A3B8;">
      &copy; 2026 Testora Quiz. Dedicated AI Assessment Engine &amp; Academic Testing Infrastructure.
    </div>
  </div>
</body>
</html>"""
        logger.info(f"📨 Transmitting institutional applicant confirmation for {ref_id} to {to_email}")
        return bool(self._send_smtp_email(to_email, subject, html))

    def send_institutional_admin_notification(self, req: dict, admin_email: str) -> bool:
        """Sends new institutional plan application notification to the Super Administrator."""
        if not admin_email:
            return False

        applicant_name = req.get("full_name", "N/A")
        email = req.get("email", "N/A")
        phone = req.get("phone", "N/A")
        designation = req.get("designation", "N/A")
        inst_name = req.get("institution_name", "N/A")
        inst_type = req.get("institution_type", "N/A")
        website = req.get("website_url") or "Not provided"
        state = req.get("state", "N/A")
        city = req.get("city", "N/A")
        depts = req.get("department_count", 1)
        faculty = req.get("faculty_count", 0)
        students = req.get("student_count", 0)
        vouchers = req.get("vouchers_requested", 1)
        ref_id = req.get("reference_id", "REQ-INST")
        req_id = req.get("id", "")
        features = req.get("selected_features", [])
        notes = req.get("additional_notes") or "None"
        created_at = req.get("created_at") or now_utc().strftime("%Y-%m-%d %H:%M:%S UTC")

        features_html = "".join([f"<li style='margin-bottom: 4px;'>{f}</li>" for f in features]) if features else "<li>Standard Suite</li>"

        admin_link = f"{settings.FRONTEND_URL}/admin/institutional-requests?id={req_id}"

        subject = f"New Institutional Plan Request — [{inst_name}]"
        html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F1F5F9; padding: 24px; color: #0F172A;">
  <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 14px; padding: 28px; border: 1px solid #CBD5E1; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <div style="border-bottom: 2px solid #E2E8F0; padding-bottom: 16px; margin-bottom: 20px;">
      <span style="background: #1E3A8A; color: #ffffff; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; text-transform: uppercase;">SUPER ADMIN DISPATCH</span>
      <h2 style="margin: 10px 0 0 0; color: #0F172A; font-size: 20px;">New Institutional Proposal Request: {inst_name}</h2>
      <p style="margin: 4px 0 0 0; color: #64748B; font-size: 13px;">Reference ID: <strong>{ref_id}</strong> &bull; Submitted: {created_at}</p>
    </div>

    <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px;">
      <tr style="background: #F8FAFC;"><td style="padding: 8px; font-weight: bold; width: 35%;">Applicant Name:</td><td style="padding: 8px;">{applicant_name} ({designation})</td></tr>
      <tr><td style="padding: 8px; font-weight: bold;">Official Email:</td><td style="padding: 8px;"><a href="mailto:{email}" style="color: #1765F5;">{email}</a></td></tr>
      <tr style="background: #F8FAFC;"><td style="padding: 8px; font-weight: bold;">Mobile / Phone:</td><td style="padding: 8px;"><a href="tel:{phone}" style="color: #1765F5;">{phone}</a></td></tr>
      <tr><td style="padding: 8px; font-weight: bold;">Institution:</td><td style="padding: 8px;"><strong>{inst_name}</strong> ({inst_type})</td></tr>
      <tr style="background: #F8FAFC;"><td style="padding: 8px; font-weight: bold;">Website:</td><td style="padding: 8px;">{website}</td></tr>
      <tr><td style="padding: 8px; font-weight: bold;">Location:</td><td style="padding: 8px;">{city}, {state}</td></tr>
      <tr style="background: #F8FAFC;"><td style="padding: 8px; font-weight: bold;">Departments / Faculty:</td><td style="padding: 8px;">{depts} Depts &bull; ~{faculty} Faculty Members</td></tr>
      <tr><td style="padding: 8px; font-weight: bold;">Estimated Students:</td><td style="padding: 8px;">~{students} Active Students</td></tr>
      <tr style="background: #F8FAFC;"><td style="padding: 8px; font-weight: bold; color: #1765F5;">Requested Vouchers:</td><td style="padding: 8px; font-weight: bold; color: #1765F5;">{vouchers} Vouchers (10,000 Credits each)</td></tr>
    </table>

    <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px; margin-bottom: 20px;">
      <strong style="font-size: 13px; color: #0F172A;">Required Capabilities Selected:</strong>
      <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 13px; color: #334155;">
        {features_html}
      </ul>
    </div>

    <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px; margin-bottom: 24px;">
      <strong style="font-size: 13px; color: #0F172A;">Additional Applicant Message / Notes:</strong>
      <p style="margin: 6px 0 0 0; font-size: 13px; color: #334155; white-space: pre-wrap;">{notes}</p>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="{admin_link}" style="display: inline-block; background: #1765F5; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 14px; padding: 12px 24px; border-radius: 10px; box-shadow: 0 2px 8px rgba(23,101,245,0.3);">
        Review in Super Admin Control Center &rarr;
      </a>
    </div>
  </div>
</body>
</html>"""
        logger.info(f"🏢 Transmitting institutional admin alert for {ref_id} to {admin_email}")
        return bool(self._send_smtp_email(admin_email, subject, html))


    def send_feedback_confirmation_email(self, to_email: str, applicant_name: str, ref_code: str, subject_text: str, category: str):
        """Sends confirmation receipt to user who submitted feedback."""
        subject = "Thank You for Your Feedback — Testora Quiz"
        frontend_url = getattr(settings, "FRONTEND_URL", "https://testora.quiz")
        
        html = f"""<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; padding: 24px; color: #1E293B;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #E2E8F0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px; border-bottom: 1px solid #F1F5F9; padding-bottom: 16px;">
      <div style="background: linear-gradient(135deg, #2563EB, #1D4ED8); color: #ffffff; padding: 8px 14px; border-radius: 10px; font-weight: 900; font-size: 16px;">
        Testora Quiz
      </div>
      <span style="font-size: 12px; color: #64748B; font-weight: 600;">User Experience & Feedback</span>
    </div>

    <h2 style="font-size: 20px; font-weight: 800; color: #0F172A; margin: 0 0 12px 0;">
      Thank You for Your Feedback!
    </h2>
    <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">
      Dear <strong>{applicant_name}</strong>,<br><br>
      We have successfully received your feedback regarding <strong>{subject_text or category}</strong>. Your insights and suggestions help us make Testora Quiz smarter, safer, and easier to use for educators and students worldwide.
    </p>

    <div style="background: #F1F5F9; border-radius: 12px; padding: 18px; margin-bottom: 24px; border-left: 4px solid #2563EB;">
      <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748B; letter-spacing: 0.5px;">Your Reference ID</div>
      <div style="font-size: 18px; font-family: monospace; font-weight: 800; color: #1D4ED8; margin-top: 4px;">{ref_code}</div>
      <div style="font-size: 12px; color: #64748B; margin-top: 6px;">Category: <strong>{category}</strong></div>
    </div>

    <p style="font-size: 13px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
      Our product, engineering, and academic support teams review every submission carefully. If you reported a problem or requested assistance, our team will investigate and reach out if further details are needed.
    </p>

    <div style="border-top: 1px solid #F1F5F9; padding-top: 18px; font-size: 12px; color: #94A3B8; text-align: center;">
      Testora Quiz &bull; AI-Powered Assessment Platform &bull; <a href="{frontend_url}" style="color: #2563EB; text-decoration: none;">Visit Website</a>
    </div>
  </div>
</body>
</html>"""
        try:
            return bool(self._send_smtp_email(to_email, subject, html))
        except Exception as e:
            logger.warning(f"Failed to transmit feedback confirmation email to {to_email}: {e}")
            return False

    def send_feedback_admin_alert_email(
        self,
        admin_email: str,
        ref_code: str,
        applicant_name: str,
        applicant_email: str,
        user_type: str,
        category: str,
        rating: Optional[int],
        subject_text: str,
        message: str,
        screenshot_url: Optional[str] = None
    ):
        """Sends alert notification to Super Admin regarding new incoming feedback."""
        subject = f"New Feedback Received — Testora Quiz [{ref_code}]"
        frontend_url = getattr(settings, "FRONTEND_URL", "https://testora.quiz")
        admin_link = f"{frontend_url}/admin/feedback"

        rating_stars = f"{rating} / 5 Stars" if rating else "Not Rated"
        screenshot_html = ""
        if screenshot_url:
            full_img_url = screenshot_url if screenshot_url.startswith("http") else f"{frontend_url}{screenshot_url}"
            screenshot_html = f"""
            <tr style="background: #F8FAFC;">
              <td style="padding: 10px; font-weight: bold;">Screenshot:</td>
              <td style="padding: 10px;"><a href="{full_img_url}" target="_blank" style="color: #2563EB; font-weight: bold;">View Attached Screenshot &rarr;</a></td>
            </tr>"""

        html = f"""<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; padding: 24px; color: #1E293B;">
  <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #E2E8F0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; border-bottom: 1px solid #F1F5F9; padding-bottom: 16px;">
      <div style="background: #0F172A; color: #ffffff; padding: 8px 14px; border-radius: 10px; font-weight: 900; font-size: 15px;">
        Testora Admin Alert
      </div>
      <span style="font-size: 13px; font-family: monospace; font-weight: 800; color: #2563EB;">{ref_code}</span>
    </div>

    <h2 style="font-size: 18px; font-weight: 800; color: #0F172A; margin: 0 0 16px 0;">
      New User Feedback Received
    </h2>

    <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px;">
      <tr style="background: #F8FAFC;"><td style="padding: 10px; font-weight: bold; width: 30%;">Submitter:</td><td style="padding: 10px;">{applicant_name} ({user_type})</td></tr>
      <tr><td style="padding: 10px; font-weight: bold;">Email:</td><td style="padding: 10px;"><a href="mailto:{applicant_email}" style="color: #2563EB;">{applicant_email}</a></td></tr>
      <tr style="background: #F8FAFC;"><td style="padding: 10px; font-weight: bold;">Category:</td><td style="padding: 10px;"><strong>{category}</strong></td></tr>
      <tr><td style="padding: 10px; font-weight: bold;">Rating:</td><td style="padding: 10px;">{rating_stars}</td></tr>
      <tr style="background: #F8FAFC;"><td style="padding: 10px; font-weight: bold;">Subject:</td><td style="padding: 10px;"><strong>{subject_text or '—'}</strong></td></tr>
      {screenshot_html}
    </table>

    <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 16px; margin-bottom: 24px;">
      <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #64748B; margin-bottom: 6px;">Feedback Message:</div>
      <div style="font-size: 13px; color: #334155; line-height: 1.6; white-space: pre-wrap;">{message}</div>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="{admin_link}" style="display: inline-block; background: #2563EB; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 14px; padding: 12px 24px; border-radius: 10px; box-shadow: 0 2px 8px rgba(37,99,235,0.3);">
        Open in Super Admin Control Center &rarr;
      </a>
    </div>
  </div>
</body>
</html>"""
        try:
            return bool(self._send_smtp_email(admin_email, subject, html))
        except Exception as e:
            logger.warning(f"Failed to transmit feedback admin alert to {admin_email}: {e}")
            return False

email_service = EmailService()
