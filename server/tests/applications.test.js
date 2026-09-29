// tests/applications.test.js — Integration tests for Job Applications API

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'super_secret_test_jwt_key_98765';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../index');
const JobApplication = require('../models/JobApplication');
const User = require('../models/User');

jest.mock('../models/JobApplication');
jest.mock('../models/User');

const mockUserId = '507f1f77bcf86cd799439011';
const validToken = jwt.sign({ id: mockUserId }, process.env.JWT_SECRET);

describe('Applications API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: mockUserId, name: 'Test User' }),
    });
  });

  describe('Auth Protection', () => {
    it('should return 401 if no Authorization token is provided', async () => {
      const res = await request(app).get('/api/applications');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/applications (Pagination & Filtering)', () => {
    it('should return paginated application results with metadata', async () => {
      const mockApps = [
        { _id: 'app1', company: 'Google', role: 'SWE', stage: 'Applied' },
        { _id: 'app2', company: 'Microsoft', role: 'SDE', stage: 'Interview' },
      ];

      JobApplication.countDocuments.mockResolvedValue(15);
      JobApplication.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockApps),
            }),
          }),
        }),
      });

      const res = await request(app)
        .get('/api/applications?page=2&limit=2')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.total).toBe(15);
      expect(res.body.page).toBe(2);
      expect(res.body.totalPages).toBe(8);
      expect(res.body.hasNextPage).toBe(true);
      expect(res.body.hasPrevPage).toBe(true);
      expect(res.body.data.length).toBe(2);
    });
  });

  describe('POST /api/applications', () => {
    it('should return 400 if company or role is missing', async () => {
      const res = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ location: 'Remote' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/company and role are required/i);
    });

    it('should create an application successfully', async () => {
      const newApp = {
        _id: 'app123',
        company: 'Stripe',
        role: 'Full Stack Engineer',
        stage: 'Saved',
        user: mockUserId,
      };

      JobApplication.create.mockResolvedValue(newApp);

      const res = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          company: 'Stripe',
          role: 'Full Stack Engineer',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.company).toBe('Stripe');
    });
  });

  describe('PATCH /api/applications/:id/stage', () => {
    it('should update stage of an application', async () => {
      const updatedApp = {
        _id: 'app123',
        company: 'Stripe',
        role: 'Full Stack Engineer',
        stage: 'Interview',
      };

      JobApplication.findOneAndUpdate.mockResolvedValue(updatedApp);

      const res = await request(app)
        .patch('/api/applications/app123/stage')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ stage: 'Interview' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.stage).toBe('Interview');
    });
  });

  describe('GET /api/applications/alerts/upcoming', () => {
    it('should return upcoming deadline and interview alerts', async () => {
      const mockUpcoming = [
        {
          _id: 'app99',
          company: 'Amazon',
          role: 'Backend Dev',
          interviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      ];

      JobApplication.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockUpcoming),
        }),
      });

      const res = await request(app)
        .get('/api/applications/alerts/upcoming')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].company).toBe('Amazon');
    });
  });

  describe('DELETE /api/applications/:id', () => {
    it('should delete an existing application', async () => {
      JobApplication.findOneAndDelete.mockResolvedValue({
        _id: 'app123',
        company: 'Stripe',
      });

      const res = await request(app)
        .delete('/api/applications/app123')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/application deleted/i);
    });
  });
});
