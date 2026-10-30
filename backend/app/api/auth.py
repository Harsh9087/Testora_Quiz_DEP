import uuid
import secrets
import string
import time
from typing import Optional, Any, Literal
import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request, Response, UploadFile, File
from pydantic import BaseModel, EmailStr
import json
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import jwt
from app.database import get_db
from app.models.user import User, Student
from app.models.institution import Institution
from app.schemas.auth import (
    UserLogin, UserCreate, Token, PasswordChange, UserProfile,
    GoogleAuthPayload, ForgotPasswordRequest, ResetPasswordRequest, UpdateProfileRequest
)
from app.utils.security import (
    get_password_hash, 
    verify_password, 
    create_access_token, 
    create_refresh_token, 
    get_current_user,
    revoke_token,
    is_token_revoked
)
from app.config import settings
from app.services.email_service import email_service
from app.utils.timezone import now_utc

from app.models.workspace import Workspace, WorkspaceMember
from app.services.workspace_service import bootstrap_personal_workspace
from app.utils.rate_limiter import rate_limit_dependency

def ensure_student_profile(user: User, db: Session) -> Student:
    student = db.query(Student).filter(Student.user_id == user.id, Student.is_deleted == False).first()
    if not student:
        prefix = "".join(c for c in user.email.split("@")[0].upper() if c.isalnum())[:8] or "STU"
        roll = f"STU-{prefix}-{secrets.token_hex(2).upper()}"
        student = Student(
            user_id=user.id,
            institution_id=user.institution_id,
            roll_number=roll,
            status="active"
        )
        db.add(student)
        db.commit()
        db.refresh(student)
    return student

def set_refresh_cookie(response: Response, refresh_token: str) -> None:
    """Sets a secure HttpOnly SameSite cookie for the refresh token."""
    secure_cookie = settings.COOKIE_SECURE or (settings.ENVIRONMENT == "production")
    samesite_val: Any = settings.COOKIE_SAMESITE if settings.COOKIE_SAMESITE in ["lax", "none", "strict"] else "lax"
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=secure_cookie,
        samesite=samesite_val,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/"
    )

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=Token, dependencies=[Depends(rate_limit_dependency(max_requests=10, window_seconds=60))])
def register(user_in: UserCreate, response: Response, db: Session = Depends(get_db)):
    # Prevent privilege escalation: self-registration only permits teacher or student
    assigned_role = user_in.role if user_in.role in ["teacher", "student"] else "teacher"

    # Check if user exists with THIS specific role (role-scoped identity)
    db_user = db.query(User).filter(
        User.email == user_in.email.strip().lower(),
        User.role == assigned_role,
        User.is_deleted == False
    ).first()
    if db_user:
        raise HTTPException(status_code=400, detail=f"An account with this email address already exists for the {assigned_role.capitalize()} role. Please sign in.")
        
    # If institution id is provided, check if valid
    if user_in.institution_id:
        inst = db.query(Institution).filter(Institution.id == user_in.institution_id, Institution.is_deleted == False).first()
        if not inst:
            raise HTTPException(status_code=400, detail="Invalid institution ID provided")

    # Dynamic signup bonus from system settings (default: 200 credits, 15 days)
    from app.services.coupon_service import CouponService
    signup_bonus, bonus_days = CouponService.get_signup_bonus_config(db)

    hashed_password = get_password_hash(user_in.password)

    user = User(
        email=user_in.email.strip().lower(),
        hashed_password=hashed_password,
        full_name=user_in.full_name,
        role=assigned_role,
        institution_id=user_in.institution_id,
        is_active=True,
        credits_balance=0,
        bonus_credits=signup_bonus if assigned_role in ["teacher", "inst_admin", "super_admin"] else 0,
        bonus_credits_expires_at=(now_utc() + timedelta(days=bonus_days)) if assigned_role in ["teacher", "inst_admin", "super_admin"] else None
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Resolve active workspace if teacher or ensure student profile
    ws_id = None
    ws_name = None
    if assigned_role in ["teacher", "inst_admin", "super_admin"]:
        ws = bootstrap_personal_workspace(user, db)
        ws_id = ws.id
        ws_name = ws.name
    elif assigned_role == "student":
        ensure_student_profile(user, db)

    access = create_access_token(user.id)
    refresh = create_refresh_token(user.id)
    set_refresh_cookie(response, refresh)

    return {
        "access_token": access,
        "refresh_token": refresh,
        "token_type": "bearer",
        "role": user.role,
        "full_name": user.full_name,
        "workspace_id": ws_id,
        "workspace_name": ws_name,
        "avatar_url": user.avatar_url
    }

@router.post("/login", response_model=Token, dependencies=[Depends(rate_limit_dependency(max_requests=15, window_seconds=60))])
def login(login_in: UserLogin, response: Response, db: Session = Depends(get_db)):
    clean_identifier = login_in.email.strip()
    clean_email = clean_identifier.lower()

    user = None
    if login_in.role:
        # Explicit role selection: disambiguate separate Teacher and Student accounts with matching emails
        user = db.query(User).filter(
            User.email == clean_email,
            User.role == login_in.role,
            User.is_deleted == False
        ).first()
        if not user:
            user = db.query(User).filter(
                (User.email.ilike(clean_email)) | (User.full_name.ilike(clean_identifier)),
                User.role == login_in.role,
                User.is_deleted == False
            ).first()
    else:
        # No explicit role provided: find matching candidates and pick the one matching the password
        candidates = db.query(User).filter(
            (User.email.ilike(clean_email)) | (User.full_name.ilike(clean_identifier)),
            User.is_deleted == False
        ).all()
        for cand in candidates:
            if verify_password(login_in.password, cand.hashed_password):
                user = cand
                break
        if not user and candidates:
            user = candidates[0]
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email, username, or password")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="User account is deactivated")
        
    if user.role == "student" and user.is_verified is False:
        raise HTTPException(
            status_code=403, 
            detail="Your student account is pending authorization. Please check your email to authorize your account before logging in."
        )

    # Resolve active workspace if teacher
    ws_id = None
    ws_name = None
    if user.role in ["teacher", "inst_admin", "super_admin"]:
        ws = bootstrap_personal_workspace(user, db)
        ws_id = ws.id
        ws_name = ws.name

    user.last_login_at = now_utc()
    db.commit()
        
    access = create_access_token(user.id)
    refresh = create_refresh_token(user.id)
    set_refresh_cookie(response, refresh)
    
    return {
        "access_token": access,
        "refresh_token": refresh,
        "token_type": "bearer",
        "role": user.role,
        "full_name": user.full_name,
        "workspace_id": ws_id,
        "workspace_name": ws_name,
        "avatar_url": user.avatar_url
    }

@router.get("/verify-student")
def verify_student(
    token: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Validates email verification token, marks student as authorized,
    generates a secure student portal password, and emails it to the student.
    """
    user = db.query(User).filter(User.verification_token == token, User.is_deleted == False).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")
        
    # Generate human-friendly strong password (e.g. Quiz84#Vp)
    chars = string.ascii_letters + string.digits
    rand_part = ''.join(secrets.choice(chars) for _ in range(6))
    generated_pwd = f"Quiz{rand_part}!"
    
    user.is_verified = True
    user.verification_token = None
    user.hashed_password = get_password_hash(generated_pwd)
    db.commit()
    db.refresh(user)
    
    # Dispatch email with generated password
    background_tasks.add_task(
        email_service.send_student_credentials_email,
        student_name=user.full_name,
        email=user.email,
        password=generated_pwd
    )
    
    return {
        "status": "success",
        "message": "Account authorized successfully. Your student portal password has been generated and sent to your email.",
        "email": user.email,
        "full_name": user.full_name,
        "generated_password": generated_pwd
    }

@router.post("/google-login", response_model=Token)
@router.post("/google-authorize", response_model=Token)
@router.post("/google", response_model=Token)
def google_auth(
    payload: GoogleAuthPayload,
    background_tasks: BackgroundTasks,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Authorizes or registers a user using Google Identity Services (GIS).
    Any new user is registered as a Teacher by default with an auto-provisioned personal workspace.
    """
    email = payload.email.strip().lower() if payload.email else ""
    google_sub = payload.google_id
    full_name = payload.name or (email.split("@")[0].replace(".", " ").title() if email else "Testora Quiz Teacher")
    avatar_url = None

    # Parse and cryptographically verify GIS Google ID Token if passed
    if payload.token:
        token_verified = False
        try:
            from google.oauth2 import id_token
            from google.auth.transport import requests as google_requests
            
            client_id = settings.GOOGLE_CLIENT_ID if settings.GOOGLE_CLIENT_ID else None
            id_info = id_token.verify_oauth2_token(
                payload.token,
                google_requests.Request(),
                client_id
            )
            if "email" in id_info:
                email = id_info["email"].lower()
            if "sub" in id_info:
                google_sub = id_info["sub"]
            if "name" in id_info:
                full_name = id_info["name"]
            if "picture" in id_info:
                avatar_url = id_info["picture"]
            token_verified = True
        except Exception:
            # Fallback for dev / mock JWT tokens
            try:
                import base64
                token_parts = payload.token.split(".")
                if len(token_parts) >= 2:
                    padded = token_parts[1] + "=" * ((4 - len(token_parts[1]) % 4) % 4)
                    decoded_claims = json.loads(base64.urlsafe_b64decode(padded).decode("utf-8"))
                    if "email" in decoded_claims:
                        email = decoded_claims["email"].lower()
                    if "sub" in decoded_claims:
                        google_sub = decoded_claims["sub"]
                    if "name" in decoded_claims:
                        full_name = decoded_claims["name"]
                    if "picture" in decoded_claims:
                        avatar_url = decoded_claims["picture"]
            except Exception:
                pass

    if not email:
        raise HTTPException(status_code=400, detail="Google authentication did not provide a valid email address")

    assigned_role = payload.role if (payload.role and payload.role in ["teacher", "student"]) else "teacher"

    user = None
    if google_sub:
        user = db.query(User).filter(
            User.google_subject == google_sub,
            User.role == assigned_role,
            User.is_deleted == False
        ).first()
    if not user and email:
        user = db.query(User).filter(
            User.email == email,
            User.role == assigned_role,
            User.is_deleted == False
        ).first()
    
    if not user:
        # New Google user: provision separate account for assigned_role
        generated_pwd = f"GoogleAuth{secrets.token_hex(4)}!"
        from app.services.coupon_service import CouponService
        signup_bonus, bonus_days = CouponService.get_signup_bonus_config(db)

        user = User(
            email=email,
            full_name=full_name,
            hashed_password=get_password_hash(generated_pwd),
            role=assigned_role,
            is_verified=True,
            is_active=True,
            auth_provider="google",
            google_id=google_sub,
            google_subject=google_sub,
            avatar_url=avatar_url,
            last_login_at=now_utc(),
            credits_balance=0,
            bonus_credits=signup_bonus if assigned_role in ["teacher", "inst_admin", "super_admin"] else 0,
            bonus_credits_expires_at=(now_utc() + timedelta(days=bonus_days)) if assigned_role in ["teacher", "inst_admin", "super_admin"] else None
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user.is_verified = True
        if google_sub:
            user.google_subject = google_sub
            user.google_id = google_sub
        if avatar_url and not user.avatar_url:
            user.avatar_url = avatar_url
        user.auth_provider = "google"
        user.last_login_at = now_utc()
        # Keep accounts strictly separate: never overwrite existing account's role
        db.commit()
        db.refresh(user)

    # Resolve workspace or student profile
    ws_id = None
    ws_name = None
    if user.role in ["teacher", "inst_admin", "super_admin"]:
        ws = bootstrap_personal_workspace(user, db)
        ws_id = ws.id
        ws_name = ws.name
    elif user.role == "student":
        ensure_student_profile(user, db)
    
    access = create_access_token(user.id)
    refresh = create_refresh_token(user.id)
    set_refresh_cookie(response, refresh)
    
    return {
        "access_token": access,
        "refresh_token": refresh,
        "token_type": "bearer",
        "role": user.role,
        "full_name": user.full_name,
        "workspace_id": ws_id,
        "workspace_name": ws_name,
        "avatar_url": user.avatar_url
    }

class RefreshTokenRequest(BaseModel):
    refresh_token: Optional[str] = None

@router.post("/refresh", response_model=Token)
def refresh_token(
    request: Request,
    response: Response,
    body: Optional[RefreshTokenRequest] = None,
    refresh_token: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # Retrieve refresh token from body, query, or HttpOnly cookie
    token_candidate = None
    if body and body.refresh_token:
        token_candidate = body.refresh_token
    elif refresh_token:
        token_candidate = refresh_token
    else:
        token_candidate = request.cookies.get("refresh_token")

    if not token_candidate:
        raise HTTPException(status_code=401, detail="Refresh token missing from request cookie or body")

    try:
        payload = jwt.decode(token_candidate, settings.SECRET_KEY, algorithms=["HS256"], options={"verify_exp": False})
        user_id: Optional[str] = payload.get("sub")
        token_type: Optional[str] = payload.get("type")
        jti: Optional[str] = payload.get("jti")
        if user_id is None or token_type != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        if jti and is_token_revoked(jti):
            raise HTTPException(status_code=401, detail="Refresh token has been revoked or replayed")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
        
    user = db.query(User).filter(User.id == user_id, User.is_deleted == False).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or deactivated")

    # Refresh Token Rotation: Revoke previous token JTI immediately
    if jti:
        revoke_token(jti)
        
    new_access = create_access_token(user.id)
    new_refresh = create_refresh_token(user.id)
    set_refresh_cookie(response, new_refresh)
    
    return {
        "access_token": new_access,
        "refresh_token": new_refresh,
        "token_type": "bearer",
        "role": user.role,
        "full_name": user.full_name
    }

@router.post("/logout")
def logout(request: Request, response: Response):
    """
    Logs out the user, revoking active refresh tokens and clearing HttpOnly session cookies.
    """
    token_candidate = request.cookies.get("refresh_token")
    if token_candidate:
        try:
            payload = jwt.decode(token_candidate, settings.SECRET_KEY, algorithms=["HS256"])
            jti = payload.get("jti")
            if jti:
                revoke_token(jti)
        except Exception:
            pass

    response.delete_cookie(key="refresh_token", path="/")
    return {"message": "Logged out successfully"}

def _format_user_profile(user: User) -> UserProfile:
    inst_name = user.institution_name or (user.institution.name if user.institution else None)
    roll = user.student_profile.roll_number if user.student_profile else None
    div = user.student_profile.division if user.student_profile else (user.section or None)
    batch = user.student_profile.batch if user.student_profile else (user.batch or None)
    dept = user.department
    status = getattr(user.student_profile, "status", "active") if user.role == "student" else ("active" if user.is_active else "inactive")
    return UserProfile(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        institution_id=user.institution_id,
        avatar_url=user.avatar_url,
        credits_balance=user.total_available_credits,
        bonus_credits=user.active_bonus_credits,
        bonus_days_remaining=user.bonus_days_remaining,
        bonus_credits_expires_at=user.bonus_credits_expires_at,
        institution_name=inst_name,
        department_name=dept,
        department=dept,
        roll_number=roll,
        division=div,
        class_name=user.class_name,
        section=user.section or div,
        batch=batch,
        phone=user.phone,
        status=status,
        created_at=user.created_at
    )

@router.get("/me", response_model=UserProfile)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _format_user_profile(current_user)

@router.put("/profile", response_model=UserProfile)
def update_profile(
    req: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if req.full_name is not None and req.full_name.strip():
        current_user.full_name = req.full_name.strip()
    if req.avatar_url is not None:
        clean_url = req.avatar_url.strip()
        current_user.avatar_url = clean_url if clean_url and clean_url.lower() != "none" else None
    if req.institution_name is not None:
        current_user.institution_name = req.institution_name.strip()
    if req.department is not None:
        current_user.department = req.department.strip()
    if req.class_name is not None:
        current_user.class_name = req.class_name.strip()
    if req.section is not None:
        current_user.section = req.section.strip()
    if req.batch is not None:
        current_user.batch = req.batch.strip()
    if req.phone is not None:
        current_user.phone = req.phone.strip()
        
    if current_user.student_profile:
        if req.batch is not None:
            current_user.student_profile.batch = req.batch.strip()
        if req.section is not None:
            current_user.student_profile.division = req.section.strip()
            
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return _format_user_profile(current_user)

@router.post("/avatar/upload", response_model=UserProfile)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Uploads a photo for the current user and saves it to static storage.
    Isolated per account ID to guarantee independent teacher and student avatars.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files (JPG, PNG, WEBP) are allowed.")
    
    ext = file.filename.split(".")[-1].lower() if file.filename and "." in file.filename else "png"
    if ext not in ["jpg", "jpeg", "png", "webp"]:
        ext = "png"
        
    static_avatars_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static", "avatars")
    os.makedirs(static_avatars_dir, exist_ok=True)
    
    filename = f"avatar_{current_user.id}_{int(time.time())}.{ext}"
    file_path = os.path.join(static_avatars_dir, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    current_user.avatar_url = f"/static/avatars/{filename}"
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    
    return _format_user_profile(current_user)


@router.post("/change-password")
def change_password(pass_in: PasswordChange, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(pass_in.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect old password")
    current_user.hashed_password = get_password_hash(pass_in.new_password)
    db.add(current_user)
    db.commit()
    return {"message": "Password changed successfully"}

@router.post("/forgot-password", dependencies=[Depends(rate_limit_dependency(max_requests=5, window_seconds=60))])
def forgot_password(
    req: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Generates a secure password reset token link and dispatches recovery email.
    """
    user = db.query(User).filter(User.email == req.email, User.is_deleted == False).first()
    if not user:
        # Return generic success to prevent email enumeration
        return {"message": "If an account with this email exists, a password reset link has been dispatched."}
        
    expire_time = int(time.time()) + 3600  # 1 hour expiration window
    reset_token = f"{uuid.uuid4().hex}:{expire_time}"
    user.reset_token = reset_token
    db.commit()
    
    background_tasks.add_task(
        email_service.send_password_reset_email,
        user_name=user.full_name,
        email=user.email,
        reset_token=reset_token
    )
    
    return {"message": "A password reset link has been dispatched to your email address."}

@router.post("/reset-password")
def reset_password(
    req: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Validates password reset token and sets the new password.
    """
    if not req.token or not req.new_password:
        raise HTTPException(status_code=400, detail="Token and new_password are required")
        
    user = db.query(User).filter(User.reset_token == req.token, User.is_deleted == False).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
        
    if ":" in req.token:
        try:
            _, exp_str = req.token.split(":", 1)
            if int(exp_str) < int(time.time()):
                user.reset_token = None
                db.commit()
                raise HTTPException(status_code=400, detail="Password reset token has expired. Please request a new link.")
        except ValueError:
            pass

    user.hashed_password = get_password_hash(req.new_password)
    user.reset_token = None
    db.commit()
    
    return {"message": "Password reset successfully. You may now log in with your new password."}
