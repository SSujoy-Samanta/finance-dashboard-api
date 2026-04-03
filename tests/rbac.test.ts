import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import app from '@/app';
import { prisma } from '@/config/db';
import argon2 from 'argon2';
import { Role, Status } from '@/generated/prisma/client';
import { AuthService } from '@/modules/auth/auth.service';

describe('RBAC Module', () => {
  let adminToken: string;
  let analystToken: string;
  let viewerToken: string;
  let adminId: string;

  const createTestUser = async (role: Role, email: string) => {
    const password = await argon2.hash('Password123!', AuthService.getArgonConfig());
    const user = await prisma.user.create({
      data: {
        email,
        name: `${role} User`,
        password,
        role,
        status: Status.ACTIVE,
      },
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'Password123!' });

    if (!response.body?.data?.accessToken) {
      throw new Error(`RBAC Setup Login Failed for ${role} (${email}): ${JSON.stringify(response.body)}`);
    }

    return { token: response.body.data.accessToken, id: user.id };
  };

  beforeAll(async () => {
    try {
      // Sequential cleanup to respect foreign key constraints
      await prisma.auditLog.deleteMany();
      await prisma.financialRecord.deleteMany();
      await prisma.user.deleteMany();

      // Parallelized user initialization with dynamic emails
      const suffix = crypto.randomUUID();
      const [admin, analyst, viewer] = await Promise.all([
        createTestUser(Role.ADMIN, `admin-${suffix}@rbac.com`),
        createTestUser(Role.ANALYST, `analyst-${suffix}@rbac.com`),
        createTestUser(Role.VIEWER, `viewer-${suffix}@rbac.com`),
      ]);

      adminToken = admin.token;
      adminId = admin.id;
      analystToken = analyst.token;
      viewerToken = viewer.token;
    } catch (error) {
      console.error('FAILED TO SETUP RBAC TEST:', error);
      throw error;
    }
  });

  describe('Financial Records', () => {
    it('should allow ANALYST to create record', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${analystToken}`)
        .send({
          amount: 100,
          type: 'INCOME',
          category: 'Salary',
          date: new Date().toISOString(),
        });

      expect(res.status).toBe(201);
    });

    it('should not allow VIEWER to create record', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          amount: 100,
          type: 'INCOME',
          category: 'Salary',
          date: new Date().toISOString(),
        });

      expect(res.status).toBe(403);
    });

    it('should only allow ADMIN to delete record', async () => {
      const record = await prisma.financialRecord.create({
        data: {
          amount: 100,
          type: 'EXPENSE',
          category: 'Rent',
          date: new Date(),
          createdById: adminId,
        },
      });

      const analystRes = await request(app)
        .delete(`/api/records/${record.id}`)
        .set('Authorization', `Bearer ${analystToken}`);

      expect(analystRes.status).toBe(403);

      const adminRes = await request(app)
        .delete(`/api/records/${record.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(adminRes.status).toBe(204);
    });

    it('should not allow VIEWER to update (PATCH) record', async () => {
      const record = await prisma.financialRecord.create({
        data: { amount: 100, type: 'INCOME', category: 'Salary', date: new Date(), createdById: adminId },
      });

      const res = await request(app)
        .patch(`/api/records/${record.id}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ amount: 200 });

      expect(res.status).toBe(403);
    });

    it('should not allow ANALYST or VIEWER to view audit logs', async () => {
      const analystRes = await request(app)
        .get('/api/audit')
        .set('Authorization', `Bearer ${analystToken}`);
      expect(analystRes.status).toBe(403);

      const viewerRes = await request(app)
        .get('/api/audit')
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(viewerRes.status).toBe(403);
    });
  });

  describe('User Management', () => {
    it('should not allow ANALYST to access user list', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${analystToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow ADMIN to access user list', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });
  });
});
