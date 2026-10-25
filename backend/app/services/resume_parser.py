import re
import io
import json
from typing import Dict, Any, List
from pypdf import PdfReader
from app.services.ai_provider import AIProvider

# Comprehensive skill taxonomy
SKILL_TAXONOMY = [
    # Languages
    "python", "javascript", "typescript", "java", "c++", "c#", "go", "golang", "rust", "ruby", "php", "swift", "kotlin", "scala", "r", "sql", "bash", "shell",
    # Frontend
    "react", "react.js", "next.js", "vue", "vue.js", "angular", "svelte", "html", "html5", "css", "css3", "tailwind", "tailwind css", "bootstrap", "redux", "zustand", "graphql", "rest api", "webpack", "vite",
    # Backend & Frameworks
    "fastapi", "django", "flask", "node.js", "express", "express.js", "spring", "spring boot", "asp.net", "nest.js", "ruby on rails", "laravel",
    # Databases & Storage
    "postgresql", "postgres", "mysql", "mongodb", "sqlite", "redis", "elasticsearch", "cassandra", "dynamodb", "supabase", "firebase", "neo4j",
    # Cloud, DevOps & Tools
    "docker", "kubernetes", "aws", "azure", "gcp", "google cloud", "ci/cd", "github actions", "gitlab", "terraform", "ansible", "nginx", "linux", "git", "jira",
    # AI / ML & Data Science
    "machine learning", "deep learning", "nlp", "natural language processing", "computer vision", "tensorflow", "pytorch", "keras", "scikit-learn", "hugging face", "transformers", "llm", "large language models", "rag", "langchain", "llamaindex", "pandas", "numpy", "opencv", "whisper", "data science", "data analysis", "tableau", "power bi",
    # Data Engineering, Analytics & BI
    "data pipelines", "data cleaning", "data wrangling", "feature engineering", "predictive modeling", "time-series analysis", "kpi reporting", "a/b testing", "excel", "jupyter", "google colab",
    # GenAI, NLP & Deep Learning
    "llms", "genai", "generative ai", "embeddings", "tf-idf", "semantic matching", "nlp pipelines", "cnns", "cnn",
    # Architecture & Concepts
    "microservices", "system design", "object oriented programming", "oop", "agile", "scrum", "distributed systems", "websockets", "grpc", "tdd"
]

class ResumeParser:

    @staticmethod
    def extract_text_from_pdf(pdf_bytes: bytes) -> str:
        try:
            reader = PdfReader(io.BytesIO(pdf_bytes))
            text = ""
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
            return text.strip()
        except Exception as e:
            return f"Error extracting PDF: {str(e)}"

    @staticmethod
    def parse_skills(text: str) -> List[str]:
        text_lower = text.lower()
        found_skills = set()
        
        for skill in SKILL_TAXONOMY:
            # Word boundary regex for exact matching
            pattern = r'(?:\b|_)' + re.escape(skill) + r'(?:\b|_)'
            if re.search(pattern, text_lower):
                # Capitalize nicely
                words = skill.split()
                nice_skill = " ".join(w.capitalize() if w not in ["js", "css", "api", "sql", "llm", "rag", "aws", "gcp", "ci/cd", "oop", "tdd", "nlp", "cnn", "cnns", "kpi", "bi"] else w.upper() for w in words)
                found_skills.add(nice_skill)
                
        return sorted(list(found_skills))

    @staticmethod
    def parse_contact_info(text: str) -> Dict[str, str]:
        # Email
        email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
        email = email_match.group(0) if email_match else ""

        # Phone
        phone_match = re.search(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text)
        phone = phone_match.group(0) if phone_match else ""

        # LinkedIn & GitHub
        linkedin_match = re.search(r'(https?://(?:www\.)?linkedin\.com/in/[\w-]+)', text)
        linkedin = linkedin_match.group(0) if linkedin_match else ""

        github_match = re.search(r'(https?://(?:www\.)?github\.com/[\w-]+)', text)
        github = github_match.group(0) if github_match else ""

        # Name heuristic (first line or line before email)
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        name = ""
        for line in lines[:5]:
            if "@" not in line and "resume" not in line.lower() and "curriculum" not in line.lower() and len(line.split()) <= 4:
                # likely name
                name = line
                break
        if not name and lines:
            name = lines[0]

        return {
            "name": name,
            "email": email,
            "phone": phone,
            "linkedin": linkedin,
            "github": github
        }

    @staticmethod
    def parse_sections(text: str) -> Dict[str, Any]:
        """Extract structured sections like Education, Experience, Projects, Certifications."""
        lines = text.split("\n")
        sections = {
            "education": [],
            "experience": [],
            "projects": [],
            "certifications": [],
            "achievements": []
        }
        
        current_section = None
        current_buffer = []

        def flush_buffer(section, buffer):
            if section and buffer:
                content = " ".join([b.strip() for b in buffer if b.strip()])
                if content:
                    sections[section].append(content)

        section_headers = {
            "education": ["education", "academic background", "qualifications", "academics"],
            "experience": ["experience", "work experience", "employment", "internship", "professional experience"],
            "projects": ["projects", "personal projects", "academic projects", "key projects"],
            "certifications": ["certifications", "licenses", "certificates", "courses"],
            "achievements": ["achievements", "honors", "awards", "accomplishments", "publications"]
        }

        for line in lines:
            trimmed = line.strip().lower()
            matched_header = None
            for sec_key, keywords in section_headers.items():
                if any(trimmed == kw or trimmed.startswith(kw + ":") for kw in keywords):
                    matched_header = sec_key
                    break
            
            if matched_header:
                flush_buffer(current_section, current_buffer)
                current_section = matched_header
                current_buffer = []
            elif current_section:
                if line.strip():
                    if line.strip().startswith(("•", "-", "*")) and current_buffer:
                        flush_buffer(current_section, current_buffer)
                        current_buffer = [line.strip().lstrip("•-* ")]
                    else:
                        current_buffer.append(line.strip())

        flush_buffer(current_section, current_buffer)

        # Fallback if empty sections
        if not sections["education"]:
            edu_patterns = re.findall(r'(Bachelor|Master|B\.Tech|M\.Tech|B\.E\.|BSc|MSc|Ph\.D|Diploma)[^\n,\.]*', text, re.IGNORECASE)
            sections["education"] = [p.strip() for p in edu_patterns[:3]]

        return sections

    @classmethod
    async def parse_resume_full(cls, text: str) -> Dict[str, Any]:
        """Performs full extraction, optionally enhanced with LLM if available."""
        contact = cls.parse_contact_info(text)
        skills = cls.parse_skills(text)
        sections = cls.parse_sections(text)

        # Optional LLM refinement if key is available
        llm_prompt = f"""
Given this resume text:
{text[:2000]}

Extract and return JSON with keys:
- "name": string
- "skills": list of strings
- "education": list of strings
- "experience": list of strings
- "projects": list of strings
- "certifications": list of strings

Return ONLY valid JSON.
"""
        llm_result = await AIProvider.generate_text(llm_prompt, "You are a resume parsing assistant.")
        if llm_result:
            try:
                # Clean markdown json codeblocks if any
                clean_json = re.sub(r'```json\s*|\s*```', '', llm_result).strip()
                parsed_llm = json.loads(clean_json)
                if parsed_llm.get("skills"):
                    # combine skills
                    all_skills = sorted(list(set(skills + parsed_llm.get("skills", []))))
                    skills = all_skills
                if parsed_llm.get("education") and len(parsed_llm["education"]) > len(sections["education"]):
                    sections["education"] = parsed_llm["education"]
                if parsed_llm.get("experience") and len(parsed_llm["experience"]) > len(sections["experience"]):
                    sections["experience"] = parsed_llm["experience"]
                if parsed_llm.get("projects") and len(parsed_llm["projects"]) > len(sections["projects"]):
                    sections["projects"] = parsed_llm["projects"]
                if parsed_llm.get("name") and not contact["name"]:
                    contact["name"] = parsed_llm["name"]
            except Exception:
                pass

        return {
            "name": contact["name"],
            "email": contact["email"],
            "phone": contact["phone"],
            "linkedin": contact["linkedin"],
            "github": contact["github"],
            "skills": skills,
            "education": sections["education"],
            "experience": sections["experience"],
            "projects": sections["projects"],
            "certifications": sections["certifications"],
            "achievements": sections["achievements"],
            "raw_text": text
        }
