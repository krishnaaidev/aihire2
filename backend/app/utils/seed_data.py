import json
import datetime
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.job import Job
from app.models.candidate import Candidate
from app.models.interview import Interview
from app.models.question import Question
from app.models.response import CandidateResponse
from app.models.report import EvaluationReport
from app.utils.security import hash_password

def seed_database(db: Session):
    # Check if database is already seeded
    if db.query(User).filter(User.email == "recruiter@aihire.com").first():
        return

    print("Seeding initial AIHire demonstration data...")

    # 1. Users
    recruiter = User(
        name="Vikram Singh",
        email="recruiter@aihire.com",
        password_hash=hash_password("password123"),
        role="recruiter"
    )
    candidate_user1 = User(
        name="Suman Krishna",
        email="candidate@aihire.com",
        password_hash=hash_password("password123"),
        role="candidate"
    )
    candidate_user2 = User(
        name="Shivam Kumar Chaubey",
        email="shivam@aihire.com",
        password_hash=hash_password("password123"),
        role="candidate"
    )

    db.add_all([recruiter, candidate_user1, candidate_user2])
    db.commit()
    db.refresh(recruiter)
    db.refresh(candidate_user1)
    db.refresh(candidate_user2)

    # 2. Jobs
    job1 = Job(
        recruiter_id=recruiter.id,
        title="Senior Full Stack AI Engineer",
        department="Engineering",
        description="Looking for an experienced engineer to architect AI-driven web platforms, develop scalable FastAPI backends, and build modern React web interfaces.",
        required_skills=json.dumps(["Python", "FastAPI", "React", "PostgreSQL", "Docker", "REST API"]),
        preferred_skills=json.dumps(["Redis", "RAG", "LLM", "WebSockets", "Tailwind CSS"]),
        experience="3-6 years",
        education="Bachelor's or Master's in Computer Science",
        responsibilities="Architect microservices, design real-time data pipelines, integrate LLMs and NLP components, and lead technical sprints.",
        scoring_weights=json.dumps({
            "technical": 0.40,
            "problem_solving": 0.20,
            "communication": 0.15,
            "role_relevance": 0.15,
            "behavioral": 0.10
        }),
        is_active=True
    )

    job2 = Job(
        recruiter_id=recruiter.id,
        title="AI / ML Systems Engineer",
        department="AI Research & Products",
        description="Build state-of-the-art NLP pipelines, implement retrieval-augmented generation (RAG), and fine-tune transformer models for recruitment intelligence.",
        required_skills=json.dumps(["Python", "PyTorch", "Transformers", "NLP", "LLM", "RAG", "Scikit-Learn"]),
        preferred_skills=json.dumps(["FastAPI", "Docker", "Whisper", "MLflow"]),
        experience="2-5 years",
        education="B.Tech/M.Tech in CSE or AI/Data Science",
        responsibilities="Develop machine learning models, vector embeddings, evaluate generative AI pipelines, and optimize model latency.",
        is_active=True
    )

    job3 = Job(
        recruiter_id=recruiter.id,
        title="Lead Frontend Engineer",
        department="User Experience",
        description="Craft ultra-responsive, accessible, and high-performance interactive interfaces using React, TypeScript, and modern design systems.",
        required_skills=json.dumps(["React", "TypeScript", "Tailwind CSS", "WebSockets", "Next.js"]),
        preferred_skills=json.dumps(["GraphQL", "Vite", "Framer Motion", "Docker"]),
        experience="3-5 years",
        education="B.Tech / B.E. in Computer Science or equivalent",
        responsibilities="Implement interactive interview rooms, dashboard data visualizations, and optimize client-side state and audio streams.",
        is_active=True
    )

    db.add_all([job1, job2, job3])
    db.commit()
    db.refresh(job1)
    db.refresh(job2)
    db.refresh(job3)

    # 3. Candidate Profiles
    cand1 = Candidate(
        user_id=candidate_user1.id,
        resume_filename="suman_krishna_resume.pdf",
        resume_text="Suman Krishna - Full Stack & AI Developer. Proficient in Python, FastAPI, React, PostgreSQL, Docker, Machine Learning, RAG, REST API, Git.",
        extracted_skills=json.dumps(["Python", "FastAPI", "React", "PostgreSQL", "Docker", "RAG", "LLM", "Git", "REST API", "Tailwind CSS"]),
        education=json.dumps(["B.Tech in Computer Science and Engineering - CT Institute of Engineering, Management and Technology (IKGPTU) 2026"]),
        experience=json.dumps(["Full Stack & AI Intern - Autonomous AI Interview Platform", "Lead Software Developer - Web Systems"]),
        projects=json.dumps(["AIHire: Autonomous AI Interview & Intelligent Evaluation Platform", "Scalable Microservices Gateway"]),
        certifications=json.dumps(["Deep Learning Specialization", "AWS Cloud Practitioner"]),
        phone="+91 98765 43210",
        linkedin_url="https://linkedin.com/in/sumankrishna",
        github_url="https://github.com/sumankrishna"
    )

    cand2 = Candidate(
        user_id=candidate_user2.id,
        resume_filename="shivam_chaubey_resume.pdf",
        resume_text="Shivam Kumar Chaubey - Machine Learning & NLP Engineer. Specialized in Python, PyTorch, Transformers, NLP, RAG, Whisper, Scikit-Learn, Docker.",
        extracted_skills=json.dumps(["Python", "PyTorch", "Transformers", "NLP", "LLM", "RAG", "Scikit-Learn", "Docker", "FastAPI"]),
        education=json.dumps(["B.Tech in Computer Science and Engineering - CT Institute of Engineering, Management and Technology (IKGPTU) 2026"]),
        experience=json.dumps(["AI Research Intern - Natural Language Systems", "Data Science Contributor"]),
        projects=json.dumps(["Speech-to-Text Multi-accent Whisper Evaluator", "Semantic Embedding Search Engine"]),
        certifications=json.dumps(["Hugging Face NLP Specialist", "TensorFlow Developer Certificate"]),
        phone="+91 98765 12345",
        linkedin_url="https://linkedin.com/in/shivamchaubey",
        github_url="https://github.com/shivamchaubey"
    )

    db.add_all([cand1, cand2])
    db.commit()
    db.refresh(cand1)
    db.refresh(cand2)

    # 4. Completed Interview and Evaluation Report for Suman Krishna on Job 1
    interview1 = Interview(
        candidate_id=cand1.id,
        job_id=job1.id,
        mode="text",
        status="completed",
        current_question_index=5,
        overall_score=88.5,
        start_time=datetime.datetime.utcnow() - datetime.timedelta(hours=2),
        end_time=datetime.datetime.utcnow() - datetime.timedelta(hours=1)
    )
    db.add(interview1)
    db.commit()
    db.refresh(interview1)

    # Questions & Responses for Interview 1
    q1 = Question(
        interview_id=interview1.id,
        question_text="How would you design a scalable asynchronous task worker architecture in FastAPI to handle high-volume resume parsing without blocking the main event loop?",
        category="technical",
        difficulty="hard",
        order_index=1,
        expected_key_points=json.dumps(["BackgroundTasks / Celery", "Redis/RabbitMQ message broker", "Non-blocking async worker pool"])
    )
    q2 = Question(
        interview_id=interview1.id,
        question_text="Can you explain the trade-offs between relational databases like PostgreSQL and vector databases when storing embeddings for candidate semantic retrieval?",
        category="conceptual",
        difficulty="medium",
        order_index=2,
        expected_key_points=json.dumps(["ACID transactions vs ANN indexing", "pgvector extension convenience", "Dedicated vector DB scalability like Milvus/Qdrant"])
    )
    q3 = Question(
        interview_id=interview1.id,
        question_text="Walk me through how you implemented real-time communication between the candidate interview room and the backend AI evaluator.",
        category="project",
        difficulty="hard",
        order_index=3,
        expected_key_points=json.dumps(["WebSocket duplex connection", "State synchronization", "Graceful reconnection"])
    )
    q4 = Question(
        interview_id=interview1.id,
        question_text="Suppose the production speech recognition service experiences intermittent latency spikes exceeding 4 seconds. How do you mitigate user experience degradation?",
        category="scenario",
        difficulty="hard",
        order_index=4,
        expected_key_points=json.dumps(["Client-side streaming speech recognition fallback", "Optimistic UI transcript buffers", "Circuit breaker pattern"])
    )
    q5 = Question(
        interview_id=interview1.id,
        question_text="Describe a time when you and another developer had fundamentally different approaches to database schema design or API contracts. How was it resolved?",
        category="behavioral",
        difficulty="medium",
        order_index=5,
        expected_key_points=json.dumps(["Objective benchmarks", "RFC / design doc comparison", "Collaborative team consensus"])
    )

    db.add_all([q1, q2, q3, q4, q5])
    db.commit()
    db.refresh(q1)
    db.refresh(q2)
    db.refresh(q3)
    db.refresh(q4)
    db.refresh(q5)

    resp1 = CandidateResponse(
        interview_id=interview1.id,
        question_id=q1.id,
        candidate_answer="In FastAPI, heavy operations like PDF parsing and NLP embeddings must not run in the async event loop because they are CPU-bound. I decouple them using Celery with Redis as the broker, or run them in an external worker process via run_in_executor. The client receives an immediate job ID and polls or listens via WebSockets for completion.",
        transcript="In FastAPI, heavy operations like PDF parsing and NLP embeddings must not run in the async event loop because they are CPU-bound. I decouple them using Celery with Redis as the broker, or run them in an external worker process via run_in_executor. The client receives an immediate job ID and polls or listens via WebSockets for completion.",
        relevance_score=94.0,
        accuracy_score=92.0,
        completeness_score=90.0,
        reasoning_score=92.0,
        communication_score=90.0,
        confidence_score=95.0,
        composite_score=91.6,
        feedback="Exceptional understanding of CPU-bound vs IO-bound workloads in asynchronous Python runtimes.",
        strengths_mentioned=json.dumps(["Clear understanding of event loop mechanics", "Mentioned Redis/Celery decoupling"]),
        improvements=json.dumps(["Could mention auto-scaling worker nodes via KEDA"])
    )
    resp2 = CandidateResponse(
        interview_id=interview1.id,
        question_id=q2.id,
        candidate_answer="PostgreSQL provides strong ACID compliance, relational integrity, and with pgvector, HNSW indexing allows querying vector similarities alongside relational metadata in a single query. For extremely high scale (tens of millions of vectors), dedicated stores like Qdrant or Pinecone offer distributed partitioning, but pgvector simplifies operational complexity dramatically.",
        transcript="PostgreSQL provides strong ACID compliance, relational integrity, and with pgvector, HNSW indexing allows querying vector similarities alongside relational metadata in a single query. For extremely high scale (tens of millions of vectors), dedicated stores like Qdrant or Pinecone offer distributed partitioning, but pgvector simplifies operational complexity dramatically.",
        relevance_score=92.0,
        accuracy_score=90.0,
        completeness_score=88.0,
        reasoning_score=90.0,
        communication_score=88.0,
        confidence_score=90.0,
        composite_score=89.6,
        feedback="Great articulation of architectural trade-offs between unified relational databases and specialized vector databases.",
        strengths_mentioned=json.dumps(["Deep knowledge of pgvector and HNSW", "Pragmatic trade-off perspective"]),
        improvements=json.dumps([])
    )

    db.add_all([resp1, resp2])
    db.commit()

    # Evaluation Report for Interview 1
    report1 = EvaluationReport(
        candidate_id=cand1.id,
        interview_id=interview1.id,
        job_id=job1.id,
        skill_match_score=92.0,
        interview_score=90.6,
        overall_score=88.5,
        technical_score=91.0,
        problem_solving_score=87.5,
        communication_score=89.0,
        role_relevance_score=91.0,
        behavioral_score=86.0,
        strengths=json.dumps([
            "Strong grasp of asynchronous FastAPI architecture and background workers",
            "Clear articulation of relational vs vector database trade-offs",
            "Structured communication with solid reasoning",
            "High candidate-job skill overlap (92% match)"
        ]),
        weaknesses=json.dumps([
            "Could elaborate on production observability tools like OpenTelemetry",
            "Consider demonstrating deeper edge-case error recovery scenarios"
        ]),
        question_analysis=json.dumps([
            {
                "question": q1.question_text,
                "category": "technical",
                "difficulty": "hard",
                "composite_score": 91.6,
                "relevance": 94.0,
                "accuracy": 92.0,
                "completeness": 90.0,
                "reasoning": 92.0,
                "communication": 90.0,
                "feedback": "Exceptional understanding of CPU-bound vs IO-bound workloads."
            },
            {
                "question": q2.question_text,
                "category": "conceptual",
                "difficulty": "medium",
                "composite_score": 89.6,
                "relevance": 92.0,
                "accuracy": 90.0,
                "completeness": 88.0,
                "reasoning": 90.0,
                "communication": 88.0,
                "feedback": "Great articulation of architectural trade-offs."
            }
        ]),
        summary="Suman Krishna demonstrated top-tier engineering competencies for the Senior Full Stack AI Engineer position. His answers were clear, technically rigorous, and aligned with modern distributed systems design.",
        recommendation="Strong Hire",
        recruiter_notes="Candidate shows exceptional promise. Strong recommendation for technical shortlisting.",
        decision_status="Shortlisted"
    )

    db.add(report1)
    db.commit()
    print("AIHire demonstration data seeded successfully!")
