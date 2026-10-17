import math
import re
from typing import List, Dict, Any

class CandidateMatcher:

    @staticmethod
    def _tokenize(text: str) -> List[str]:
        words = re.findall(r'\b[a-zA-Z0-9\+#\.]+\b', text.lower())
        stopwords = {
            "the", "and", "a", "an", "in", "to", "of", "for", "with", "at", "by", "from",
            "is", "are", "was", "were", "be", "been", "on", "that", "this", "it", "as"
        }
        return [w for w in words if w not in stopwords and len(w) > 1]

    @classmethod
    def compute_cosine_similarity(cls, text1: str, text2: str) -> float:
        tokens1 = cls._tokenize(text1)
        tokens2 = cls._tokenize(text2)
        if not tokens1 or not tokens2:
            return 0.0

        vec1 = {}
        for t in tokens1:
            vec1[t] = vec1.get(t, 0) + 1

        vec2 = {}
        for t in tokens2:
            vec2[t] = vec2.get(t, 0) + 1

        common = set(vec1.keys()).intersection(set(vec2.keys()))
        dot_product = sum(vec1[k] * vec2[k] for k in common)

        mag1 = math.sqrt(sum(v ** 2 for v in vec1.values()))
        mag2 = math.sqrt(sum(v ** 2 for v in vec2.values()))

        if mag1 == 0 or mag2 == 0:
            return 0.0

        return dot_product / (mag1 * mag2)

    @classmethod
    def match_candidate_to_job(
        cls,
        candidate_skills: List[str],
        candidate_resume_text: str,
        job_required_skills: List[str],
        job_preferred_skills: List[str],
        job_description_text: str
    ) -> Dict[str, Any]:
        """
        Hybrid Candidate-Job Matcher combining:
        1. Required skills overlap
        2. Preferred skills bonus
        3. Semantic TF-IDF Cosine Similarity of resume and JD texts
        """
        cand_skills_lower = {s.lower() for s in candidate_skills}
        req_skills_lower = {s.lower() for s in job_required_skills}
        pref_skills_lower = {s.lower() for s in job_preferred_skills}

        matched_req = []
        missing_req = []
        for r_skill in job_required_skills:
            if r_skill.lower() in cand_skills_lower or any(r_skill.lower() in s or s in r_skill.lower() for s in cand_skills_lower):
                matched_req.append(r_skill)
            else:
                missing_req.append(r_skill)

        matched_pref = []
        missing_pref = []
        for p_skill in job_preferred_skills:
            if p_skill.lower() in cand_skills_lower or any(p_skill.lower() in s or s in p_skill.lower() for s in cand_skills_lower):
                matched_pref.append(p_skill)
            else:
                missing_pref.append(p_skill)

        # 1. Required skills ratio
        req_score = (len(matched_req) / len(job_required_skills) * 100.0) if job_required_skills else 80.0

        # 2. Preferred skills score
        pref_score = (len(matched_pref) / len(job_preferred_skills) * 100.0) if job_preferred_skills else 50.0

        # 3. Semantic TF-IDF text similarity (0.0 to 1.0 -> 0 to 100)
        semantic_sim = cls.compute_cosine_similarity(candidate_resume_text, job_description_text)
        semantic_score = min(100.0, semantic_sim * 140.0) # scaled for text length

        # Hybrid Weighted Score:
        # 55% Required Skills + 15% Preferred Skills + 30% Semantic Similarity
        hybrid_score = round((0.55 * req_score) + (0.15 * pref_score) + (0.30 * semantic_score), 1)
        hybrid_score = max(5.0, min(100.0, hybrid_score))

        # Categorize fit
        if hybrid_score >= 80.0:
            fit_level = "Excellent Fit"
            recommendation = "Strong candidate profile closely matching core requirements and technical competencies."
        elif hybrid_score >= 65.0:
            fit_level = "Good Fit"
            recommendation = "Solid candidate match with most required skills. Technical interview recommended."
        elif hybrid_score >= 50.0:
            fit_level = "Moderate Fit"
            recommendation = "Candidate demonstrates some relevant skills but has notable gaps in key requirements."
        else:
            fit_level = "Low Fit"
            recommendation = "Candidate lacks several mandatory technical skills required for this role."

        return {
            "match_score": hybrid_score,
            "matched_skills": list(set(matched_req + matched_pref)),
            "missing_skills": missing_req + missing_pref,
            "fit_level": fit_level,
            "recommendation": recommendation,
            "breakdown": {
                "required_skills_coverage": round(req_score, 1),
                "preferred_skills_bonus": round(pref_score, 1),
                "semantic_text_similarity": round(semantic_score, 1)
            }
        }
