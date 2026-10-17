import re
import json
from typing import Dict, Any, List
from app.services.resume_parser import ResumeParser, SKILL_TAXONOMY
from app.services.ai_provider import AIProvider

class JobAnalyzer:

    @staticmethod
    def extract_requirements_heuristic(text: str) -> Dict[str, Any]:
        text_lower = text.lower()
        
        # Skills
        found_skills = ResumeParser.parse_skills(text)
        
        # Experience detection
        exp_match = re.search(r'(\d+[\+]?\s*(?:-\s*\d+)?\s*(?:years|yrs|year|yr))', text, re.IGNORECASE)
        experience = exp_match.group(0) if exp_match else "2+ years"

        # Education detection
        edu_match = re.search(r'(Bachelor[\'s]?|Master[\'s]?|B\.Tech|B\.E\.|BSc|MSc|Ph\.D)[^\n,\.]*', text, re.IGNORECASE)
        education = edu_match.group(0).strip() if edu_match else "Bachelor's in Computer Science or related field"

        # Split skills into required and preferred
        if len(found_skills) > 4:
            req_skills = found_skills[:int(len(found_skills) * 0.7)]
            pref_skills = found_skills[int(len(found_skills) * 0.7):]
        else:
            req_skills = found_skills
            pref_skills = []

        return {
            "required_skills": req_skills,
            "preferred_skills": pref_skills,
            "experience": experience,
            "education": education,
            "responsibilities": text[:300]
        }

    @classmethod
    async def analyze_job_description(cls, raw_text: str) -> Dict[str, Any]:
        heuristic_res = cls.extract_requirements_heuristic(raw_text)

        # Optional LLM refinement
        prompt = f"""
Analyze this job description text and return a valid JSON object with:
- "title": string (inferred job title)
- "department": string
- "required_skills": list of core mandatory technical skills
- "preferred_skills": list of nice-to-have skills
- "experience": string (e.g., "3-5 years")
- "education": string
- "responsibilities": string summary of core responsibilities

Job Description:
{raw_text[:2000]}
"""
        llm_response = await AIProvider.generate_text(prompt, "You are an HR Tech AI assistant.")
        if llm_response:
            try:
                clean_json = re.sub(r'```json\s*|\s*```', '', llm_response).strip()
                parsed = json.loads(clean_json)
                return {
                    "title": parsed.get("title", "Software Engineer"),
                    "department": parsed.get("department", "Engineering"),
                    "required_skills": parsed.get("required_skills", heuristic_res["required_skills"]),
                    "preferred_skills": parsed.get("preferred_skills", heuristic_res["preferred_skills"]),
                    "experience": parsed.get("experience", heuristic_res["experience"]),
                    "education": parsed.get("education", heuristic_res["education"]),
                    "responsibilities": parsed.get("responsibilities", heuristic_res["responsibilities"])
                }
            except Exception:
                pass

        return {
            "title": "Software Engineer",
            "department": "Engineering",
            "required_skills": heuristic_res["required_skills"],
            "preferred_skills": heuristic_res["preferred_skills"],
            "experience": heuristic_res["experience"],
            "education": heuristic_res["education"],
            "responsibilities": heuristic_res["responsibilities"]
        }
