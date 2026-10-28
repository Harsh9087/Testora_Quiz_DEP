import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROOT_DIR = os.path.dirname(BASE_DIR)

class Settings(BaseSettings):
    PROJECT_NAME: str = "Testora Quiz - AI Dynamic Examination & Student Management System"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "super-secret-key-change-in-production"
    ENVIRONMENT: str = "development"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 5256000  # 10 years (persistent session until manual logout)
    REFRESH_TOKEN_EXPIRE_DAYS: int = 3650       # 10 years
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: str = "lax"
    
    # Database (defaults to backend/quiz.db via database.py resolver)
    DATABASE_URL: str = "sqlite:///quiz.db"
    
    # Redis Pub/Sub (Required for Multi-Worker WebSocket Sync in Production)
    REDIS_URL: Optional[str] = None
    
    # AI Engine
    GEMINI_API_KEY: str = ""
    
    # Google OAuth / Identity Services
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    
    # Razorpay Payment Gateway
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    RAZORPAY_WEBHOOK_SECRET: Optional[str] = None
    
    # Pricing & Credit Rates (paise integer calculations)
    PRICE_PER_UNIT_PAISE: int = 10  # 10 paise per student-question attempt (₹0.10)
    GST_PERCENTAGE: int = 18        # 18% GST
    CREDIT_PER_UNIT: int = 1        # 1 Credit per student-question attempt
    MIN_ORDER_AMOUNT_PAISE: int = 100 # Razorpay minimum order value is ₹1.00 (100 paise)

    # Configurable Prepaid Credit Recharge Packages
    RECHARGE_PACKAGES: list = [
        {
            "id": "pkg_1000",
            "name": "Starter Recharge",
            "credits": 1000,
            "amount_paise": 9900,
            "formatted_amount": "₹99",
            "rate_per_credit": "₹0.10",
            "popular": False,
            "badge": "Standard",
            "description": "1,000 Credits • Ideal for smaller assessments & quizzes"
        },
        {
            "id": "pkg_2200",
            "name": "Standard Value",
            "credits": 2200,
            "amount_paise": 19900,
            "formatted_amount": "₹199",
            "rate_per_credit": "₹0.09",
            "popular": True,
            "badge": "10% Extra",
            "description": "2,200 Credits • Includes 200 Bonus Credits for regular midterms"
        },
        {
            "id": "pkg_6000",
            "name": "Institutional Power",
            "credits": 6000,
            "amount_paise": 49900,
            "formatted_amount": "₹499",
            "rate_per_credit": "₹0.08",
            "popular": False,
            "badge": "20% Extra",
            "description": "6,000 Credits • Includes 1,000 Bonus Credits for full departments"
        }
    ]
    
    # Storage & Uploads
    STORAGE_PATH: Optional[str] = None
    UPLOAD_DIR: str = os.path.join(BASE_DIR, "uploads")
    KB_UPLOADS_DIR: str = os.path.join(BASE_DIR, "uploads", "kb_documents")
    
    # SMTP Email Configuration
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "aegeusexams@gmail.com"
    SMTP_PASSWORD: str = ""
    EMAILS_FROM_EMAIL: str = "aegeusexams@gmail.com"
    EMAILS_FROM_NAME: str = "Testora Quiz Examination System"
    
    # HTTP Email APIs (Recommended for Render, Heroku, or clouds blocking SMTP ports 465/587)
    RESEND_API_KEY: Optional[str] = None
    SENDGRID_API_KEY: Optional[str] = None
    
    # Allowed CORS origins (comma-separated string or wildcard)
    ALLOWED_ORIGINS: str = "*"
    
    # Frontend Deployment URL for emails & links
    FRONTEND_URL: str = "http://localhost:3000"
    
    model_config = SettingsConfigDict(
        case_sensitive=True,
        extra="ignore",
        env_file=[os.path.join(BASE_DIR, "..", ".env"), ".env"]
    )

settings = Settings()

# Reconcile dynamic STORAGE_PATH if provided by Render / Cloud mount
if settings.STORAGE_PATH:
    settings.UPLOAD_DIR = settings.STORAGE_PATH
    settings.KB_UPLOADS_DIR = os.path.join(settings.STORAGE_PATH, "kb_documents")

# Create upload directories if not exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.KB_UPLOADS_DIR, exist_ok=True)

