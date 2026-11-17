import pytest

def calculate_score(answers: list, marking_scheme: dict):
    """
    Core score calculation logic:
    marking_scheme = {"correct": 1.0, "negative": 0.25}
    answers = [{"user_answer": "A", "correct_answer": "A"}, ...]
    """
    total_marks = 0.0
    correct_count = 0
    incorrect_count = 0
    unattempted_count = 0

    for ans in answers:
        user_ans = ans.get("user_answer")
        corr_ans = ans.get("correct_answer")
        if not user_ans:
            unattempted_count += 1
            continue
        if user_ans.strip().upper() == corr_ans.strip().upper():
            total_marks += marking_scheme.get("correct", 1.0)
            correct_count += 1
        else:
            total_marks -= marking_scheme.get("negative", 0.0)
            incorrect_count += 1

    return {
        "score": max(0.0, round(total_marks, 2)),
        "correct": correct_count,
        "incorrect": incorrect_count,
        "unattempted": unattempted_count,
        "percentage": round((correct_count / max(1, len(answers))) * 100, 2)
    }

def test_evaluation_all_correct():
    answers = [
        {"user_answer": "A", "correct_answer": "A"},
        {"user_answer": "B", "correct_answer": "B"},
        {"user_answer": "C", "correct_answer": "C"},
    ]
    scheme = {"correct": 2.0, "negative": 0.5}
    res = calculate_score(answers, scheme)
    assert res["score"] == 6.0
    assert res["correct"] == 3
    assert res["incorrect"] == 0
    assert res["percentage"] == 100.0

def test_evaluation_with_negative_marking():
    answers = [
        {"user_answer": "A", "correct_answer": "A"},
        {"user_answer": "C", "correct_answer": "B"}, # incorrect: -0.5
        {"user_answer": None, "correct_answer": "C"}, # unattempted: 0
        {"user_answer": "D", "correct_answer": "D"}, # correct: +2.0
    ]
    scheme = {"correct": 2.0, "negative": 0.5}
    res = calculate_score(answers, scheme)
    assert res["score"] == 3.5
    assert res["correct"] == 2
    assert res["incorrect"] == 1
    assert res["unattempted"] == 1
    assert res["percentage"] == 50.0

def test_evaluation_floor_at_zero():
    answers = [
        {"user_answer": "B", "correct_answer": "A"},
        {"user_answer": "C", "correct_answer": "B"},
    ]
    scheme = {"correct": 1.0, "negative": 1.0}
    res = calculate_score(answers, scheme)
    assert res["score"] == 0.0 # Score must never be negative
    assert res["incorrect"] == 2
