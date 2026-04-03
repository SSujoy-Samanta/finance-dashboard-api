import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import app from '@/app';
import { prisma } from '@/config/db';
import argon2 from 'argon2';
import { Role, Status, AuditLog } from '@/generated/prisma/client';
import { AuthService } from '@/modules/auth/auth.service';

describe('User Management Module', () => {
  let adminToken: string;
  const adminEmail = `admin-${crypto.randomUUID()}@users-test.com`;

  beforeAll(async () => {
    // Sequential cleanup
    await prisma.auditLog.deleteMany();
    await prisma.financialRecord.deleteMany();
    await prisma.user.deleteMany();

    const password = await argon2.hash('Password123!', AuthService.getArgonConfig());
    await prisma.user.create({
      data: {
        email: adminEmail,
        password,
        name: 'Super Admin',
        role: Role.ADMIN,
        status: Status.ACTIVE,
      },
    });

    const res = await request(app).post('/api/auth/login').send({
      email: adminEmail,
      password: 'Password123!',
    });
    adminToken = res.body.data.accessToken;
  });

  describe('Admin Operations', () => {
    it('should list users with pagination', async () => {
      // Create 5 extra users
      const users = Array.from({ length: 5 }).map((_, i) => ({
        email: `user${i}-${crypto.randomUUID()}@list.com`,
        name: `User ${i}`,
        password: 'hashedpassword',
        role: Role.VIEWER,
      }));
      await prisma.user.createMany({ data: users });

      const res = await request(app)
        .get('/api/users?limit=2&page=1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.meta.total).toBeGreaterThanOrEqual(6); // 1 admin + 5 new
    });

    it('should create a new user and log it', async () => {
      const email = `new-${crypto.randomUUID()}@created.com`;
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email,
          password: 'Password123!',
          name: 'Created User',
          role: Role.ANALYST,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.email).toBe(email);

      // Verify audit log
      const auditRes = await request(app)
        .get('/api/audit')
        .set('Authorization', `Bearer ${adminToken}`);
      
      const creationLog = auditRes.body.data.find((l: AuditLog) => l.action === 'USER_CREATED');
      expect(creationLog).toBeDefined();
      expect(creationLog.metadata.email).toBe(email);
    });

    it('should update user status (Deactivate) and log it', async () => {
      const targetUser = await prisma.user.create({
        data: {
          email: `target-${crypto.randomUUID()}@update.com`,
          name: 'Target User',
          password: 'hashedpassword',
          role: Role.VIEWER,
        },
      });

      const res = await request(app)
        .patch(`/api/users/${targetUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: Status.INACTIVE });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(Status.INACTIVE);

      // Verify audit log
      const auditRes = await request(app)
        .get('/api/audit')
        .set('Authorization', `Bearer ${adminToken}`);
      
      const updateLog = auditRes.body.data.find(
        (l: AuditLog) => l.action === 'USER_DEACTIVATED' && l.entityId === targetUser.id
      );
      expect(updateLog).toBeDefined();
      expect(updateLog.metadata.after.status).toBe(Status.INACTIVE);
    });

    it('should fail to create user with malformed email', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'not-an-email',
          password: 'Password123!',
          name: 'Bad User',
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
