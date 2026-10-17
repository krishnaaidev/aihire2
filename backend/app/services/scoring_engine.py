from typing import Dict, List, Any
from app.config import settings

class ScoringEngine:

    @classmethod
    def calculate_category_scores(
        cls,
        responses: List[Any],
        skill_match_score: float
    ) -> Dict[str, float]:
        """
        Groups interview responses by category and calculates aggregate
        scores for each dimension specified in Synopsis Section 8.9:
        - Technical Assessment
        - Problem Solving
        - Communication
        - Role Relevance
        - Behavioral Assessment
        """
        technical_scores = []
        problem_solving_scores = []
        communication_scores = []
        behavioral_scores = []

        for resp in responses:
            cat = getattr(resp.question, "category", "technical") if hasattr(resp, "question") else resp.get("category", "technical")
            score = getattr(resp, "composite_score", 0.0) if hasattr(resp, "composite_score") else resp.get("composite_score", 0.0)
            comm = getattr(resp, "communication_score", 75.0) if hasattr(resp, "communication_score") else resp.get("communication_score", 75.0)
            
            communication_scores.append(comm)

            if cat in ["technical", "conceptual"]:
                technical_scores.append(score)
            elif cat in ["scenario", "project"]:
                problem_solving_scores.append(score)
            elif cat == "behavioral":
                behavioral_scores.append(score)
            else:
                technical_scores.append(score)

        def avg(lst, fallback=70.0):
            return sum(lst) / len(lst) if lst else fallback

        tech_avg = avg(technical_scores)
        ps_avg = avg(problem_solving_scores)
        comm_avg = avg(communication_scores)
        beh_avg = avg(behavioral_scores)

        # Role Relevance is a blend of skill match score and technical score
        role_rel_avg = round((skill_match_score * 0.6) + (tech_avg * 0.4), 1)

        return {
            "technical": round(tech_avg, 1),
            "problem_solving": round(ps_avg, 1),
            "communication": round(comm_avg, 1),
            "role_relevance": round(role_rel_avg, 1),
            "behavioral": round(beh_avg, 1)
        }

    @classmethod
    def calculate_overall_score(
        cls,
        category_scores: Dict[str, float],
        custom_weights: Dict[str, float] = None
    ) -> float:
        """
        Calculates Overall Score using configurable weights:
        Overall Score =
        Technical Assessment × 40%
        + Problem Solving × 20%
        + Communication × 15%
        + Role Relevance × 15%
        + Behavioral Assessment × 10%
        """
        weights = settings.DEFAULT_WEIGHTS.copy()
        if custom_weights:
            # Normalize user weights if they sum to 100 or 1.0
            total_w = sum(custom_weights.values())
            if total_w > 0:
                weights = {k: v / total_w for k, v in custom_weights.items()}

        overall = (
            category_scores.get("technical", 70.0) * weights.get("technical", 0.40) +
            category_scores.get("problem_solving", 70.0) * weights.get("problem_solving", 0.20) +
            category_scores.get("communication", 70.0) * weights.get("communication", 0.15) +
            category_scores.get("role_relevance", 70.0) * weights.get("role_relevance", 0.15) +
            category_scores.get("behavioral", 70.0) * weights.get("behavioral", 0.10)
        )

        return round(min(100.0, max(0.0, overall)), 1)
