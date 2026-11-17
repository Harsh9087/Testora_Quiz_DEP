import sys
import os

# Add the backend directory to python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.email_service import email_service

def test_smtp_connection():
    test_email = input("Enter an email address to send the test email to: ")
    print(f"Attempting to send a test email to {test_email}...")
    
    # We use a dummy reset password email just to verify sending capability
    success = email_service._send_smtp_email(
        to_email=test_email,
        subject="Testora Quiz - SMTP Test Configuration",
        html_content="<h1>SMTP Configured Successfully!</h1><p>Your SMTP credentials in the .env file are working correctly.</p>"
    )
    
    if success:
        print("[SUCCESS] The email was sent successfully. Please check your inbox.")
    else:
        print("[FAILED] Could not send the email. Please check your .env SMTP credentials and terminal logs.")

if __name__ == "__main__":
    test_smtp_connection()
