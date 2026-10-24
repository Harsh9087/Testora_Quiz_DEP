import json
import logging
import re
import secrets
from typing import Dict, Any, List
from app.services.ai_service import AIService

logger = logging.getLogger(__name__)

class AIFormService:
    def __init__(self):
        self.ai = AIService()

    def generate_form(self, user_prompt: str) -> Dict[str, Any]:
        """
        Synthesizes a structured custom form from a natural-language description using Gemini,
        with intelligent fallback heuristics.
        """
        if self.ai.enabled:
            try:
                system_instruction = (
                    "You are an enterprise UX form design AI. Convert the user's natural language "
                    "request into a structured form definition. "
                    "Return ONLY a valid JSON object with the following exact keys:\n"
                    "- title: Concise, professional title of the form\n"
                    "- description: Helpful 1-2 sentence subtitle or instruction for respondents\n"
                    "- fields: An array of field objects, each having:\n"
                    "    - id: Unique string like 'f_1', 'f_2'\n"
                    "    - label: Clear, professional label / question\n"
                    "    - field_type: One of ['text', 'email', 'phone', 'number', 'textarea', 'select', 'radio', 'checkbox', 'rating']\n"
                    "    - placeholder: Optional helpful input placeholder\n"
                    "    - required: Boolean (true for essential fields like name/email/ratings)\n"
                    "    - options: Array of option strings (for 'select', 'radio', 'checkbox')\n"
                    "    - description: Optional short hint text"
                )

                prompt = (
                    f"User Request: {user_prompt}\n\n"
                    "Create an intuitive, comprehensive form based on the requirements above. "
                    "Include appropriate input types, multiple choice options where relevant, "
                    "and mark essential fields as required."
                )

                raw_output = self.ai._call_gemini(prompt, system_instruction=system_instruction, json_mode=True)
                cleaned = self.ai._clean_json_str(raw_output)
                parsed = json.loads(cleaned)

                if "title" in parsed and "fields" in parsed and isinstance(parsed["fields"], list):
                    # Normalize field ids
                    for idx, f in enumerate(parsed["fields"], start=1):
                        if not f.get("id"):
                            f["id"] = f"f_{idx}"
                        if "required" not in f:
                            f["required"] = True
                        if "options" not in f or not isinstance(f["options"], list):
                            f["options"] = []
                    return parsed
            except Exception as e:
                logger.warning(f"Gemini custom form generation encountered error: {e}. Falling back to heuristic builder.")

        # Heuristic / Template fallback generator based on prompt keywords
        return self._generate_heuristic_form(user_prompt)

    def _generate_heuristic_form(self, prompt: str) -> Dict[str, Any]:
        p_lower = prompt.lower()
        fields: List[Dict[str, Any]] = []

        title = "Feedback & Registration Form"
        description = "Please fill in the information below."

        if "workshop" in p_lower or "feedback" in p_lower:
            title = "Technical Workshop Feedback Form"
            description = "We value your constructive feedback to help us enhance future sessions."
            fields.extend([
                {"id": "f_1", "label": "Full Name", "field_type": "text", "placeholder": "e.g. Alex Morgan", "required": True, "options": []},
                {"id": "f_2", "label": "Email Address", "field_type": "email", "placeholder": "e.g. alex@university.edu", "required": True, "options": []},
                {"id": "f_3", "label": "Overall Workshop Rating", "field_type": "rating", "placeholder": "", "required": True, "options": ["1 - Poor", "2 - Fair", "3 - Good", "4 - Very Good", "5 - Excellent"]},
                {"id": "f_4", "label": "Instructor's Knowledge & Delivery", "field_type": "radio", "placeholder": "", "required": True, "options": ["Exceptional", "Above Average", "Average", "Needs Improvement"]},
                {"id": "f_5", "label": "Pace and Clarity of Content", "field_type": "select", "placeholder": "Select pace", "required": True, "options": ["Just Right", "Too Fast", "Too Slow"]},
                {"id": "f_6", "label": "What topics would you like to see next?", "field_type": "textarea", "placeholder": "Share your suggestions or topics...", "required": False, "options": []}
            ])
        elif "event" in p_lower or "registration" in p_lower or "hackathon" in p_lower:
            title = "Event & Workshop Registration Form"
            description = "Register for upcoming technical events, tracks, and competitions."
            fields.extend([
                {"id": "f_1", "label": "Participant Name", "field_type": "text", "placeholder": "e.g. Priya Sharma", "required": True, "options": []},
                {"id": "f_2", "label": "Email Address", "field_type": "email", "placeholder": "e.g. priya@institute.ac.in", "required": True, "options": []},
                {"id": "f_3", "label": "Contact Number", "field_type": "phone", "placeholder": "+91 9876543210", "required": True, "options": []},
                {"id": "f_4", "label": "College / Organization Name", "field_type": "text", "placeholder": "e.g. MIT School of Engineering", "required": True, "options": []},
                {"id": "f_5", "label": "Event Track Selection", "field_type": "select", "placeholder": "Select track", "required": True, "options": ["AI & Machine Learning", "Full-Stack Web Dev", "Cybersecurity", "Cloud Computing"]},
                {"id": "f_6", "label": "Dietary Preferences", "field_type": "radio", "placeholder": "", "required": False, "options": ["Vegetarian", "Non-Vegetarian", "Vegan", "No Preference"]}
            ])
        elif "survey" in p_lower or "evaluation" in p_lower:
            title = "Academic Evaluation Survey"
            description = "Share your thoughts and ratings on course modules and materials."
            fields.extend([
                {"id": "f_1", "label": "Student Name", "field_type": "text", "placeholder": "Your name (optional)", "required": False, "options": []},
                {"id": "f_2", "label": "Email Address", "field_type": "email", "placeholder": "your.email@university.edu", "required": False, "options": []},
                {"id": "f_3", "label": "Course Difficulty Level", "field_type": "radio", "placeholder": "", "required": True, "options": ["Introductory", "Moderate", "Challenging", "Very Rigorous"]},
                {"id": "f_4", "label": "Quality of Learning Materials", "field_type": "rating", "placeholder": "", "required": True, "options": ["1", "2", "3", "4", "5"]},
                {"id": "f_5", "label": "Key Strengths of this Course", "field_type": "textarea", "placeholder": "What did you enjoy the most?", "required": True, "options": []},
                {"id": "f_6", "label": "Recommended Improvements", "field_type": "textarea", "placeholder": "Suggestions for the next iteration...", "required": False, "options": []}
            ])
        else:
            # General custom form based on user prompt
            words = prompt.strip().split()
            title = " ".join(words[:5]).capitalize()
            if not title.endswith("Form"):
                title += " Form"
            fields.extend([
                {"id": "f_1", "label": "Full Name", "field_type": "text", "placeholder": "Your name", "required": True, "options": []},
                {"id": "f_2", "label": "Email Address", "field_type": "email", "placeholder": "Your email address", "required": True, "options": []},
                {"id": "f_3", "label": "Contact Number", "field_type": "phone", "placeholder": "Your phone number", "required": False, "options": []},
                {"id": "f_4", "label": "Primary Selection / Category", "field_type": "select", "placeholder": "Select an option", "required": True, "options": ["Option A", "Option B", "Option C"]},
                {"id": "f_5", "label": "Additional Notes or Comments", "field_type": "textarea", "placeholder": "Provide details here...", "required": False, "options": []}
            ])

        return {
            "title": title,
            "description": description,
            "fields": fields
        }

ai_form_service = AIFormService()
