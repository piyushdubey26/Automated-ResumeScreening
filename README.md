# ResumeAI – Automated Resume Screening Platform

A modern, role‑aware resume screening and job‑matching platform for students and job seekers, with recruiter tools. Built to deliver **resume parsing, role‑specific scoring, JD matching, AI rewrite suggestions, gamification, and an optional recruiter dashboard**.

---

## 🔥 Why this project

Most tools give a generic score. **ResumeAI** focuses on **role‑specific feedback + instant improvements** and grows into a **career ecosystem** (learning recommendations, mock interviews, verified portfolios) while also serving **recruiters**.

---

## ✨ Core Features (MVP → Advanced)

**MVP (Phase 1)**
* User auth (signup/login, JWT)
* Profile (role/industry preference)
* Resume upload & automated parsing
* Basic scoring (structure, grammar, keywords per role)
* Actionable feedback cards

**Phase 2 – Differentiators**
* JD (Job Description) matching & match %
* AI resume rewriter (bullet point improvements)
* Role‑specific rubrics (SDE, Data Science, Marketing, PM)

**Phase 3 – Ecosystem**
* Portfolio links (GitHub/Kaggle/Behance/LinkedIn) + activity signals
* Learning recommendations (fill skill gaps)
* Gamification (badges, leaderboards)

**Phase 4 – Premium/Recruiter**
* AI mock interviews tied to resume
* Recruiter dashboard (bulk upload, ranked shortlist)

---

## 🏗️ Architecture

```
frontend/        React + Vite + Tailwind (TypeScript)
backend/         Node.js + Express (TypeScript) – Auth, Users, Uploads, Scoring orchestrator
shared/          Shared rubrics (SDE, Data Science, Marketing, PM)
samples/         Sample resumes and JDs for testing
infra/           Docker Compose, env templates
```

---

## 🧰 Tech Stack

* **Frontend**: React 19, Vite, TypeScript, Tailwind CSS v4, Lucide React, React Query, React Router v7
* **Backend**: Node.js, Express, TypeScript, Zod, Multer, JWT, bcryptjs, Socket.IO
* **DB/Infra**: MongoDB / PostgreSQL (Prisma) + In-memory fallback mode, Docker, Docker Compose

---

## 📁 Folder Structure

```
Automated-ResumeScreening/
├─ frontend/
│  ├─ src/
│  │  ├─ components/
│  │  ├─ pages/ (Landing, Features, Pricing, Login, Register, Dashboard, Recruiter)
│  │  ├─ services/ (api.ts)
│  │  ├─ context/ (AuthContext, ThemeContext)
│  │  └─ App.tsx
│  ├─ index.html
│  └─ package.json
├─ backend/
│  ├─ src/
│  │  ├─ app.ts
│  │  ├─ server.ts
│  │  ├─ controllers/
│  │  ├─ services/ (parser, scoring, jdMatch, aiRewrite, aiInterview)
│  │  ├─ routes/
│  │  └─ utils/mockDb.ts
│  └─ package.json
├─ shared/
│  └─ rubrics/ (sde.json, data-science.json, marketing.json, product-management.json)
├─ samples/ (SDE, Data Science, Marketing resumes & JDs)
├─ infra/ (docker-compose.yml, .env.example)
└─ README.md
```

---

## ⚙️ Getting Started

### 1. Clone & Setup

```bash
git clone https://github.com/piyushdubey26/Automated-ResumeScreening.git
cd Automated-ResumeScreening
```

### 2. Start Backend

```bash
cd backend
npm install
npm run dev
```

Server will run on `http://localhost:8000`.

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Application will run on `http://localhost:5173`.

---

## 🙌 Credits

Built by **Piyush Dubey**.
PRs welcome!

---

## 📄 License

MIT – free to use and modify.
