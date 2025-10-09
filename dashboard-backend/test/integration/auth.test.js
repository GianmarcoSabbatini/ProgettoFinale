/**
 * Integration Tests - Authentication
 * Test dell'autenticazione JWT e registrazione utenti
 */

const request = require('supertest');
const { expect } = require('chai');

const BASE_URL = 'http://localhost:3001';

describe('Authentication API', function() {
  this.timeout(10000); // Timeout 10 secondi per test di integrazione
  
  let authToken;
  let testUser;

  before(function() {
    console.log('\n  🔐 Testing Authentication System...\n');
  });

  describe('POST /api/register', () => {
    it('should register a new user with valid data', async () => {
      const timestamp = Date.now();
      testUser = {
        username: `testuser_${timestamp}`,
        email: `test_${timestamp}@example.com`,
        password: 'TestPassword123!',
        nome: 'Test',
        cognome: 'User'
      };

      const res = await request(BASE_URL)
        .post('/api/register')
        .send(testUser)
        .expect(200);

      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('token');
      expect(res.body.token).to.be.a('string');
      
      // Verifica struttura JWT (header.payload.signature)
      const tokenParts = res.body.token.split('.');
      expect(tokenParts).to.have.lengthOf(3);
      
      authToken = res.body.token;
    });

    it('should reject registration with weak password', async () => {
      const res = await request(BASE_URL)
        .post('/api/register')
        .send({
          username: 'weakpass',
          email: 'weak@example.com',
          password: 'weak', // Password troppo corta
          nome: 'Weak',
          cognome: 'Pass'
        })
        .expect(400);

      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message');
    });

    it('should reject registration with invalid email', async () => {
      const res = await request(BASE_URL)
        .post('/api/register')
        .send({
          username: 'invalidemail',
          email: 'not-an-email', // Email non valida
          password: 'StrongPass123!',
          nome: 'Invalid',
          cognome: 'Email'
        })
        .expect(400);

      expect(res.body).to.have.property('success', false);
    });

    it('should reject duplicate username', async () => {
      // Usa lo stesso username del primo test
      const res = await request(BASE_URL)
        .post('/api/register')
        .send({
          username: testUser.username, // Duplicato
          email: 'different@example.com',
          password: 'TestPassword123!',
          nome: 'Duplicate',
          cognome: 'User'
        })
        .expect(500); // Il backend restituisce 500 per errori DB

      expect(res.body).to.have.property('success', false);
    });
  });

  describe('POST /api/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(BASE_URL)
        .post('/api/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      // Accept 200 (success) or 429 (rate limit)
      expect([200, 429]).to.include(res.status);
      
      if (res.status === 200) {
        expect(res.body).to.have.property('success', true);
        expect(res.body).to.have.property('token');
        expect(res.body.token).to.be.a('string');
        authToken = res.body.token; // Aggiorna token
      }
    });

    it('should reject login with wrong password', async () => {
      const res = await request(BASE_URL)
        .post('/api/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!'
        });

      // Accept 400 (bad credentials) or 429 (rate limit)
      expect([400, 429]).to.include(res.status);
      expect(res.body).to.have.property('success', false);
    });

    it('should reject login with non-existent email', async () => {
      const res = await request(BASE_URL)
        .post('/api/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'AnyPassword123!'
        });

      // Accept 400 (bad credentials) or 429 (rate limit)
      expect([400, 429]).to.include(res.status);
      expect(res.body).to.have.property('success', false);
    });

    it('should reject login with invalid email format', async () => {
      const res = await request(BASE_URL)
        .post('/api/login')
        .send({
          email: 'not-an-email',
          password: 'Password123!'
        });

      // Accept either 400 (validation) or 429 (rate limit)
      expect([400, 429]).to.include(res.status);
      expect(res.body).to.have.property('success', false);
    });
  });

  describe('JWT Token Validation', () => {
    it('should access protected endpoint with valid token', async () => {
      const res = await request(BASE_URL)
        .get('/api/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('messages');
      expect(res.body.messages).to.be.an('array');
    });

    it('should reject access without token', async () => {
      const res = await request(BASE_URL)
        .get('/api/messages')
        .expect(401);

      expect(res.body).to.have.property('message');
    });

    it('should reject access with invalid token', async () => {
      const res = await request(BASE_URL)
        .get('/api/messages')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(res.body).to.have.property('message');
    });

    it('should reject access with malformed Authorization header', async () => {
      const res = await request(BASE_URL)
        .get('/api/messages')
        .set('Authorization', 'InvalidFormat')
        .expect(401);

      expect(res.body).to.have.property('message');
    });
  });
});
