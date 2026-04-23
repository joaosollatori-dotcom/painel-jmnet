# Infrastructure Specification - TITÃ | ISP

## Architecture Overview
TITÃ | ISP is structured as a **Turborepo** monorepo, designed for multi-tenant scalability and high-performance background processing.

## Running Locally (Docker)

### Prerequisites
- Docker & Docker Compose
- Node.js 20+

### Core Services (`docker-compose.yml`)
1. **titan-db** (PostgreSQL 16): Primary data store.
2. **titan-redis** (Redis 7): Used for BullMQ queues and general caching.
3. **titan-api** (Node.js): Fastify backend service (Running on port 3000/3001).
4. **titan-web** (React): Vite-based frontend (Running on port 5173).

### Infrastructure Support (`docker-compose.infra.yml`)
1. **titan_mongo** (MongoDB 4.4): Required specifically for **GenieACS** integration.
2. **redis-cli**: Integrated health checks for resilience.

## Deployment

### Backend (API)
- **Target**: Can be deployed to Vercel (via `vercel.json` and `process.env.VERCEL` checks) or as a containerized Node.js service.
- **Docker Build**: Uses `apps/api/Dockerfile` with a context-aware build from the monorepo root.

### Frontend (Web)
- **Target**: Vercel, Netlify, or Nginx (Post-build static files).
- **Environment**: Requires `VITE_API_URL` and `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.

## Environment Variables

### Root / API (`.env`)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | Prisma DB Connection String | `postgresql://user:pass@host:5432/db` |
| `DIRECT_URL` | Direct DB connection (for migrations) | `postgresql://user:pass@host:5432/db` |
| `REDIS_URL` | Redis Connection String | `redis://localhost:6379` |
| `JWT_SECRET` | Secret for signing tokens | `super-secret-key` |
| `SUPABASE_SERVICE_KEY` | Admin key for bypass logic | `eyJhbGci...` |

### Frontend (`apps/web/.env`)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_URL` | Backend API Endpoint | `http://localhost:3001` |
| `VITE_SUPABASE_URL` | Supabase Project URL | `https://xyz.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase Public Key | `eyJhbGci...` |

## CI/CD & Automation
- **Turbo**: Used for parallel builds and caching (`turbo.json`).
- **Biome**: Used for linting and formatting across both apps.
- **Prisma Migrations**: Managed via `npx prisma migrate dev`.
- **Systemic Fix Scripts**: Custom scripts like `apps/api/systemic-fix.ts` are used for DB-level schema corrections and RLS normalization.
