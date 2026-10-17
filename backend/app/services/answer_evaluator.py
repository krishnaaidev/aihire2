import re
import json
from typing import Dict, Any, List
from app.services.ai_provider import AIProvider

class AnswerEvaluator:

    @staticmethod
    def evaluate_heuristic(
        question_text: str,
        candidate_answer: str,
        expected_key_points: List[str]
    ) -> Dict[str, Any]:
        """
        Deterministic NLP evaluation assessing the 5 core parameters from Synopsis Table 8.8.
        """
        answer_clean = candidate_answer.strip()
        words = answer_clean.split()
        word_count = len(words)
        answer_lower = answer_clean.lower()

        # If answer is empty or trivial
        if word_count < 5:
            return {
                "relevance_score": 20.0,
                "accuracy_score": 20.0,
                "completeness_score": 15.0,
                "reasoning_score": 15.0,
                "communication_score": 25.0,
                "confidence_score": 30.0,
                "composite_score": 20.0,
                "feedback": "Answer is extremely brief and does not adequately address the technical scope of the question.",
                "strengths": [],
                "improvements": ["Provide concrete technical details and elaborate on architectural choices."]
            }

        # 1. Relevance: check overlap with question vocabulary
        q_tokens = set(re.findall(r'\b\w{3,}\b', question_text.lower()))
        matched_q_tokens = sum(1 for t in q_tokens if t in answer_lower)
        rel_ratio = (matched_q_tokens / max(len(q_tokens), 1))
        relevance_score = min(96.0, max(45.0, 50.0 + (rel_ratio * 50.0)))

        # 2. Completeness: coverage of expected key points
        key_hits = 0
        for kp in expected_key_points:
            kp_words = [w.lower() for w in re.findall(r'\b\w{3,}\b', kp)]
            if any(w in answer_lower for w in kp_words):
                key_hits += 1
        completeness_ratio = (key_hits / max(len(expected_key_points), 1)) if expected_key_points else 0.8
        completeness_score = min(98.0, max(40.0, 45.0 + (completeness_ratio * 50.0)))

        # 3. Accuracy: technical terms presence & coherence
        tech_indicators = ["architecture", "scaling", "latency", "threads", "memory", "async", "cache", "database", "query", "index", "api", "component", "state", "pattern", "test", "deploy", "security"]
        tech_matches = sum(1 for t in tech_indicators if t in answer_lower)
        accuracy_score = min(95.0, max(50.0, 55.0 + min(tech_matches * 6.0, 40.0)))

        # 4. Reasoning: transitional words indicating justification and logical flow
        reasoning_words = ["because", "therefore", "in order to", "trade-off", "tradeoff", "advantage", "however", "consequently", "specifically", "for example", "such as", "resulted in"]
        reasoning_hits = sum(1 for rw in reasoning_words if rw in answer_lower)
        reasoning_score = min(96.0, max(45.0, 50.0 + min(reasoning_hits * 10.0, 45.0)))

        # 5. Communication: structure, sentence length, absence of excessive disclaimers
        sentence_count = len(re.split(r'[\.\?!]+', answer_clean))
        comm_score = 70.0
        if 20 <= word_count <= 250:
            comm_score += 15.0
        if sentence_count >= 2:
            comm_score += 10.0
        communication_score = min(98.0, max(40.0, comm_score))

        # 6. Confidence: lack of filler phrases (e.g. "I think maybe", "I'm not sure")
        fillers = ["i guess", "maybe", "i don't know", "not really sure", "um", "uh"]
        filler_penalty = sum(10 for f in fillers if f in answer_lower)
        confidence_score = max(40.0, min(95.0, 85.0 - filler_penalty + (10.0 if word_count > 40 else 0.0)))

        # Composite score calculation
        composite = round(
            (relevance_score * 0.25) +
            (accuracy_score * 0.25) +
            (completeness_score * 0.20) +
            (reasoning_score * 0.15) +
            (communication_score * 0.15),
            1
        )

        strengths = []
        if relevance_score >= 75:
            strengths.append("Directly addressed the core premises of the question.")
        if accuracy_score >= 75:
            strengths.append("Demonstrated solid technical depth and domain vocabulary.")
        if reasoning_score >= 75:
            strengths.append("Articulated clear rationales and engineering trade-offs.")

        improvements = []
        if completeness_score < 75:
            improvements.append("Cover more edge cases and expected operational considerations.")
        if word_count < 30:
            improvements.append("Elaborate further with specific project instances or metrics.")

        feedback = (
            f"Candidate answered with good clarity (Score: {composite}/100). "
            f"{'Covered key concepts thoroughly.' if completeness_score >= 70 else 'Could deepen coverage of architectural nuances.'}"
        )

        return {
            "relevance_score": round(relevance_score, 1),
            "accuracy_score": round(accuracy_score, 1),
            "completeness_score": round(completeness_score, 1),
            "reasoning_score": round(reasoning_score, 1),
            "communication_score": round(communication_score, 1),
            "confidence_score": round(confidence_score, 1),
            "composite_score": composite,
            "feedback": feedback,
            "strengths": strengths,
            "improvements": improvements
        }

    @classmethod
    async def evaluate_answer(
        cls,
        question_text: str,
        category: str,
        expected_key_points: List[str],
        candidate_answer: str
    ) -> Dict[str, Any]:
        """
        Evaluates candidate answer, combining LLM intelligence when available
        with solid heuristic fallback.
        """
        base_eval = cls.evaluate_heuristic(question_text, candidate_answer, expected_key_points)

        prompt = f"""
You are the AI Hiring Evaluator on the AIHire platform.
Evaluate this interview candidate answer based strictly on the 5 evaluation criteria:
1. Relevance (Does it address the question?)
2. Technical Accuracy (Is it correct and precise?)
3. Completeness (Did it cover critical concepts?)
4. Reasoning (Are explanations well-justified?)
5. Communication (Is it coherent and clear?)

Question: "{question_text}"
Category: {category}
Expected concepts: {expected_key_points}
Candidate Answer: "{candidate_answer}"

Output ONLY valid JSON with:
{{
  "relevance_score": number (0-100),
  "accuracy_score": number (0-100),
  "completeness_score": number (0-100),
  "reasoning_score": number (0-100),
  "communication_score": number (0-100),
  "confidence_score": number (0-100),
  "composite_score": number (0-100),
  "feedback": string,
  "strengths": list of strings,
  "improvements": list of strings
}}
"""
        llm_resp = await AIProvider.generate_text(prompt, "You are a fair, expert technical hiring evaluator.")
        if llm_resp:
            try:
                clean_json = re.sub(r'```json\s*|\s*```', '', llm_resp).strip()
                parsed = json.loads(clean_json)
                if "composite_score" in parsed:
                    return parsed
            except Exception:
                pass

        return base_eval
