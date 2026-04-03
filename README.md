# 🟣 Finance Dashboard API

A production-grade, secure, and performant REST API built for high-stakes financial data management.

---

### 🛡️ Core Pillars
- **Security First**: PBKDF2/Argon2id hashing, secure JWT/Cookie hybrid auth, and RBAC-enforced endpoints.
- **Data Integrity**: Global soft-delete policy, decimal-safe arithmetic, and comprehensive audit logging.
- **Developer Experience**: Modern TS stack, Swagger interactive docs, and 100% type-safe data flow.

---

## 🏗️ Architecture Overview

The project is structured around a **Feature-Based Modular Architecture**:

- `src/config/` — Centralized behavior (Permissions, Envs, DB, Logger)
- `src/modules/` — Business logic encapsulated in `Auth`, `Records`, `Dashboard`, and `Audit`
- `src/middlewares/` — Security guards for RBAC, JWT verification, and validation
- `src/utils/` — Standardized response shapes and custom error handling

---

## ⚡ Quick Start

### 1. Installation
```bash
git clone https://github.com/Sujoy-Roy-Dev/finance-dashboard-api
pnpm install
cp .env.example .env
```

### 2. Database Sync (Critical)
To support soft-delete uniqueness, you must patch the initial migration:
```bash
# A. Generate & Patch SQL
pnpm prisma migrate dev --name init --create-only
# Add WHERE ("deletedAt" IS NULL) to unique index definitions in .sql file

# B. Execute & Resolve
pnpm prisma db execute --file prisma/migrations/<timestamp>_init/migration.sql
pnpm prisma migrate resolve --applied <timestamp>_init
```

### 3. Seed & Launch
```bash
pnpm prisma:seed
pnpm dev
```

---

## 🔑 Environment Variables

| Variable | Description | Requirement | Default |
| :--- | :--- | :--- | :--- |
| **DATABASE_URL** | PostgreSQL connection string | 🔴 REQUIRED | - |
| **JWT_ACCESS_SECRET** | Secret for access token signing | 🔴 REQUIRED | - |
| **JWT_REFRESH_SECRET**| Secret for refresh token signing | 🔴 REQUIRED | - |
| **PORT** | Application port | 🔘 OPTIONAL | `3000` |
| **NODE_ENV** | Environment state | 🔘 OPTIONAL | `development` |
| **CORS_ORIGIN** | Allowed frontend origins | 🔘 OPTIONAL | `http://localhost:3000` |
| **TRUST_PROXY** | Trust proxy headers (e.g. Railway) | 🔘 OPTIONAL | `false` |

---

## 📚 API Reference

### 🔐 Authentication
`POST /api/auth/register` | `Public` | - | Create new account  
`POST /api/auth/login` | `Public` | - | Authenticate & get tokens  
`POST /api/auth/refresh` | `Cookie` | - | Refresh Access Token  
`POST /api/auth/logout` | `Bearer` | - | Invalidate session  
`GET  /api/auth/me` | `Bearer` | - | Get active profile  

### 📊 Dashboard & Metrics
`GET /api/dashboard/summary` | `Bearer` | `dashboard:read` | Financial overview  
`GET /api/dashboard/by-category`| `Bearer` | `dashboard:read` | Category distribution  
`GET /api/dashboard/trends` | `Bearer` | `dashboard:read` | Monthly trends  
`GET /api/dashboard/recent` | `Bearer` | `dashboard:read` | Latest transactions  

### 📈 Financial Records
`POST   /api/records` | `Bearer` | `record:create` | Add new record  
`GET    /api/records` | `Bearer` | `record:read` | Transaction list  
`PATCH  /api/records/:id` | `Bearer` | `record:update` | Modify existing  
`DELETE /api/records/:id` | `Bearer` | `record:delete` | Soft-delete entry  

### 👤 Management & System
`GET /api/users` | `Bearer` | `user:read` | List system users  
`GET /api/audit` | `Bearer` | `audit:read` | Activity logs  
`GET /health` | `Public` | - | System status  
`GET /docs` | `Public` | - | Swagger UI (OpenAPI)  

---

## 🛡️ RBAC Matrix

| Permission | Description | ADMIN | ANALYST | VIEWER |
| :--- | :--- | :---: | :---: | :---: |
| `user:create/read` | Staff management | ✅ | ❌ | ❌ |
| `record:create` | Data entry | ✅ | ✅ | ❌ |
| `record:read` | Data visibility | ✅ | ✅ | ✅ |
| `record:update/delete`| Data modification | ✅ | ❌ | ❌ |
| `dashboard:read` | Financial analytics | ✅ | ✅ | ✅ |
| `audit:read` | Log oversight | ✅ | ❌ | ❌ |

> [!TIP]
> **Data Integrity Policy**: The **ANALYST** role is designed for "Append-Only" access. This prevents historical data tampering while allowing contributors to view insights and add new data.

---

## 🐳 Docker Deployment

Optimized multi-stage production builds for minimal surface area.

```bash
# 1. Build and Launch
docker-compose up -d --build

# 2. Verification
docker-compose ps
docker-compose logs -f api
```

### ⚡ Infrastructure Highlights:
- **Minimal Image**: Alpine-based (<150MB).
- **Security**: Rootless user execution.
- **Resilience**: Automated healthchecks & auto-restart.

---

## 📦 Seeded Credentials

| Role | Email | Password | status |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@finance.dev` | `Admin@1234` | `ACTIVE` |
| **ANALYST** | `analyst@finance.dev` | `Analyst@1234` | `ACTIVE` |
| **VIEWER** | `viewer@finance.dev` | `Viewer@1234` | `ACTIVE` |

---

## 📝 Assumptions & Tradeoffs

 - **Single Org**: Focused on single-organization deployment.
 - **Precision**: `Decimal(15, 2)` utilized for total financial accuracy.
 - **Soft Delete**: Deliberate design to maintain immutable audit trails.
 - **Pino Logging**: Preference for structured JSON logs for observability.
 - **Custom Error Codes**: Standardized codes (e.g. `USER_NOT_FOUND`) over generic messages.

---

## 🧪 Testing Coverage
```bash
# Unit & Integration
pnpm test

# Generate Coverage
pnpm test:coverage
```
Test logic covers **Auth flows**, **RBAC granularity**, and **Record math accuracy**.
