# 📘 TESTORAQUIZ – COMPLETE PLATFORM USER MANUAL & MASTER GUIDE
### The Ultimate Step-by-Step Operating Guide for Teachers, Students, Administrators & Candidates

**Platform Website**: [https://testoraquiz.com](https://testoraquiz.com)  
**Version**: 2.5 Enterprise Edition  
**Author**: TestoraQuiz Architecture & Engineering Team  
**Document Purpose**: Ready-to-print Master Markdown Document for PDF Export  

---

## 📑 TABLE OF CONTENTS

1. [Platform Overview & Core Architecture](#1-platform-overview--core-architecture)
2. [User Roles & Authentication Flow](#2-user-roles--authentication-flow)
   - 2.1 Choose Mode (Teacher vs. Student)
   - 2.2 Account Registration & Email Verification
   - 2.3 Sign In, Google OAuth & Role Persistence
   - 2.4 Secure Sign Out & Session Purging
3. [Instructor Studio: End-to-End Exam Creation](#3-instructor-studio-end-to-end-exam-creation)
   - 3.1 Step 1: Knowledge Source & Assessment Context
   - 3.2 Step 2: Question Blueprint, Bloom Taxonomy & Difficulty
   - 3.3 Step 3: Duration, Marks, Anti-Cheat Rules & Schedule
   - 3.4 Step 4: AI Synthesis, Blueprint Review & Publishing
4. [Question Studio & Assessment Formatting](#4-question-studio--assessment-formatting)
   - 4.1 Manual Question Authoring & Editing
   - 4.2 KaTeX Mathematical Formulas & Chemical Notations
   - 4.3 Image & Diagram Attachments
   - 4.4 Answer Keys, Hints & Detailed Explanations
5. [Question Paper Generation, PDF Export & Printing](#5-question-paper-generation-pdf-export--printing)
   - 5.1 Multi-Column Layout Formatting
   - 5.2 Header Branding, Watermarks & Instructions
   - 5.3 Instant Print-Ready PDF Generation
6. [Candidate Management & Passcode Credentials](#6-candidate-management--passcode-credentials)
   - 6.1 Creating & Managing Student Rosters (CSV / Manual)
   - 6.2 Generating Unique Candidate Passcodes (Username & 6-Digit PIN)
   - 6.3 Distributing Passcodes via One-Click Copy & WhatsApp
7. [Candidate Portal: The Examination Experience](#7-candidate-portal-the-examination-experience)
   - 7.1 Accessing Scheduled & Available Assessments
   - 7.2 Exam Instructions, Honor Code & Camera Check
   - 7.3 Candidate HUD: Timer, Question Palette & Answer Autosave
   - 7.4 Network Interruption Recovery & Offline Protection
   - 7.5 Exam Submission & Auto-Submit on Timeout
8. [Anti-Cheat Proctoring Radar & Live Monitoring](#8-anti-cheat-proctoring-radar--live-monitoring)
   - 8.1 Real-Time Live Proctoring Dashboard
   - 8.2 Tab Switch & Window Blur Detection
   - 8.3 Multi-Face & Missing Face AI Detection
   - 8.4 Automated Cheating Incident Logs & Evidence Flags
9. [Automated Grading, Gradebook & Analytics](#9-automated-grading-gradebook--analytics)
   - 9.1 Instant MCQ Auto-Grading & Subjective AI Scoring
   - 9.2 Comprehensive Gradebook & Cohort Statistics
   - 9.3 Student Diagnostic Reports & Peer Benchmarking
   - 9.4 Question-by-Question Solution Reviews
10. [Verifiable Digital Certificates & Credentials](#10-verifiable-digital-certificates--credentials)
    - 10.1 Certificate Activation & Passing Thresholds
    - 10.2 Customizing Signatories, Signatures & Digital Seals
    - 10.3 QR-Code Authentication & Public Verification Portal
    - 10.4 High-Resolution PDF Certificate Generation
11. [AI Form Studio & Custom Form Builder](#11-ai-form-studio--custom-form-builder)
    - 11.1 Creating Interactive Registration & Survey Forms
    - 11.2 Editing Choice Options, Dropdowns & Photo Attachments
    - 11.3 Theme Styling, Custom Slugs & Public Form Links
    - 11.4 Response Collection & Excel / CSV Export
12. [Mock Test Library & Placement Arena](#12-mock-test-library--placement-arena)
    - 12.1 Practicing Curated Mock Tests (JEE, NEET, Gate, Govt Exams)
    - 12.2 Corporate Placement Tests (TCS, Infosys, Wipro, Cognizant)
    - 12.3 Performance Percentiles & Detailed Solution Explanations
13. [Study Materials & Placement Knowledge Base](#13-study-materials--placement-knowledge-base)
    - 13.1 DSA Problem Solving Roadmaps & Cheat Sheets
    - 13.2 Company-Wise Interview Questions & Notes
    - 13.3 Subject Notes & Reference PDF Downloads
14. [Billing, Wallet Credits & Coupon Engine](#14-billing-wallet-credits--coupon-engine)
    - 14.1 How Credits Work (Exams, Certificates & AI Generation)
    - 14.2 Free Starter Credits & Referral Bonuses
    - 14.3 Purchasing Plans via Razorpay Payment Gateway
    - 14.4 Applying Promo Codes & Institution Vouchers
15. [Settings, UI Personalization & Support Desk](#15-settings-ui-personalization--support-desk)
    - 15.1 Dark Mode / Light Mode Theming
    - 15.2 Share Experience, Bug Reporting & Support Desk
16. [Frequently Asked Questions (FAQ) & Troubleshooting](#16-frequently-asked-questions-faq--troubleshooting)

---

## 1. PLATFORM OVERVIEW & CORE ARCHITECTURE

**TestoraQuiz** is an advanced, high-performance, AI-driven assessment ecosystem created to simplify how educational institutions, professors, corporate recruiters, and students conduct, proctor, and evaluate examinations.

### Key Architectural Highlights
- **Sub-Second Fast**: Built with Next.js 14 frontend and high-concurrency Python 3.11 FastAPI backend.
- **Bank-Grade Proctoring**: Real-time client telemetry detecting tab switches, multi-screen navigation, face loss, and suspicious behavior.
- **Mathematical KaTeX Rendering**: Complete native support for complex STEM formulas, fractions, matrices, and chemical reactions.
- **Verifiable Proof**: Every issued certificate contains a cryptographically tamper-proof QR code verifiable in any browser without logging in.
- **Google Forms-Style Custom Forms**: Build surveys, recruitment forms, and registration sheets with rich image attachments.

---

## 2. USER ROLES & AUTHENTICATION FLOW

TestoraQuiz strictly separates **Teacher / Instructor** accounts from **Student / Candidate** accounts to ensure data isolation and safety.

### 2.1 Choose Mode (Teacher vs. Student)
1. Open [https://testoraquiz.com](https://testoraquiz.com) and click **Get Started** or visit `/portal`.
2. You will see two interactive cards:
   - **Teacher Mode**: Designed for faculty, coaching institutions, deans, and exam coordinators. Enables AI exam synthesis, live proctoring, gradebooks, certificates, and student rosters.
   - **Student Mode**: Designed for candidates taking tests, exploring the free Mock Test Library, accessing company placement materials, and downloading verified certificates.
3. Click the card of your chosen role (a blue ring and checkmark will confirm your selection) and click **Continue to Sign In**.

### 2.2 Account Registration & Email Verification
1. On the Authentication page, toggle to the **Sign Up / Register** tab.
2. Fill in:
   - **Full Name**: e.g., `Dr. Jane Sharma` or `Vrushabh Gillarkar`
   - **Email Address**: e.g., `jane@institution.edu`
   - **Password**: Minimum 6 characters (alphanumeric + symbol recommended)
   - **Confirm Password**: Re-enter the exact password
3. Click **Create Account**.
4. An automated welcome email containing your verification credentials will be dispatched. Follow the link to activate your profile.

### 2.3 Sign In, Google OAuth & Role Persistence
- **Email + Password**: Enter your registered email and password. TestoraQuiz instantly routes you to `/dashboard/teacher` or `/dashboard/student` depending on your account role.
- **Sign In with Google**: Click **Continue with Google**. Select your Google profile. The system safely checks your preferred mode and signs you into your personalized workspace in milliseconds.
- **Remember Me**: Check this box to keep your email pre-filled on your trusted device.

### 2.4 Secure Sign Out & Session Purging
To protect student and instructor data on shared computers (cyber cafes or college labs):
1. Open the sidebar or mobile menu and click **Sign Out**.
2. TestoraQuiz executes a **3-tier purge**:
   - Clears active browser LocalStorage tokens.
   - Destroys persistent cookies.
   - Revokes backend HttpOnly refresh session tokens.
3. You can immediately log into another account (e.g. switching from Teacher to Student) without session conflicts.

---

## 3. INSTRUCTOR STUDIO: END-TO-END EXAM CREATION

The Instructor Studio allows educators to create a full 50-mark exam in under 60 seconds using syllabus grounding or AI prompts.

### Step-by-Step Exam Creation Workflow:

```
[ Step 1: Source & Title ] ➡️ [ Step 2: Blueprint & Bloom ] ➡️ [ Step 3: Anti-Cheat & Schedule ] ➡️ [ Step 4: AI Synthesis ]
```

### 3.1 Step 1: Knowledge Source & Assessment Context
1. Navigate to **Teacher Dashboard ➡️ Create Assessment**.
2. **Assessment Title**: Enter a clear name (e.g., `TCS Ninja - Quantitative Aptitude Test 1` or `Physics Unit 3 Mechanics`).
3. **Choose Knowledge Source Mode**:
   - **Mode A: AI Topic / Keyword**: Type any subject topic (e.g., `Thermodynamics Laws, Heat Engines and Entropy`). The AI uses deep academic knowledge to synthesize questions.
   - **Mode B: Upload Syllabus / Document**: Attach a `.pdf`, `.docx`, or `.txt` file (lecture notes, textbook chapter, or past year paper). The AI grounds questions strictly to your document.
   - **Mode C: Select Existing Knowledge Base**: Pick a collection previously uploaded to your repository.
4. Click **Continue to Questions ➡️**.

### 3.2 Step 2: Question Blueprint, Bloom Taxonomy & Difficulty
1. **Total Question Count**: Select 5, 10, 15, 20, 25 or custom questions.
2. **Question Formats**:
   - **Multiple Choice (MCQ)**: Single correct option among 4 choices.
   - **Subjective / Short Answer**: Theory questions requiring typed explanations.
3. **Difficulty Balance**:
   - **Easy**: Foundational definitions and basic concept recall.
   - **Medium**: Analytical application and standard numericals.
   - **Hard**: Multi-step derivations, edge cases, and high-order thinking.
4. **Bloom's Taxonomy Level**: Check tags such as *Remember*, *Understand*, *Apply*, *Analyze*, or *Evaluate*.
5. **Negative Marking**:
   - None (0 points deducted for wrong answers).
   - 0.25 (Standard 1/4th penalty).
   - 0.50 or custom deduction.
6. Click **Continue to Schedule ➡️**.

### 3.3 Step 3: Duration, Marks, Anti-Cheat Rules & Schedule
1. **Duration**: Set time limit in minutes (e.g. `30` min for 10 Qs, `60` min for 30 Qs).
2. **Total Marks & Passing Score**:
   - e.g. Total Marks: `50`, Passing Marks: `20` (40%).
3. **Target Candidate Cohort**:
   - Select a pre-configured **Student Directory** (e.g., `Class 12 - Science Batch A`) or leave open for direct code entry.
4. **Schedule Window**:
   - **Start Time**: When the exam unlocks for students.
   - **End Time**: Hard cut-off after which no candidate can submit.
5. **Anti-Cheat Proctoring Rules**:
   - Toggle **Proctor Radar**: Enables full-screen locking and background tab tracking.
   - Toggle **Strict Auto-Submit**: Automatically submits the test if the student commits 3 tab switches.
6. Click **Review Final Blueprint ➡️**.

### 3.4 Step 4: AI Synthesis, Blueprint Review & Publishing
1. Verify the summary card displaying:
   - Title, Duration, Question Count, Total Marks, Pass Mark.
2. Click **Generate & Publish Assessment**.
3. The platform synthesizes questions, creates answer keys with solutions, and immediately returns you to the **Live Assessments Table**.
4. A unique **6-digit Exam Code** (e.g., `EX-832-6155`) is generated instantly.

---

## 4. QUESTION STUDIO & ASSESSMENT FORMATTING

Educators have complete editorial control over every generated question.

### 4.1 Manual Question Authoring & Editing
1. In the **Live Assessments Table**, click `...` (Actions) ➡️ **Question Studio & Preview**.
2. Click any question card to edit:
   - Question title and problem prompt.
   - 4 Options (A, B, C, D).
   - Marking the correct option radio button.
   - Detailed rationale/explanation.
3. Click **Add Custom Question** to insert manual questions at any position.
4. Reorder questions using drag handles or order arrows.

### 4.2 KaTeX Mathematical Formulas & Chemical Notations
TestoraQuiz renders beautiful LaTeX equations natively:
- **Inline Math**: Wrap inside single dollar signs: `$E = mc^2$` or `$\frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$`.
- **Display Block Math**: Wrap inside double dollar signs:
  ```
  $$\int_{0}^{\infty} e^{-x^2} dx = \frac{\sqrt{\pi}}{2}$$
  ```
- **Chemical Formulas**: Write formulas such as `$2H_2 + O_2 \rightarrow 2H_2O$`.

### 4.3 Image & Diagram Attachments
- Click the **🖼️ Image Attachment** button on any question or individual option.
- Upload PNG, JPG, or SVG diagrams (circuit diagrams, geometric figures, graphs, or biological illustrations).
- The image renders crisp and centered on both mobile and laptop screens.

---

## 5. QUESTION PAPER GENERATION, PDF EXPORT & PRINTING

For physical classroom exams, TestoraQuiz transforms online quizzes into print-ready test papers.

### 5.1 Formatting Layout
- **Single Column**: Best for exams with large diagrams, math derivations, and reading passages.
- **Two Column Newspaper Layout**: Saves paper; optimal for objective standard tests.

### 5.2 Header Branding & Instructions
- Customizes your paper header with:
  - College / School Name & Logo.
  - Exam Name, Subject Code, Date, Duration & Maximum Marks.
  - Student Name, Roll Number, and Signature box.
  - Official General Instructions (e.g. *Use black ballpoint pen only*).

### 5.3 Instant Printing
1. Click **Print Question Paper / Export PDF** in Question Studio.
2. Choose to generate:
   - **Student Question Paper** (clean, without answer markings).
   - **Teacher Solution Key** (with correct options highlighted and step-by-step explanations).
3. Download the PDF or send directly to your connected printer.

---

## 6. CANDIDATE MANAGEMENT & PASSCODE CREDENTIALS

Eliminate password reset headaches during exam day with zero-friction Passcode Credentials.

### 6.1 Creating Student Directories (Rosters)
1. Go to **Teacher Dashboard ➡️ Student Directory**.
2. Click **Create Directory** (e.g., `Computer Science 3rd Year - Batch 2026`).
3. Add candidates via:
   - **Bulk CSV Upload**: Upload an Excel/CSV file with columns: `Full Name`, `Email`, `Roll Number`, `Phone`.
   - **Manual Input**: Type student details directly into the roster table.

### 6.2 Generating Unique Candidate Passcodes
When an assessment is assigned to a directory:
- TestoraQuiz automatically provisions unique credentials for every student:
  - **Username**: Format `STU{ROLL}-{EXAM_CODE}` (e.g. `STUVRUSHABHBC86-EX-832-6155`).
  - **Passcode**: A secure 6-digit PIN (e.g. `435170`).
- No complicated password setup is needed. Students just enter this 6-digit PIN to start.

### 6.3 Distributing Passcodes
- **One-Click Copy**: Click the copy icon beside any student username or passcode.
- **WhatsApp Share**: Click the green **Share via WhatsApp** button to send pre-formatted credentials directly to your class WhatsApp group.
- **Auto-Email**: If email addresses are listed, TestoraQuiz dispatches candidate passes with one click.

---

## 7. CANDIDATE PORTAL: THE EXAMINATION EXPERIENCE

### 7.1 Accessing the Assessment
Candidates can enter their exam in two convenient ways:
1. **Via Direct 6-Digit Code**:
   - Go to [testoraquiz.com](https://testoraquiz.com).
   - Click **Enter Code** in the top navigation or mobile drawer.
   - Type the exam code (e.g. `EX-832-6155`) and press Enter.
2. **Via Student Dashboard**:
   - Log in under **Student Mode**.
   - Your assigned examinations appear in the **Available & Scheduled Examinations** hero banner.
   - Click **Enter Exam Room**.

### 7.2 Exam Instructions & Honor Code
Before the timer begins, candidates view:
- Exam rules, duration, question count, and marking scheme.
- Anti-cheat guidelines (e.g. *Do not switch tabs, minimize the browser, or open inspect tools*).
- An explicit **I agree to the honor code** checkbox to unlock the start button.

### 7.3 Candidate Exam HUD (Heads-Up Display)
During the test, the clean candidate interface provides:
- **Sticky Countdown Timer**: Prominently displayed in minutes and seconds (turns amber at 5 min, red at 1 min).
- **Question Palette**: Color-coded question selector:
  - ⚪ *Unvisited*
  - 🔴 *Visited but Unanswered*
  - 🟢 *Answered & Saved*
  - 🟣 *Marked for Review*
- **Autosave Engine**: Every answer click is instantly synchronized to the server in milliseconds.

### 7.4 Network Interruption Recovery
If candidate Wi-Fi or mobile data disconnects during the test:
- The exam room caches responses locally in encrypted memory.
- An offline notice indicates *Offline — Answers stored securely on device*.
- When the internet reconnects, all pending answers auto-sync without data loss.

### 7.5 Submission & Auto-Submit
- Candidates can click **Submit Assessment** when finished.
- A confirmation dialog displays total answered vs. unanswered questions before final submission.
- If the countdown reaches `00:00`, the system automatically commits the latest saved answers.

---

## 8. ANTI-CHEAT PROCTORING RADAR & LIVE MONITORING

### 8.1 Real-Time Live Proctoring Dashboard
Teachers can monitor their entire classroom in real time:
1. Click **Live Monitor / Proctor Room** in the Live Assessments table.
2. View live candidate status cards:
   - 🟢 Active & Taking Test
   - 🟡 Warning Issued
   - 🔴 Critical Disqualification Flag
   - ⚪ Submitted & Completed

### 8.2 Tab Switch & Window Blur Detection
- The instant a student minimizes the browser, opens a new tab, or switches to a chat application, the system registers a **Focus Blur Event**.
- The student's screen flashes a red warning: *Warning: Tab switch detected. This incident has been logged.*
- The teacher's live dashboard records the exact timestamp of each violation.

### 8.3 Auto-Disqualification
If configured by the educator, when a student exceeds the allowed violations limit (e.g., 3 tab switches), the assessment immediately locks and triggers an **Auto-Submit with Cheat Penalty**.

---

## 9. AUTOMATED GRADING, GRADEBOOK & ANALYTICS

### 9.1 Instant Grading
- **MCQ Evaluations**: Evaluated instantaneously at the moment of submission.
- **Subjective Evaluations**: Educators can evaluate subjective answers with AI assistance or assign custom marks per answer with written feedback.

### 9.2 Comprehensive Gradebook
1. Open **Teacher Dashboard ➡️ Gradebook & Results**.
2. Key analytics displayed:
   - Class Average Score, Highest Score, Lowest Score.
   - Passing Percentage & Bell-Curve Grade Distribution.
   - Question-by-Question Difficulty Index (which questions most students got wrong).

### 9.3 Student Diagnostic Reports
- Students can view their comprehensive score report in **Student Dashboard ➡️ Submissions**.
- Shows score breakdown, percentage, accuracy rate, time spent per question, and step-by-step correct answer explanations.

---

## 10. VERIFIABLE DIGITAL CERTIFICATES & CREDENTIALS

Reward passing candidates with tamper-proof, industry-grade certificates.

### 10.1 Certificate Activation
1. In the Teacher Dashboard, open **Certificates** or click **Manage Certificates** on any assessment.
2. Enable certificates for the test.
3. Configure **Passing Criteria** (e.g. Candidates scoring $\ge 40\%$ or $\ge 60\%$).

### 10.2 Customizing Certificate Aesthetics
- Enter **Institute / College Name**: e.g., `Devorax Institute of Technology`.
- Enter **Signatory 1**: e.g., `Dr. Jane Sharma, Head of Department`. Upload signature image.
- Enter **Signatory 2**: e.g., `Prof. A. K. Verma, Examination Controller`. Upload signature image.
- Upload **Institute Stamp / Digital Seal**: Upload official seal logo.
- Toggle badges: Show Total Marks, Percentage, Grade, and Verification QR Code.

### 10.3 QR-Code Authentication Portal
- Every generated certificate has a unique cryptographically generated Verification Code (e.g., `CRT-2026-9K4M2`).
- Anyone scanning the QR code with their smartphone camera is directed to:
  `https://testoraquiz.com/verify-certificate?code=CRT-...`
- The public portal displays the official authenticity certificate, recipient name, examination details, issue date, and passing score.

---

## 11. AI FORM STUDIO & CUSTOM FORM BUILDER

Create recruitment drives, admission sheets, student feedback surveys, and seminar registrations.

### 11.1 Generating Forms
1. Go to **Teacher Dashboard ➡️ AI Form Builder**.
2. **AI Prompt Generation**: Type: *Create an admission registration form for Class 11 Science students with contact details, parent info, and subject choice group.*
3. Click **Generate Form with AI**. The studio constructs all questions, input fields, dropdowns, and validation rules in seconds.

### 11.2 Editing Choice Options & Images
- Click on any question field (Name, Email, Phone, Dropdown Select, Radio Buttons, Checkboxes).
- **Edit Choice Options**: Click directly inside any option text box (Option A, Option B, etc.) and type your label.
- **Attach Photos to Options**: Click the `🖼️` icon next to any option to attach an image (ideal for visual questions).
- Reorder fields using drag-and-drop handles.

### 11.3 Themes & Public Links
- Select from premium themes: *Classic Minimalist*, *Sunset Amber*, *Ocean Indigo*, *Emerald Mint*, or *Midnight Slate*.
- Click **Publish Form** to receive your shareable URL: `https://testoraquiz.com/f/your-form-slug`.
- Share via WhatsApp, email, or embed on your website.

### 11.4 Response Export
- Open **Form Responses** to inspect submissions in real time.
- Click **Export to Excel / CSV** to download all collected student data.

---

## 12. MOCK TEST LIBRARY & PLACEMENT ARENA

Free and premium practice assessments for competitive exams and engineering campus placements.

### 12.1 Curated Competitive Exams
- **Engineering & Medical**: JEE Main, JEE Advanced, NEET Full Mock Series.
- **National Entrance**: CUET, GATE, Banking & SSC PYQs (Previous Year Questions).

### 12.2 Corporate Placement Arena
- Practice company-specific recruitment exam patterns:
  - **TCS Ninja & Digital**: Quantitative Aptitude, Verbal Ability, Advanced Reasoning.
  - **Infosys Specialist Programmer**: Pseudo-code, Data Structures, Numerical Puzzle.
  - **Wipro Elite NLTH**: English Communication, Analytical Aptitude, Coding.
  - **Cognizant, HCL, Accenture & Capgemini Placement Papers**.

---

## 13. STUDY MATERIALS & KNOWLEDGE BASE

Free curated resources located under **Student Dashboard ➡️ Study Material**:
- **DSA Sheets**: SDE 450 Problem Solving Sheet, Striver 79 Roadmap, LeetCode curated collections.
- **Company Interview Notes**: Core CS subjects (DBMS, Operating Systems, Computer Networks, OOPs in Java/C++).
- **Quantitative & Verbal Cheat Sheets**: Formulas, shortcut tricks, and grammar rules.

---

## 14. BILLING, WALLET CREDITS & COUPON ENGINE

### 14.1 How Credits Work
- TestoraQuiz operates on a straightforward credit model:
  - **AI Exam Generation**: Deducts credits based on question volume.
  - **Certificate Issuance**: 1 credit per qualified student.
  - **Student Exam Taking**: 100% Free for students.

### 14.2 Free Starter Credits
- Every new teacher account automatically receives **500 Free Welcome Bonus Credits** upon registration to explore all AI features and test synthesis without payment.

### 14.3 Purchasing Credits & Plans
1. Navigate to **Pricing & Plans** or click your Credit Badge.
2. Select your plan:
   - **Starter Pack**: For individual tutors and educators.
   - **Pro Studio**: For coaching institutes and private colleges.
   - **Enterprise / University**: Unlimited assessments, custom domains, and dedicated proctoring servers.
3. Click **Proceed to Payment**. Checkout securely via **Razorpay** (UPI, Google Pay, PhonePe, Paytm, Net Banking, Credit/Debit Cards).
4. Credits are credited instantly to your wallet.

### 14.4 Applying Promo Codes
- Enter your promo or coupon code (e.g. `DIWALI50` or `WELCOME2026`) in the checkout dialog to receive instant discounts or bonus credits.

---

## 15. SETTINGS, UI PERSONALIZATION & SUPPORT DESK

### 15.1 Dark Mode / Light Mode
- Click the **Sun / Moon** icon in the top header or mobile drawer to switch seamlessly between High-Contrast Dark Mode and Clean Light Mode.
- Settings are saved automatically across all your devices.

### 15.2 Share Experience & Bug Reporting
- Encounter an issue or want to suggest a new feature?
- Click the **Feedback** icon in the bottom corner.
- Choose:
  - 💬 *Share Experience* (General feedback)
  - 💡 *Suggest a Feature* (Request new workflows)
  - 🐞 *Report an Issue* (Bug report with severity selector and screenshot attachment)
  - ⭐ *Rate Experience* (1 to 5 star rating)
- Every submission generates a unique **Feedback Reference ID** (e.g. `FB-2026-8K2X`).

---

## 16. FREQUENTLY ASKED QUESTIONS (FAQ) & TROUBLESHOOTING

#### Q1: Can students take exams on mobile phones?
**Yes.** TestoraQuiz is 100% responsive and optimized for mobile screens (Android, iOS Safari, Chrome, Edge). The exam interface supports smooth scrolling, full-screen mode, and touch navigation.

#### Q2: What happens if a student accidentally closes the browser during a test?
**No answers are lost.** As soon as the student reopens the link and enters their exam code or passcode, their timer resumes from where it left off, and all previous answers remain selected.

#### Q3: How do I prevent students from cheating?
Enable the **Anti-Cheat Proctoring Radar** in Step 3 of exam creation. This flags tab switching, full-screen exits, and can automatically submit their test if violations exceed your chosen threshold.

#### Q4: How do I export my test paper for offline printing?
Go to **Question Studio** for your exam and click **Print / Export PDF**. You can choose between a clean student question paper or a teacher answer key with complete step-by-step solutions.

#### Q5: Who can I contact for urgent exam support?
You can use the in-app **Support Desk** or email support directly. Standard response SLA is within 2 to 4 business hours, with highest priority given to live ongoing examinations.

---

### 🎓 TestoraQuiz – Smart, Safe & Effortless Assessment Engineering
*Created with pride for educators and learners worldwide.*
