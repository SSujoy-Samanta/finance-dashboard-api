# Project Setup Guide

Detailed setup instructions for the Finance Dashboard API in local and production environments.

## 📋 1. Prerequisites

Before starting, ensure you have the following installed:
- **Node.js**: `v20.x` or higher
- **pnpm**: `v9.x` or higher
- **PostgreSQL**: `v14.x` or higher (Local or External)

**Verification**:
```bash
node --version
pnpm --version
psql --version
```

---

## 🗄️ 2. Database Setup

### Local PostgreSQL
1. Create a new database:
   ```bash
   createdb finance_dashboard
   ```
2. (Optional) Docker Alternative for Database Only:
   ```bash
   docker run --name finance-pg \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_DB=finance_dashboard \
     -p 5432:5432 -d postgres:16
   ```

### Connection String Format
`postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public`

---

## ⚙️ 3. Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   cp .env.example .env.test
   ```

2. Generate secure JWT secrets:
   ```bash
   openssl rand -base64 64
   ```

3. Update `.env.test` with a separate test database (e.g., `finance_dashboard_test`) to prevent data loss during testing.

---

## 🛠️ 4. Installation & Database Sync

Follow these steps precisely to ensure the database schema and indexes are correctly initialized.

### 📦 1. Install Dependencies
```bash
pnpm install
pnpm prisma:generate
```

---

### 🗄️ 2. Database Synchronization
> [!IMPORTANT]
> **Why is this required?** Because the schema uses **Partial Unique Indexes** for soft-delete support (which Prisma cannot natively represent in the `.prisma` file), you must follow one of the paths below:

#### 🟣 Option A: Manual Migration Patching (Recommended)
This method ensures your database history remains clean and production-ready.

1. **Generate Template**: Create the base migration file without applying it.
   ```bash
   pnpm prisma migrate dev --name init --create-only
   ```

2. **Patch SQL**: Open the generated `.sql` file in `prisma/migrations/<timestamp>_init/` and replace the standard unique index creation with:
   ```sql
   CREATE UNIQUE INDEX "users_email_key" ON "users"("email") WHERE ("deletedAt" IS NULL);
   CREATE UNIQUE INDEX "idx_financial_records_reference_active" ON "financial_records"("reference") WHERE ("deletedAt" IS NULL AND "reference" IS NOT NULL);
   ```

3. **Execute SQL**: Run the patched file manually.
   ```bash
   pnpm prisma db execute --file prisma/migrations/<timestamp>_init/migration.sql
   ```

4. **Resolve History**: Tell Prisma the migration has been applied.
   ```bash
   pnpm prisma migrate resolve --applied <timestamp>_init
   ```

#### 🧪 Option B: DB Push (Alternative for Rapid Testing)
Use this only if you do not care about migration history (e.g., local development).
```bash
pnpm prisma db push
```

---

### 🌱 3. Seed Initial Data
```bash
pnpm prisma:seed
```

---

## 🚀 5. Running the Application

### Development Mode
```bash
pnpm dev
# API running at http://localhost:3000
```

### Production Build
```bash
pnpm build
pnpm start
```

### Health Verification
```bash
curl http://localhost:3000/health
```

---

## 🧪 6. Running Tests

The application uses **Vitest** for unit and integration testing.

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage report (Reports saved in /coverage)
pnpm test:coverage
```

---

## 📜 7. Prisma Commands Reference

| Command | Description |
| :--- | :--- |
| `pnpm prisma:migrate` | Runs pending migrations in development |
| `pnpm prisma:generate`| Regenerates Prisma client |
| `pnpm prisma:seed` | Seeds the database |
| `pnpm prisma:studio` | Opens Prisma Studio (GUI database viewer) |
| `npx prisma migrate reset` | Resets database and re-runs all migrations (Destructive) |

---

## 🐳 8. Deployment (Docker)

The project includes a multi-stage Alpine build optimized for production.

### Launch the Stack:
```bash
# Build and start the container in detached mode
docker-compose up -d --build
```

### Verify Status:
```bash
# Wait for the status to show '(healthy)'
docker-compose ps

# Monitor production logs
docker-compose logs -f api
```

### Seeding in Docker:
```bash
docker exec -it finance-dashboard-api npx tsx prisma/seed.ts
```

---

## ☁️ 9. Cloud Deployment (Railway/Render)

### Steps:
1. Connect your GitHub repository.
2. Set Environment Variables in the platform dashboard.
3. **Build Command**: `pnpm install && pnpm build`
4. **Start Command**: `pnpm start`
5. **Health Check Path**: `/health`

---

## 🆘 9. Common Issues

- **Port in use**: Change `PORT` in `.env`.
- **Prisma Client not found**: Run `pnpm prisma:generate`.
- **Migration Error**: Ensure `DATABASE_URL` is correct and the database exists.
- **Cookies not sent**: If testing locally without a frontend domain, ensure `sameSite` is `strict` and `secure` is `false` (default in dev).
