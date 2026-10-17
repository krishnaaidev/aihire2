import pytest
from app.services.answer_evaluator import AnswerEvaluator
from app.services.scoring_engine import ScoringEngine

def test_heuristic_answer_evaluator():
    question = "How do you handle database connection pooling in FastAPI?"
    answer = "In FastAPI with SQLAlchemy, we configure an asynchronous engine with a pool_size and max_overflow. Because requests are concurrent, having connection pooling prevents exhausting database connections and reduces connection latency under high throughput."
    key_points = ["connection pooling", "concurrency", "performance"]

    eval_res = AnswerEvaluator.evaluate_heuristic(question, answer, key_points)
    
    assert eval_res["composite_score"] >= 70.0
    assert eval_res["relevance_score"] >= 60.0
    assert eval_res["completeness_score"] >= 60.0
    assert len(eval_res["feedback"]) > 10

def test_scoring_engine_weights():
    category_scores = {
        "technical": 90.0,
        "problem_solving": 80.0,
        "communication": 85.0,
        "role_relevance": 90.0,
        "behavioral": 75.0
    }
    # Default weights: 40% tech, 20% ps, 15% comm, 15% role, 10% beh
    # 90*0.4 + 80*0.2 + 85*0.15 + 90*0.15 + 75*0.1 = 36 + 16 + 12.75 + 13.5 + 7.5 = 85.75
    overall = ScoringEngine.calculate_overall_score(category_scores)
    assert abs(overall - 85.8) < 0.2
