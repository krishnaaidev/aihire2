import json
from typing import Dict, Any, List
from app.services.scoring_engine import ScoringEngine
from app.services.ai_provider import AIProvider

class ReportGenerator:

    @classmethod
    async def generate_evaluation_report(
        cls,
        candidate_name: str,
        job_title: str,
        skill_match_score: float,
        responses: List[Any],
        custom_weights: Dict[str, float] = None
    ) -> Dict[str, Any]:
        """
        Synthesizes the comprehensive evaluation report specified in Synopsis Section 8.10.
        """
        category_scores = ScoringEngine.calculate_category_scores(responses, skill_match_score)
        overall_score = ScoringEngine.calculate_overall_score(category_scores, custom_weights)
        
        # Interview performance score is average of composite response scores
        interview_scores = [getattr(r, "composite_score", 0.0) for r in responses]
        interview_avg = sum(interview_scores) / len(interview_scores) if interview_scores else 70.0
        interview_score = round(interview_avg, 1)

        # Aggregate strengths, improvements and question analyses
        all_strengths = []
        all_weaknesses = []
        question_analyses = []

        for r in responses:
            q_text = getattr(r.question, "question_text", "Interview Question") if hasattr(r, "question") else "Question"
            q_cat = getattr(r.question, "category", "technical") if hasattr(r, "question") else "technical"
            q_diff = getattr(r.question, "difficulty", "medium") if hasattr(r, "question") else "medium"
            
            question_analyses.append({
                "question": q_text,
                "category": q_cat,
                "difficulty": q_diff,
                "candidate_answer": r.candidate_answer,
                "composite_score": r.composite_score,
                "relevance": r.relevance_score,
                "accuracy": r.accuracy_score,
                "completeness": r.completeness_score,
                "reasoning": r.reasoning_score,
                "communication": r.communication_score,
                "feedback": r.feedback
            })

            try:
                if hasattr(r, "strengths_mentioned") and r.strengths_mentioned:
                    st = json.loads(r.strengths_mentioned)
                    all_strengths.extend(st)
                if hasattr(r, "improvements") and r.improvements:
                    imp = json.loads(r.improvements)
                    all_weaknesses.extend(imp)
            except Exception:
                pass

        # Deduplicate
        unique_strengths = list(dict.fromkeys(all_strengths))
        unique_weaknesses = list(dict.fromkeys(all_weaknesses))

        if not unique_strengths:
            unique_strengths = [
                "Demonstrated good domain understanding across interview categories.",
                "Provided structured answers with clear articulation of technical concepts."
            ]
        if not unique_weaknesses:
            unique_weaknesses = [
                "Could provide more quantified metrics from past system deployments.",
                "Further depth on corner cases and failure modes would strengthen responses."
            ]

        # Recommendation based on overall score
        if overall_score >= 85.0:
            recommendation = "Strong Hire"
            summary_tone = f"{candidate_name} delivered an exceptional performance for the {job_title} role, displaying deep technical mastery and clear architectural reasoning."
        elif overall_score >= 72.0:
            recommendation = "Hire"
            summary_tone = f"{candidate_name} demonstrated solid capabilities suited for the {job_title} position, answering technical and behavioral probes effectively."
        elif overall_score >= 60.0:
            recommendation = "Lean Hire"
            summary_tone = f"{candidate_name} meets foundational expectations for {job_title}, with potential for rapid growth under senior mentorship."
        elif overall_score >= 48.0:
            recommendation = "Consider"
            summary_tone = f"{candidate_name} demonstrated some relevant skills but displayed inconsistent depth in advanced system scenarios."
        else:
            recommendation = "Do Not Hire"
            summary_tone = f"{candidate_name} did not satisfy minimum technical competency thresholds required for the {job_title} role."

        return {
            "skill_match_score": skill_match_score,
            "interview_score": interview_score,
            "overall_score": overall_score,
            "technical_score": category_scores["technical"],
            "problem_solving_score": category_scores["problem_solving"],
            "communication_score": category_scores["communication"],
            "role_relevance_score": category_scores["role_relevance"],
            "behavioral_score": category_scores["behavioral"],
            "strengths": unique_strengths[:5],
            "weaknesses": unique_weaknesses[:5],
            "question_analysis": question_analyses,
            "summary": summary_tone,
            "recommendation": recommendation,
            "decision_status": "Pending"
        }
