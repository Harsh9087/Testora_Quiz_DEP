from sqlalchemy import Column, String, Integer, Text, Boolean, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.models.base import TimeStampedModel

class MockTestCategory(TimeStampedModel):
    __tablename__ = "mock_test_categories"

    name = Column(String(100), nullable=False, unique=True)
    slug = Column(String(100), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    category_type = Column(String(50), nullable=False, default="school") # "school", "engineering_entrance", "engineering_branch", "competitive", "corporate"
    subcategories_json = Column(Text, nullable=True) # JSON array of strings
    is_active = Column(Boolean, default=True, nullable=False)
    display_order = Column(Integer, default=0, nullable=False)

    tests = relationship("MockTest", back_populates="test_category")


class MockTestType(TimeStampedModel):
    __tablename__ = "mock_test_types"

    name = Column(String(100), nullable=False, unique=True)
    slug = Column(String(100), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    icon = Column(String(50), default="FileText", nullable=False)
    badge_color = Column(String(50), default="blue", nullable=False)
    requires_chapter = Column(Boolean, default=False, nullable=False)
    requires_topic = Column(Boolean, default=False, nullable=False)
    requires_pyq_metadata = Column(Boolean, default=False, nullable=False)
    requires_section = Column(Boolean, default=False, nullable=False)
    is_speed_test = Column(Boolean, default=False, nullable=False)
    is_practice = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    display_order = Column(Integer, default=0, nullable=False)

    tests = relationship("MockTest", back_populates="test_type_rel")


class MockTest(TimeStampedModel):
    __tablename__ = "mock_tests"

    # Category relationship
    category_id = Column(String(36), ForeignKey("mock_test_categories.id"), nullable=True, index=True)
    category = Column(String(100), default="School Examinations", nullable=False) # Category display name
    subcategory = Column(String(100), nullable=True)

    # Test Type Classification
    test_type_id = Column(String(36), ForeignKey("mock_test_types.id"), nullable=True, index=True)
    test_type = Column(String(100), default="Full-Length Mock Test", nullable=False, index=True)

    # Core academic / exam classification (Kept strictly separate)
    class_level = Column(String(50), nullable=True, index=True) # "Class 11", "Class 12", "Engineering", "General"
    subject = Column(String(100), nullable=True, index=True) # "Physics", "Chemistry", "Mathematics", "Computer Science", etc.
    exam_type = Column(String(100), nullable=True, index=True) # "School Board", "JEE Main", "JEE Advanced", "Engineering Branch", "Corporate Placement"
    engineering_branch = Column(String(100), nullable=True) # "CSE", "IT", "Mechanical", "Civil", "ECE", "EEE"

    # Chapter, Topic & Sectional Scope
    chapter = Column(String(150), nullable=True) # For Chapter-Wise, Topic-Wise, Revision
    topic = Column(String(150), nullable=True) # For Topic-Wise
    section_name = Column(String(100), nullable=True) # For Sectional Test (e.g. "Section A: Quantitative", "Section B: Analytical")

    # Previous Year Questions (PYQ) metadata
    pyq_exam_name = Column(String(100), nullable=True) # e.g. "JEE Main 2024", "CBSE Board 2023"
    pyq_year = Column(Integer, nullable=True)
    pyq_shift = Column(String(50), nullable=True) # e.g. "Shift 1", "Shift 2", "Set 1"
    pyq_source = Column(String(255), nullable=True) # e.g. "NTA Official Question Paper"

    # Speed Test & Practice Mode specific
    speed_test_target_time_per_q = Column(Integer, nullable=True) # Target time in seconds
    practice_mode_instant_explanation = Column(Boolean, default=False, nullable=False)

    # Legacy / Corporate placement compatibility
    company_name = Column(String(100), default="Testora Mock", nullable=False, index=True)
    company_slug = Column(String(50), default="testora", nullable=False, index=True)
    company_logo = Column(String(255), nullable=True)

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    difficulty = Column(String(20), default="Medium", nullable=False) # "Easy", "Medium", "Hard", "Mixed"
    language = Column(String(50), default="English", nullable=False)

    # Difficulty Distribution breakdown (e.g. {"Easy": 20, "Medium": 50, "Hard": 30})
    difficulty_distribution_json = Column(Text, nullable=True)

    # Audience Visibility & Access Control
    # "students_only", "teachers_only", "all", "specific_class"
    visibility_target = Column(String(50), default="students_only", nullable=False, index=True)
    target_class = Column(String(50), nullable=True) # For specific_class e.g. "Class 11"

    # Publication status: "draft", "published", "unpublished"
    status = Column(String(50), default="published", nullable=False, index=True)

    # Pricing (0 for free mock tests)
    price_inr = Column(Integer, default=0, nullable=False)
    price_paise = Column(Integer, default=0, nullable=False)
    is_free = Column(Boolean, default=True, nullable=False)

    # Examination Configuration & Independent Marks
    duration_minutes = Column(Integer, default=60, nullable=False)
    total_questions = Column(Integer, default=50, nullable=False)
    total_marks = Column(Float, default=50.0, nullable=False)
    marks_per_question = Column(Float, default=1.0, nullable=False)
    negative_marking = Column(Float, default=0.0, nullable=False) # e.g. 0.5 or 1.0 or 0.0
    passing_marks = Column(Float, default=20.0, nullable=False)
    pass_percentage = Column(Integer, default=40, nullable=False)
    attempt_limit = Column(Integer, default=0, nullable=False) # 0 = unlimited

    instructions = Column(Text, nullable=True)
    questions_json = Column(Text, nullable=True) # JSON array of questions
    display_order = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    attempts_count = Column(Integer, default=0, nullable=False)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=True)

    # Teacher Ownership & Direct Distribution System
    is_platform_library = Column(Boolean, default=True, nullable=False)
    creator_role = Column(String(50), default="super_admin", nullable=False) # "super_admin", "teacher"
    share_token = Column(String(64), unique=True, index=True, nullable=True)
    share_access_type = Column(String(50), default="assigned_only", nullable=False) # "assigned_only", "public_link"
    login_required = Column(Boolean, default=True, nullable=False)
    is_link_active = Column(Boolean, default=True, nullable=False)
    start_time = Column(String(50), nullable=True)
    end_time = Column(String(50), nullable=True)
    results_visibility = Column(String(50), default="immediate", nullable=False) # "immediate", "after_release"
    are_results_released = Column(Boolean, default=True, nullable=False)
    assigned_directories_json = Column(Text, nullable=True) # JSON list of directory IDs
    assigned_students_json = Column(Text, nullable=True) # JSON list of student IDs/emails
    is_archived = Column(Boolean, default=False, nullable=False)

    test_category = relationship("MockTestCategory", back_populates="tests")
    test_type_rel = relationship("MockTestType", back_populates="tests")
    purchases = relationship("MockTestPurchase", back_populates="mock_test", cascade="all, delete-orphan")


class MockTestPurchase(TimeStampedModel):
    __tablename__ = "mock_test_purchases"

    student_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    mock_test_id = Column(String(36), ForeignKey("mock_tests.id"), nullable=False, index=True)

    amount_paid_inr = Column(Integer, default=0, nullable=False)
    amount_paid_paise = Column(Integer, default=0, nullable=False)
    payment_method = Column(String(50), default="FREE", nullable=False) # "FREE", "RAZORPAY", "WALLET_CREDITS"

    razorpay_order_id = Column(String(100), nullable=True, index=True)
    razorpay_payment_id = Column(String(100), nullable=True)
    razorpay_signature = Column(String(255), nullable=True)

    status = Column(String(50), default="unlocked", nullable=False) # "unlocked", "completed"
    score = Column(Float, nullable=True)
    max_score = Column(Float, nullable=True)
    percentage = Column(Float, nullable=True)
    passed = Column(Boolean, nullable=True)

    answers_json = Column(Text, nullable=True) # JSON dict of user answers
    completed_at = Column(String(50), nullable=True)

    # Candidate snapshot & metadata
    student_name = Column(String(150), nullable=True)
    student_email = Column(String(150), nullable=True)
    time_taken_seconds = Column(Integer, nullable=True)
    attempt_number = Column(Integer, default=1, nullable=False)

    mock_test = relationship("MockTest", back_populates="purchases")
    student = relationship("User")


class MockTestAssignment(TimeStampedModel):
    __tablename__ = "mock_test_assignments"

    mock_test_id = Column(String(36), ForeignKey("mock_tests.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_by = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    directory_id = Column(String(36), ForeignKey("student_directories.id"), nullable=True, index=True)
    directory_name = Column(String(150), nullable=True)
    student_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    student_email = Column(String(150), nullable=True)
    student_name = Column(String(150), nullable=True)

    mock_test = relationship("MockTest", backref="assignments")
