import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/server.js';
import User from '../src/models/User.js';
import Tenant from '../models/Tenant.js';

describe('Authentication & Provisioning Endpoints', () => {
  beforeAll(async () => {
    // Connect to a test MongoDB database
    const url = 'mongodb://localhost:27017/assetflow_test';
    await mongoose.disconnect(); // Disconnect default connection
    await mongoose.connect(url);
  });

  afterAll(async () => {
    // Clean up test data and close connection
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear user and tenant collections before each test
    await User.deleteMany({});
    await Tenant.deleteMany({});
  });

  it('should successfully register a new user as Employee and create tenant', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        name: 'Vasu Patel',
        email: 'vasu@patel.com',
        password: 'Password123',
        tenantName: 'VasuCorp',
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toEqual('Employee');
    expect(res.body.data.email).toEqual('vasu@patel.com');

    // Confirm Tenant was created
    const tenant = await Tenant.findOne({ name: 'VasuCorp' });
    expect(tenant).not.toBeNull();
  });

  it('should prevent signup with an already registered email within the same tenant', async () => {
    // Create initial user
    const tenant = new Tenant({ name: 'VasuCorp' });
    await tenant.save();

    const user = new User({
      tenantId: tenant._id,
      name: 'Vasu Patel',
      email: 'vasu@patel.com',
      passwordHash: 'dummyhash',
      role: 'Employee',
    });
    await user.save();

    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        name: 'Vasu Patel Duplicate',
        email: 'vasu@patel.com',
        password: 'Password123',
        tenantName: 'VasuCorp',
      });

    expect(res.statusCode).toEqual(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toEqual('EMAIL_ALREADY_IN_USE');
  });

  it('should sign in successfully and return JWT access token', async () => {
    // Register user first
    await request(app)
      .post('/api/v1/auth/signup')
      .send({
        name: 'Vasu Patel',
        email: 'vasu@patel.com',
        password: 'Password123',
        tenantName: 'VasuCorp',
      });

    // Attempt login
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'vasu@patel.com',
        password: 'Password123',
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toEqual('Employee');
  });
});
