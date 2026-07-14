# AttendHub

Full-stack attendance and leave management system with separate employee and admin portals.

**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS · Express · Prisma · MongoDB · JWT

## Features

- **Employee portal** — check-in / check-out, leave & sick requests, attendance history, profile
- **Admin portal** — employee CRUD with photo upload, request approve/reject, attendance summary charts, working-hours performance
- **Auth** — JWT + bcrypt, role-based API guards (employee vs admin)

## Screenshots

Add screenshots of the landing page, employee dashboard, and admin summary here after you deploy or run locally.

## Architecture

```
Browser (Next.js)  --Bearer JWT-->  Express API (:5000)
                                       ├── /prisma/*      employees, login, signup
                                       ├── /requests*     leave workflow
                                       ├── /attendance/*  check-in/out, history, summary
                                       └── MongoDB (Prisma)
```

## Quick start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### Backend

```bash
cd backend
cp .env.example .env   # set DATABASE_URL and JWT_SECRET
npm install
npx prisma generate
npm run dev
```

API defaults to `http://localhost:5000`. Health check: `GET /health`.

### Frontend

```bash
cd frontend/attendance_manegement
cp .env.example .env.local   # optional; defaults to localhost:5000
npm install
npm run dev
```

App defaults to `http://localhost:3000`.

## Environment variables

**Backend (`backend/.env`)**

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | yes | MongoDB connection string |
| `JWT_SECRET` | yes | Secret for signing JWTs |
| `PORT` | no | Defaults to `5000` |
| `FRONTEND_URL` / `FRONTEND_URLS` | no | Allowed CORS origins (comma-separated) |

**Frontend (`frontend/attendance_manegement/.env.local`)**

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | no | API base URL (default `http://localhost:5000`) |

## Creating an admin user

Public signup always creates an **employee**. To get an admin:

1. Sign up as a normal employee, or create one from the admin UI once you have access
2. In MongoDB, set that employee's `role` to `admin` (or `ADMIN`)
3. Log in again — you'll be redirected to `/admin/dashboard`

## Demo / portfolio tips

- Deploy the API and frontend, then put the live URL in this README
- Capture 2–3 GIFs or screenshots of check-in, leave approval, and the admin summary
- Do not commit real `.env` files or production secrets

## Project layout

```
backend/                         Express + Prisma API
frontend/attendance_manegement/  Next.js app (folder name keeps historical spelling)
```

## Portfolio checklist

- [ ] Run locally and capture screenshots / a short demo GIF
- [ ] Deploy frontend + API and add the live URL at the top of this README
- [ ] Create one admin user (see above) for reviewers to explore the full app

## to commit
