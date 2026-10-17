import json
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.job import Job
from app.models.candidate import Candidate
from app.models.interview import Interview
from app.models.question import Question
from app.models.response import CandidateResponse
from app.models.report import EvaluationReport
from app.utils.security import hash_password

RECRUITER_DATA = [
    {
        "name": "Dr. Rajesh Sharma",
        "email": "rajesh.ai@aihire.com",
        "branch": "Computer Science & Engineering",
        "field": "Artificial Intelligence & Machine Learning",
        "job_title": "Principal AI Research Scientist",
        "department": "AI & ML Systems",
        "description": "Lead research and development of scalable neural network architectures, generative models, and multi-modal AI systems for high-throughput enterprise applications.",
        "required_skills": ["Python", "PyTorch", "Transformers", "LLM", "Deep Learning", "MLflow"],
        "preferred_skills": ["CUDA", "C++", "Distributed Training", "Ray", "vLLM"],
        "experience": "5-8 years",
        "responsibilities": "Direct algorithmic research, optimize large-scale inference pipelines, mentor research engineers, and publish technical breakthroughs."
    },
    {
        "name": "Priya Patel",
        "email": "priya.cloud@aihire.com",
        "branch": "Information Technology",
        "field": "Cloud Architecture & DevOps",
        "job_title": "Lead Cloud DevOps Architect",
        "department": "Cloud & Infrastructure",
        "description": "Design resilient multi-cloud architectures, automate zero-downtime CI/CD pipelines, and govern Kubernetes container orchestration at petabyte scale.",
        "required_skills": ["AWS", "Docker", "Kubernetes", "Terraform", "CI/CD", "Linux"],
        "preferred_skills": ["GCP", "Ansible", "Prometheus", "Helm", "Istio"],
        "experience": "4-7 years",
        "responsibilities": "Architect cloud landing zones, implement Infrastructure-as-Code, enforce security compliance, and optimize cloud consumption costs."
    },
    {
        "name": "Amit Verma",
        "email": "amit.cyber@aihire.com",
        "branch": "Information Security & Cyber Defense",
        "field": "Cybersecurity & Ethical Hacking",
        "job_title": "Senior Cybersecurity Threat Analyst",
        "department": "Cyber Defense & Threat Intelligence",
        "description": "Perform penetration testing, monitor SIEM telemetry, evaluate zero-day vulnerabilities, and fortify enterprise attack surfaces against sophisticated threats.",
        "required_skills": ["Cybersecurity", "Penetration Testing", "Python", "Linux", "Network Security", "Wireshark"],
        "preferred_skills": ["CISSP", "Splunk", "Reverse Engineering", "Burp Suite", "OWASP"],
        "experience": "3-6 years",
        "responsibilities": "Execute red team exercises, audit distributed system architectures, lead incident response, and ensure compliance standards."
    },
    {
        "name": "Sneha Reddy",
        "email": "sneha.fullstack@aihire.com",
        "branch": "Software Engineering",
        "field": "Full Stack Web Systems",
        "job_title": "Senior Full Stack Engineer (FastAPI + React)",
        "department": "Core Platform Engineering",
        "description": "Develop high-performance REST and WebSocket microservices in FastAPI with reactive, modular component frontends built in React and TypeScript.",
        "required_skills": ["Python", "FastAPI", "React", "TypeScript", "PostgreSQL", "Docker"],
        "preferred_skills": ["Redis", "WebSockets", "Tailwind CSS", "Next.js", "GraphQL"],
        "experience": "3-5 years",
        "responsibilities": "Architect microservices, design real-time duplex communications, enforce state management standards, and drive API contracts."
    },
    {
        "name": "Vikram Malhotra",
        "email": "vikram.data@aihire.com",
        "branch": "Data Science & Engineering",
        "field": "Data Engineering & Big Data Analytics",
        "job_title": "Lead Data Pipeline Architect",
        "department": "Big Data Platforms",
        "description": "Construct high-throughput streaming and batch ETL data pipelines utilizing Apache Spark, Kafka, and modern cloud lakehouses.",
        "required_skills": ["Python", "SQL", "Apache Spark", "Kafka", "Data Warehousing", "Snowflake"],
        "preferred_skills": ["Airflow", "dbt", "PostgreSQL", "Databricks", "Flink"],
        "experience": "4-6 years",
        "responsibilities": "Design real-time analytics pipelines, enforce schema validation, maintain data governance, and optimize query latency."
    },
    {
        "name": "Ananya Sen",
        "email": "ananya.mobile@aihire.com",
        "branch": "Mobile Computing",
        "field": "Mobile App Development",
        "job_title": "Staff Mobile Engineer (iOS & Flutter)",
        "department": "Consumer Mobile Apps",
        "description": "Craft responsive cross-platform and native mobile experiences delivering 60fps animations, robust offline caching, and biometric authentication.",
        "required_skills": ["Flutter", "Swift", "Kotlin", "Mobile UI", "REST API", "Git"],
        "preferred_skills": ["React Native", "Firebase", "CI/CD for Mobile", "GraphQL", "CoreData"],
        "experience": "3-5 years",
        "responsibilities": "Lead mobile release pipelines, optimize memory footprints, implement state management, and ensure App Store compliance."
    },
    {
        "name": "Rohit Kapoor",
        "email": "rohit.iot@aihire.com",
        "branch": "Electronics & Communication Engineering",
        "field": "Embedded Systems & Internet of Things (IoT)",
        "job_title": "Embedded Firmware Engineer (RTOS & C/C++)",
        "department": "Hardware & Connected Devices",
        "description": "Program bare-metal microcontrollers and real-time operating systems for low-power smart sensors, telemetry modules, and edge connectivity.",
        "required_skills": ["C++", "C", "RTOS", "Microcontrollers", "I2C/SPI", "Linux"],
        "preferred_skills": ["FreeRTOS", "MQTT", "ESP32", "BLE", "PCB Debugging"],
        "experience": "3-6 years",
        "responsibilities": "Write hardware abstraction layers, optimize power consumption, conduct oscilloscopic debugging, and maintain OTA updates."
    },
    {
        "name": "Meera Nair",
        "email": "meera.web3@aihire.com",
        "branch": "Distributed Systems",
        "field": "Blockchain & Decentralized Protocols",
        "job_title": "Blockchain Core & Smart Contract Engineer",
        "department": "Decentralized Infrastructure",
        "description": "Architect secure, gas-optimized smart contracts and decentralized protocol primitives across EVM-compatible chains and high-throughput networks.",
        "required_skills": ["Solidity", "Rust", "Ethereum", "Cryptography", "Web3.js", "Smart Contracts"],
        "preferred_skills": ["Hardhat", "Foundry", "Zero Knowledge Proofs", "IPFS", "DeFi"],
        "experience": "2-5 years",
        "responsibilities": "Audit smart contract security, design state machine logic, implement cross-chain bridges, and evaluate consensus protocols."
    },
    {
        "name": "Arjun Singhania",
        "email": "arjun.robotics@aihire.com",
        "branch": "Mechatronics & Robotics",
        "field": "Autonomous Navigation & Robotics",
        "job_title": "Autonomous Systems Engineer (ROS2 & SLAM)",
        "department": "Robotics & Perception",
        "description": "Develop real-time perception, localization, and trajectory planning algorithms for mobile robotics platforms and industrial AGVs.",
        "required_skills": ["C++", "Python", "ROS2", "SLAM", "Computer Vision", "Control Systems"],
        "preferred_skills": ["LiDAR Processing", "Kalman Filtering", "Gazebo", "OpenCV", "Path Planning"],
        "experience": "3-6 years",
        "responsibilities": "Deploy multi-sensor fusion stacks, optimize kinematic controllers, conduct simulation stress tests, and tune PID loops."
    },
    {
        "name": "Pooja Joshi",
        "email": "pooja.frontend@aihire.com",
        "branch": "Human-Computer Interaction",
        "field": "UI/UX & Frontend Architecture",
        "job_title": "Lead Design Systems Engineer",
        "department": "User Experience & Web Platform",
        "description": "Engineer comprehensive, accessible design system component libraries with pixel-perfect responsive layouts and micro-interactions.",
        "required_skills": ["React", "TypeScript", "Tailwind CSS", "HTML5", "CSS3", "Design Systems"],
        "preferred_skills": ["Storybook", "Framer Motion", "Figma", "Web Accessibility", "Vite"],
        "experience": "3-5 years",
        "responsibilities": "Architect atomic UI components, ensure WCAG 2.1 AA accessibility, enforce design tokens, and streamline cross-platform styling."
    },
    {
        "name": "Karan Bhatia",
        "email": "karan.sre@aihire.com",
        "branch": "Systems Engineering",
        "field": "Site Reliability Engineering & Automation QA",
        "job_title": "Site Reliability & Quality Automation Lead",
        "department": "Reliability & Quality Engineering",
        "description": "Ensure high availability (99.99%) across distributed microservices by introducing chaos engineering, comprehensive end-to-end automated testing, and synthetic monitoring.",
        "required_skills": ["Python", "Selenium", "Docker", "CI/CD", "Linux", "Prometheus"],
        "preferred_skills": ["Grafana", "Playwright", "Chaos Engineering", "Locust", "ELK Stack"],
        "experience": "4-6 years",
        "responsibilities": "Establish SLO/SLI targets, automate regression test suites, run chaos experiments, and conduct post-mortem root-cause analysis."
    },
    {
        "name": "Dr. Sunita Rao",
        "email": "sunita.healthtech@aihire.com",
        "branch": "Biotechnology Engineering",
        "field": "Bioinformatics & HealthTech Software",
        "job_title": "Bioinformatics Software Engineer",
        "department": "Computational Biology & Health Diagnostics",
        "description": "Implement computational pipelines for genomic sequence analysis, molecular modeling, and clinical decision-support integrations.",
        "required_skills": ["Python", "R", "Bioinformatics", "Machine Learning", "SQL", "Linux"],
        "preferred_skills": ["Nextflow", "Bioconductor", "Docker", "Genomic Sequencing", "HL7/FHIR"],
        "experience": "3-6 years",
        "responsibilities": "Analyze biological sequence datasets, build automated variant calling pipelines, and collaborate with laboratory scientists."
    },
    {
        "name": "Devendra Mehta",
        "email": "devendra.fintech@aihire.com",
        "branch": "Financial Engineering",
        "field": "FinTech & Quantitative Trading",
        "job_title": "Quantitative Trading Systems Engineer",
        "department": "Algorithmic Trading & Risk Analytics",
        "description": "Build ultra-low latency execution engines, risk calculation pipelines, and automated trading strategies for global financial exchanges.",
        "required_skills": ["C++", "Python", "Low Latency", "Algorithms", "Financial Modeling", "SQL"],
        "preferred_skills": ["ZeroMQ", "Kernel Bypass", "Fixed Income Math", "Time-Series Databases", "Order Book Simulation"],
        "experience": "4-7 years",
        "responsibilities": "Optimize execution latency down to microseconds, model risk parameters, validate backtesting engines, and interface with market feeds."
    },
    {
        "name": "Ritu Aggarwal",
        "email": "ritu.computervision@aihire.com",
        "branch": "Applied Computing",
        "field": "Computer Vision & Visual AI",
        "job_title": "Senior Computer Vision Engineer",
        "department": "Spatial Computing & Vision",
        "description": "Deploy deep learning models for real-time object detection, image segmentation, facial landmark analysis, and 3D point cloud processing.",
        "required_skills": ["Python", "OpenCV", "PyTorch", "Computer Vision", "TensorFlow", "Deep Learning"],
        "preferred_skills": ["YOLO", "TensorRT", "3D Reconstruction", "ONNX", "Edge Deployment"],
        "experience": "3-6 years",
        "responsibilities": "Train custom vision backbones, optimize real-time edge frame rates, annotate vision datasets, and deploy on mobile/embedded GPUs."
    },
    {
        "name": "Gaurav Nanda",
        "email": "gaurav.networks@aihire.com",
        "branch": "Network & Communications Engineering",
        "field": "Telecommunications & 5G Systems",
        "job_title": "5G Core & Network Virtualization Engineer",
        "department": "Next-Gen Telecommunications",
        "description": "Implement virtualized network functions, OpenFlow protocols, and private 5G core network architectures for mission-critical deployments.",
        "required_skills": ["Linux", "Python", "Networking", "TCP/IP", "Docker", "Kubernetes"],
        "preferred_skills": ["5G Core", "Open vSwitch", "Wireshark", "BGP", "Network Slicing"],
        "experience": "4-7 years",
        "responsibilities": "Design virtualized network slices, monitor QoS packet metrics, audit network topologies, and configure software-defined firewalls."
    },
    {
        "name": "Neha Kulkarni",
        "email": "neha.gamedev@aihire.com",
        "branch": "Interactive Media & Computer Graphics",
        "field": "Game Engine Development & Spatial Computing",
        "job_title": "3D Graphics & Game Engine Developer",
        "department": "Virtual Worlds & Interactive Media",
        "description": "Develop custom rendering pipelines, physics calculations, and multiplayer networking architectures using Unreal Engine and modern shader languages.",
        "required_skills": ["C++", "Unreal Engine", "Computer Graphics", "Shaders", "Mathematics", "Git"],
        "preferred_skills": ["DirectX", "Vulkan", "HLSL", "Multiplayer Netcode", "Spatial Audio"],
        "experience": "3-6 years",
        "responsibilities": "Optimize GPU draw calls, program custom compute shaders, build real-time multiplayer protocols, and implement spatial physics."
    },
    {
        "name": "Sandeep Yadav",
        "email": "sandeep.erp@aihire.com",
        "branch": "Enterprise Information Systems",
        "field": "Enterprise Systems & Microservices",
        "job_title": "Enterprise Microservices & ERP Architect",
        "department": "Corporate Technology Solutions",
        "description": "Oversee enterprise-grade ERP integrations, database sharding, synchronous/asynchronous event buses, and supply chain management software.",
        "required_skills": ["Java", "Spring Boot", "PostgreSQL", "Microservices", "REST API", "Docker"],
        "preferred_skills": ["Kafka", "Kubernetes", "Oracle", "SAP Integration", "Enterprise Architecture"],
        "experience": "5-8 years",
        "responsibilities": "Direct enterprise system migrations, design event-driven domain boundaries, and govern cross-department data workflows."
    },
    {
        "name": "Shalini Menon",
        "email": "shalini.nlp@aihire.com",
        "branch": "Cognitive Science & Computing",
        "field": "Natural Language Processing & Generative AI",
        "job_title": "Lead NLP & Conversational AI Engineer",
        "department": "Cognitive AI Lab",
        "description": "Engineer advanced conversational agents, speech synthesis/recognition pipelines, semantic embedding stores, and fine-tuned domain-specific LLMs.",
        "required_skills": ["Python", "NLP", "Transformers", "LLM", "RAG", "FastAPI"],
        "preferred_skills": ["LangChain", "Vector Databases", "Whisper", "Hugging Face", "Semantic Search"],
        "experience": "3-6 years",
        "responsibilities": "Fine-tune foundation models, implement chunking and hybrid retrieval, minimize model hallucination, and benchmark accuracy."
    },
    {
        "name": "Tarun Chawla",
        "email": "tarun.avionics@aihire.com",
        "branch": "Aerospace Engineering",
        "field": "Aerospace Flight Software & Avionics",
        "job_title": "Safety-Critical Flight Software Engineer",
        "department": "Avionics & Space Systems",
        "description": "Write deterministic, fault-tolerant flight control and telemetry software adhering strictly to DO-178C Level A aviation certification guidelines.",
        "required_skills": ["C", "C++", "Embedded Systems", "RTOS", "Linux", "Control Systems"],
        "preferred_skills": ["DO-178C", "Flight Dynamics", "Hardware-in-the-Loop", "CAN Bus", "Fault Tolerance"],
        "experience": "4-8 years",
        "responsibilities": "Design deterministic guidance software, execute rigorous hardware-in-the-loop simulations, and verify fail-safe redundancies."
    },
    {
        "name": "Alok Deshmukh",
        "email": "alok.vlsi@aihire.com",
        "branch": "VLSI & Microelectronics",
        "field": "Semiconductor & Chip Design Verification",
        "job_title": "ASIC / FPGA Verification Engineer",
        "department": "Silicon Engineering & VLSI",
        "description": "Perform register-transfer level (RTL) functional verification and formal mathematical verification for next-generation silicon chips using SystemVerilog and UVM.",
        "required_skills": ["Verilog", "SystemVerilog", "Digital Design", "Python", "Linux", "C++"],
        "preferred_skills": ["UVM", "FPGA", "VCS", "Formal Verification", "Timing Analysis"],
        "experience": "3-6 years",
        "responsibilities": "Create constrained-random verification testbenches, maximize functional coverage metrics, and validate semiconductor IP blocks."
    }
]

def seed_database(db: Session, force: bool = False):
    # Check if database has already been seeded with the 20 recruiters
    existing_count = db.query(User).filter(User.role == "recruiter").count()
    if existing_count >= 20 and not force:
        return

    print("Seeding AIHire with 20 Recruiters across diverse branches & fields (0 candidate accounts)...")

    # Clear existing users, jobs, candidates, interviews, reports to guarantee clean state
    db.query(EvaluationReport).delete()
    db.query(CandidateResponse).delete()
    db.query(Question).delete()
    db.query(Interview).delete()
    db.query(Job).delete()
    db.query(Candidate).delete()
    db.query(User).delete()
    db.commit()

    # Seed 20 Recruiters and their respective Open Positions
    for r_info in RECRUITER_DATA:
        recruiter = User(
            name=r_info["name"],
            email=r_info["email"],
            password_hash=hash_password("password123"),
            role="recruiter"
        )
        db.add(recruiter)
        db.commit()
        db.refresh(recruiter)

        # Create job requisition for this recruiter
        job = Job(
            recruiter_id=recruiter.id,
            title=r_info["job_title"],
            department=f"{r_info['department']} ({r_info['field']})",
            description=r_info["description"],
            required_skills=json.dumps(r_info["required_skills"]),
            preferred_skills=json.dumps(r_info["preferred_skills"]),
            experience=r_info["experience"],
            education=f"Bachelor's / Master's in {r_info['branch']} or related specialization",
            responsibilities=r_info["responsibilities"],
            scoring_weights=json.dumps({
                "technical": 0.40,
                "problem_solving": 0.20,
                "communication": 0.15,
                "role_relevance": 0.15,
                "behavioral": 0.10
            }),
            is_active=True
        )
        db.add(job)
        db.commit()

    print(f"Successfully seeded {len(RECRUITER_DATA)} Recruiters across 20 distinct engineering branches with 0 candidate accounts.")
