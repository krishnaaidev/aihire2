import json
import re
import random
from typing import List, Dict, Any, Optional
from app.services.ai_provider import AIProvider

DEFAULT_QUESTION_BANK = [
    {
        "category": "technical",
        "difficulty": "medium",
        "text_template": "Can you explain how you have utilized {skill} in your recent projects, and how it handles concurrency, state synchronization, or performance bottlenecks?",
        "expected_key_points": ["Architecture/usage pattern", "Concurrency & performance considerations", "Error handling or state management"]
    },
    {
        "category": "conceptual",
        "difficulty": "medium",
        "text_template": "How does {skill} differ fundamentally from alternative technologies or paradigms in the ecosystem, and what architectural trade-offs do you consider when choosing it?",
        "expected_key_points": ["Core architectural philosophy", "Trade-offs and advantages", "Best practices and constraints"]
    },
    {
        "category": "project",
        "difficulty": "hard",
        "text_template": "Walk me through the most technically challenging software system or project you worked on involving {skill}. What was the internal architecture and how did you overcome the primary roadblock?",
        "expected_key_points": ["Problem statement", "System architecture", "Technical challenge solved", "Measurable outcome"]
    },
    {
        "category": "scenario",
        "difficulty": "hard",
        "text_template": "Imagine our production service built with {role_tech} experiences sudden latency spikes, thread starvation, and memory leaks during peak traffic. Walk me step-by-step through your debugging and mitigation approach.",
        "expected_key_points": ["Observability & profiling (metrics, logs, traces)", "Root cause isolation", "Short-term mitigation vs permanent fix"]
    },
    {
        "category": "system_design",
        "difficulty": "hard",
        "text_template": "If you had to design a distributed, fault-tolerant ingestion pipeline leveraging {skill} that processes millions of events per second with exactly-once semantics, how would you architect it?",
        "expected_key_points": ["Distributed partitioning & queuing", "Idempotency & transaction log", "Backpressure and fault tolerance"]
    },
    {
        "category": "debugging",
        "difficulty": "medium",
        "text_template": "Describe a difficult bug, race condition, or memory regression you encountered while implementing {skill}. How did you trace, reproduce, and resolve it?",
        "expected_key_points": ["Diagnostic process", "Tooling used (profiler, debugger, logs)", "Root cause and regression prevention"]
    },
    {
        "category": "security",
        "difficulty": "medium",
        "text_template": "When deploying services utilizing {skill}, what security vulnerabilities (e.g. injection, auth bypass, CSRF/XSS, insecure deserialization) do you actively audit and guard against?",
        "expected_key_points": ["Threat modeling", "Authentication & authorization", "Data sanitization & encryption"]
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
        Generates and shuffles personalized interview questions matching Synopsis Section 8.5.
        Randomizes question sequence, templates, and focal skills so no two interviews are identical.
        """
        # Randomize skills order for fresh question angles
        shuffled_cand_skills = list(candidate_skills) if candidate_skills else []
        random.shuffle(shuffled_cand_skills)
        shuffled_req_skills = list(required_skills) if required_skills else ["Computer Science"]
        random.shuffle(shuffled_req_skills)

        skills_to_use = shuffled_cand_skills if shuffled_cand_skills else shuffled_req_skills
        primary_skill = skills_to_use[0] if skills_to_use else "Software Architecture"
        secondary_skill = skills_to_use[1] if len(skills_to_use) > 1 else primary_skill
        role_tech = f"{job_title} ({', '.join(shuffled_req_skills[:3])})"

        # 1. Try LLM generation if available
        prompt = f"""
You are the AI Interviewer for AIHire platform.
Generate a randomized, structured set of {num_questions} personalized interview questions for:
- Role: {job_title}
- Required Skills: {', '.join(shuffled_req_skills)}
- Experience Level: {experience_level}
- Candidate Skills: {', '.join(shuffled_cand_skills[:8])}
- Candidate Projects: {candidate_projects[:2]}

CRITICAL: Randomly shuffle the question sequence and topics. Do not use a fixed question pattern.
Generate a valid JSON array of objects with keys:
- "question_text": The personalized question text
- "category": One of ["technical", "conceptual", "project", "scenario", "system_design", "debugging", "behavioral"]
- "difficulty": One of ["easy", "medium", "hard"]
- "expected_key_points": list of 3-4 key concepts the candidate should cover

Ensure questions are balanced across categories and deeply relevant to the candidate's background and target role.
"""
        llm_resp = await AIProvider.generate_text(prompt, "You are an expert technical interviewer.")
        if llm_resp:
            try:
                clean_json = re.sub(r'```json\s*|\s*```', '', llm_resp).strip()
                parsed = json.loads(clean_json)
                if isinstance(parsed, list) and len(parsed) >= 1:
                    # Randomly shuffle questions
                    random.shuffle(parsed)
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

        # 2. Contextual fallback template generation with random shuffling
        questions = []
        templates = list(DEFAULT_QUESTION_BANK)
        random.shuffle(templates)

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

        # Final shuffle of questions
        random.shuffle(questions)
        for i, q in enumerate(questions):
            q["order_index"] = i + 1

        return questions

    @classmethod
    async def generate_adaptive_question_on_topic(
        cls,
        job_title: str,
        required_skills: List[str],
        candidate_skills: List[str],
        previous_question: str,
        candidate_answer: str,
        eval_feedback: str = "",
        order_index: int = 2
    ) -> Dict[str, Any]:
        """
        Dynamically analyzes the candidate's previous response, identifies the exact topic,
        technologies, or architectural choices they discussed, and formulates an intelligent
        follow-up question tailored to that topic (Max 5 questions per interview).
        """
        prompt = f"""
You are the Lead Technical AI Interviewer on the AIHire platform.
Candidate is interviewing for: {job_title}
Key Job Requirements: {', '.join(required_skills[:6])}
Candidate Profile Skills: {', '.join(candidate_skills[:8])}

Previous Question #{order_index - 1}:
"{previous_question}"

Candidate's Answer:
"{candidate_answer}"

AI Evaluation Feedback on Answer:
"{eval_feedback}"

YOUR TASK:
Formulate Question #{order_index} (out of 5 max).
Rules:
1. Examine the candidate's answer and identify the exact topic, tools, architectural decisions, or practical approaches they mentioned.
2. Directly base Question #{order_index} on that topic: probe deeper into the trade-offs, edge cases, scaling limits, failure modes, or real-world implementation challenges of the solution they proposed.
3. Natural phrasing: reference what they just said (e.g. "You mentioned [concept/tool] in your response. How would you handle...").
4. Return ONLY a valid JSON object with keys:
   - "question_text": The personalized follow-up question text
   - "category": One of ["technical", "scenario", "problem_solving", "architecture", "system_design"]
   - "difficulty": One of ["medium", "hard"]
   - "expected_key_points": list of 3-4 specific concepts expected
"""
        llm_resp = await AIProvider.generate_text(prompt, "You are an expert technical interviewer.")
        if llm_resp:
            try:
                clean_json = re.sub(r'```json\s*|\s*```', '', llm_resp).strip()
                parsed = json.loads(clean_json)
                if parsed.get("question_text"):
                    return {
                        "question_text": parsed.get("question_text"),
                        "category": parsed.get("category", "technical"),
                        "difficulty": parsed.get("difficulty", "medium"),
                        "expected_key_points": parsed.get("expected_key_points", ["Architecture", "Edge cases", "Trade-offs"]),
                        "order_index": order_index
                    }
            except Exception:
                pass

        # Contextual Topic Extractor Fallback
        lower_ans = candidate_answer.lower()
        if any(w in lower_ans for w in ["database", "sql", "query", "postgres", "mongo", "table", "data"]):
            topic_q = "In your answer, you highlighted database operations. How would you design the indexing strategy, handle connection pooling, and prevent lock contention as concurrent traffic spikes 10x?"
            category = "technical"
            points = ["Indexing strategy", "Connection pooling", "Lock contention & transactions"]
        elif any(w in lower_ans for w in ["api", "rest", "graphql", "endpoint", "microservice", "service", "backend"]):
            topic_q = "You discussed API and service architecture. What strategies would you use for rate limiting, idempotent request processing, and graceful circuit breaking during downstream outages?"
            category = "architecture"
            points = ["Rate limiting", "Idempotency", "Circuit breaker pattern"]
        elif any(w in lower_ans for w in ["cache", "redis", "memory", "performance", "latency", "speed"]):
            topic_q = "You mentioned performance and caching mechanisms. How would you prevent cache stampedes, manage distributed cache invalidation, and ensure data consistency across multi-region deployments?"
            category = "system_design"
            points = ["Cache stampede mitigation", "Cache invalidation", "Eventual consistency"]
        elif any(w in lower_ans for w in ["test", "ci/cd", "deploy", "docker", "cloud", "aws", "kubernetes"]):
            topic_q = "You referenced deployment and validation procedures. How would you structure automated regression testing and canary rollouts to guarantee zero-downtime deployments in a mission-critical setup?"
            category = "scenario"
            points = ["Canary deployments", "Automated regression tests", "Zero-downtime rollback"]
        elif any(w in lower_ans for w in ["state", "react", "component", "frontend", "ui", "render"]):
            topic_q = "You mentioned state management and user interface architecture. How do you prevent unnecessary re-renders, manage asynchronous side-effects, and ensure accessibility (WCAG) compliance in complex workflows?"
            category = "technical"
            points = ["Render optimization", "Async side-effect handling", "Accessibility"]
        else:
            # Fallback based on job and skills
            fallback_skill = required_skills[0] if required_skills else "System Architecture"
            topic_q = f"Building on your response, what architectural trade-offs or constraints have you encountered when applying {fallback_skill} in production, and how did you measure success?"
            category = "technical"
            points = ["Architectural trade-offs", "Production constraints", "Performance metrics"]

        return {
            "question_text": topic_q,
            "category": category,
            "difficulty": "hard" if order_index >= 3 else "medium",
            "expected_key_points": points,
            "order_index": order_index
        }
