# QuickStart & Running Guide

Detailed step-by-step instructions for starting, running, and operating the **AI Dynamic Examination & Student Management System**.

---

## 📋 System Prerequisites

Before starting, ensure you have the following installed on your machine:
- Python `3.9+`
- Node.js `18.0+`
- npm `9.0+`

---

## 🚀 How to Start Manually (Local Development)

To run the complete system, you will start two servers in separate terminal windows:
1. **Backend Server** (FastAPI on Port `8000`)
2. **Frontend Server** (Next.js on Port `3000`)

---

### Terminal 1: Backend Server (FastAPI)

1. Open your terminal and navigate to the project root directory:
   ```bash
   cd /Users/meet/Desktop/quiz_application
   ```

2. Activate the Python virtual environment:
   ```bash
   source venv/bin/activate
   ```

3. Ensure environment variables are loaded in `backend/.env`:
   ```env
   GEMINI_API_KEY=your-gemini-api-key-here
   SECRET_KEY=super-secret-key-change-in-production
   DATABASE_URL=sqlite:///./quiz.db
   ```

4. Launch the FastAPI Uvicorn server:
   ```bash
   cd backend
   python -m uvicorn app.main:app --reload --port 8000
   ```

> **Confirmation**: The backend is running when you see `Application startup complete` and server process started on `http://127.0.0.1:8000`.

---

### Terminal 2: Frontend Server (Next.js)

1. Open a second terminal window and navigate to the frontend directory:
   ```bash
   cd /Users/meet/Desktop/quiz_application/frontend
   ```

2. Start the Next.js development server:
   ```bash
   npm run dev
   ```

> **Confirmation**: The frontend is running when you see `Ready in ...` on `http://localhost:3000`.

---

## 🔑 Login Credentials

The system seeds default accounts automatically on initial startup:

| Account Type | Email | Password | Quick Action Button |
|---|---|---|---|
| **Teacher Studio** | `teacher@aegeus.edu` | `securepassword` | ⚡ *Fill Teacher Creds* |
| **Student Portal** | `student@aegeus.edu` | `securepassword` | 🎓 *Fill Student Creds* |

---

## 🌐 Application URLs

| Interface | URL | Description |
|---|---|---|
| **Main Portal Login** | [http://localhost:3000](http://localhost:3000) | Main sign-in screen for teachers and students |
| **Teacher Studio** | [http://localhost:3000/dashboard/teacher](http://localhost:3000/dashboard/teacher) | Full teacher hub (create exams, upload RAG docs, student directory) |
| **Student Portal** | [http://localhost:3000/dashboard/student](http://localhost:3000/dashboard/student) | Student hub (view live exams, past scorecards, performance overview) |
| **Direct Exam Portal** | `http://localhost:3000/exam/{EXAM_CODE}` | Isolated exam portal requiring exam session credentials |
| **API Documentation** | [http://localhost:8000/docs](http://localhost:8000/docs) | Swagger UI for exploring backend endpoints |
| **Health Check** | [http://localhost:8000/health](http://localhost:8000/health) | System health status JSON |

---

## 📖 Feature & Operations Walkthrough

### 1. Uploading Study Materials (RAG Vector Indexing)

1. Log into **Teacher Studio** (`teacher@aegeus.edu`).
2. Click the **📚 Subject Knowledge Base** tab.
3. Enter a Subject Code (e.g. `biology_101`).
4. Select a file (`.pdf`, `.docx`, `.pptx`, `.txt`, `.csv`, `.png`, `.jpg`).
5. Click **`Index Material into Vector DB`**.
   *The system extracts text, chunks it, and generates embeddings for AI question retrieval.*

---

### 2. Creating an AI Exam Paper

1. In Teacher Studio, click the **📝 Create & Schedule Quiz** tab.
2. Enter **Subject Name** and **Quiz Title**.
3. Configure **Time Limit (mins)**, **Total Marks**, and optional **Schedule Window** (Start & End date/time).
4. Configure **Question Blueprint**:
   - Number of MCQs and Subjective questions
   - Question Type (MCQ, Subjective, True/False, Mixed)
   - Difficulty Level (Easy, Medium, Hard)
   - Topic Keyword (e.g., `Photosynthesis`)
5. Click **`Generate Non-Repeating Questions from Subject KB`**.
   *Questions will be compiled using RAG context from indexed documents.*

---

### 3. Publishing Exams & Exporting Credentials

1. Locate the generated exam card under **Question Papers & Live Links**.
2. Click **`Question Paper Review`** to inspect compiled questions, options, and answers.
3. Click **`Publish`** to make the exam live.
4. Click **`🔑 Gen Creds`** to generate student login credentials.
5. Click **`📥 CSV`** to download the `credentials_{exam_name}.csv` file containing student usernames and passwords.

---

### 4. Taking an Exam (Student View)

1. Navigate to the exam link: `/exam/{EXAM_CODE}`.
2. Enter the student's exam username (e.g., `std_alex_45741`) and 6-digit passcode.
3. Features available during the test:
   - **Live Countdown Timer Bar**: Sticky timer at top turning red under 5 minutes.
   - **Question Palette Grid**: Numbered grid tracking Answered (green), Flagged (amber), and Unanswered items.
   - **Flag for Review**: Bookmark questions to revisit before submitting.
   - **Proctoring Protection**: Tab switches, window resizes, or copy-paste attempts trigger security warnings.
4. Click **`Finish Exam`** and confirm submission.

---

### 5. Downloading Response Booklet with Correct Answers

After a student completes an exam:
- **Immediate Download**: Right after submission, click **`📄 Download / Print Response Booklet`** on the completion screen.
- **From Student Dashboard**: Under **Past Examination History**, click **`View Report`** → **`📄 Download Printable Response Booklet (PDF)`**.
- **From Teacher Studio**: In **Gradebook & Analytics**, view submission details and print response sheets.

> The response booklet includes: Student Info, Score & Percentage, Student's Selected Answers (green ✓ for correct, red ✕ for wrong), Official Correct Answers, Detailed Explanations, and AI Rubric Feedback.

---

### 6. Bulk Importing Students via CSV

1. In Teacher Studio, click the **👥 Student Roster & CSV** tab.
2. Under **Bulk Import from CSV**, choose a `.csv` file with the following headers:
   ```csv
   full_name,email,roll_number,division,batch
   John Doe,john@school.edu,CS-2024-002,A,2024-2028
   Jane Smith,jane@school.edu,CS-2024-003,A,2024-2028
   ```
3. Click **`Import Students from CSV`**.

---

## 🛠️ Troubleshooting & Commands

- **Check Server Status**:
  ```bash
  curl http://localhost:8000/health
  ```
  Returns `{"status":"healthy","database":"ok","ai_engine":"enabled"}`.

- **Re-creating Database / Resetting Data**:
  To start with fresh database tables, stop the backend server and remove the database file:
  ```bash
  rm backend/quiz.db
  ```
  On next backend server start, tables and initial seed data will be recreated automatically.

---

## 💳 Mandatory Per-Test Razorpay Payment System

### 1. Business Logic & Pricing Architecture
Testora Quiz enforces mandatory payment for every assessment before it can be published, distributed, or taken:
- **Free Drafting**: Instructors can freely synthesize, edit, and save exams as drafts.
- **Mandatory Enforcement**: An exam **cannot** be published, student credentials/passcodes **cannot** be generated, email invitations **cannot** be dispatched, WhatsApp share links **cannot** be generated, and students **cannot** log in until payment is verified on the backend.
- **Billing Formula**:
  $$\text{Billable Units} = \text{student\_count} \times \text{question\_count}$$
  - Default rate: `PRICE_PER_UNIT_PAISE = 10` (₹0.10 per student-question unit).
  - Configurable in `backend/app/config.py` or `backend/.env`.
  - GST: 18% automatically calculated and itemized on tax invoice.
  - Razorpay order minimum: ₹1.00 (`MIN_ORDER_AMOUNT_PAISE = 100`).
- **Configuration Expansion (Delta Top-up)**:
  If a teacher adds more questions or enrolls additional candidates after paying, the system detects the unit expansion and requires a delta top-up before re-publishing or issuing new passcodes.
- **Cryptographic Verification**:
  Server-side HMAC-SHA256 signature verification ensures no client-side spoofing can unlock an exam. Duplicate callbacks and webhook retries are strictly idempotent.

---

### 2. Razorpay Mode Configuration

#### Test Mode (Sandbox / Local Dev)
1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. Switch toggle in header from **Live Mode** to **Test Mode**.
3. Navigate to **Settings** → **API Keys** → **Generate Test Key**.
4. Configure in `backend/.env`:
   ```env
   RAZORPAY_KEY_ID="rzp_test_YourTestKeyId"
   RAZORPAY_KEY_SECRET="YourTestKeySecret"
   RAZORPAY_WEBHOOK_SECRET="YourTestWebhookSecret"
   ```
5. In development/testing environments where no live key is set, the system automatically enables **local simulation mode**, prompting a dialog to simulate authorization and verify HMAC signatures seamlessly.

#### Live Mode (Production)
1. Complete Razorpay KYC and activate business account.
2. Switch toggle to **Live Mode**.
3. Navigate to **Settings** → **API Keys** → **Generate Live Key**.
4. Configure production environment variables in your server / container hosting:
   ```env
   RAZORPAY_KEY_ID="rzp_live_YourLiveKeyId"
   RAZORPAY_KEY_SECRET="YourLiveKeySecret"
   RAZORPAY_WEBHOOK_SECRET="YourLiveWebhookSecret"
   ```
5. **Never** expose `RAZORPAY_KEY_SECRET` or `RAZORPAY_WEBHOOK_SECRET` in frontend files or `.env.local`.

---

### 3. Razorpay Webhook Configuration
Webhooks allow asynchronous reconciliation if a customer closes their browser before the redirect completes:
1. In the Razorpay Dashboard, navigate to **Settings** → **Webhooks** → **Add New Webhook**.
2. **Webhook URL**:
   ```
   https://api.yourdomain.com/api/v1/payments/webhook
   ```
3. **Secret**: Enter your `RAZORPAY_WEBHOOK_SECRET`.
4. **Active Events**:
   - `order.paid`
   - `payment.captured`
   - `payment.failed`
5. Click **Create Webhook**. The backend verifies raw request body HMAC-SHA256 signatures and handles duplicate deliveries idempotently.

---

### 4. Running Automated Test Suites
All test suites are unified under the root [tests/](file:///c:/Users/ROHIT%20SHAHARE/Desktop/Testora_Quiz_DEP/tests) directory.

**Option A (1-Click Runner)**:
Double-click `run_tests.bat` in the project root.

**Option B (Command Line from Project Root)**:
```bash
# Run all tests
.\venv\Scripts\python.exe -m pytest tests/ -v

# Run payment and credit wallet suite
.\venv\Scripts\python.exe -m pytest tests/test_exam_payment_system.py -v

# Run multi-tenant SaaS suite
.\venv\Scripts\python.exe -m pytest tests/test_saas_features.py -v
```
All integration, security, and payment tests will execute and report passing assertions.

