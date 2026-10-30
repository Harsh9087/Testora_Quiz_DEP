import json
from datetime import datetime
from sqlalchemy import Column, String, Integer, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import TimeStampedModel
from app.utils.timezone import now_utc

class InstitutionalRequest(TimeStampedModel):
    __tablename__ = "institutional_requests"

    # Unique Reference ID (e.g. INST-2026-12345)
    reference_id = Column(String(50), unique=True, index=True, nullable=False)

    # 1. Contact Person Details
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(50), nullable=False)
    designation = Column(String(255), nullable=False)

    # 2. Institution Details
    institution_name = Column(String(255), nullable=False, index=True)
    institution_type = Column(String(100), nullable=False)  # College, University, Coaching Institute, School, Other
    website_url = Column(String(255), nullable=True)
    state = Column(String(100), nullable=False)
    city = Column(String(100), nullable=False)
    department_count = Column(Integer, default=1, nullable=False)
    faculty_count = Column(Integer, default=1, nullable=False)
    student_count = Column(Integer, default=1, nullable=False)

    # 3. Requirement Details
    vouchers_requested = Column(Integer, default=1, nullable=False)
    credits_per_voucher = Column(Integer, default=10000, nullable=False)
    expected_implementation_date = Column(String(100), nullable=True)
    selected_features = Column(Text, nullable=False)  # JSON-encoded array of feature strings
    additional_notes = Column(Text, nullable=True)

    # 4. Status & Review Workflow
    # Statuses: "Pending Review", "Under Review", "Proposal Sent", "Approved", "Rejected", "Closed"
    status = Column(String(50), default="Pending Review", index=True, nullable=False)
    assigned_admin_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    assigned_admin_name = Column(String(255), nullable=True)
    admin_notes = Column(Text, nullable=True)

    # Commercial & Approval Terms
    proposed_pricing = Column(String(100), nullable=True)
    approved_vouchers = Column(Integer, nullable=True)
    negotiated_terms = Column(Text, nullable=True)
    proposal_sent_at = Column(DateTime, nullable=True)
    decision_reason = Column(Text, nullable=True)
    decided_at = Column(DateTime, nullable=True)
    decided_by_id = Column(String(36), nullable=True)
    decided_by_name = Column(String(255), nullable=True)

    # 5. Email Notification Tracking & Retry
    applicant_email_sent = Column(Boolean, default=False, nullable=False)
    admin_email_sent = Column(Boolean, default=False, nullable=False)
    email_delivery_error = Column(Text, nullable=True)

    # 6. Audit & Status History (JSON log of status transitions)
    status_history = Column(Text, nullable=True)

    # 7. Association with Existing Institution (if linked/approved)
    institution_id = Column(String(36), ForeignKey("institutions.id"), nullable=True)

    # Relationships
    assigned_admin = relationship("User", foreign_keys=[assigned_admin_id])
    institution = relationship("Institution", foreign_keys=[institution_id])

    def add_history_entry(self, action: str, actor_name: str, notes: str = None):
        """Appends an event to the JSON status history."""
        try:
            history = json.loads(self.status_history) if self.status_history else []
        except Exception:
            history = []

        history.append({
            "timestamp": now_utc().isoformat(),
            "action": action,
            "actor": actor_name,
            "status": self.status,
            "notes": notes
        })
        self.status_history = json.dumps(history)

    def get_features_list(self) -> list:
        try:
            return json.loads(self.selected_features) if self.selected_features else []
        except Exception:
            return []

