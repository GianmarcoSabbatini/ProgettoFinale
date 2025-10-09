/**
 * Integration Tests - API Endpoints
 * Test degli endpoint API protetti (messaggi)
 */

const request = require('supertest');
const { expect } = require('chai');

const BASE_URL = 'http://localhost:3001';

describe('API Endpoints', function() {
  this.timeout(10000);
  
  let authToken;
  let testMessageId;
  let testUserId;

  before(async function() {
    console.log('\n  📡 Testing API Endpoints...\n');
    
    // Crea un utente di test e ottieni il token
    const timestamp = Date.now();
    const res = await request(BASE_URL)
      .post('/api/register')
      .send({
        username: `apitest_${timestamp}`,
        email: `apitest_${timestamp}@example.com`,
        password: 'ApiTest123!',
        nome: 'API',
        cognome: 'Test'
      });

    if (res.body.token) {
      authToken = res.body.token;
      testUserId = res.body.user.id;
    }
  });

  describe('GET /api/messages', () => {
    it('should return messages array', async () => {
      if (!authToken) {
        this.skip();
        return;
      }

      const res = await request(BASE_URL)
        .get('/api/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('messages');
      expect(res.body.messages).to.be.an('array');
    });

    it('should require authentication', async () => {
      const res = await request(BASE_URL)
        .get('/api/messages')
        .expect(401);

      expect(res.body).to.have.property('message');
    });
  });

  describe('POST /api/messages', () => {
    it('should create a new message with valid data', async () => {
      if (!authToken) {
        this.skip();
        return;
      }

      const messageData = {
        title: 'Test Message',
        content: 'This is a test message content',
        author: 'API Test'
      };

      const res = await request(BASE_URL)
        .post('/api/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .send(messageData)
        .expect(200);

      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('message');
      
      // Get the message ID from the messages list
      const messagesRes = await request(BASE_URL)
        .get('/api/messages')
        .set('Authorization', `Bearer ${authToken}`);
      
      testMessageId = messagesRes.body.messages[0]?.id;
    });

    it('should reject message without authentication', async () => {
      const res = await request(BASE_URL)
        .post('/api/messages')
        .send({
          title: 'Unauthorized',
          content: 'Should fail',
          author: 'Hacker'
        })
        .expect(401);

      expect(res.body).to.have.property('message');
    });

    it('should reject message with empty title', async () => {
      if (!authToken) {
        this.skip();
        return;
      }

      const res = await request(BASE_URL)
        .post('/api/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '', // Vuoto
          content: 'Content',
          author: 'Test'
        })
        .expect(400);

      expect(res.body).to.have.property('success', false);
    });

    it('should reject message with empty content', async () => {
      if (!authToken) {
        this.skip();
        return;
      }

      const res = await request(BASE_URL)
        .post('/api/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Title',
          content: '', // Vuoto
          author: 'Test'
        })
        .expect(400);

      expect(res.body).to.have.property('success', false);
    });
  });

  describe('PUT /api/messages/:id', () => {
    it('should update existing message', async () => {
      if (!authToken || !testMessageId) {
        return this.skip();
      }

      const updatedData = {
        content: 'Updated content',
        author: 'API Test' // Must match original author
      };

      const res = await request(BASE_URL)
        .put(`/api/messages/${testMessageId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updatedData)
        .expect(200);

      expect(res.body).to.have.property('success', true);
    });

    it('should require authentication for update', async () => {
      if (!testMessageId) {
        return this.skip();
      }

      const res = await request(BASE_URL)
        .put(`/api/messages/${testMessageId}`)
        .send({
          content: 'Should fail',
          author: 'API Test'
        })
        .expect(401);

      expect(res.body).to.have.property('message');
    });

    it('should reject update with missing fields', async () => {
      if (!authToken || !testMessageId) {
        return this.skip();
      }

      const res = await request(BASE_URL)
        .put(`/api/messages/${testMessageId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Missing author field'
        })
        .expect(400);

      expect(res.body).to.have.property('success', false);
    });
  });

  describe('DELETE /api/messages/:id', () => {
    it('should delete existing message', async () => {
      if (!authToken || !testMessageId) {
        return this.skip();
      }

      const res = await request(BASE_URL)
        .delete(`/api/messages/${testMessageId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ author: 'API Test' })
        .expect(200);

      expect(res.body).to.have.property('success', true);
    });

    it('should require authentication for delete', async () => {
      const res = await request(BASE_URL)
        .delete('/api/messages/1')
        .send({ author: 'API Test' })
        .expect(401);

      expect(res.body).to.have.property('message');
    });

    it('should require author in body', async () => {
      if (!authToken) {
        return this.skip();
      }

      const res = await request(BASE_URL)
        .delete('/api/messages/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(res.body).to.have.property('success', false);
    });
  });
});
