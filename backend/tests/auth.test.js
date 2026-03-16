const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const { expect } = chai;

chai.use(chaiHttp);

const customerService = require('../services/customerService');
const adminService = require('../services/adminService');
const accountService = require('../services/accountService');

let app;
let server;

before((done) => {
  process.env.JWT_SECRET = 'test_secret';
  process.env.JWT_EXPIRE = '7d';
  process.env.MONGO_URI = 'mongodb://localhost:27017/myfinbank_test';
  process.env.EMAIL_USER = 'test@test.com';
  process.env.EMAIL_PASS = 'test';
  process.env.ADMIN_EMAIL = 'admin@test.com';
  app = require('../server');
  setTimeout(done, 1000);
});

after((done) => {
  done();
  process.exit(0);
});

afterEach(() => {
  sinon.restore();
});

describe('POST /api/auth/login - Customer Login', () => {
  it('should return 400 if email or password missing', (done) => {
    chai.request(app)
      .post('/api/auth/login')
      .send({ email: '' })
      .end((err, res) => {
        expect(res.status).to.equal(400);
        expect(res.body.success).to.be.false;
        expect(res.body.message).to.equal('Email and password required');
        done();
      });
  });

  it('should return 401 if customer not found', (done) => {
    sinon.stub(customerService, 'findByEmail').resolves(null);
    chai.request(app)
      .post('/api/auth/login')
      .send({ email: 'notfound@test.com', password: 'password123' })
      .end((err, res) => {
        expect(res.status).to.equal(401);
        expect(res.body.success).to.be.false;
        done();
      });
  });

  it('should return 403 if customer status is PENDING_VERIFICATION', (done) => {
    sinon.stub(customerService, 'findByEmail').resolves({
      status: 'PENDING_VERIFICATION',
      comparePassword: async () => true
    });
    chai.request(app)
      .post('/api/auth/login')
      .send({ email: 'pending@test.com', password: 'password123' })
      .end((err, res) => {
        expect(res.status).to.equal(403);
        done();
      });
  });

  it('should return 401 if password is incorrect', (done) => {
    sinon.stub(customerService, 'findByEmail').resolves({
      status: 'ACTIVE',
      comparePassword: async () => false
    });
    chai.request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'wrongpassword' })
      .end((err, res) => {
        expect(res.status).to.equal(401);
        expect(res.body.message).to.equal('Invalid credentials');
        done();
      });
  });

  it('should return 200 with token if credentials are valid', (done) => {
    sinon.stub(customerService, 'findByEmail').resolves({
      customerId: 'MYFIN-CUST-0001',
      name: 'Test User',
      email: 'test@test.com',
      status: 'ACTIVE',
      comparePassword: async () => true
    });
    chai.request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'password123' })
      .end((err, res) => {
        expect(res.status).to.equal(200);
        expect(res.body.success).to.be.true;
        expect(res.body.token).to.be.a('string');
        expect(res.body.user.role).to.equal('CUSTOMER');
        done();
      });
  });
});

describe('POST /api/auth/admin/login - Admin Login', () => {
  it('should return 401 if admin not found', (done) => {
    sinon.stub(adminService, 'findByEmail').resolves(null);
    chai.request(app)
      .post('/api/auth/admin/login')
      .send({ email: 'admin@test.com', password: 'admin123' })
      .end((err, res) => {
        expect(res.status).to.equal(401);
        expect(res.body.success).to.be.false;
        done();
      });
  });

  it('should return 200 with token for valid admin', (done) => {
    sinon.stub(adminService, 'findByEmail').resolves({
      adminId: 'MYFIN-ADMIN-0001',
      name: 'Admin',
      email: 'admin@test.com',
      comparePassword: async () => true
    });
    chai.request(app)
      .post('/api/auth/admin/login')
      .send({ email: 'admin@test.com', password: 'admin123' })
      .end((err, res) => {
        expect(res.status).to.equal(200);
        expect(res.body.success).to.be.true;
        expect(res.body.user.role).to.equal('ADMIN');
        done();
      });
  });
});

describe('POST /api/auth/forgot-password', () => {
  it('should return 400 if email missing', (done) => {
    chai.request(app)
      .post('/api/auth/forgot-password')
      .send({})
      .end((err, res) => {
        expect(res.status).to.equal(400);
        done();
      });
  });

  it('should return 404 if email not found', (done) => {
    sinon.stub(customerService, 'findByEmail').resolves(null);
    chai.request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'notfound@test.com' })
      .end((err, res) => {
        expect(res.status).to.equal(404);
        done();
      });
  });
});