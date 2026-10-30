from sqlalchemy import Column, String, ForeignKey, Boolean, DateTime, Integer, UniqueConstraint
from sqlalchemy.orm import relationship
from app.models.base import TimeStampedModel

class User(TimeStampedModel):
    __tablename__ = "users"
    __table_args__ = (
        UniqueConstraint("email", "role", name="uq_users_email_role"),
        UniqueConstraint("google_subject", "role", name="uq_users_google_subject_role"),
    )
    
    email = Column(String(255), index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)  # "super_admin", "inst_admin", "teacher", "student"
    institution_id = Column(String(36), ForeignKey("institutions.id"), nullable=True)
    institution_name = Column(String(255), nullable=True)
    department = Column(String(255), nullable=True)
    class_name = Column(String(100), nullable=True)
    section = Column(String(50), nullable=True)
    batch = Column(String(100), nullable=True)
    phone = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=True)
    verification_token = Column(String(255), nullable=True)
    auth_provider = Column(String(50), default="local") # "local", "google"
    google_id = Column(String(255), nullable=True)
    google_subject = Column(String(255), index=True, nullable=True)
    avatar_url = Column(String(500), nullable=True)
    last_login_at = Column(DateTime, nullable=True)
    reset_token = Column(String(255), nullable=True)
    credits_balance = Column(Integer, default=0, nullable=False)
    bonus_credits = Column(Integer, default=500, nullable=False)
    bonus_credits_expires_at = Column(DateTime, nullable=True)

    @property
    def active_bonus_credits(self) -> int:
        if not self.bonus_credits or self.bonus_credits <= 0:
            return 0
        if self.bonus_credits_expires_at:
            from app.utils.timezone import now_utc
            now = now_utc()
            exp = self.bonus_credits_expires_at
            if exp.tzinfo is None:
                exp = exp.replace(tzinfo=now.tzinfo)
            if now > exp:
                return 0
        return self.bonus_credits

    @property
    def total_available_credits(self) -> int:
        return (self.credits_balance or 0) + self.active_bonus_credits

    @property
    def bonus_days_remaining(self) -> int:
        if not self.bonus_credits_expires_at or self.active_bonus_credits <= 0:
            return 0
        from app.utils.timezone import now_utc
        now = now_utc()
        exp = self.bonus_credits_expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=now.tzinfo)
        diff = (exp - now).total_seconds()
        if diff <= 0:
            return 0
        import math
        return math.ceil(diff / 86400)
    
    institution = relationship("Institution", back_populates="users")
    student_profile = relationship("Student", back_populates="user", uselist=False, cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="uploader")
    audit_logs = relationship("AuditLog", back_populates="user")
    owned_workspaces = relationship("Workspace", back_populates="owner", foreign_keys="Workspace.owner_id")
    workspace_memberships = relationship("WorkspaceMember", back_populates="user", cascade="all, delete-orphan")

class Student(TimeStampedModel):
    __tablename__ = "students"
    
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    institution_id = Column(String(36), ForeignKey("institutions.id"), nullable=True)
    roll_number = Column(String(100), nullable=False)
    department_id = Column(String(36), ForeignKey("departments.id"), nullable=True)
    division = Column(String(50), nullable=True)
    batch = Column(String(100), nullable=True)
    admission_year = Column(String(10), nullable=True)
    status = Column(String(50), default="active")  # "active", "inactive", "suspended"
    
    user = relationship("User", back_populates="student_profile")
    institution = relationship("Institution")
    cohort_memberships = relationship("StudentCohortMembership", back_populates="student", cascade="all, delete-orphan")
    subject_enrollments = relationship("StudentSubjectEnrollment", back_populates="student", cascade="all, delete-orphan")
