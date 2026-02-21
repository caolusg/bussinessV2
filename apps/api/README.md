# API

Express + TypeScript API for BussinessV2.

## Setup

1. Create `apps/api/.env` using `.env.example` as a template.
   - Windows note: if a system `DATABASE_URL` exists, it can conflict with local dev.
     This project loads `apps/api/.env` with `override=true` so the local value wins.
2. Ensure PostgreSQL is running and the database exists.
3. Create tables with the SQL script at the end of this README.

Example `apps/api/.env`:

```bash
PORT=8000
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/bcai
JWT_SECRET=changeme
GEMINI_API_KEY=changeme
```

Run in dev mode:

```bash
cd apps/api
npm run dev
```

Verify DB connectivity:

```bash
curl http://localhost:8000/api/health/db
```

PowerShell:

```powershell
Invoke-RestMethod -Method Get -Uri http://localhost:8000/api/health/db
```

## Scripts

- `npm install`
- `npm run dev`
- `npm run build`
- `npm start`

## Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/negotiation/sessions`
- `POST /api/negotiation/sessions/:id/messages`

## Auth

Use `Authorization: Bearer <token>` for protected endpoints.

## SQL (tables)

```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
