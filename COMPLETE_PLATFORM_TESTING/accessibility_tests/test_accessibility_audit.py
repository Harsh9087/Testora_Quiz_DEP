import os
import re
import pytest

FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "frontend")

def test_form_inputs_have_associated_labels_or_aria():
    """Verify that inputs have aria-label, placeholder, or associated label elements."""
    login_path = os.path.join(FRONTEND_DIR, "app", "login", "page.tsx")
    assert os.path.exists(login_path), "login page.tsx must exist"
    with open(login_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Verify input elements have either placeholder or aria-label or preceding label
    input_matches = re.findall(r'<input\b[^>]*>', content)
    assert len(input_matches) > 0
    for imp in input_matches:
        has_accessible_name = any(attr in imp for attr in ["placeholder=", "aria-label=", "title=", "type=\"checkbox\""])
        assert has_accessible_name, f"Input missing accessible identifier: {imp}"

def test_images_have_alt_attributes():
    """Verify all <img> tags across core pages define alt attributes for screen readers."""
    core_pages = [
        os.path.join(FRONTEND_DIR, "app", "login", "page.tsx"),
        os.path.join(FRONTEND_DIR, "app", "page.tsx"),
        os.path.join(FRONTEND_DIR, "app", "portal", "page.tsx")
    ]
    for page in core_pages:
        if not os.path.exists(page):
            continue
        with open(page, "r", encoding="utf-8") as f:
            content = f.read()
        img_tags = re.findall(r'<img\b[^>]*>', content)
        for img in img_tags:
            assert "alt=" in img, f"Image missing alt attribute in {page}: {img}"
