# bussinessv2: Minimal Business Negotiation Practice

A simplified cross-cultural business negotiation practice system with authentication.

## Features

- **Register/Login**: Secure access to the practice environment.
- **Negotiation Practice**: Real-time dialogue with an AI opponent.
- **Scenario & Language Selection**: Practice different business contexts in English or Chinese.

## Setup

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    Copy `.env.example` to `.env.local` and set your backend API URL:
    ```bash
    cp .env.example .env.local
    ```
    Default `VITE_API_BASE_URL` is empty (uses current host).
    In dev, Vite proxies `/api/*` from `http://localhost:3000` to `http://localhost:8000`.

3.  **Start Development Server**:
    ```bash
    npm run dev
    ```

## Dev Proxy

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- `/api/*` requests go to the backend via Vite `server.proxy`.

## Routes

- `/register`: Create a new account.
- `/login`: Sign in to your account.
- `/negotiation`: Core practice area (requires login).
- `/`: Redirects to `/negotiation` if logged in, otherwise `/login`.
