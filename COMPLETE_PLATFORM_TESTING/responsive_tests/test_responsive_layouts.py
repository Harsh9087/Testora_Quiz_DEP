import os
import re
import pytest

FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "frontend")

def test_mobile_input_prevents_ios_auto_zoom():
    """Inputs on mobile must have fontSize 16px to prevent unwanted iOS Safari zooming."""
    feedback_path = os.path.join(FRONTEND_DIR, "components", "FeedbackModal.tsx")
    assert os.path.exists(feedback_path)
    with open(feedback_path, "r", encoding="utf-8") as f:
        content = f.read()
    # Check that style 16px is enforced on inputs
    assert 'fontSize: "16px"' in content or "text-base" in content

def test_mobile_drawer_width_constrained():
    """Mobile navigation drawer must have bounded width to prevent overflowing viewport."""
    page_path = os.path.join(FRONTEND_DIR, "app", "page.tsx")
    assert os.path.exists(page_path)
    with open(page_path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "max-w-[82vw]" in content or "max-w-xs" in content or "w-[300px]" in content

def test_table_dropdown_max_height_and_scroll():
    """Action dropdowns in assessment table must have max height and scroll to avoid laptop screen clipping."""
    table_path = os.path.join(FRONTEND_DIR, "app", "dashboard", "teacher", "_components", "LiveAssessmentsTable.tsx")
    assert os.path.exists(table_path)
    with open(table_path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "max-h-" in content
    assert "overflow-y-auto" in content
