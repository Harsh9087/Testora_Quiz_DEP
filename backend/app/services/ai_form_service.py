import json
import logging
import re
import secrets
from typing import Dict, Any, List, Optional
from app.services.ai_service import AIService

logger = logging.getLogger(__name__)

class AIFormService:
    def __init__(self):
        self.ai = AIService()

    def improve_prompt(self, user_prompt: str, focus: Optional[str] = None) -> Dict[str, Any]:
        """
        Enhances and expands a short or basic user prompt into a rich, detailed, professional prompt
        describing sections, field types (MCQs, rating scales, open text), validation rules, and themes.
        """
        raw = user_prompt.strip()
        if self.ai.enabled:
            try:
                system_instruction = (
                    "You are an expert prompt engineer and form architect. "
                    "The user has provided a prompt or brief idea for a form. "
                    "Enhance and rewrite this prompt into a rich, highly specific, professional specification "
                    "that will guide an AI form generator to produce the best possible form. "
                    "Return ONLY a JSON object with:\n"
                    "- improved_prompt: The expanded, highly detailed description of questions, types, and options\n"
                    "- suggested_title: A catchy, professional title for the form\n"
                    "- suggested_themes: An array of 2-3 theme IDs that would look great (e.g. ['navy_indigo', 'cyber_dark', 'emerald_growth', 'cherry_blossom'])"
                )
                focus_hint = f" Ensure special emphasis on {focus}." if focus else ""
                prompt = f"Original user prompt: \"{raw}\"{focus_hint}\nRewrite and improve this prompt."

                raw_output = self.ai._call_gemini(prompt, system_instruction=system_instruction, json_mode=True)
                cleaned = self.ai._clean_json_str(raw_output)
                parsed = json.loads(cleaned)
                if "improved_prompt" in parsed:
                    return {
                        "improved_prompt": parsed["improved_prompt"],
                        "suggested_title": parsed.get("suggested_title", raw.title()),
                        "suggested_themes": parsed.get("suggested_themes", ["navy_indigo", "aurora_borealis"])
                    }
            except Exception as e:
                logger.warning(f"Error improving prompt via Gemini: {e}")

        # Intelligent heuristic fallback prompt expansion
        p_lower = raw.lower()
        if "workshop" in p_lower or "feedback" in p_lower:
            improved = (
                f"Create a comprehensive feedback form for: {raw}. "
                "Include participant identification (Full Name, Institutional Email), "
                "overall session satisfaction on a 1-5 rating scale, instructor clarity and pacing (Radio choice), "
                "hands-on exercise relevance (Checkbox selection of topics mastered), "
                "and two in-depth open-ended questions: key learnings and suggestions for future masterclasses."
            )
            title = "Comprehensive Workshop & Session Feedback Form"
            themes = ["navy_indigo", "electric_amber", "neo_mint"]
        elif "event" in p_lower or "registration" in p_lower or "hackathon" in p_lower:
            improved = (
                f"Design an official registration portal for: {raw}. "
                "Capture participant full name, contact number, verified email address, college or organization name, "
                "technical domain / track preference (Dropdown: AI/ML, Cloud, Web3, Cybersecurity), "
                "experience level (Beginner, Intermediate, Advanced), GitHub or portfolio link, "
                "and dietary/accommodation preferences."
            )
            title = "Official Event & Competition Registration"
            themes = ["cyber_dark", "cosmic_starlight", "aurora_borealis"]
        elif "survey" in p_lower or "course" in p_lower or "eval" in p_lower:
            improved = (
                f"Generate a rigorous academic evaluation survey for: {raw}. "
                "Include anonymous or named student options, course difficulty scale (1-5), "
                "quality of study resources, lecture presentation effectiveness, "
                "areas where additional tutorial sessions are needed (Multi-select checkbox), "
                "and constructive recommendations for the academic curriculum committee."
            )
            title = "Academic Curriculum & Course Evaluation Survey"
            themes = ["royal_purple", "nordic_frost", "minimal_slate"]
        else:
            improved = (
                f"Create a modern, user-friendly form for: {raw}. "
                "Include respondent profile details (Full Name, Email Address, Contact Phone), "
                "category selection with detailed options, a 5-star rating assessment, "
                "multiple-choice preferences with clear option choices, and a feedback paragraph section."
            )
            title = f"{raw.title()} Form"
            themes = ["sunset_warmth", "deep_ocean", "cherry_blossom"]

        return {
            "improved_prompt": improved,
            "suggested_title": title,
            "suggested_themes": themes
        }

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
