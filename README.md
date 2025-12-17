# Attendance Management

This repository contains a full-stack Attendance Management application.

- Backend: Express + Prisma (MongoDB)
- Frontend: Next.js (app router) + React + TypeScript

## Overview

Features:

- Employee management (create, update, photo upload)
- Attendance check-in / check-out
- Admin dashboard with request management (leave/sick requests)
- JWT-based authentication

## Fix applied

Issue: The admin dashboard at `app/admin/dashboard/requests/page.tsx` could not fetch requests from the backend and returned a 403 (Access denied) even for valid admin users.

Root cause: Role value in JWT token sometimes used uppercase (`"ADMIN"`) while backend role checks compared only against `'admin'` and `'Admin'`, causing a mismatch and a 403.

Change made: Backend role checks are now case-insensitive. In `backend/src/index.ts` the admin checks were updated to:

```ts
const role = (authReq.user?.role || "").toString().toLowerCase();
if (role !== "admin") {
  return res.status(403).json({ error: "Access denied" });
}
```

This ensures `ADMIN`, `admin`, or `Admin` all allow admin-only endpoints.

## Local setup

Prerequisites:

- Node.js 18+ and npm
- MongoDB (Atlas or local) with a connection string

Backend

1. cd backend
2. Create a `.env` file with at least:

```
DATABASE_URL=<your_mongo_connection_string>
JWT_SECRET=<a_secret_key>
PORT=5000
```

3. Install and run:

```bash
cd backend
npm install
npm run build   # if applicable
npm run dev     # or `node dist/index.js` depending on scripts
```

Frontend

1. cd frontend/attendance_manegement
2. Install and run:

```bash
cd frontend/attendance_manegement
npm install
npm run dev
```

Notes

- The frontend stores JWT token at `localStorage.token` on login. Ensure you log in as an admin account so admin endpoints (like `/requests`) return data.
- Backend exposes request routes at `http://localhost:5000/requests` (admin) and `http://localhost:5000/requests/my-requests` (employee).

## Next steps / Troubleshooting

- If you still see 403 responses, inspect the stored user object in localStorage (key: `user`) and confirm the `role` value; it should be `admin`/`ADMIN` etc.
- If CORS errors occur, ensure backend `cors()` is enabled and frontend origin is allowed.

If you'd like, I can:

- Run a quick lint or start the servers locally (if you want me to run commands here).
- Update other role checks to use a central helper function.
