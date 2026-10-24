# Testora Quiz — Complete Project Documentation & Technical Overview

---

## 1. Project Executive Summary

**Testora Quiz** is an enterprise-grade, AI-powered Examination, Dynamic Question Studio, Live Anti-Cheat Proctoring, and Student Learning Analytics SaaS platform. Designed for schools, universities, and training institutes, it automates the assessment lifecycle from syllabus document ingestion to automatic grading.

---

## 2. Technical Stack Summary

| Layer | Technology | Key Details |
|---|---|---|
| **Frontend Framework** | **Next.js 15 (App Router)** | React 19, Server & Client Components |
| **Language** | **TypeScript** | Strict typing across API clients and stores |
| **Styling** | **Tailwind CSS v4** | Responsive UI, dark/light theme tokens |
| **State Management** | **Zustand** | Auth store (`authStore.ts`) & exam answers/timer autosave (`examStore.ts`) |
| **Formula Rendering** | **KaTeX** | Real-time LaTeX/KaTeX mathematical and scientific notation support |
| **Backend Framework** | **FastAPI (Python 3.11+)** | Async REST APIs, high-performance request handling |
| **ASGI Server** | **Uvicorn / Gunicorn** | Async worker process manager |
| **Real-Time Layer** | **Native WebSockets** | Live anti-cheat telemetry streaming (`/api/v1/attempts/ws/teacher/{exam_id}`) |
| **Database & ORM** | **SQLAlchemy 2.0** | Relational mapping with foreign-key cascades |
| **Database Engines** | **SQLite / PostgreSQL** | Local development (`quiz.db`) / Production (PostgreSQL) |
| **Migrations** | **Alembic** | Version-controlled schema migrations up to head revision |
| **AI / RAG Pipeline** | **Google Gemini AI** | `gemini-1.5-flash` & `text-embedding-004` vector embeddings |
| **Vector Search** | **Cosine Similarity Index** | In-memory semantic chunk search for RAG grounding |
| **Document Parsers** | **PyPDF, python-docx, python-pptx** | Full-file ingestion of PDF, DOCX, PPTX, TXT, CSV |
| **Authentication** | **JWT & Google OAuth 2.0** | OAuth2 Bearer tokens, Bcrypt password hashing |
| **Email Service** | **Amazon SES / Resend / SendGrid** | SMTP over SSL (Port 465) / STARTTLS (Port 587) & HTTP APIs |

---

## 3. High-Level Architecture & Modules

```
                    ┌─────────────────────────┐
                    │    Next.js 15 Client    │
                    │   (Teacher & Student)   │
                    └────────────┬────────────┘
                                 │ HTTP / WebSockets
                                 ▼
                    ┌─────────────────────────┐
                    │     FastAPI Server      │
                    │        (:8000)          │
                    └──────┬──────────┬───────┘
                           │          │
         ┌─────────────────┴─┐      ┌─┴────────────────┐
         ▼                   ▼      ▼                  ▼
┌──────────────────┐  ┌───────────┐ ┌──────────────┐ ┌──────────────┐
│  SQLAlchemy ORM  │  │ File RAG  │ │ Gemini GenAI │ │ WebSockets   │
│ (SQLite / Postgre│  │ (Embeddings│ │ (Questions & │ │ (Anti-Cheat  │
│      DB)         │  │ & Chunks) │ │ Subjective)  │ │ Telemetry)   │
└──────────────────┘  └───────────┘ └──────────────┘ └──────────────┘
```

### Key Modules:

### 3.1 RAG Knowledge Base & Document Ingestion
- Upload syllabus documents, textbooks, lecture slides, and notes.
- Supported formats: PDF, DOCX, PPTX, TXT, CSV, MD, JSON.
- Vector indexing: Chunks text with overlapping boundaries and indexes embeddings for semantic similarity search.

### 3.2 Dynamic AI Assessment Generator
- Generates balanced Multiple Choice Questions (MCQ), True/False, and Subjective questions grounded strictly in the Knowledge Base.
- Strict count adherence and KaTeX formula preservation (`$...$` and `$$...$$`).

### 3.3 Interactive AI Question Studio
- Modal allowing inline editing of question text, option choices, correct answers, and marks allocation.
- **Single-Question AI Re-Roll**: One-click regeneration of individual questions using Knowledge Base context.

### 3.4 Live Anti-Cheat Proctoring Command Center
- **Isolated Exam Sandbox**: Fullscreen enforcement, tab-switch detection, copy-paste prevention, developer tools blocking, and window blur tracking.
- **Live WebSocket Feed**: Real-time event streaming broadcasting red-flag alerts to teachers with remote test termination capabilities.

### 3.5 Automated Grading & Analytics
- Instant grading for objective questions (MCQ / True-False) with configurable negative marking.
- AI evaluation of subjective answers against rubrics.
- Cohort score distributions, pass rates, topic mastery heatmaps, and comprehensive gradebooks.

---

## 4. Directory Structure

```
Testora_Quiz_DEP/
├── backend/
│   ├── app/
│   │   ├── api/            # Route controllers (auth, exams, attempts, kb, reports, students)
│   │   ├── models/         # SQLAlchemy DB models (user, exam, question, candidate, etc.)
│   │   ├── schemas/        # Pydantic validation schemas
│   │   ├── services/       # AI service, RAG engine, email service, storage
│   │   ├── utils/          # Security, rate limiter, timezone helpers
│   │   ├── config.py       # Pydantic Settings & environment variables
│   │   ├── database.py     # Database engine & session maker
│   │   └── main.py         # FastAPI application entrypoint & startup seed
│   ├── alembic/            # Database migration scripts
│   ├── tests/              # End-to-end and load test suites
│   ├── .env                # Backend secrets (DB, Gemini, SMTP, Google Auth)
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── app/                # Next.js 15 App Router pages & routes
│   │   ├── dashboard/      # Teacher & Student dashboards
│   │   ├── exam/           # Exam sandbox & instructions
│   │   ├── login/          # Authentication & Google OAuth
│   │   └── page.tsx        # Landing portal page
│   ├── components/         # Reusable UI components (Calculator, MathText, Toast)
│   ├── store/              # Zustand state stores (authStore, examStore)
│   ├── lib/                # API fetch helpers & utilities
│   ├── .env.local          # Frontend public variables (API URL, Google Client ID)
│   └── package.json        # Node.js dependencies
├── docs/                   # Project documentation
├── docker-compose.yml      # Containerized deployment config
├── README.md               # Quick overview
└── RUNNING_GUIDE.md        # Detailed running guide
```

---

## 5. Local Setup & How to Run

### Prerequisites
- **Python**: `3.9+` (Tested on `3.11.4`)
- **Node.js**: `18.0+` (Tested on `v22.17.0`)
- **npm**: `9.0+` (Tested on `10.9.2`)

---

### Step 1: Start Backend Server (FastAPI)

Open a terminal and run:

```powershell
cd "C:\Users\ROHIT SHAHARE\Desktop\Testora_Quiz_DEP\backend"
..\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

> **Backend URL**: [http://localhost:8000](http://localhost:8000)  
> **API Docs (Swagger UI)**: [http://localhost:8000/docs](http://localhost:8000/docs)  
> **Health Check Endpoint**: [http://localhost:8000/health](http://localhost:8000/health)

---

### Step 2: Start Frontend Server (Next.js)

Open a second terminal and run:

```powershell
cd "C:\Users\ROHIT SHAHARE\Desktop\Testora_Quiz_DEP\frontend"
npm run dev
```

> **Frontend Application URL**: [http://localhost:3000](http://localhost:3000)

---

## 6. Default Login Credentials

Initial data is automatically seeded upon first database launch:

| Role | Email | Password | Access Portal |
|---|---|---|---|
| **Teacher Studio** | `teacher@aegeus.edu` | `securepassword` | [http://localhost:3000/dashboard/teacher](http://localhost:3000/dashboard/teacher) |
| **Student Portal** | `student@aegeus.edu` | `securepassword` | [http://localhost:3000/dashboard/student](http://localhost:3000/dashboard/student) |

---

## 7. Environment Variables Reference

### Backend (`backend/.env`):
```env
# Database
DATABASE_URL="sqlite:///quiz.db"

# Security & CORS
SECRET_KEY="super-secret-key-testora-quiz-local-dev-2026"
FRONTEND_URL="http://localhost:3000"

# AI Service
GEMINI_API_KEY="your-gemini-api-key"

# Email Configuration (Amazon SES / SMTP)
SMTP_HOST="email-smtp.ap-southeast-2.amazonaws.com"
SMTP_PORT=465
SMTP_USER="your-smtp-username"
SMTP_PASSWORD="your-smtp-password"
EMAILS_FROM_EMAIL="support@testoraquiz.com"
EMAILS_FROM_NAME="TestoraQuiz Examination System"

# Google OAuth
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"

# Razorpay Payment Gateway
RAZORPAY_KEY_ID="rzp_test_..."
RAZORPAY_KEY_SECRET="..."
```

### Frontend (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_..."
```

---

## 8. Primary API Endpoints Taxonomy

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/login` | Authenticate user & issue JWT |
| `POST` | `/api/v1/auth/forgot-password` | Request password reset email |
| `GET` / `POST` | `/api/v1/students/` | Manage student roster directory |
| `GET` | `/api/v1/students/assigned-exams` | Student active & scheduled test feed |
| `POST` | `/api/v1/kb/upload` | Upload & chunk whole syllabus file |
| `GET` | `/api/v1/kb/documents` | List indexed subject documents |
| `POST` | `/api/v1/exams/generate-from-kb` | Dynamic AI Question generation |
| `PUT` | `/api/v1/exams/{id}/questions` | Question Studio save & marks recalculation |
| `POST` | `/api/v1/exams/{id}/regenerate-question` | Single-question AI re-roll |
| `POST` | `/api/v1/exams/{id}/publish` | Publish assessment live to candidates |
| `POST` | `/api/v1/exams/{id}/credentials` | Generate candidate access passcodes |
| `POST` | `/api/v1/attempts/login` | Candidate passcode login to exam sandbox |
| `GET` | `/api/v1/attempts/exam-info` | Fetch candidate test paper |
| `POST` | `/api/v1/attempts/save-progress` | Autosave responses in real time |
| `POST` | `/api/v1/attempts/proctor-alert` | Log anti-cheat violation event |
| `POST` | `/api/v1/attempts/submit` | Final submission & instant automated grading |
| `WS` | `/api/v1/attempts/ws/teacher/{exam_id}` | Real-time teacher proctoring event stream |
| `GET` | `/api/v1/reports/exam-analytics/{id}` | Class-wide analytics & gradebook |
| `GET` | `/api/v1/payments/plans` | Fetch available subscription plans |
| `POST` | `/api/v1/payments/create-order` | Generate Razorpay order for subscription |
| `POST` | `/api/v1/payments/verify-payment` | Verify HMAC-SHA256 signature & activate plan |
| `GET` | `/api/v1/payments/history` | View teacher payment transactions |

