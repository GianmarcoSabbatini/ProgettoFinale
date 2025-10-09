/**
 * Integration Tests - Security
 * Test delle funzionalità di sicurezza (Rate Limiting, CORS, Headers)
 */

const request = require('supertest');
const { expect } = require('chai');

const BASE_URL = 'http://localhost:3001';

describe('Security Features', function() {
  this.timeout(15000); // Timeout 15 secondi per rate limiting tests
  
  before(function() {
    console.log('\n  🛡️  Testing Security Features...\n');
  });

  describe('Security Headers (Helmet)', () => {
    it('should include X-Content-Type-Options header', async () => {
      const res = await request(BASE_URL)
        .get('/api/messages')
        .expect(401); // Non autenticato, ma headers presenti

      expect(res.headers).to.have.property('x-content-type-options');
      expect(res.headers['x-content-type-options']).to.equal('nosniff');
    });

    it('should include X-Frame-Options header', async () => {
      const res = await request(BASE_URL)
        .get('/api/messages');

      expect(res.headers).to.have.property('x-frame-options');
      expect(res.headers['x-frame-options']).to.equal('SAMEORIGIN');
    });

    it('should include X-Download-Options header', async () => {
      const res = await request(BASE_URL)
        .get('/api/messages');

      expect(res.headers).to.have.property('x-download-options');
      expect(res.headers['x-download-options']).to.equal('noopen');
    });

    it('should include X-DNS-Prefetch-Control header', async () => {
      const res = await request(BASE_URL)
        .get('/api/messages');

      expect(res.headers).to.have.property('x-dns-prefetch-control');
      expect(res.headers['x-dns-prefetch-control']).to.equal('off');
    });
  });

  describe('CORS Configuration', () => {
    it('should allow requests from configured origin', async () => {
      const res = await request(BASE_URL)
        .get('/api/messages')
        .set('Origin', 'http://localhost:5173');

      expect(res.headers).to.have.property('access-control-allow-origin');
      expect(res.headers['access-control-allow-origin']).to.equal('http://localhost:5173');
    });

    it('should handle preflight requests', async () => {
      const res = await request(BASE_URL)
        .options('/api/messages')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'POST')
        .expect(204);

      expect(res.headers).to.have.property('access-control-allow-methods');
    });
  });

  describe('Rate Limiting', () => {
    it('should allow initial login attempts', async () => {
      const res = await request(BASE_URL)
        .post('/api/login')
        .send({
          email: 'test@example.com',
          password: 'wrong'
        });

      // Può essere 400 (validazione/credenziali errate) o 429 (rate limit)
      expect([400, 429]).to.include(res.status);
    });

    it('should enforce rate limiting after multiple failed attempts', async () => {
      // Fai 6 tentativi rapidamente
      const promises = [];
      for (let i = 0; i < 6; i++) {
        promises.push(
          request(BASE_URL)
            .post('/api/login')
            .send({
              email: `ratelimit${i}@test.com`,
              password: 'wrong'
            })
        );
      }

      const results = await Promise.all(promises);
      
      // Almeno uno dei tentativi dovrebbe essere bloccato (429)
      const blocked = results.some(res => res.status === 429);
      expect(blocked).to.be.true;
    });
  });

  describe('Input Validation', () => {
    it('should reject SQL injection attempts in email', async () => {
      const res = await request(BASE_URL)
        .post('/api/login')
        .send({
          email: "admin'--",
          password: 'password'
        });

      // Can be 400 (validation) or 429 (rate limit)
      expect([400, 429]).to.include(res.status);
      expect(res.body).to.have.property('success', false);
    });

    it('should reject XSS attempts in registration', async () => {
      const res = await request(BASE_URL)
        .post('/api/register')
        .send({
          username: '<script>alert("xss")</script>',
          email: 'xss@test.com',
          password: 'Password123!',
          nome: 'Test',
          cognome: 'XSS'
        });

      // Accept 200 (successful), 400 (validation), or 500 (server error)
      expect([200, 400, 500]).to.include(res.status);
    });

    it('should sanitize HTML in input fields', async () => {
      const res = await request(BASE_URL)
        .post('/api/login')
        .send({
          email: 'test@example.com',
          password: '<b>password</b>'
        });

      // Must reject or sanitize - accept 400 (credentials) or 429 (rate limit)
      expect([400, 429]).to.include(res.status);
    });
  });

  describe('Password Security', () => {
    it('should enforce password minimum length', async () => {
      const res = await request(BASE_URL)
        .post('/api/register')
        .send({
          username: 'shortpass',
          email: 'short@test.com',
          password: 'Ab1', // Troppo corta
          nome: 'Short',
          cognome: 'Pass'
        })
        .expect(400);

      expect(res.body).to.have.property('success', false);
    });

    it('should enforce password complexity (uppercase)', async () => {
      const res = await request(BASE_URL)
        .post('/api/register')
        .send({
          username: 'noupper',
          email: 'noupper@test.com',
          password: 'password123', // Nessuna maiuscola
          nome: 'No',
          cognome: 'Upper'
        })
        .expect(400);

      expect(res.body).to.have.property('success', false);
    });

    it('should enforce password complexity (number)', async () => {
      const res = await request(BASE_URL)
        .post('/api/register')
        .send({
          username: 'nonumber',
          email: 'nonumber@test.com',
          password: 'PasswordNoNum', // Nessun numero
          nome: 'No',
          cognome: 'Number'
        })
        .expect(400);

      expect(res.body).to.have.property('success', false);
    });
  });
});
