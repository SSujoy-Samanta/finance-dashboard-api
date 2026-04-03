import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import app from '@/app';
import { prisma } from '@/config/db';
import argon2 from 'argon2';
import { Role, Status } from '@/generated/prisma/client';
import { AuthService } from '@/modules/auth/auth.service';

describe('Dashboard Module', () => {
  let adminToken: string;
  let adminId: string;
  const adminEmail = `admin-${crypto.randomUUID()}@dashboard.com`;

  beforeAll(async () => {
    try {
      // Sequential cleanup to respect foreign key constraints
      await prisma.auditLog.deleteMany();
      await prisma.financialRecord.deleteMany();
      await prisma.user.deleteMany();

      const password = await argon2.hash('Password123!', AuthService.getArgonConfig());
      const user = await prisma.user.create({
        data: {
          email: adminEmail,
          password,
          name: 'Admin User',
          role: Role.ADMIN,
          status: Status.ACTIVE,
        },
      });
      adminId = user.id;

      const authRes = await request(app).post('/api/auth/login').send({
        email: adminEmail,
        password: 'Password123!',
      });

      if (!authRes.body?.data?.accessToken) {
        throw new Error(`Dashboard Setup Login Failed: ${JSON.stringify(authRes.body)}`);
      }
      adminToken = authRes.body.data.accessToken;

      // Parallelized seed records
      await prisma.financialRecord.createMany({
        data: [
          { amount: 1000, type: 'INCOME', category: 'Salary', date: new Date(), createdById: adminId },
          { amount: 500, type: 'INCOME', category: 'Freelance', date: new Date(), createdById: adminId },
          { amount: 400, type: 'EXPENSE', category: 'Rent', date: new Date(), createdById: adminId },
          { amount: 100, type: 'EXPENSE', category: 'Food', date: new Date(), createdById: adminId },
        ],
      });
    } catch (error) {
      console.error('FAILED TO SETUP DASHBOARD TEST:', error);
      throw error;
    }
  });

  it('should get summary totals correctly', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.totalIncome).toBe("1500.00");
    expect(res.body.data.totalExpenses).toBe("500.00");
    expect(res.body.data.netBalance).toBe("1000.00");
    expect(res.body.data.incomeCount).toBe(2);
    expect(res.body.data.expenseCount).toBe(2);
  });

  it('should group by category correctly', async () => {
    const res = await request(app)
      .get('/api/dashboard/by-category')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.some((c: { category: string; total: string }) => c.category === 'Salary' && c.total === "1000.00")).toBe(true);
    expect(res.body.data.some((c: { category: string; total: string }) => c.category === 'Rent' && c.total === "400.00")).toBe(true);
  });

  it('should get recent records with limit', async () => {
    const res = await request(app)
      .get('/api/dashboard/recent?limit=2')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data[0]).toHaveProperty('createdBy');
  });

  it('should return trends (raw SQL verification)', async () => {
    const res = await request(app)
      .get('/api/dashboard/trends?period=monthly')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty('income');
    expect(res.body.data[0]).toHaveProperty('expenses');
    expect(res.body.data[0]).toHaveProperty('net');
  });

  describe('Edge Cases & Security', () => {
    it('should handle empty database state for summary', async () => {
      // Clear records temporarily
      await prisma.financialRecord.deleteMany();

      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalIncome).toBe("0.00");
      expect(res.body.data.netBalance).toBe("0.00");

      // Re-seed for other potential async runs or file-level safety
      await prisma.financialRecord.createMany({
        data: [
          { amount: 1000, type: 'INCOME', category: 'Salary', date: new Date(), createdById: adminId },
        ],
      });
    });

    it('should block unauthorized access to dashboard', async () => {
      const res = await request(app).get('/api/dashboard/summary');
      expect(res.status).toBe(401);
    });

    it('should fail trends with invalid period (Validation)', async () => {
      const res = await request(app)
        .get('/api/dashboard/trends?period=invalid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
