# ResumeAI – Automated Resume Screening Platform

A modern, role‑aware resume screening and job‑matching platform for students and job seekers, with recruiter tools. Built to deliver **resume parsing, role‑specific scoring, JD matching, AI rewrite suggestions, gamification, and an optional recruiter dashboard**.

---

## 🔥 Why this project

Most tools give a generic score. **ResumeAI** focuses on **role‑specific feedback + instant improvements** and grows into a **career ecosystem** (learning recommendations, mock interviews, verified portfolios) while also serving **recruiters**.

---
we as a team start the project with this and current plan for the project is this 

## ✨ Core Features (MVP → Advanced)

**MVP (Phase 1)**

* User auth (signup/login, JWT)
* Profile (role/industry preference)
* Resume upload (PDF/DOC/DOCX) & parsing
* Basic scoring (structure, grammar, keywords per role)
* Actionable feedback cards

**Phase 2 – Differentiators**

* JD (Job Description) matching & match %
* AI resume rewriter (bullet improvements)
* Role‑specific rubrics (e.g., SDE, DS, Marketing)

**Phase 3 – Ecosystem**

* Portfolio links (GitHub/Kaggle/Behance/LinkedIn) + activity signals
* Learning recommendations (fill skill gaps)
* Gamification (badges, leaderboards)

**Phase 4 – Premium/Recruiter**

* AI mock interviews tied to resume
* Recruiter dashboard (bulk upload, ranked shortlist)
* Browser extension for job boards (instant match %)

---

## 🏗️ Architecture (suggested)

```
frontend/        React + Vite + Tailwind (TypeScript)
backend/         Node.js + Express (TypeScript) – Auth, Users, Uploads, Scoring orchestrator
nlp-service/     (Optional) Python + FastAPI – parsing, JD matching, NER, keyword/scoring
worker/          (Optional) BullMQ/Redis – async parsing & scoring jobs
shared/          Shared types/schemas (Zod), constants, rubrics
infra/           Docker Compose, GitHub Actions, env templates
```

**Storage & DB**: MongoDB (users, resumes, scores, JDs, feedback, recruiter jobs)
**File storage**: Local `/uploads` (dev) → S3/Cloud Storage (prod)
**Queue**: Redis (optional) for heavy parsing/scoring
**Observability**: pino logs + OpenTelemetry (optional)

---

## 🧰 Tech Stack

* **Frontend**: React, Vite, TypeScript, Tailwind, shadcn/ui, React Query, React Router
* **Backend**: Node.js, Express, TypeScript, Zod, Mongoose, Multer, JWT, bcrypt
* **NLP** (optional service): Python, FastAPI, spaCy, scikit‑learn, sentence‑transformers
* **DB/Infra**: MongoDB, Redis (optional), Docker, Docker Compose, GitHub Actions CI

---

## 📁 Folder Structure (starter)

```
resumeai/
├─ frontend/
│  ├─ src/
│  │  ├─ components/
│  │  ├─ pages/ (Home, Features, Pricing, Login, Dashboard)
│  │  ├─ lib/ (api.ts, queryClient.ts)
│  │  ├─ hooks/
│  │  ├─ routes/
│  │  └─ main.tsx
│  ├─ index.html
│  ├─ package.json
│  └─ vite.config.ts
├─ backend/
│  ├─ src/
│  │  ├─ app.ts (express app)
│  │  ├─ server.ts (boot)
│  │  ├─ config/
│  │  ├─ middlewares/
│  │  ├─ modules/
│  │  │  ├─ auth/ (routes, controller, service)
│  │  │  ├─ users/
│  │  │  ├─ resumes/ (upload, parse, score)
│  │  │  └─ jobs/ (JD upload/match)
│  │  ├─ utils/
│  │  └─ types/
│  ├─ package.json
│  └─ tsconfig.json
├─ nlp-service/ (optional)
│  ├─ app.py (FastAPI)
│  ├─ requirements.txt
│  └─ models/ (keyword lists, embeddings)
├─ shared/
│  ├─ rubrics/
│  │  ├─ sde.json
│  │  ├─ data-science.json
│  │  └─ marketing.json
│  └─ schemas/ (zod/ts)
├─ infra/
│  ├─ docker-compose.yml
│  ├─ .env.example
│  └─ ci.yml (GitHub Actions)
├─ .gitignore
└─ README.md
```

---

## ⚙️ Getting Started

### Prerequisites

* Node.js ≥ 18, npm or pnpm
* Python ≥ 3.10 (if using `nlp-service`)
* Docker Desktop (optional, for DB/services)

### 1) Clone & env setup

```bash
git clone https://github.com/<your-username>/resumeai.git
cd resumeai
cp infra/.env.example .env # for root orchestration
```

### 2) Start with Docker (quickest)

```bash
docker compose -f infra/docker-compose.yml up -d
```

This brings up: MongoDB, Redis (optional), backend, frontend, and nlp-service (if enabled).

### 3) Run manually (dev mode)

**Backend**

```bash
cd backend
cp ../infra/.env.example .env
npm i
npm run dev
```

**Frontend**

```bash
cd frontend
npm i
npm run dev
```

**NLP Service (optional)**

```bash
cd nlp-service
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8001
```

---

## 🔐 Environment Variables

Create `.env` files in `backend/`, `frontend/`, and `nlp-service/` as needed.

**backend/.env**

```
PORT=8000
MONGO_URI=mongodb://localhost:27017/resumeai
JWT_SECRET=supersecret
UPLOAD_DIR=./uploads
NLP_SERVICE_URL=http://localhost:8001
ALLOWED_ORIGINS=http://localhost:5173
```

**frontend/.env**

```
VITE_API_BASE=http://localhost:8000/api
```

**nlp-service/.env** (optional)

```
PORT=8001
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
```

---

## 🧪 API (initial draft)

Base URL: `/api`

### Auth

* `POST /auth/signup` – { name, email, password, rolePreference }
* `POST /auth/login` – { email, password }
* `GET /auth/me` – Get current user

### Resume

* `POST /resumes` – multipart upload; returns { resumeId }
* `GET /resumes/:id` – metadata + latest score
* `GET /resumes/:id/feedback` – array of feedback items

### JD Matching

* `POST /jobs/jd` – upload JD text; returns { jdId }
* `POST /match` – { resumeId, jdId } → { matchPct, missingKeywords\[] }

### AI Rewrite

* `POST /resumes/:id/rewrite` – { bulletText } → { improvedBullet }

---

## 🗃️ Data Models (simplified)

**User**

```ts
{
  _id: ObjectId,
  name: string,
  email: string,
  passwordHash: string,
  rolePreference: 'sde' | 'data-science' | 'marketing' | ...,
  badges: string[],
  createdAt, updatedAt
}
```

**Resume**

```ts
{
  _id: ObjectId,
  userId: ObjectId,
  filename: string,
  text: string,
  sections: { education, experience[], projects[], skills[] },
  latestScore: number,
  rubricId: string,
  createdAt, updatedAt
}
```

**JD**

```ts
{
  _id: ObjectId,
  employer?: ObjectId,
  title: string,
  text: string,
  requiredSkills: string[],
  niceToHave: string[],
  createdAt
}
```

**MatchResult**

```ts
{
  resumeId: ObjectId,
  jdId: ObjectId,
  matchPct: number,
  missingKeywords: string[],
  ts: Date
}
```

---

## 📏 Scoring Rubric (starter idea)

Weights can be tuned per role.

```
Structure (20): required sections present, ordering
Clarity (15): grammar, readability, action verbs
Impact (25): metrics, outcomes, ownership
Skills (20): hard skills vs role rubric (Zod/JSON)
Projects (10): relevance, recency, repo links
ATS‑friendliness (10): headings, fonts, no tables/images
```

Example rubric JSON: `shared/rubrics/sde.json`

```json
{
  "weights": {"structure": 0.2, "clarity": 0.15, "impact": 0.25, "skills": 0.2, "projects": 0.1, "ats": 0.1},
  "keywords": ["data structures", "algorithms", "git", "rest api", "docker", "aws"],
  "penalties": {"tables": 5, "images": 5, "excess_pages": 10}
}
```

---

## 🧠 JD Matching (approach)

* Extract skills/entities → spaCy NER + curated keyword lists.
* Compute embeddings for resume vs JD → cosine similarity (sentence‑transformers).
* Weighted score = keyword overlap (40%) + embedding similarity (60%).

---

## 🧩 Frontend UX Notes

* Sticky header that shrinks on scroll (logo centers on mid‑scroll)
* Pages: Home, Features, Pricing, How It Works, Login/Register, Dashboard
* Dashboard: Upload resume → Score + Feedback + Rewrite → JD Match → Share/Export
* Gamification widgets: Score history chart, badges grid, college leaderboard

---

## 🧱 Security & Privacy

* Hash passwords (bcrypt), sign JWTs, rotate tokens
* Validate inputs with Zod; sanitize file uploads (Multer limits, MIME checks)
* Store files privately; generate signed URLs for downloads
* PII minimization; allow users to delete data (GDPR‑style)

---

## 🚀 Scripts

**Frontend**

```bash
npm run dev    # start vite dev server
npm run build  # production build
```

**Backend**

```bash
npm run dev    # ts-node-dev
npm run build  # tsc
npm run start  # node dist/server.js
```

**NLP Service**

```bash
uvicorn app:app --reload --port 8001
```
---

## 🤝 Contributing

1. Fork & clone
2. Create a feature branch: `feat/<scope>`
3. Commit with Conventional Commits (e.g., `feat(auth): add jwt refresh`)
4. PR to `main` with description & screenshots

**Commit types**: feat, fix, docs, style, refactor, perf, test, chore, ci

---

## 🧪 CI/CD (GitHub Actions)

* Lint & typecheck on PR
* Run unit tests
* Build Docker images on `main`
* Optional: Deploy to Render/Vercel/Fly.io

---

## 📄 License

MIT – free to use and modify.

---

## 📚 Starter Tasks for New Contributors

* [ ] Implement `/auth/signup` & `/auth/login`
* [ ] Build upload endpoint (Multer) & PDF/DOCX parser
* [ ] Create `shared/rubrics/sde.json` & apply during scoring
* [ ] Frontend Upload → Score view with feedback cards
* [ ] JD Match UI: paste JD → get match % + missing keywords

---

## 🧪 Sample Data & Testing

* Add `samples/` with 3 resumes (SDE/DS/Marketing) + 2 JDs for quick testing.
* Seed script to create demo users and mock scores.

---

## 🙌 Credits

Built by Piyush Dubey ,shubham singh , sakshi kumari and anisha . 
PRs welcome!
# Automated-ResumeScreening
