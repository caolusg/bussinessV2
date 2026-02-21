# API

Express + TypeScript API for BussinessV2.

## Setup

1. Create a `.env` file using `.env.example` as a template.
2. Ensure PostgreSQL is running and the database exists.
3. Create tables with the SQL script at the end of this README.

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
