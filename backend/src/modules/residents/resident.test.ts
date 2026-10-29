import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../../app';
import { User } from '../../models/user.model';
import { Society } from '../../models/society.model';
import { Building } from '../../models/building.model';
import { Flat } from '../../models/flat.model';
import { Resident } from '../../models/resident.model';
import { hashPassword } from '../../utils/security';

describe('Phase 4: Resident & Household Management Tests', () => {
  let mongoServer: MongoMemoryServer;
  let app: ReturnType<typeof createApp>;
  let adminCookie: string[];
  let residentCookie: string[];

  // Shared test data IDs (recreated in beforeEach)
  let wingAId: string;
  let wingBId: string;
  let flatA101Id: string;
  let flatA102Id: string;
  let flatB201Id: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    app = createApp();

    // Create Society Admin
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

    // Create Resident User
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
    await Resident.deleteMany({});
    await Flat.deleteMany({});
    await Building.deleteMany({});
    await Society.deleteMany({});

    // Create buildings and flats fresh for each test
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

    const f1 = await request(app)
      .post('/api/v1/flats')
      .set('Cookie', adminCookie)
      .send({ buildingId: wingAId, flatNumber: 'A-101', floor: 1 });
    flatA101Id = f1.body.data.flat._id;

    const f2 = await request(app)
      .post('/api/v1/flats')
      .set('Cookie', adminCookie)
      .send({ buildingId: wingAId, flatNumber: 'A-102', floor: 1 });
    flatA102Id = f2.body.data.flat._id;

    const f3 = await request(app)
      .post('/api/v1/flats')
      .set('Cookie', adminCookie)
      .send({ buildingId: wingBId, flatNumber: 'B-201', floor: 2 });
    flatB201Id = f3.body.data.flat._id;
  });

  /* -------------------------------------------------------------
   * 1. Resident Creation and Retrieval
   * ------------------------------------------------------------- */
  describe('Resident Creation and Retrieval', () => {
    it('POST /api/v1/residents should create a valid resident linked to a flat', async () => {
      const res = await request(app)
        .post('/api/v1/residents')
        .set('Cookie', adminCookie)
        .send({
          fullName: 'Rajesh Patel',
          flatId: flatA101Id,
          residentCategory: 'OWNER',
          isOccupant: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.resident.fullName).toBe('Rajesh Patel');
      expect(res.body.data.resident.residentCategory).toBe('OWNER');
      expect(res.body.data.resident.residencyStatus).toBe('ACTIVE');
      expect(res.body.data.resident.isOccupant).toBe(true);
    });

    it('POST /api/v1/residents with missing name should fail with 400', async () => {
      const res = await request(app)
        .post('/api/v1/residents')
        .set('Cookie', adminCookie)
        .send({ flatId: flatA101Id, residentCategory: 'OWNER' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('POST /api/v1/residents with invalid email should fail with 400', async () => {
      const res = await request(app)
        .post('/api/v1/residents')
        .set('Cookie', adminCookie)
        .send({
          fullName: 'Test Person',
          email: 'not-an-email',
          flatId: flatA101Id,
          residentCategory: 'OWNER',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('POST /api/v1/residents with nonexistent flat should fail with 404', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post('/api/v1/residents')
        .set('Cookie', adminCookie)
        .send({ fullName: 'Ghost', flatId: fakeId, residentCategory: 'TENANT' });

      expect(res.status).toBe(404);
    });

    it('POST /api/v1/residents without session should return 401', async () => {
      const res = await request(app)
        .post('/api/v1/residents')
        .send({ fullName: 'No Auth', flatId: flatA101Id, residentCategory: 'OWNER' });

      expect(res.status).toBe(401);
    });

    it('POST /api/v1/residents by RESIDENT should return 403', async () => {
      const res = await request(app)
        .post('/api/v1/residents')
        .set('Cookie', residentCookie)
        .send({ fullName: 'Resident Creating', flatId: flatA101Id, residentCategory: 'OWNER' });

      expect(res.status).toBe(403);
    });

    it('GET /api/v1/residents without session should return 401', async () => {
      const res = await request(app).get('/api/v1/residents');
      expect(res.status).toBe(401);
    });

    it('GET /api/v1/residents should return paginated results with meta', async () => {
      // Create 3 residents
      for (let i = 1; i <= 3; i++) {
        await request(app)
          .post('/api/v1/residents')
          .set('Cookie', adminCookie)
          .send({ fullName: `Person ${i}`, flatId: flatA101Id, residentCategory: 'FAMILY_MEMBER' });
      }

      const res = await request(app)
        .get('/api/v1/residents?page=1&limit=2')
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.residents.length).toBe(2);
      expect(res.body.meta.total).toBe(3);
      expect(res.body.meta.totalPages).toBe(2);
    });

    it('GET /api/v1/residents should support filtering by category and residencyStatus', async () => {
      await request(app)
        .post('/api/v1/residents')
        .set('Cookie', adminCookie)
        .send({ fullName: 'Owner One', flatId: flatA101Id, residentCategory: 'OWNER', isOccupant: true });

      await request(app)
        .post('/api/v1/residents')
        .set('Cookie', adminCookie)
        .send({ fullName: 'Tenant One', flatId: flatA102Id, residentCategory: 'TENANT', isOccupant: true });

      const ownerRes = await request(app)
        .get('/api/v1/residents?category=OWNER')
        .set('Cookie', adminCookie);

      expect(ownerRes.status).toBe(200);
      expect(ownerRes.body.data.residents.length).toBe(1);
      expect(ownerRes.body.data.residents[0].residentCategory).toBe('OWNER');

      const activeRes = await request(app)
        .get('/api/v1/residents?residencyStatus=ACTIVE')
        .set('Cookie', adminCookie);

      expect(activeRes.status).toBe(200);
      expect(activeRes.body.data.residents.length).toBe(2);
    });

    it('GET /api/v1/residents/:id should return resident details with populated flat', async () => {
      const createRes = await request(app)
        .post('/api/v1/residents')
        .set('Cookie', adminCookie)
        .send({ fullName: 'Detail Person', flatId: flatA101Id, residentCategory: 'OWNER' });

      const res = await request(app)
        .get(`/api/v1/residents/${createRes.body.data.resident._id}`)
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.resident.fullName).toBe('Detail Person');
      // Flat should be populated with building info
      const flat = res.body.data.resident.flatId;
      expect(typeof flat).toBe('object');
      expect(flat.flatNumber).toBe('A-101');
    });

    it('GET /api/v1/residents should not expose userId or isDeleted internal fields', async () => {
      await request(app)
        .post('/api/v1/residents')
        .set('Cookie', adminCookie)
        .send({ fullName: 'Privacy Check', flatId: flatA101Id, residentCategory: 'OWNER' });

      const res = await request(app)
        .get('/api/v1/residents')
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      // userId should be null or undefined, never a populated user object with secrets
      const r = res.body.data.residents[0];
      expect(r.userId).toBeFalsy(); // null or undefined — no populated user document
    });

    it('GET /api/v1/flats/:flatId/residents should return residents for a specific flat', async () => {
      await request(app)
        .post('/api/v1/residents')
        .set('Cookie', adminCookie)
        .send({ fullName: 'Flat Resident', flatId: flatA101Id, residentCategory: 'OWNER' });

      const res = await request(app)
        .get(`/api/v1/flats/${flatA101Id}/residents`)
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.residents.length).toBe(1);
      expect(res.body.data.residents[0].fullName).toBe('Flat Resident');
    });
  });

  /* -------------------------------------------------------------
   * 2. Household Rules and Occupancy Synchronization
   * ------------------------------------------------------------- */
  describe('Household Rules and Occupancy Synchronization', () => {
    it('should allow multiple residents in the same flat', async () => {
      await request(app)
        .post('/api/v1/residents')
        .set('Cookie', adminCookie)
        .send({ fullName: 'Head of Family', flatId: flatA101Id, residentCategory: 'OWNER', isOccupant: true });

      const familyRes = await request(app)
        .post('/api/v1/residents')
        .set('Cookie', adminCookie)
        .send({
          fullName: 'Spouse Patel',
          flatId: flatA101Id,
          residentCategory: 'FAMILY_MEMBER',
          isOccupant: true,
          relationshipToPrimaryResident: 'Spouse',
        });

      expect(familyRes.status).toBe(201);

      const flatResidents = await request(app)
        .get(`/api/v1/flats/${flatA101Id}/residents`)
        .set('Cookie', adminCookie);

      expect(flatResidents.body.data.residents.length).toBe(2);
    });

    it('owner who is NOT an occupant should not mark flat as OCCUPIED', async () => {
      await request(app)
        .post('/api/v1/residents')
        .set('Cookie', adminCookie)
        .send({ fullName: 'Absentee Owner', flatId: flatA101Id, residentCategory: 'OWNER', isOccupant: false });

      const flatRes = await request(app)
        .get(`/api/v1/flats/${flatA101Id}`)
        .set('Cookie', adminCookie);

      expect(flatRes.body.data.flat.occupancyStatus).toBe('VACANT');
    });

    it('active tenant occupant should set flat to TENANTED', async () => {
      await request(app)
        .post('/api/v1/residents')
        .set('Cookie', adminCookie)
        .send({ fullName: 'Tenant Sharma', flatId: flatA101Id, residentCategory: 'TENANT', isOccupant: true });

      const flatRes = await request(app)
        .get(`/api/v1/flats/${flatA101Id}`)
        .set('Cookie', adminCookie);

      expect(flatRes.body.data.flat.occupancyStatus).toBe('TENANTED');
    });

    it('active non-tenant occupant should set flat to OCCUPIED', async () => {
      await request(app)
        .post('/api/v1/residents')
        .set('Cookie', adminCookie)
        .send({ fullName: 'Owner Occupant', flatId: flatA101Id, residentCategory: 'OWNER', isOccupant: true });

      const flatRes = await request(app)
        .get(`/api/v1/flats/${flatA101Id}`)
        .set('Cookie', adminCookie);

      expect(flatRes.body.data.flat.occupancyStatus).toBe('OCCUPIED');
    });

    it('moving out the last occupant should set flat to VACANT', async () => {
      const createRes = await request(app)
        .post('/api/v1/residents')
        .set('Cookie', adminCookie)
        .send({ fullName: 'Solo Owner', flatId: flatA101Id, residentCategory: 'OWNER', isOccupant: true });

      // Verify flat is OCCUPIED
      let flatRes = await request(app)
        .get(`/api/v1/flats/${flatA101Id}`)
        .set('Cookie', adminCookie);
      expect(flatRes.body.data.flat.occupancyStatus).toBe('OCCUPIED');

      // Move out
      await request(app)
        .post(`/api/v1/residents/${createRes.body.data.resident._id}/move-out`)
        .set('Cookie', adminCookie);

      // Flat should now be VACANT
      flatRes = await request(app)
        .get(`/api/v1/flats/${flatA101Id}`)
        .set('Cookie', adminCookie);
      expect(flatRes.body.data.flat.occupancyStatus).toBe('VACANT');
    });

    it('moving out one of multiple occupants should NOT mark flat VACANT', async () => {
      await request(app)
        .post('/api/v1/residents')
        .set('Cookie', adminCookie)
        .send({ fullName: 'Owner One', flatId: flatA101Id, residentCategory: 'OWNER', isOccupant: true });

      const createRes2 = await request(app)
        .post('/api/v1/residents')
        .set('Cookie', adminCookie)
        .send({ fullName: 'Family Two', flatId: flatA101Id, residentCategory: 'FAMILY_MEMBER', isOccupant: true });

      // Move out the family member
      await request(app)
        .post(`/api/v1/residents/${createRes2.body.data.resident._id}/move-out`)
        .set('Cookie', adminCookie);

      // Flat should still be OCCUPIED (owner still there)
      const flatRes = await request(app)
        .get(`/api/v1/flats/${flatA101Id}`)
        .set('Cookie', adminCookie);
      expect(flatRes.body.data.flat.occupancyStatus).toBe('OCCUPIED');
    });

    it('inactive residents should be excluded from current-occupant queries but retained historically', async () => {
      const createRes = await request(app)
        .post('/api/v1/residents')
        .set('Cookie', adminCookie)
        .send({ fullName: 'Former Tenant', flatId: flatA101Id, residentCategory: 'TENANT', isOccupant: true });

      // Move out
      await request(app)
        .post(`/api/v1/residents/${createRes.body.data.resident._id}/move-out`)
        .set('Cookie', adminCookie);

      // Query active residents only
      const activeRes = await request(app)
        .get('/api/v1/residents?residencyStatus=ACTIVE&flatId=' + flatA101Id)
        .set('Cookie', adminCookie);

      expect(activeRes.body.data.residents.length).toBe(0);

      // Query all residents (including inactive)
      const allRes = await request(app)
        .get('/api/v1/flats/' + flatA101Id + '/residents')
        .set('Cookie', adminCookie);

      expect(allRes.body.data.residents.length).toBe(1);
      expect(allRes.body.data.residents[0].residencyStatus).toBe('INACTIVE');
      expect(allRes.body.data.residents[0].moveOutDate).not.toBeNull();
    });

    it('duplicate active resident in same flat should return 409', async () => {
      await request(app)
        .post('/api/v1/residents')
        .set('Cookie', adminCookie)
        .send({ fullName: 'Duplicate Name', flatId: flatA101Id, residentCategory: 'OWNER', isOccupant: true });

      const dupRes = await request(app)
        .post('/api/v1/residents')
        .set('Cookie', adminCookie)
        .send({ fullName: 'duplicate name', flatId: flatA101Id, residentCategory: 'FAMILY_MEMBER' });

      expect(dupRes.status).toBe(409);
      expect(dupRes.body.error.code).toBe('CONFLICT');
    });

    it('same person active in two flats should return 409', async () => {
      await request(app)
        .post('/api/v1/residents')
        .set('Cookie', adminCookie)
        .send({ fullName: 'Multi Flat', flatId: flatA101Id, residentCategory: 'OWNER', isOccupant: true });

      const dupRes = await request(app)
        .post('/api/v1/residents')
        .set('Cookie', adminCookie)
        .send({ fullName: 'Multi Flat', flatId: flatA102Id, residentCategory: 'OWNER', isOccupant: true });

      expect(dupRes.status).toBe(409);
      expect(dupRes.body.error.message).toContain('another flat');
    });
  });

  /* -------------------------------------------------------------
   * 3. Reassignment and History Preservation
   * ------------------------------------------------------------- */
  describe('Reassignment and History Preservation', () => {
    it('POST /residents/:id/reassign should move resident to new flat and preserve history', async () => {
      const createRes = await request(app)
        .post('/api/v1/residents')
        .set('Cookie', adminCookie)
        .send({ fullName: 'Mover Singh', flatId: flatA101Id, residentCategory: 'OWNER', isOccupant: true });

      const residentId = createRes.body.data.resident._id;

      // Reassign to Wing B flat
      const reassignRes = await request(app)
        .post(`/api/v1/residents/${residentId}/reassign`)
        .set('Cookie', adminCookie)
        .send({ newFlatId: flatB201Id });

      expect(reassignRes.status).toBe(200);
      expect(reassignRes.body.data.resident.flatId.flatNumber).toBe('B-201');
      expect(reassignRes.body.data.resident.residencyStatus).toBe('ACTIVE');

      // Old flat should be VACANT (no more occupants)
      const oldFlatRes = await request(app)
        .get(`/api/v1/flats/${flatA101Id}`)
        .set('Cookie', adminCookie);
      expect(oldFlatRes.body.data.flat.occupancyStatus).toBe('VACANT');

      // New flat should be OCCUPIED (owner is occupant)
      const newFlatRes = await request(app)
        .get(`/api/v1/flats/${flatB201Id}`)
        .set('Cookie', adminCookie);
      expect(newFlatRes.body.data.flat.occupancyStatus).toBe('OCCUPIED');

      // Old flat should retain the historical (inactive) resident record
      const oldFlatResidents = await request(app)
        .get(`/api/v1/flats/${flatA101Id}/residents`)
        .set('Cookie', adminCookie);

      expect(oldFlatResidents.body.data.residents.length).toBe(1);
      expect(oldFlatResidents.body.data.residents[0].residencyStatus).toBe('INACTIVE');
      expect(oldFlatResidents.body.data.residents[0].moveOutDate).not.toBeNull();
    });

    it('reassign to same flat should return 400', async () => {
      const createRes = await request(app)
        .post('/api/v1/residents')
        .set('Cookie', adminCookie)
        .send({ fullName: 'Same Flat Test', flatId: flatA101Id, residentCategory: 'OWNER' });

      const res = await request(app)
        .post(`/api/v1/residents/${createRes.body.data.resident._id}/reassign`)
        .set('Cookie', adminCookie)
        .send({ newFlatId: flatA101Id });

      expect(res.status).toBe(400);
    });

    it('reassign by RESIDENT should return 403', async () => {
      const createRes = await request(app)
        .post('/api/v1/residents')
        .set('Cookie', adminCookie)
        .send({ fullName: 'Unauthorized Reassign', flatId: flatA101Id, residentCategory: 'OWNER' });

      const res = await request(app)
        .post(`/api/v1/residents/${createRes.body.data.resident._id}/reassign`)
        .set('Cookie', residentCookie)
        .send({ newFlatId: flatB201Id });

      expect(res.status).toBe(403);
    });
  });

  /* -------------------------------------------------------------
   * 4. Update and Move-Out Authorization
   * ------------------------------------------------------------- */
  describe('Update and Move-Out Authorization', () => {
    it('PATCH /api/v1/residents/:id by RESIDENT should return 403', async () => {
      const createRes = await request(app)
        .post('/api/v1/residents')
        .set('Cookie', adminCookie)
        .send({ fullName: 'Patch Test', flatId: flatA101Id, residentCategory: 'OWNER' });

      const res = await request(app)
        .patch(`/api/v1/residents/${createRes.body.data.resident._id}`)
        .set('Cookie', residentCookie)
        .send({ phone: '9999999999' });

      expect(res.status).toBe(403);
    });

    it('PATCH /api/v1/residents/:id should update allow-listed fields', async () => {
      const createRes = await request(app)
        .post('/api/v1/residents')
        .set('Cookie', adminCookie)
        .send({ fullName: 'Update Me', flatId: flatA101Id, residentCategory: 'OWNER', isOccupant: false });

      const res = await request(app)
        .patch(`/api/v1/residents/${createRes.body.data.resident._id}`)
        .set('Cookie', adminCookie)
        .send({ phone: '9876543210', email: 'updated@test.com', isOccupant: true });

      expect(res.status).toBe(200);
      expect(res.body.data.resident.phone).toBe('9876543210');
      expect(res.body.data.resident.email).toBe('updated@test.com');
      expect(res.body.data.resident.isOccupant).toBe(true);

      // Occupancy should now be OCCUPIED (owner became occupant)
      const flatRes = await request(app)
        .get(`/api/v1/flats/${flatA101Id}`)
        .set('Cookie', adminCookie);
      expect(flatRes.body.data.flat.occupancyStatus).toBe('OCCUPIED');
    });

    it('PATCH /api/v1/residents/:id should not allow userId mass-assignment', async () => {
      const createRes = await request(app)
        .post('/api/v1/residents')
        .set('Cookie', adminCookie)
        .send({ fullName: 'Injection Test', flatId: flatA101Id, residentCategory: 'OWNER' });

      // Attempt to set userId via PATCH (should be ignored by schema allow-list)
      const res = await request(app)
        .patch(`/api/v1/residents/${createRes.body.data.resident._id}`)
        .set('Cookie', adminCookie)
        .send({ userId: new mongoose.Types.ObjectId().toString(), fullName: 'Updated Name' });

      expect(res.status).toBe(200);
      // userId should remain null (not injected from body)
      expect(res.body.data.resident.userId).toBeFalsy();
    });

    it('POST /residents/:id/move-out on already inactive resident should return 400', async () => {
      const createRes = await request(app)
        .post('/api/v1/residents')
        .set('Cookie', adminCookie)
        .send({ fullName: 'Double Moveout', flatId: flatA101Id, residentCategory: 'OWNER', isOccupant: true });

      // First move-out
      await request(app)
        .post(`/api/v1/residents/${createRes.body.data.resident._id}/move-out`)
        .set('Cookie', adminCookie);

      // Second move-out attempt
      const res = await request(app)
        .post(`/api/v1/residents/${createRes.body.data.resident._id}/move-out`)
        .set('Cookie', adminCookie);

      expect(res.status).toBe(400);
    });

    it('DELETE /api/v1/residents/:id should soft-delete and sync flat occupancy', async () => {
      const createRes = await request(app)
        .post('/api/v1/residents')
        .set('Cookie', adminCookie)
        .send({ fullName: 'Delete Me', flatId: flatA101Id, residentCategory: 'OWNER', isOccupant: true });

      // Flat should be OCCUPIED
      let flatRes = await request(app)
        .get(`/api/v1/flats/${flatA101Id}`)
        .set('Cookie', adminCookie);
      expect(flatRes.body.data.flat.occupancyStatus).toBe('OCCUPIED');

      // Delete the resident
      await request(app)
        .delete(`/api/v1/residents/${createRes.body.data.resident._id}`)
        .set('Cookie', adminCookie);

      // Flat should be VACANT
      flatRes = await request(app)
        .get(`/api/v1/flats/${flatA101Id}`)
        .set('Cookie', adminCookie);
      expect(flatRes.body.data.flat.occupancyStatus).toBe('VACANT');

      // Resident should not appear in directory
      const dirRes = await request(app)
        .get('/api/v1/residents')
        .set('Cookie', adminCookie);
      expect(dirRes.body.data.residents.length).toBe(0);
    });

    it('GET /api/v1/residents/:id with nonexistent ID should return 404', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .get(`/api/v1/residents/${fakeId}`)
        .set('Cookie', adminCookie);

      expect(res.status).toBe(404);
    });
  });

  /* -------------------------------------------------------------
   * 5. Occupancy Edge Cases
   * ------------------------------------------------------------- */
  describe('Occupancy Edge Cases', () => {
    it('mix of tenant and owner occupants should set flat to TENANTED', async () => {
      await request(app)
        .post('/api/v1/residents')
        .set('Cookie', adminCookie)
        .send({ fullName: 'Owner Lives Too', flatId: flatA101Id, residentCategory: 'OWNER', isOccupant: true });

      await request(app)
        .post('/api/v1/residents')
        .set('Cookie', adminCookie)
        .send({ fullName: 'Tenant Lives Here', flatId: flatA101Id, residentCategory: 'TENANT', isOccupant: true });

      const flatRes = await request(app)
        .get(`/api/v1/flats/${flatA101Id}`)
        .set('Cookie', adminCookie);

      expect(flatRes.body.data.flat.occupancyStatus).toBe('TENANTED');
    });

    it('changing resident from occupant to non-occupant should update flat to VACANT if last occupant', async () => {
      const createRes = await request(app)
        .post('/api/v1/residents')
        .set('Cookie', adminCookie)
        .send({ fullName: 'Flip Occupant', flatId: flatA101Id, residentCategory: 'OWNER', isOccupant: true });

      // Flat should be OCCUPIED
      let flatRes = await request(app)
        .get(`/api/v1/flats/${flatA101Id}`)
        .set('Cookie', adminCookie);
      expect(flatRes.body.data.flat.occupancyStatus).toBe('OCCUPIED');

      // Change isOccupant to false
      await request(app)
        .patch(`/api/v1/residents/${createRes.body.data.resident._id}`)
        .set('Cookie', adminCookie)
        .send({ isOccupant: false });

      // Flat should now be VACANT
      flatRes = await request(app)
        .get(`/api/v1/flats/${flatA101Id}`)
        .set('Cookie', adminCookie);
      expect(flatRes.body.data.flat.occupancyStatus).toBe('VACANT');
    });
  });
});
