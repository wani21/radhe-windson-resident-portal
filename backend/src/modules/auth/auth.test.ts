import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../../app';
import { User } from '../../models/user.model';
import { hashPassword } from '../../utils/security';
import { requireRole } from '../../middleware/auth';
import { sendSuccess } from '../../utils/response';

describe('Authentication & RBAC Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    app = createApp();

    // Mount test-only RBAC inspection route to test requireRole middleware
    app.get('/api/v1/test-admin-only', requireRole('SOCIETY_ADMIN'), (req, res) => {
      sendSuccess(res, { secret: 'admin_dashboard_data' });
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  it('POST /api/v1/auth/login with valid credentials should succeed and set HttpOnly cookie', async () => {
    const passwordHash = await hashPassword('Test@Password123!');
    await User.create({
      fullName: 'Society Secretary',
      email: 'admin@society.org',
      passwordHash,
      role: 'SOCIETY_ADMIN',
      status: 'ACTIVE',
      tokenVersion: 0,
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@society.org', password: 'Test@Password123!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('admin@society.org');
    expect(res.body.data.user.role).toBe('SOCIETY_ADMIN');
    // Ensure password hash is NEVER leaked
    expect(res.body.data.user.passwordHash).toBeUndefined();

    // Ensure HttpOnly cookie is issued
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toContain('rw_token=');
    expect(cookies[0]).toContain('HttpOnly');
  });

  it('POST /api/v1/auth/login with wrong password should fail with 401', async () => {
    const passwordHash = await hashPassword('Correct@Password123!');
    await User.create({
      fullName: 'Resident User',
      email: 'resident@society.org',
      passwordHash,
      role: 'RESIDENT',
      status: 'ACTIVE',
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'resident@society.org', password: 'WrongPassword!' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('POST /api/v1/auth/login with inactive user should fail with 403', async () => {
    const passwordHash = await hashPassword('Resident@Password123!');
    await User.create({
      fullName: 'Inactive Resident',
      email: 'inactive@society.org',
      passwordHash,
      role: 'RESIDENT',
      status: 'INACTIVE',
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'inactive@society.org', password: 'Resident@Password123!' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('GET /api/v1/auth/me should return 401 when no session cookie is provided', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/auth/me should return active profile when session cookie is provided', async () => {
    const passwordHash = await hashPassword('SecurePass@2026');
    await User.create({
      fullName: 'Security Guard Ram',
      email: 'guard@society.org',
      passwordHash,
      role: 'SECURITY',
      status: 'ACTIVE',
      tokenVersion: 0,
    });

    // 1. Log in to acquire cookie
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'guard@society.org', password: 'SecurePass@2026' });

    const cookie = loginRes.headers['set-cookie'];

    // 2. Fetch profile using cookie
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', cookie);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.email).toBe('guard@society.org');
    expect(meRes.body.data.user.role).toBe('SECURITY');
  });

  it('Bumping tokenVersion should instantly revoke existing sessions', async () => {
    const passwordHash = await hashPassword('RevocablePass@123');
    const user = await User.create({
      fullName: 'Committee Member',
      email: 'committee@society.org',
      passwordHash,
      role: 'COMMITTEE_MEMBER',
      status: 'ACTIVE',
      tokenVersion: 0,
    });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'committee@society.org', password: 'RevocablePass@123' });

    const cookie = loginRes.headers['set-cookie'];

    // Invalidate session by incrementing tokenVersion
    await User.findByIdAndUpdate(user._id, { $inc: { tokenVersion: 1 } });

    // Subsequent request with the previously valid cookie must now fail with 401
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', cookie);

    expect(meRes.status).toBe(401);
    expect(meRes.body.error.message).toContain('revoked');
  });

  it('POST /api/v1/auth/logout should clear the session cookie', async () => {
    const res = await request(app).post('/api/v1/auth/logout');
    expect(res.status).toBe(200);
    const cookies = res.headers['set-cookie'];
    expect(cookies[0]).toContain('rw_token=;');
  });
});
