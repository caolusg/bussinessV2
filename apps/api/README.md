# API

Express + TypeScript API for BussinessV2.

## Setup

1. Create `apps/api/.env` using `.env.example` as a template.
   - Windows note: if a system `DATABASE_URL` exists, it can conflict with local dev.
     This project loads `apps/api/.env` with `override=true` so the local value wins.
2. Ensure PostgreSQL is running and the database exists.
3. Create tables with the SQL script at the end of this README or run `apps/api/schema.sql`.

Example `apps/api/.env`:

```bash
PORT=8000
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/bcai
JWT_SECRET=changeme
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
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
- `GET /api/negotiation/sessions/:id`
- `POST /api/negotiation/sessions/:id/messages`
- `POST /api/negotiation/sessions/:id/ai-reply`

AI reply note:
- `GEMINI_API_KEY` is required for AI replies.
- `GEMINI_MODEL` defaults to `gemini-2.5-flash` if not set.

## Windows npm install (EACCES workaround)

If you hit `EACCES` when installing dependencies, set a project-local npm cache:

```powershell
cd apps/api
$env:NPM_CONFIG_CACHE="C:\Users\caolu\Documents\GitHub\bussinessV2\.npm-cache"
npm install
```

## AI Reply Verification (PowerShell)

```powershell
# 1) Login (assumes user already exists)
$login = Invoke-RestMethod -Method Post -Uri http://localhost:8000/api/auth/login `
  -ContentType "application/json" `
  -Body (@{ email="caolu3@123.com"; password="Passw0rd!" } | ConvertTo-Json)

$token = $login.token

# 2) Create session
$session = Invoke-RestMethod -Method Post -Uri http://localhost:8000/api/negotiation/sessions `
  -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer $token" } `
  -Body (@{ scenario="price"; locale="en" } | ConvertTo-Json)

$sessionId = $session.sessionId

# 3) Save user message
Invoke-RestMethod -Method Post -Uri "http://localhost:8000/api/negotiation/sessions/$sessionId/messages" `
  -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer $token" } `
  -Body (@{ content="We need a 15% discount for 1,000 units." } | ConvertTo-Json)

# 4) AI reply
Invoke-RestMethod -Method Post -Uri "http://localhost:8000/api/negotiation/sessions/$sessionId/ai-reply" `
  -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer $token" }
```

Check DB:

```powershell
docker exec -it bcai-postgres psql -U postgres -d bcai -c "SELECT role, content, created_at FROM messages ORDER BY created_at DESC LIMIT 10;"
```

If you see `fetch failed` or networking errors, test Node's network:

```powershell
node -e "fetch('https://www.google.com').then(r=>console.log(r.status)).catch(e=>console.error(e))"
```

If that fails, you may need to configure `HTTPS_PROXY` / `HTTP_PROXY` for your environment.

## Auth

Use `Authorization: Bearer <token>` for protected endpoints.

## SQL (tables)

Initialize via docker (recommended):

```bash
docker exec -i bcai-postgres psql -U postgres -d bcai < apps/api/schema.sql
```

Note: The API generates UUIDs in application code, so the table columns use `UUID`
without relying on database extensions.

```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

If you already created tables with `SERIAL` ids, recreate them or migrate:

```sql
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_session_id_fkey;
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_user_id_fkey;

ALTER TABLE users ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE sessions ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE sessions ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
ALTER TABLE messages ALTER COLUMN session_id TYPE UUID USING session_id::uuid;

ALTER TABLE sessions
  ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE messages
  ADD CONSTRAINT messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE;
```
