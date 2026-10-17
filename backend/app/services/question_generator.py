import json
import re
from typing import List, Dict, Any, Optional
from app.services.ai_provider import AIProvider

DEFAULT_QUESTION_BANK = [
    {
        "category": "technical",
        "difficulty": "medium",
        "text_template": "Can you explain how you have utilized {skill} in your recent projects, and how it handles concurrency or performance bottlenecks?",
        "expected_key_points": ["Architecture/usage pattern", "Performance considerations", "Error handling or state management"]
    },
    {
        "category": "conceptual",
        "difficulty": "medium",
        "text_template": "How does {skill} differ fundamentally from alternative technologies in the ecosystem, and what architectural trade-offs do you consider when choosing it?",
        "expected_key_points": ["Core architectural philosophy", "Trade-offs and advantages", "Best practices"]
    },
    {
        "category": "project",
        "difficulty": "hard",
        "text_template": "Walk me through the most technically challenging software system or project you worked on involving {skill}. What was the architecture and how did you overcome the primary obstacle?",
        "expected_key_points": ["Problem statement", "System architecture", "Technical challenge solved", "Measurable outcome"]
    },
    {
        "category": "scenario",
        "difficulty": "hard",
        "text_template": "Imagine our production service built with {role_tech} experiences sudden latency spikes and memory leaks during peak traffic. Walk me step-by-step through your debugging and mitigation approach.",
        "expected_key_points": ["Observability & profiling (metrics, logs, traces)", "Root cause isolation", "Short-term mitigation vs permanent fix"]
    },
    {
        "category": "behavioral",
        "difficulty": "medium",
        "text_template": "Tell me about a situation where you had a strong technical disagreement with a team member or stakeholder regarding system design or deadlines. How did you handle it and reach consensus?",
        "expected_key_points": ["Constructive communication", "Data-driven objective trade-offs", "Team collaboration and alignment"]
    }
]

class QuestionGenerator:

    @classmethod
    async def generate_interview_questions(
        cls,
        job_title: str,
        required_skills: List[str],
        experience_level: str,
        candidate_skills: List[str],
        candidate_experience: List[Any],
        candidate_projects: List[Any],
        num_questions: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Generates personalized questions matching Synopsis Section 8.5:
        - Technical questions
        - Conceptual questions
        - Scenario-based questions
        - Project-based questions
        - Behavioral questions
        """
        skills_to_use = candidate_skills if candidate_skills else required_skills
        primary_skill = skills_to_use[0] if skills_to_use else "Software Architecture"
        secondary_skill = skills_to_use[1] if len(skills_to_use) > 1 else primary_skill
        role_tech = f"{job_title} ({', '.join(required_skills[:3])})"

        # 1. Try LLM generation if available
        prompt = f"""
You are the AI Interviewer for AIHire platform.
Generate a structured set of {num_questions} personalized interview questions for:
- Role: {job_title}
- Required Skills: {', '.join(required_skills)}
- Experience Level: {experience_level}
- Candidate Skills: {', '.join(candidate_skills[:8])}
- Candidate Projects: {candidate_projects[:2]}

Generate a valid JSON array of objects with keys:
- "question_text": The personalized question text
- "category": One of ["technical", "conceptual", "project", "scenario", "behavioral"]
- "difficulty": One of ["easy", "medium", "hard"]
- "expected_key_points": list of 3-4 key concepts the candidate should cover

Ensure questions are balanced across categories and deeply relevant to the candidate's background and target role.
"""
        llm_resp = await AIProvider.generate_text(prompt, "You are an expert technical interviewer.")
        if llm_resp:
            try:
                clean_json = re.sub(r'```json\s*|\s*```', '', llm_resp).strip()
                parsed = json.loads(clean_json)
                if isinstance(parsed, list) and len(parsed) >= 3:
                    questions = []
                    for i, q in enumerate(parsed[:num_questions]):
                        questions.append({
                            "question_text": q.get("question_text"),
                            "category": q.get("category", "technical"),
                            "difficulty": q.get("difficulty", "medium"),
                            "expected_key_points": q.get("expected_key_points", []),
                            "order_index": i + 1
                        })
                    return questions
            except Exception:
                pass

        # 2. Contextual fallback template generation
        questions = []
        templates = DEFAULT_QUESTION_BANK
        for i in range(min(num_questions, len(templates))):
            t = templates[i]
            skill = secondary_skill if i % 2 == 1 else primary_skill
            q_text = t["text_template"].format(skill=skill, role_tech=role_tech)
            questions.append({
                "question_text": q_text,
                "category": t["category"],
                "difficulty": t["difficulty"],
                "expected_key_points": t["expected_key_points"],
                "order_index": i + 1
            })

        return questions

    @classmethod
    async def generate_dynamic_followup(
        cls,
        question_text: str,
        candidate_answer: str,
        category: str,
        order_index: int
    ) -> Dict[str, Any]:
        """
        Dynamically adapts interview by formulating an intelligent follow-up
        deepening or clarifying previous candidate answer (Synopsis Section 8.6).
        """
        prompt = f"""
As an AI interviewer, the previous question was:
"{question_text}"

The candidate answered:
"{candidate_answer}"

Formulate a concise, sharp follow-up question that either asks for technical depth on a specific point they mentioned, or asks how they would handle edge-cases/failure scenarios.
Return JSON with:
- "question_text": follow-up question
- "expected_key_points": list of key points
"""
        llm_resp = await AIProvider.generate_text(prompt, "You are an adaptive AI interviewer.")
        if llm_resp:
            try:
                clean_json = re.sub(r'```json\s*|\s*```', '', llm_resp).strip()
                parsed = json.loads(clean_json)
                return {
                    "question_text": parsed.get("question_text", f"Could you dive deeper into that? Specifically, how would you test and validate that approach in a high-scale environment?"),
                    "category": category,
                    "difficulty": "hard",
                    "expected_key_points": parsed.get("expected_key_points", ["Edge cases", "Scalability", "Testing"]),
                    "order_index": order_index
                }
            except Exception:
                pass

        return {
            "question_text": f"That is an interesting solution. Could you elaborate on how you would validate the correctness and monitor latency in production for that approach?",
            "category": category,
            "difficulty": "hard",
            "expected_key_points": ["Monitoring", "Unit/Integration tests", "Resilience"],
            "order_index": order_index
        }
