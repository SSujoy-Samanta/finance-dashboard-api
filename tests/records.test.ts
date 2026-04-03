import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import app from '@/app';
import { prisma } from '@/config/db';
import argon2 from 'argon2';
import { Role, Status, AuditLog, FinancialRecord } from '@/generated/prisma/client';
import { AuthService } from '@/modules/auth/auth.service';

describe('Financial Records Module', () => {
  let adminToken: string;
  let adminId: string;
  const adminEmail = `admin-${crypto.randomUUID()}@records.com`;

  beforeAll(async () => {
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

    const res = await request(app).post('/api/auth/login').send({
      email: adminEmail,
      password: 'Password123!',
    });
    adminToken = res.body.data.accessToken;
  });

  it('should create a record and log to audit', async () => {
    const recordData = {
      amount: 500.50,
      type: 'EXPENSE',
      category: 'Rent',
      date: new Date().toISOString(),
      notes: 'Monthly rent payment',
    };

    const res = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(recordData);

    expect(res.status).toBe(201);
    expect(Number(res.body.data.amount)).toBe(500.5);

    // Check audit log
    const auditRes = await request(app)
      .get('/api/audit')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(auditRes.status).toBe(200);
    expect(auditRes.body.data.some((log: AuditLog) => log.action === 'RECORD_CREATED')).toBe(true);
  });

  it('should list and filter records', async () => {
    // Create multiple records
    await prisma.financialRecord.createMany({
      data: [
        { amount: 100, type: 'INCOME', category: 'Salary', date: new Date(), createdById: adminId },
        { amount: 50, type: 'EXPENSE', category: 'Food', date: new Date(), createdById: adminId },
      ],
    });

    const res = await request(app)
      .get('/api/records?type=INCOME')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].type).toBe('INCOME');
  });

  it('should soft delete a record', async () => {
    const record = await prisma.financialRecord.create({
      data: { amount: 100, type: 'INCOME', category: 'Salary', date: new Date(), createdById: adminId },
    });

    const deleteRes = await request(app)
      .delete(`/api/records/${record.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deleteRes.status).toBe(204);

    const getRes = await request(app)
      .get(`/api/records/${record.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(getRes.status).toBe(404);
  });

  it('should capture before/after snapshots on update', async () => {
    const record: FinancialRecord = await prisma.financialRecord.create({
      data: { amount: 100, type: 'INCOME', category: 'Salary', date: new Date(), createdById: adminId },
    });

    await request(app)
      .patch(`/api/records/${record.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 150 });

    const auditRes = await request(app)
      .get('/api/audit')
      .set('Authorization', `Bearer ${adminToken}`);

    const updateLog = auditRes.body.data.find((l: AuditLog) => l.action === 'RECORD_UPDATED')!;
    const metadata = updateLog.metadata as {
      before: Partial<FinancialRecord>;
      after: Partial<FinancialRecord>
    };

    expect(metadata.before.amount).toBe("100");
    expect(metadata.after.amount).toBe("150");
  });

  describe('Complex Filtering & Edge Cases', () => {
    it('should handle pagination correctly', async () => {
      // Seed 15 records
      const records = Array.from({ length: 15 }).map((_, i) => ({
        amount: 10 + i,
        type: 'EXPENSE' as const,
        category: 'Test',
        date: new Date(),
        createdById: adminId,
      }));
      await prisma.financialRecord.createMany({ data: records });

      const res = await request(app)
        .get('/api/records?limit=10&page=2')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.meta.page).toBe(2);
      expect(res.body.meta.totalPages).toBeGreaterThanOrEqual(2);
    });

    it('should filter by amount range', async () => {
      await prisma.financialRecord.createMany({
        data: [
          { amount: 10, type: 'INCOME', category: 'Low', date: new Date(), createdById: adminId },
          { amount: 1000, type: 'INCOME', category: 'High', date: new Date(), createdById: adminId },
        ],
      });

      const res = await request(app)
        .get('/api/records?minAmount=500')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const isAllAbove500 = res.body.data.every((r: any) => Number(r.amount) >= 500);
      expect(isAllAbove500).toBe(true);
      expect(res.body.data.some((r: any) => r.category === 'High')).toBe(true);
    });

    it('should search by notes or category', async () => {
      await prisma.financialRecord.create({
        data: { amount: 50, type: 'EXPENSE', category: 'Travel', notes: 'Secret meeting', date: new Date(), createdById: adminId },
      });

      const res = await request(app)
        .get('/api/records?search=Secret')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data[0].notes).toContain('Secret');
    });

    it('should fail with 400 for negative amounts (Validation)', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: -100, // Invalid
          type: 'EXPENSE',
          category: 'Tax',
          date: new Date().toISOString(),
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
