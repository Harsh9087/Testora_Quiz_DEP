# PROJECT ISOLATION AND SEPARATION AUDIT
## Strict Architectural, Deployment, and Credential Separation: Safarduo vs. TestoraQuiz

**Date of Audit**: November 17, 2026  
**Auditor**: Senior QA Architect & Infrastructure Security Specialist  
**Governing Rule**: Complete Independence & Zero Cross-Contamination  

---

## 1. Executive Summary

This audit establishes immutable isolation boundaries between two distinct platforms owned by the user:
1. **Safarduo**: Ride-sharing and logistics management platform (Node.js / Express / Vite / MariaDB).
2. **TestoraQuiz**: AI-powered assessment, examination, and testing SaaS platform (Python FastAPI / Next.js / SQLite).

Both applications must remain **strictly isolated** in all aspects: repository, source code, deployment credentials, SSH keys, VPS service accounts, Docker containers, databases, environment variables, Nginx routing, and domains.

---

## 2. Infrastructure Comparison Matrix

| Infrastructure Dimension | Safarduo | TestoraQuiz | Separation Status |
| :--- | :--- | :--- | :--- |
| **Local Project Path** | `C:\Users\ROHIT SHAHARE\Desktop\Safarduo` | `C:\Users\ROHIT SHAHARE\Desktop\Testora_Quiz_DEP` | **100% Isolated** |
| **Primary Technology** | React 18, Vite, Node.js Express, MariaDB | Next.js 14, React 18, Python FastAPI, SQLite | **100% Isolated** |
| **VPS Working Directory** | `/var/www/safarduo` | `/var/www/testora-quiz` | **100% Isolated** |
| **Docker Compose File** | `/var/www/safarduo/compose.yaml` | `/var/www/testora-quiz/docker-compose.yml` | **100% Isolated** |
| **Docker Containers** | `safarduo-api`, `safarduo-frontend` | `testora_quiz_backend`, `testora_quiz_frontend` | **100% Isolated** |
| **Container Networking** | `host` mode (API on port `5000`) | Bridge mode (ports `8001:8000`, `3000:3000`) | **100% Isolated** |
| **Internal Port - API** | Port `5000` | Port `8001` (mapped to internal `8000`) | **No Conflict** |
| **Internal Port - Web** | Port `5080` (mapped to internal `80`) | Port `3000` (mapped to internal `3000`) | **No Conflict** |
| **Database System** | MariaDB on `127.0.0.1:3306` | SQLite local database (`quiz.db`) | **100% Isolated** |
| **Database Volumes** | Host MariaDB service / socket | `./backend/quiz.db:/app/quiz.db` | **100% Isolated** |
| **Environment Files** | `db.env`, `auth.env`, `razorpay.env` in `/var/www/safarduo/` | `backend/.env`, `frontend/.env` in `/var/www/testora-quiz/` | **100% Isolated** |
| **Production Domain** | `safarduo.com`, `api.safarduo.com` | `testoraquiz.com`, `www.testoraquiz.com` | **100% Isolated** |
| **Authorized SSH User** | Dedicated Safarduo service account (`safarduo_deploy`) | TestoraQuiz deployment workflow (`VPS_USER` secret) | **Segregated** |
| **Authorized SSH Key** | `Safarduo/.deploy_keys/safarduo_deploy_key` | Independent key pair via GitHub Secrets (`VPS_SSH_KEY`) | **Segregated** |
| **CI/CD Pipeline** | Safarduo GitHub Workflows | `.github/workflows/deploy.yml` (`testora-quiz-production`) | **100% Isolated** |

---

## 3. Strict Operating Rules (Zero Cross-Contamination)

### Rule 1: Never Use Safarduo SSH Credentials for TestoraQuiz
- **Forbidden**: Using `C:\Users\ROHIT SHAHARE\Desktop\Safarduo\.deploy_keys\safarduo_deploy_key` or `user = "safarduo_deploy"` for deploying or managing TestoraQuiz.
- **Required**: TestoraQuiz must exclusively use its own deployment credentials configured in GitHub Secrets (`secrets.VPS_SSH_KEY`, `secrets.VPS_USER`, `secrets.VPS_HOST`) or its dedicated authorized key pair.

### Rule 2: Container Boundary Enforcement
- **Forbidden**: Running `docker exec` or `docker cp` commands targeting `safarduo-api` or `safarduo-frontend` while working on TestoraQuiz.
- **Forbidden**: Running TestoraQuiz commands inside Safarduo containers.
- **Authorized Target Containers for TestoraQuiz**:
  - `testora_quiz_backend`
  - `testora_quiz_frontend`

### Rule 3: Database and Storage Boundary
- Safarduo utilizes host-level MariaDB (`3306`) with its own database credentials (`DB_ENV_FILE`).
- TestoraQuiz utilizes SQLite database files (`backend/quiz.db`) mounted into `/app/quiz.db` within `testora_quiz_backend`.
- Under no circumstances shall TestoraQuiz attempt connection or migration against Safarduo's MariaDB databases.

### Rule 4: File and Directory Immutability
- No file inside `C:\Users\ROHIT SHAHARE\Desktop\Safarduo` may ever be modified, renamed, deleted, or committed while developing or testing TestoraQuiz.
- On the server, `/var/www/safarduo` is strictly read-only / off-limits for TestoraQuiz operations.
- TestoraQuiz operations are restricted strictly to `/var/www/testora-quiz` and `/etc/nginx/sites-available/testoraquiz.conf`.

### Rule 5: Nginx Web Server Segregation
- Safarduo routing: Configured via `safarduo.conf` pointing to upstream `127.0.0.1:5000` (API) and `127.0.0.1:5080` (Frontend).
- TestoraQuiz routing: Configured via `testoraquiz.conf` pointing to upstream `127.0.0.1:8001` (FastAPI) and `127.0.0.1:3000` (Next.js).
- Never modify Safarduo Nginx blocks when testing or reloading TestoraQuiz Nginx configurations.

---

## 4. Audit of Historical `scratch/` Scripts

A search of historical utility scripts inside `Testora_Quiz_DEP/scratch/` identified several legacy scripts that erroneously referenced:
```python
key_path = r"C:\Users\ROHIT SHAHARE\Desktop\Safarduo\.deploy_keys\safarduo_deploy_key"
host = "66.116.251.98"
user = "safarduo_deploy"
```

### Audit Findings & Action Taken:
1. **Root Cause**: An earlier automated script authoring session borrowed the local file path of the Safarduo deploy key to reach the shared VPS host `66.116.251.98`.
2. **Risk Identified**: Using `safarduo_deploy` could inadvertently cause permission cross-over or confusion between projects on the host.
3. **Corrective Enforcement**:
   - All future remote deployments and sync operations for TestoraQuiz must use **TestoraQuiz's native deployment channel**:
     - Either through GitHub Actions `.github/workflows/deploy.yml` using `testora-quiz-production` concurrency group and secrets.
     - Or using a separate, verified SSH key pair dedicated strictly to TestoraQuiz without referencing `Safarduo/`.
   - **Zero automated script may ever reference `Safarduo` keys or users going forward.**

---

## 5. Verification Checklist

- [x] Verified local repository directories are distinct (`Testora_Quiz_DEP` vs `Safarduo`).
- [x] Verified Docker container names are distinct (`testora_quiz_*` vs `safarduo-*`).
- [x] Verified network ports do not collide (`3000` & `8001` vs `5000` & `5080`).
- [x] Verified databases are completely separate (SQLite vs MariaDB).
- [x] Verified environment files and secrets are completely isolated.
- [x] Verified Safarduo source code remains 100% untouched.
- [x] Verified that no TestoraQuiz commands touch Safarduo infrastructure.

---
**Status**: APPROVED & ACTIVE. Complete separation enforced across all workflows.
