import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../../app';
import { User } from '../../models/user.model';
import { Society } from '../../models/society.model';
import { Building } from '../../models/building.model';
import { Flat } from '../../models/flat.model';
import { hashPassword } from '../../utils/security';

describe('Phase 3: Society Infrastructure, Wings & Flat Management Tests', () => {
  let mongoServer: MongoMemoryServer;
  let app: ReturnType<typeof createApp>;
  let adminCookie: string[];
  let residentCookie: string[];

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    app = createApp();

    // 1. Create Society Admin
    const adminPasswordHash = await hashPassword('AdminPass@2026!');
    await User.create({
      fullName: 'Secretary Admin',
      email: 'admin@windson.org',
      passwordHash: adminPasswordHash,
      role: 'SOCIETY_ADMIN',
      status: 'ACTIVE',
      tokenVersion: 0,
    });

    const adminLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@windson.org', password: 'AdminPass@2026!' });
    adminCookie = adminLoginRes.headers['set-cookie'];

    // 2. Create Resident User
    const residentPasswordHash = await hashPassword('ResidentPass@2026!');
    await User.create({
      fullName: 'Resident User',
      email: 'resident@windson.org',
      passwordHash: residentPasswordHash,
      role: 'RESIDENT',
      status: 'ACTIVE',
      tokenVersion: 0,
    });

    const residentLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'resident@windson.org', password: 'ResidentPass@2026!' });
    residentCookie = residentLoginRes.headers['set-cookie'];
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Flat.deleteMany({});
    await Building.deleteMany({});
    await Society.deleteMany({});
  });

  /* -------------------------------------------------------------
   * 1. Society Module Tests
   * ------------------------------------------------------------- */
  describe('Society Management', () => {
    it('GET /api/v1/society should auto-provision default profile if not exists', async () => {
      const res = await request(app)
        .get('/api/v1/society')
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.society.name).toBe('Radhe Windson Residential Society');
      expect(res.body.data.society.settings.maintenanceDueDay).toBe(5);
    });

    it('GET /api/v1/society without session should return 401', async () => {
      const res = await request(app).get('/api/v1/society');
      expect(res.status).toBe(401);
    });

    it('POST /api/v1/society should reject creating a second society (Single-Society Rule)', async () => {
      // First creation
      await request(app)
        .post('/api/v1/society')
        .set('Cookie', adminCookie)
        .send({ name: 'Radhe Windson Tower' });

      // Second creation attempt must fail with 409 Conflict
      const secondRes = await request(app)
        .post('/api/v1/society')
        .set('Cookie', adminCookie)
        .send({ name: 'Duplicate Society' });

      expect(secondRes.status).toBe(409);
      expect(secondRes.body.success).toBe(false);
      expect(secondRes.body.error.code).toBe('CONFLICT');
    });

    it('PATCH /api/v1/society should update configuration when called by SOCIETY_ADMIN', async () => {
      const res = await request(app)
        .patch('/api/v1/society')
        .set('Cookie', adminCookie)
        .send({
          settings: {
            maintenanceDueDay: 10,
            lateFee: 250,
          },
          address: {
            street: 'Main Society Road',
            city: 'Gandhinagar',
            state: 'Gujarat',
            postalCode: '382010',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.society.settings.maintenanceDueDay).toBe(10);
      expect(res.body.data.society.settings.lateFee).toBe(250);
      expect(res.body.data.society.address.city).toBe('Gandhinagar');
    });

    it('PATCH /api/v1/society by RESIDENT must be rejected with 403 Forbidden', async () => {
      const res = await request(app)
        .patch('/api/v1/society')
        .set('Cookie', residentCookie)
        .send({ name: 'Hacked Name' });

      expect(res.status).toBe(403);
    });

    it('PATCH /api/v1/society with invalid maintenanceDueDay (>28) should fail validation', async () => {
      const res = await request(app)
        .patch('/api/v1/society')
        .set('Cookie', adminCookie)
        .send({ settings: { maintenanceDueDay: 35 } });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  /* -------------------------------------------------------------
   * 2. Building / Wing Module Tests
   * ------------------------------------------------------------- */
  describe('Building / Wing Management', () => {
    it('POST /api/v1/buildings should create a new wing', async () => {
      const res = await request(app)
        .post('/api/v1/buildings')
        .set('Cookie', adminCookie)
        .send({ name: 'Wing A', totalFloors: 14 });

      expect(res.status).toBe(201);
      expect(res.body.data.building.name).toBe('Wing A');
      expect(res.body.data.building.totalFloors).toBe(14);
    });

    it('POST /api/v1/buildings should reject duplicate building name in same society', async () => {
      await request(app)
        .post('/api/v1/buildings')
        .set('Cookie', adminCookie)
        .send({ name: 'Wing A', totalFloors: 10 });

      const duplicateRes = await request(app)
        .post('/api/v1/buildings')
        .set('Cookie', adminCookie)
        .send({ name: 'wing a', totalFloors: 12 }); // Case-insensitive duplicate

      expect(duplicateRes.status).toBe(409);
      expect(duplicateRes.body.error.code).toBe('CONFLICT');
    });

    it('PATCH /api/v1/buildings/:id should reject reducing totalFloors below existing flats', async () => {
      // 1. Create building with 10 floors
      const bRes = await request(app)
        .post('/api/v1/buildings')
        .set('Cookie', adminCookie)
        .send({ name: 'Wing B', totalFloors: 10 });
      const buildingId = bRes.body.data.building._id;

      // 2. Create flat on 8th floor
      await request(app)
        .post('/api/v1/flats')
        .set('Cookie', adminCookie)
        .send({ buildingId, flatNumber: 'B-801', floor: 8 });

      // 3. Attempt reducing building floors to 5 (should be blocked)
      const patchRes = await request(app)
        .patch(`/api/v1/buildings/${buildingId}`)
        .set('Cookie', adminCookie)
        .send({ totalFloors: 5 });

      expect(patchRes.status).toBe(400);
      expect(patchRes.body.error.message).toContain('Cannot reduce total floors');
    });

    it('DELETE /api/v1/buildings/:id should reject deleting building with active flats', async () => {
      const bRes = await request(app)
        .post('/api/v1/buildings')
        .set('Cookie', adminCookie)
        .send({ name: 'Wing C', totalFloors: 5 });
      const buildingId = bRes.body.data.building._id;

      await request(app)
        .post('/api/v1/flats')
        .set('Cookie', adminCookie)
        .send({ buildingId, flatNumber: 'C-101', floor: 1 });

      const delRes = await request(app)
        .delete(`/api/v1/buildings/${buildingId}`)
        .set('Cookie', adminCookie);

      expect(delRes.status).toBe(400);
      expect(delRes.body.error.message).toContain('active flats');
    });

    it('POST /api/v1/buildings should reject invalid floor count (zero) with 400', async () => {
      const res = await request(app)
        .post('/api/v1/buildings')
        .set('Cookie', adminCookie)
        .send({ name: 'Wing Zero', totalFloors: 0 });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('POST /api/v1/buildings by RESIDENT should return 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/buildings')
        .set('Cookie', residentCookie)
        .send({ name: 'Resident Wing', totalFloors: 5 });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('PATCH /api/v1/buildings by RESIDENT should return 403 Forbidden', async () => {
      const bRes = await request(app)
        .post('/api/v1/buildings')
        .set('Cookie', adminCookie)
        .send({ name: 'Wing D', totalFloors: 5 });

      const res = await request(app)
        .patch(`/api/v1/buildings/${bRes.body.data.building._id}`)
        .set('Cookie', residentCookie)
        .send({ totalFloors: 10 });

      expect(res.status).toBe(403);
    });

    it('GET /api/v1/buildings/:id with nonexistent ID should return 404', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .get(`/api/v1/buildings/${fakeId}`)
        .set('Cookie', adminCookie);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('POST /api/v1/buildings should handle names with regex special characters safely', async () => {
      // A name with regex special characters should not crash the duplicate check
      const res = await request(app)
        .post('/api/v1/buildings')
        .set('Cookie', adminCookie)
        .send({ name: 'Wing (A) [Special]', totalFloors: 3 });

      expect(res.status).toBe(201);
      expect(res.body.data.building.name).toBe('Wing (A) [Special]');

      // Duplicate with different case should still be caught
      const dupRes = await request(app)
        .post('/api/v1/buildings')
        .set('Cookie', adminCookie)
        .send({ name: 'wing (a) [special]', totalFloors: 3 });

      expect(dupRes.status).toBe(409);
      expect(dupRes.body.error.code).toBe('CONFLICT');
    });
  });

  /* -------------------------------------------------------------
   * 3. Flat Module & Compound Uniqueness Tests
   * ------------------------------------------------------------- */
  describe('Flat Management & Uniqueness Constraints', () => {
    let wingAId: string;
    let wingBId: string;

    beforeEach(async () => {
      const b1 = await request(app)
        .post('/api/v1/buildings')
        .set('Cookie', adminCookie)
        .send({ name: 'Wing A', totalFloors: 10 });
      wingAId = b1.body.data.building._id;

      const b2 = await request(app)
        .post('/api/v1/buildings')
        .set('Cookie', adminCookie)
        .send({ name: 'Wing B', totalFloors: 10 });
      wingBId = b2.body.data.building._id;
    });

    it('POST /api/v1/flats should register flat and normalize flat number', async () => {
      const res = await request(app)
        .post('/api/v1/flats')
        .set('Cookie', adminCookie)
        .send({
          buildingId: wingAId,
          flatNumber: '  101  ',
          floor: 1,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.flat.flatNumber).toBe('101');
      expect(res.body.data.flat.occupancyStatus).toBe('VACANT');
    });

    it('POST /api/v1/flats should reject duplicate flat number in same building with 409 Conflict', async () => {
      // 1. Create 101 in Wing A
      await request(app)
        .post('/api/v1/flats')
        .set('Cookie', adminCookie)
        .send({ buildingId: wingAId, flatNumber: '101', floor: 1 });

      // 2. Attempt duplicate 101 in Wing A
      const dupRes = await request(app)
        .post('/api/v1/flats')
        .set('Cookie', adminCookie)
        .send({ buildingId: wingAId, flatNumber: '101', floor: 1 });

      expect(dupRes.status).toBe(409);
      expect(dupRes.body.error.code).toBe('CONFLICT');
    });

    it('POST /api/v1/flats should ALLOW identical flat number in DIFFERENT buildings', async () => {
      // 101 in Wing A
      const resA = await request(app)
        .post('/api/v1/flats')
        .set('Cookie', adminCookie)
        .send({ buildingId: wingAId, flatNumber: '101', floor: 1 });
      expect(resA.status).toBe(201);

      // 101 in Wing B (Permitted by compound unique index)
      const resB = await request(app)
        .post('/api/v1/flats')
        .set('Cookie', adminCookie)
        .send({ buildingId: wingBId, flatNumber: '101', floor: 1 });
      expect(resB.status).toBe(201);
      expect(resB.body.data.flat.flatNumber).toBe('101');
    });

    it('POST /api/v1/flats should reject floor exceeding building totalFloors', async () => {
      const res = await request(app)
        .post('/api/v1/flats')
        .set('Cookie', adminCookie)
        .send({ buildingId: wingAId, flatNumber: '1101', floor: 15 }); // Wing A has 10 floors

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('exceeds the total floors');
    });

    it('POST /api/v1/flats should reject nonexistent buildingId with 404', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post('/api/v1/flats')
        .set('Cookie', adminCookie)
        .send({ buildingId: fakeId, flatNumber: '101', floor: 1 });

      expect(res.status).toBe(404);
    });

    it('POST /api/v1/flats by RESIDENT should return 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/flats')
        .set('Cookie', residentCookie)
        .send({ buildingId: wingAId, flatNumber: '102', floor: 1 });

      expect(res.status).toBe(403);
    });

    it('GET /api/v1/flats should support filtering by buildingId and occupancyStatus', async () => {
      // Seed flats
      await request(app)
        .post('/api/v1/flats')
        .set('Cookie', adminCookie)
        .send({ buildingId: wingAId, flatNumber: '101', floor: 1, occupancyStatus: 'OCCUPIED' });

      await request(app)
        .post('/api/v1/flats')
        .set('Cookie', adminCookie)
        .send({ buildingId: wingAId, flatNumber: '102', floor: 1, occupancyStatus: 'VACANT' });

      await request(app)
        .post('/api/v1/flats')
        .set('Cookie', adminCookie)
        .send({ buildingId: wingBId, flatNumber: '201', floor: 2, occupancyStatus: 'OCCUPIED' });

      // Query Wing A only
      const resWingA = await request(app)
        .get(`/api/v1/flats?buildingId=${wingAId}`)
        .set('Cookie', residentCookie);

      expect(resWingA.status).toBe(200);
      expect(resWingA.body.data.flats.length).toBe(2);
      expect(resWingA.body.meta.total).toBe(2);

      // Query Occupied only
      const resOccupied = await request(app)
        .get('/api/v1/flats?occupancyStatus=OCCUPIED')
        .set('Cookie', residentCookie);

      expect(resOccupied.status).toBe(200);
      expect(resOccupied.body.data.flats.length).toBe(2);
    });

    it('PATCH /api/v1/flats/:id by RESIDENT should return 403 Forbidden', async () => {
      const createRes = await request(app)
        .post('/api/v1/flats')
        .set('Cookie', adminCookie)
        .send({ buildingId: wingAId, flatNumber: '301', floor: 3 });

      const res = await request(app)
        .patch(`/api/v1/flats/${createRes.body.data.flat._id}`)
        .set('Cookie', residentCookie)
        .send({ occupancyStatus: 'OCCUPIED' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('PATCH /api/v1/flats/:id should ignore buildingId (immutable field)', async () => {
      const createRes = await request(app)
        .post('/api/v1/flats')
        .set('Cookie', adminCookie)
        .send({ buildingId: wingAId, flatNumber: '401', floor: 4 });

      // Attempt to move flat to a different building via body injection
      const res = await request(app)
        .patch(`/api/v1/flats/${createRes.body.data.flat._id}`)
        .set('Cookie', adminCookie)
        .send({ buildingId: wingBId, occupancyStatus: 'OCCUPIED' });

      // Update should succeed (buildingId is simply ignored by the schema allow-list)
      expect(res.status).toBe(200);
      // The flat should still belong to the original building
      expect(res.body.data.flat.buildingId._id || res.body.data.flat.buildingId).toBe(wingAId);
    });

    it('GET /api/v1/flats should exclude archived (soft-deleted) flats', async () => {
      await request(app)
        .post('/api/v1/flats')
        .set('Cookie', adminCookie)
        .send({ buildingId: wingAId, flatNumber: '501', floor: 5 });

      const createRes2 = await request(app)
        .post('/api/v1/flats')
        .set('Cookie', adminCookie)
        .send({ buildingId: wingAId, flatNumber: '502', floor: 5 });

      // Archive one flat
      await request(app)
        .delete(`/api/v1/flats/${createRes2.body.data.flat._id}`)
        .set('Cookie', adminCookie);

      // Query should return only the non-archived flat
      const res = await request(app)
        .get(`/api/v1/flats?buildingId=${wingAId}`)
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      const flatNumbers = res.body.data.flats.map((f: any) => f.flatNumber);
      expect(flatNumbers).toContain('501');
      expect(flatNumbers).not.toContain('502');
    });

    it('GET /api/v1/flats should support pagination', async () => {
      // Create 5 flats in Wing A
      for (let i = 1; i <= 5; i++) {
        await request(app)
          .post('/api/v1/flats')
          .set('Cookie', adminCookie)
          .send({ buildingId: wingAId, flatNumber: `PG-${i}`, floor: 1 });
      }

      // Page 1 with limit 2
      const page1 = await request(app)
        .get(`/api/v1/flats?buildingId=${wingAId}&page=1&limit=2`)
        .set('Cookie', adminCookie);

      expect(page1.status).toBe(200);
      expect(page1.body.data.flats.length).toBe(2);
      expect(page1.body.meta.total).toBe(5);
      expect(page1.body.meta.totalPages).toBe(3);

      // Page 3 with limit 2 (should have 1 remaining)
      const page3 = await request(app)
        .get(`/api/v1/flats?buildingId=${wingAId}&page=3&limit=2`)
        .set('Cookie', adminCookie);

      expect(page3.status).toBe(200);
      expect(page3.body.data.flats.length).toBe(1);
    });
  });
});
