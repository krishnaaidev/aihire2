# AIHire: Autonomous AI Interview & Intelligent Candidate Evaluation Platform

> **B.Tech Capstone Project — Academic Session 2026**  
> **Submitted By:** Suman Krishna (Roll: 2301275) & Shivam Kumar Chaubey (Roll: 2301267)  
> **Under the Guidance of:** Er. Sukhdayal (Assistant Professor)  
> **Institution:** CT Institute of Engineering, Management and Technology (I.K.G. Punjab Technical University)

---

## 🌟 Overview & Synopsis Alignment

**AIHire** is a modern, end-to-end recruitment decision-support system that combines Large Language Models (LLMs), Natural Language Processing (NLP), Speech Recognition, Semantic Similarity, and automated multi-parameter evaluation techniques.

The platform addresses conventional hiring challenges (repetitive screening, manual inconsistencies, delays in feedback) while preserving human oversight for final decisions (as stated in Section 17 of the project synopsis).

---

## 🏗️ Architecture & Modules (Synopsis Section 8)

| Module | Synopsis Section | Implementation Details |
|---|---|---|
| **User Authentication** | Section 8.1 | Role-based authorization (`recruiter`, `candidate`, `admin`) using JWT Bearer tokens and bcrypt password hashing. |
| **Job Management** | Section 8.2 | Job posting, updates, requirements extraction, and configurable weighted scoring. |
| **Resume Processing** | Section 8.3 | PDF & text resume parser with 150+ technology taxonomy, contact info regex, and structured section extraction. |
| **Candidate Matching** | Section 8.4 | Hybrid matcher combining exact skill set overlap, TF-IDF, and Cosine similarity vectors. |
| **Question Generator** | Section 8.5 | Personalized questions across Technical, Conceptual, Scenario, Project, and Behavioral categories. |
| **Interview Engine** | Section 8.6 | Real-time adaptive interview room supporting dynamic follow-up questions based on previous answers. |
| **Speech Processing** | Section 8.7 | Real-time speech-to-text and text-to-speech voice interaction via Web Speech API & Whisper architecture. |
| **Answer Evaluator** | Section 8.8 | Evaluates answers across 5 parameters: **Relevance, Accuracy, Completeness, Reasoning, and Communication**. |
| **Candidate Scoring** | Section 8.9 | Configurable weighted scoring engine (Default: Technical 40%, Problem Solving 20%, Communication 15%, Role Relevance 15%, Behavioral 10%). |
| **Report Generation** | Section 8.10 | Comprehensive dossier with score rings, strengths, areas for improvement, question-by-question analysis, and hiring recommendations. |
| **Recruiter Dashboard** | Section 8.11 | Recruiter portal with candidate filtering, status updates, exportable reports, and **Side-by-Side Candidate Comparison**. |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Python 3.10+** (Python 3.14 compatible)
- **Node.js 18+** & **npm**

### 2. Fast Launch (One Command)
Run the automated runner script to launch both backend and frontend:
```bash
./run.sh
```
- **Web Application:** `http://localhost:5173`
- **FastAPI Documentation (Swagger UI):** `http://localhost:8000/docs`
- **Backend API:** `http://localhost:8000/api`

---

## 🔑 Recruiter Accounts Across 20 Engineering Branches

The database is seeded with **20 specialized recruiters** spanning 20 distinct technical branches and fields, each managing dedicated job requisitions. **Zero pre-seeded candidates** exist to provide a clean testing environment for new evaluations.

**Default Password for all recruiters:** `password123`

| # | Recruiter Name | Branch / Discipline | Specialized Field | Login Email |
|---|---|---|---|---|
| 1 | **Dr. Rajesh Sharma** | Computer Science & Engineering | Artificial Intelligence & Machine Learning | `rajesh.ai@aihire.com` |
| 2 | **Priya Patel** | Information Technology | Cloud Architecture & DevOps | `priya.cloud@aihire.com` |
| 3 | **Amit Verma** | Information Security & Cyber Defense | Cybersecurity & Ethical Hacking | `amit.cyber@aihire.com` |
| 4 | **Sneha Reddy** | Software Engineering | Full Stack Web Systems | `sneha.fullstack@aihire.com` |
| 5 | **Vikram Malhotra** | Data Science & Engineering | Data Engineering & Big Data Analytics | `vikram.data@aihire.com` |
| 6 | **Ananya Sen** | Mobile Computing | Mobile App Development | `ananya.mobile@aihire.com` |
| 7 | **Rohit Kapoor** | Electronics & Communication | Embedded Systems & IoT | `rohit.iot@aihire.com` |
| 8 | **Meera Nair** | Distributed Systems | Blockchain & Decentralized Protocols | `meera.web3@aihire.com` |
| 9 | **Arjun Singhania** | Mechatronics & Robotics | Autonomous Navigation & Robotics | `arjun.robotics@aihire.com` |
| 10 | **Pooja Joshi** | Human-Computer Interaction | UI/UX & Frontend Architecture | `pooja.frontend@aihire.com` |
| 11 | **Karan Bhatia** | Systems Engineering | Site Reliability & Automation QA | `karan.sre@aihire.com` |
| 12 | **Dr. Sunita Rao** | Biotechnology Engineering | Bioinformatics & HealthTech Software | `sunita.healthtech@aihire.com` |
| 13 | **Devendra Mehta** | Financial Engineering | FinTech & Quantitative Trading | `devendra.fintech@aihire.com` |
| 14 | **Ritu Aggarwal** | Applied Computing | Computer Vision & Visual AI | `ritu.computervision@aihire.com` |
| 15 | **Gaurav Nanda** | Network & Communications | Telecommunications & 5G Systems | `gaurav.networks@aihire.com` |
| 16 | **Neha Kulkarni** | Interactive Media & Graphics | Game Engine & Spatial Computing | `neha.gamedev@aihire.com` |
| 17 | **Sandeep Yadav** | Enterprise Information Systems | Enterprise Systems & Microservices | `sandeep.erp@aihire.com` |
| 18 | **Shalini Menon** | Cognitive Science & Computing | NLP & Generative AI | `shalini.nlp@aihire.com` |
| 19 | **Tarun Chawla** | Aerospace Engineering | Aerospace Flight Software & Avionics | `tarun.avionics@aihire.com` |
| 20 | **Alok Deshmukh** | VLSI & Microelectronics | Semiconductor & Chip Verification | `alok.vlsi@aihire.com` |

*(Recruiter quick selection dropdown is available on the Login page for convenient testing)*

---

## 🧪 Testing Strategy (Synopsis Section 21)

To run the automated backend test suite:
```bash
PYTHONPATH=backend ./venv/bin/pytest backend/tests
```
Tests cover:
- Password hashing & JWT token validation (`test_auth.py`)
- Candidate hybrid skill matching & TF-IDF similarity (`test_matcher.py`)
- 5-criteria answer evaluation (`test_evaluator.py`)
- Configurable scoring weights calculation (`test_scoring.py`)

---

## 🐳 Docker Deployment (Synopsis Section 9.6)

Run with Docker Compose:
```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`

---

## 📂 Project Directory Structure

```
AIHire2/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI application & startup seeder
│   │   ├── config.py                  # Settings & environment variables
│   │   ├── database.py                # SQLAlchemy DB engine & session
│   │   ├── models/                    # DB entities: User, Job, Candidate, Interview, Report...
│   │   ├── schemas/                   # Pydantic schemas for request/response validation
│   │   ├── api/                       # Modular REST & WebSocket routers
│   │   ├── services/                  # AI Provider, Parser, Matcher, Evaluator, Scoring...
│   │   └── utils/                     # Security, JWT, seed data
│   ├── tests/                         # Pytest test suite
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/                # Navbar, Footer, ProtectedRoute
│   │   ├── context/                   # AuthContext with JWT session management
│   │   ├── pages/                     # Landing, Dashboard, Candidate Portal, Interview Room...
│   │   ├── services/api.js            # REST API client
│   │   ├── App.jsx                    # Client-side router
│   │   └── main.jsx
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── run.sh                             # Fast startup script
└── README.md
```

---

## 🌐 Deploy to a Live Website (1-Click via GitHub)

### Method 1: Deploy Full-Stack on Render (Free, 2 Minutes)
1. Go to **[Render.com](https://dashboard.render.com/)** and sign in with GitHub.
2. Click **New +** > **Blueprint** (or **Web Service**).
3. Connect your repository: `https://github.com/krishnaaidev/aihire2`.
4. Render will automatically detect [`render.yaml`](render.yaml):
   - **Build Command:** `./build.sh` (builds the React frontend and installs Python backend)
   - **Start Command:** `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Click **Apply / Create**.
6. Render will build and launch your live website on a public URL: `https://aihire.onrender.com`!

### Method 2: Deploy Frontend on Vercel
1. Go to **[Vercel.com](https://vercel.com/)** and log in with GitHub.
2. Click **Add New...** > **Project** and select `aihire2`.
3. Vercel automatically uses [`vercel.json`](vercel.json).
4. Click **Deploy**. Your frontend is live instantly at `https://aihire2.vercel.app`.

---

## 🛡️ Limitations and Ethical Considerations (Synopsis Section 17)
AIHire is engineered as a **decision-support platform**, not an autonomous hiring authority. Final hiring decisions, shortlisting, and candidate communications remain under qualified human supervisor review.

