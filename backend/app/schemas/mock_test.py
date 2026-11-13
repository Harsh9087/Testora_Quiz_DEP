from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# Category Schemas
class MockTestCategoryBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    category_type: str = "school" # "school", "engineering_entrance", "engineering_branch", "competitive", "corporate"
    subcategories: List[str] = []
    is_active: bool = True
    display_order: int = 0

class MockTestCategoryCreate(BaseModel):
    name: str
    slug: Optional[str] = None
    description: Optional[str] = None
    category_type: str = "school"
    subcategories: List[str] = []
    is_active: bool = True
    display_order: int = 0

class MockTestCategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    category_type: Optional[str] = None
    subcategories: Optional[List[str]] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None

class MockTestCategoryResponse(MockTestCategoryBase):
    id: str
    created_at: Optional[Any] = None
    updated_at: Optional[Any] = None
    tests_count: int = 0

    class Config:
        from_attributes = True


# Test Type Schemas (Scalable Test Type Classification)
class MockTestTypeBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    icon: str = "FileText"
    badge_color: str = "blue"
    requires_chapter: bool = False
    requires_topic: bool = False
    requires_pyq_metadata: bool = False
    requires_section: bool = False
    is_speed_test: bool = False
    is_practice: bool = False
    is_active: bool = True
    display_order: int = 0

class MockTestTypeCreate(BaseModel):
    name: str
    slug: Optional[str] = None
    description: Optional[str] = None
    icon: str = "FileText"
    badge_color: str = "blue"
    requires_chapter: bool = False
    requires_topic: bool = False
    requires_pyq_metadata: bool = False
    requires_section: bool = False
    is_speed_test: bool = False
    is_practice: bool = False
    is_active: bool = True
    display_order: int = 0

class MockTestTypeUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    badge_color: Optional[str] = None
    requires_chapter: Optional[bool] = None
    requires_topic: Optional[bool] = None
    requires_pyq_metadata: Optional[bool] = None
    requires_section: Optional[bool] = None
    is_speed_test: Optional[bool] = None
    is_practice: Optional[bool] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None

class MockTestTypeResponse(MockTestTypeBase):
    id: str
    created_at: Optional[Any] = None
    updated_at: Optional[Any] = None
    tests_count: int = 0

    class Config:
        from_attributes = True


# Question Schemas
class MockQuestion(BaseModel):
    id: str
    question: str
    options: List[str]
    question_type: Optional[str] = "single_choice" # single_choice, multiple_choice, true_false, numerical, match_following, assertion_reason, comprehension, diagram_based
    domain: Optional[str] = None
    subject: Optional[str] = None
    chapter: Optional[str] = None
    topic: Optional[str] = None
    difficulty: Optional[str] = "Medium" # "Easy", "Medium", "Hard"
    marks: Optional[float] = 1.0
    negative_marks: Optional[float] = 0.0

    # Diagram & Media Support
    image_url: Optional[str] = None
    image_caption: Optional[str] = None
    image_alt: Optional[str] = None
    diagram_type: Optional[str] = None # circuit, optics, geometry, graph, chemistry, engineering, table, general
    diagram_position: Optional[str] = "below_question" # above_question, below_question
    media_attachments: Optional[List[Dict[str, Any]]] = None

    # Source Attribution & Authenticity
    source_details: Optional[Dict[str, Any]] = None

    # Specialized question data
    passage: Optional[str] = None
    numerical_tolerance: Optional[float] = None

class MockQuestionWithAnswer(MockQuestion):
    correct_answer: str
    correct_answers: Optional[List[str]] = None
    explanation: Optional[str] = None
    explanation_image_url: Optional[str] = None


# Mock Test Summary & Detail
class MockTestSummary(BaseModel):
    id: str
    category_id: Optional[str] = None
    category: str = "School Examinations"
    subcategory: Optional[str] = None

    test_type_id: Optional[str] = None
    test_type: str = "Full-Length Mock Test"

    class_level: Optional[str] = None
    subject: Optional[str] = None
    exam_type: Optional[str] = None
    engineering_branch: Optional[str] = None

    chapter: Optional[str] = None
    topic: Optional[str] = None
    section_name: Optional[str] = None

    pyq_exam_name: Optional[str] = None
    pyq_year: Optional[int] = None
    pyq_shift: Optional[str] = None
    pyq_source: Optional[str] = None

    speed_test_target_time_per_q: Optional[int] = None
    practice_mode_instant_explanation: bool = False

    company_name: str
    company_slug: str
    company_logo: Optional[str] = None
    title: str
    description: Optional[str] = None
    difficulty: str
    language: str = "English"

    difficulty_distribution: Optional[Dict[str, float]] = None

    visibility_target: str = "students_only"
    target_class: Optional[str] = None
    target_section: Optional[str] = "mock_test_library"
    status: str = "published"

    price_inr: int = 0
    price_paise: int = 0
    is_free: bool = True

    duration_minutes: int = 60
    total_questions: int = 50
    total_marks: float = 50.0
    marks_per_question: float = 1.0
    negative_marking: float = 0.0
    passing_marks: float = 20.0
    pass_percentage: int = 40
    attempt_limit: int = 0

    attempts_count: int = 0
    display_order: int = 0
    is_active: bool = True
    is_unlocked: bool = False
    has_attempted: bool = False
    last_score: Optional[float] = None
    last_percentage: Optional[float] = None
    last_passed: Optional[bool] = None
    created_at: Optional[Any] = None
    updated_at: Optional[Any] = None

    # Teacher Ownership & Direct Distribution fields
    created_by: Optional[str] = None
    creator_name: Optional[str] = None
    creator_role: Optional[str] = "super_admin"
    is_platform_library: bool = True
    share_token: Optional[str] = None
    share_access_type: str = "assigned_only"
    login_required: bool = True
    is_link_active: bool = True
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    results_visibility: str = "immediate"
    are_results_released: bool = True
    assigned_directories_count: int = 0
    assigned_students_count: int = 0
    is_archived: bool = False

class MockTestDetail(MockTestSummary):
    instructions: Optional[str] = None
    questions: List[MockQuestion] = []


class MockTestCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category_id: Optional[str] = None
    category: str = "School Examinations"
    subcategory: Optional[str] = None

    test_type_id: Optional[str] = None
    test_type: str = "Full-Length Mock Test"

    class_level: Optional[str] = None
    subject: Optional[str] = None
    exam_type: Optional[str] = None
    engineering_branch: Optional[str] = None

    chapter: Optional[str] = None
    topic: Optional[str] = None
    section_name: Optional[str] = None

    pyq_exam_name: Optional[str] = None
    pyq_year: Optional[int] = None
    pyq_shift: Optional[str] = None
    pyq_source: Optional[str] = None

    speed_test_target_time_per_q: Optional[int] = None
    practice_mode_instant_explanation: bool = False

    difficulty: str = "Medium"
    language: str = "English"

    company_name: Optional[str] = "Testora Mock"
    company_slug: Optional[str] = None
    company_logo: Optional[str] = None

    visibility_target: str = "students_only"
    target_class: Optional[str] = None
    target_section: Optional[str] = "mock_test_library"
    status: str = "published"

    price_inr: int = 0
    duration_minutes: int = 60
    total_questions: int = 50
    total_marks: float = 50.0
    marks_per_question: float = 1.0
    negative_marking: float = 0.0
    passing_marks: float = 20.0
    pass_percentage: int = 40
    attempt_limit: int = 0

    instructions: Optional[str] = None
    questions: List[Dict[str, Any]] = []
    is_active: bool = True


class MockTestUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None

    test_type_id: Optional[str] = None
    test_type: Optional[str] = None

    class_level: Optional[str] = None
    subject: Optional[str] = None
    exam_type: Optional[str] = None
    engineering_branch: Optional[str] = None

    chapter: Optional[str] = None
    topic: Optional[str] = None
    section_name: Optional[str] = None

    pyq_exam_name: Optional[str] = None
    pyq_year: Optional[int] = None
    pyq_shift: Optional[str] = None
    pyq_source: Optional[str] = None

    speed_test_target_time_per_q: Optional[int] = None
    practice_mode_instant_explanation: Optional[bool] = None

    difficulty: Optional[str] = None
    language: Optional[str] = None

    company_name: Optional[str] = None
    company_slug: Optional[str] = None
    company_logo: Optional[str] = None

    visibility_target: Optional[str] = None
    target_class: Optional[str] = None
    target_section: Optional[str] = None
    status: Optional[str] = None

    price_inr: Optional[int] = None
    duration_minutes: Optional[int] = None
    total_questions: Optional[int] = None
    total_marks: Optional[float] = None
    marks_per_question: Optional[float] = None
    negative_marking: Optional[float] = None
    passing_marks: Optional[float] = None
    pass_percentage: Optional[int] = None
    attempt_limit: Optional[int] = None

    instructions: Optional[str] = None
    questions: Optional[List[Dict[str, Any]]] = None
    is_active: Optional[bool] = None


class MockTestOrderResponse(BaseModel):
    order_id: str
    amount: int
    currency: str
    key_id: str
    test_id: str
    test_title: str
    company_name: str
    price_inr: int

class MockTestVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

class MockTestStartPayload(BaseModel):
    student_name: Optional[str] = None
    student_email: Optional[str] = None


class MockTestSubmitRequest(BaseModel):
    answers: Dict[str, str]

class QuestionReview(BaseModel):
    id: str
    question: str
    options: List[str]
    question_type: Optional[str] = "single_choice"
    image_url: Optional[str] = None
    image_caption: Optional[str] = None
    source_details: Optional[Dict[str, Any]] = None
    selected_answer: Optional[str] = None
    correct_answer: str
    is_correct: bool
    explanation: Optional[str] = None
    marks_obtained: float = 0.0
    negative_marks_deducted: float = 0.0

class MockTestSubmitResult(BaseModel):
    score: float
    max_score: float
    percentage: float
    passed: bool
    correct_count: int
    incorrect_count: int
    unanswered_count: int
    total_negative_marks: float = 0.0
    passing_marks: float = 0.0
    pass_percentage: int = 40
    completed_at: str
    reviews: List[QuestionReview] = []

class CompanyFilterItem(BaseModel):
    name: str
    slug: str
    count: int

class MockTestAdminStats(BaseModel):
    total_tests: int
    published_count: int
    draft_count: int
    hidden_count: int
    total_questions: int
    total_attempts: int


# ══════════════════════════════════════════════════════════════════════════
# Teacher-Created Mock Tests & Direct Sharing System Schemas
# ══════════════════════════════════════════════════════════════════════════

class TeacherMockTestCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = "School Examinations"
    subject: Optional[str] = None
    class_level: Optional[str] = None
    test_type: Optional[str] = "Full-Length Mock Test"
    difficulty: str = "Medium"
    language: str = "English"
    duration_minutes: int = 60
    total_marks: float = 50.0
    negative_marking: float = 0.0
    passing_marks: float = 20.0
    instructions: Optional[str] = None
    questions: List[MockQuestionWithAnswer] = []
    status: str = "draft"
    share_access_type: str = "assigned_only" # "assigned_only" or "public_link"
    login_required: bool = True
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    attempt_limit: int = 1
    results_visibility: str = "immediate" # "immediate" or "after_release"
    assigned_directory_ids: Optional[List[str]] = None
    assigned_student_ids: Optional[List[str]] = None


class TeacherMockTestAssignRequest(BaseModel):
    directory_ids: List[str] = []
    student_ids: List[str] = []
    share_access_type: Optional[str] = "assigned_only"
    login_required: Optional[bool] = True
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    attempt_limit: Optional[int] = 1
    results_visibility: Optional[str] = "immediate"
    send_email_notification: Optional[bool] = False


class MockTestSendEmailRequest(BaseModel):
    directory_ids: List[str] = []
    student_emails: List[str] = []


class MockTestSharePublicDetail(BaseModel):
    id: str
    share_token: str
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    subject: Optional[str] = None
    class_level: Optional[str] = None
    test_type: Optional[str] = None
    difficulty: Optional[str] = "Medium"
    duration_minutes: int
    total_questions: int
    total_marks: float
    negative_marking: float
    passing_marks: float
    instructions: Optional[str] = None
    teacher_name: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    is_expired: bool = False
    is_started: bool = True
    login_required: bool = True
    share_access_type: str = "assigned_only"
    attempt_limit: int = 1
    user_attempts_count: int = 0
    is_eligible: bool = True
    ineligibility_reason: Optional[str] = None
    status: str = "published"


class MockTestResultItem(BaseModel):
    id: str
    student_id: str
    student_name: str
    student_email: Optional[str] = None
    score: float
    max_score: float
    percentage: float
    passed: bool
    completed_at: Optional[str] = None
    time_taken_seconds: Optional[int] = None
    attempt_number: int = 1

