# Cloud & PaaS Reflection

A focused, full-stack collaborative reflection editor for “Why We Chose PaaS Over IaaS: Understanding the Shared Responsibility Model.”

## Features

- Tiptap rich-text editor with formatting, lists, alignment, undo, and redo
- Required self-declared editor name
- Immutable revision history and word-level GitHub-style comparison
- Optimistic concurrency with HTTP 409 conflict responses
- Hidden rectangular-drawing Easter egg and backend JWT/HttpOnly admin authentication
- Transactional restore of any revision or the original default article
- TiDB Cloud/MySQL connection pooling and idempotent database seeding
- Responsive article, history, comparison, and admin interfaces

## Technology

React/TypeScript/Vite/CSS Modules on the frontend; Node.js/Express/TypeScript on the backend; MySQL-compatible TiDB Cloud with `mysql2/promise`.

## Structure

```text
frontend/src/components
frontend/src/services
frontend/src/styles
frontend/src/types
backend/src/config
backend/src/database
backend/src/middleware
backend/src/routes (API is organized in app.ts)
backend/src/validators
shared/types
```

## Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- TiDB Cloud SQL endpoint and credentials

## Install

```powershell
npm install
```

Copy and then edit the project-root environment values:

```powershell
Copy-Item .env.example .env
```

See [ENV_SETUP.md](ENV_SETUP.md) for every value and the TiDB walkthrough.

## Local development

Terminal 1:

```powershell
npm run dev -w backend
```

Terminal 2:

```powershell
npm run dev -w frontend
```

Open `http://localhost:5173`. The Vite server proxies `/api` to port `5000`.

Or run both workspaces:

```powershell
npm run dev
```

## API

- `GET /api/article`
- `GET /api/article/revisions`
- `GET /api/article/revisions/:revisionId`
- `POST /api/article/revisions`
- `POST /api/admin/unlock`
- `GET /api/admin/session`
- `POST /api/admin/logout`
- `POST /api/admin/revisions/:revisionId/restore`
- `POST /api/admin/restore-default`

See [POSTMAN_TESTING.md](POSTMAN_TESTING.md).

## Database behavior

The backend creates `articles` and `article_revisions`, seeds only one original revision when absent, and never replaces existing revisions during startup. Saving and restoring use transactions and row locking.

## Production build

```powershell
npm run build
npm start
```

The Express server serves `frontend/dist` and provides frontend route fallback.

## Render deployment

For separate frontend and backend services, follow the **Split Render deployment** steps in [ENV_SETUP.md](ENV_SETUP.md). The frontend must have `VITE_API_URL` set to the backend URL at build time, and the backend must have `CLIENT_ORIGIN` set to the frontend URL.

If deploying as one Node Web Service instead, use build command `npm install && npm run build` and start command `npm start`. Add backend environment variables in the Render Dashboard; never put secrets in `render.yaml`. Set `NODE_ENV=production`, `CLIENT_ORIGIN` to the deployed frontend origin, and allow the service to use Render's supplied `PORT`.

## Security

Database credentials, administrator code, and JWT signing secret exist only in backend environment variables. Admin JWTs are stored only in Secure/HttpOnly cookies in production and every restoration endpoint independently uses authentication middleware. Mutating requests require origin matching, and login attempts are rate limited.
