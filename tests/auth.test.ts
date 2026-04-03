import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import argon2 from 'argon2';
import app from '@/app';
import { prisma } from '@/config/db';
import { User, Status } from '@/generated/prisma/client';
import { AuthService } from '@/modules/auth/auth.service';

describe('Auth Module', () => {
  let sharedUser: User;
  let sharedToken: string;

  const generateTestEmail = () => `test-${crypto.randomUUID()}@example.com`;

  beforeAll(async () => {
    try {
      // Sequential cleanup to respect foreign key constraints
      await prisma.auditLog.deleteMany();
      await prisma.financialRecord.deleteMany();
      await prisma.user.deleteMany();

      // Create a shared user directly (more robust than API call for setup)
      const email = generateTestEmail();
      const password = await argon2.hash('Password123!', AuthService.getArgonConfig());

      sharedUser = await prisma.user.create({
        data: {
          email,
          password,
          name: 'Shared Test User',
          status: Status.ACTIVE,
        },
      });

      // Login to get token for logout tests
      const res = await request(app).post('/api/auth/login').send({
        email,
        password: 'Password123!',
      });
      sharedToken = res.body.data.accessToken;
    } catch (error) {
      console.error('FAILED TO SETUP AUTH TEST:', error);
      throw error;
    }
  });

  const getBaseUserData = () => ({
    email: generateTestEmail(),
    password: 'Password123!',
    name: 'New Test User',
  });

  it('should register a new user', async () => {
    const userData = getBaseUserData();
    const res = await request(app)
      .post('/api/auth/register')
      .send(userData);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(userData.email);
  });

  it('should not register user with existing email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: sharedUser.email,
        password: 'Password123!',
        name: 'Duplicate',
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE_ENTRY');
  });

  it('should login with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: sharedUser.email,
        password: 'Password123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
  });

  it('should not login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: sharedUser.email,
        password: 'wrongpassword',
      });

    expect(res.status).toBe(401);
  });

  it('should logout and clear cookie', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${sharedToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['set-cookie']?.[0]).toContain('refreshToken=;');
  });

  describe('Session Management & Status', () => {
    it('should retrieve current user profile (/me)', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${sharedToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe(sharedUser.email);
      expect(res.body.data.user).not.toHaveProperty('password');
    });

    it('should refresh access token using valid cookie', async () => {
      // Login again to get a fresh cookie
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: sharedUser.email, password: 'Password123!' });
      
      const cookie = loginRes.headers['set-cookie'];

      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', (cookie as unknown as string[]) || []);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('accessToken');
    });

    it('should fail to refresh with tampered token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', ['refreshToken=invalid-token-here; Path=/api/auth/refresh']);

      expect(res.status).toBe(401);
    });

    it('should block login for inactive users', async () => {
      // Deactivate user
      await prisma.user.update({
        where: { id: sharedUser.id },
        data: { status: Status.INACTIVE }
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: sharedUser.email, password: 'Password123!' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('ACCOUNT_INACTIVE');

      // Re-activate for other tests
      await prisma.user.update({
        where: { id: sharedUser.id },
        data: { status: Status.ACTIVE }
      });
    });
  });
});
