# Authentication System

A full stack authentication system built from scratch.

---
## What This Project Covers

This project implements a production grade authentication system with:

- **JWT Authentication** — access tokens + refresh token rotation

- **OAuth 2.0** — Google sign in via Authorization Code Flow

- **Role-Based Access Control (RBAC)** — admin, user roles with protected routes

- **Security Hardening** — bcrypt, httpOnly cookies, rate limiting, CSRF protection

- **Silent Token Refresh** — expired tokens are swapped transparently via axios interceptor

---
## Tech Stack

| Layer    | Technology                          |
| -------- | ----------------------------------- |
| Frontend | React 18, Vite, React Router, Axios |
| Backend  | Node.js, Express                    |
| Database | PostgreSQL                          |
| Auth     | JWT, bcryptjs                       |
| OAuth    | Google OAuth 2.0                    |

---
## Architecture

```

auth-system/

├── auth-client/          # React frontend

│   └── src/

│       ├── api/          # Axios instance + token refresh interceptor

│       ├── context/      # Global auth state

│       ├── hooks/        # useAuth hook

│       ├── components/   # ProtectedRoute

│       └── pages/        # Login, Register, Dashboard, OAuthCallback

│

└── auth-server/          # Express backend

    └── src/

        ├── config/       # PostgreSQL connection

        ├── controllers/  # Request/response handlers

        ├── middleware/   # JWT verification, rate limiting

        ├── routes/       # Auth + OAuth route definitions

        ├── services/     # Core business logic

        └── db/           # SQL schema

```

### Request Flow

```

Client → API Gateway (rate limiter) → Route → Controller → Service → PostgreSQL

```

---
## Database Schema

```sql

users               -- id, email, password_hash, role, is_locked, failed_attempts

refresh_tokens      -- token_hash, user_id, family, expires_at

oauth_accounts      -- user_id, provider, provider_id

login_attempts      -- ip, email, created_at

```

---
## Auth Flows

### Register

1. Client sends email + password

2. Rate limiter checks request (5 attempts / 15 min)

3. Email uniqueness checked against DB

4. Password hashed with bcrypt (12 rounds)

5. User stored with role `user`

6. Access token (15min) + refresh token (7 days) issued

7. Refresh token stored hashed in DB

8. Refresh token set as httpOnly cookie

### Login

1. Client sends email + password

2. Rate limiter blocks after 5 failed attempts

3. bcrypt.compare() verifies password

4. Failed attempt increments lockout counter (locks at 5)

5. Success resets counter, issues new token pair

6. Old refresh token invalidated

### OAuth 2.0 (Google)

1. Client clicks "Continue with Google"

2. Server generates `state` param (CSRF protection)

3. Client redirected to Google with `state` + scopes

4. User authenticates at Google

5. Google redirects back with `code` + `state`

6. Server verifies `state`, exchanges `code` for tokens

7. User profile fetched, account linked or created

8. JWT pair issued, user lands on dashboard

### Token Refresh

1. API request returns 401 (token expired)

2. Axios interceptor catches the error

3. POST /auth/refresh sent with httpOnly cookie

4. Server verifies token hash against DB

5. Reuse detected? Entire token family revoked

6. Valid? New token pair issued

7. Original request retried transparently

---
## API Reference
### Auth Endpoints

| Method | Endpoint       | Description               |
| ------ | -------------- | ------------------------- |
| POST   | /auth/register | Create a new account      |
| POST   | /auth/login    | Login, receive token pair |
| POST   | /auth/refresh  | Rotate refresh token      |
| POST   | /auth/logout   | Invalidate refresh token  |
| GET    | /auth/me       | Get current user          |

---
## Running Locally

### Prerequisites

- Node.js 18+

- PostgreSQL
### Backend

```bash

cd auth-server

npm install

```

Create a `.env` file:

```env

PORT=3000

NODE_ENV=development

DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/authdb

  

ACCESS_TOKEN_SECRET=your_secret_here

REFRESH_TOKEN_SECRET=your_other_secret_here

ACCESS_TOKEN_EXPIRY=15m

REFRESH_TOKEN_EXPIRY=7d

  

GOOGLE_CLIENT_ID=your_google_client_id

GOOGLE_CLIENT_SECRET=your_google_client_secret

GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

```

Generate secure JWT secrets:

```bash

node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

```

Create the database:

```bash

psql -U postgres -c "CREATE DATABASE authdb;"

psql -U postgres -d authdb -f src/db/schema.sql

```

Start the server:

```bash

npm run dev

```
### Frontend

```bash

cd auth-client

npm install

npm run dev

```

Open `http://localhost:5173`

---
## Future Improvements

- GitHub OAuth provider

- Email verification on registration

- Password reset via email

- Two-factor authentication 

- Admin dashboard UI

- Automated testing