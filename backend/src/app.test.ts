import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from './app';

describe('Base Application Endpoints', () => {
  const app = createApp();

  it('GET /api/v1 should return 200 with API metadata', async () => {
    const res = await request(app).get('/api/v1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Radhe Windson Society ERP API');
    expect(res.body.data.status).toBe('operational');
  });

  it('GET /api/v1/health should return health check response structure', async () => {
    const res = await request(app).get('/api/v1/health');
    // Without active DB connection, status is 503 (DEGRADED); when connected, it is 200 (UP)
    expect([200, 503]).toContain(res.status);
    expect(res.body.data).toHaveProperty('status');
    expect(res.body.data).toHaveProperty('database');
  });

  it('GET /api/v1/nonexistent should return 404 with structured error', async () => {
    const res = await request(app).get('/api/v1/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('Should apply security headers via Helmet', async () => {
    const res = await request(app).get('/api/v1');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });
});
