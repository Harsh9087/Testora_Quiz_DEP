import pytest
from pydantic import BaseModel, Field, ValidationError
from typing import List, Optional

class OptionSchema(BaseModel):
    id: str
    text: str
    is_correct: bool = False

class QuestionSchema(BaseModel):
    text: str
    options: List[OptionSchema]
    explanation: Optional[str] = None
    difficulty: str = "MEDIUM"
    marks: float = 1.0
    negative_marks: float = 0.0

def test_question_schema_valid():
    q = QuestionSchema(
        text="What is the derivative of $\\sin(x)$ with respect to $x$?",
        options=[
            OptionSchema(id="opt_1", text="$\\cos(x)$", is_correct=True),
            OptionSchema(id="opt_2", text="$-\\cos(x)$", is_correct=False),
            OptionSchema(id="opt_3", text="$\\tan(x)$", is_correct=False),
            OptionSchema(id="opt_4", text="$\\sec^2(x)$", is_correct=False),
        ],
        explanation="By standard calculus rules, d/dx[sin(x)] = cos(x).",
        difficulty="MEDIUM",
        marks=2.0,
        negative_marks=0.5
    )
    assert len(q.options) == 4
    correct_opts = [opt for opt in q.options if opt.is_correct]
    assert len(correct_opts) == 1
    assert correct_opts[0].id == "opt_1"
    assert q.marks == 2.0

def test_question_schema_missing_options():
    with pytest.raises(ValidationError):
        QuestionSchema(
            text="Incomplete Question",
            options="Not a list" # type: ignore
        )
