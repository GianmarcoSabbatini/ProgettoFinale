const request = require('supertest');
const { expect } = require('chai');
const mysql = require('mysql2/promise');

const BASE_URL = 'http://localhost:3001';

describe('Password Reset Flow', function() {
    this.timeout(10000);
    
    let db;
    let testUserId;
    let testUserEmail = 'resettest@example.com';

    before(async function() {
        console.log('\n  🔑 Testing Password Reset System...\n');
        
        // Connect to database
        db = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_DATABASE || 'dashboard_db'
        });

        // Create test user
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('TestPassword123!', 10);
        const [result] = await db.execute(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            ['resetuser', testUserEmail, hashedPassword]
        );
        testUserId = result.insertId;

        await db.execute(
            'INSERT INTO profiles (user_id, nome, cognome) VALUES (?, ?, ?)',
            [testUserId, 'Reset', 'Test']
        );
    });

    after(async function() {
        // Cleanup
        if (testUserId) {
            await db.execute('DELETE FROM password_resets WHERE user_id = ?', [testUserId]);
            await db.execute('DELETE FROM profiles WHERE user_id = ?', [testUserId]);
            await db.execute('DELETE FROM users WHERE id = ?', [testUserId]);
        }
        await db.end();
    });

    describe('POST /api/auth/forgot-password', () => {
        it('should generate reset token for valid email', async () => {
            const res = await request(BASE_URL)
                .post('/api/auth/forgot-password')
                .send({ email: testUserEmail });

            expect(res.status).to.equal(200);
            expect(res.body.success).to.be.true;
            expect(res.body.token).to.be.a('string');
            expect(res.body.token).to.have.lengthOf(64); // 32 bytes hex = 64 chars
            expect(res.body.expiresAt).to.be.a('string');
            expect(res.body.email).to.equal(testUserEmail);
        });

        it('should reject forgot-password for non-existent email', async () => {
            const res = await request(BASE_URL)
                .post('/api/auth/forgot-password')
                .send({ email: 'nonexistent@example.com' });

            expect(res.status).to.equal(404);
            expect(res.body.success).to.be.false;
            expect(res.body.message).to.include('Utente non trovato');
        });

        it('should reject forgot-password with invalid email format', async () => {
            const res = await request(BASE_URL)
                .post('/api/auth/forgot-password')
                .send({ email: 'invalid-email' });

            expect(res.status).to.equal(400);
            expect(res.body.success).to.be.false;
        });

        it('should reject forgot-password without email', async () => {
            const res = await request(BASE_URL)
                .post('/api/auth/forgot-password')
                .send({});

            expect(res.status).to.equal(400);
            expect(res.body.success).to.be.false;
        });

        it('should invalidate old tokens when generating new one', async () => {
            // Generate first token
            const res1 = await request(BASE_URL)
                .post('/api/auth/forgot-password')
                .send({ email: testUserEmail });
            
            const token1 = res1.body.token;

            // Generate second token
            const res2 = await request(BASE_URL)
                .post('/api/auth/forgot-password')
                .send({ email: testUserEmail });

            const token2 = res2.body.token;

            // Verify first token is invalidated
            const [tokens] = await db.execute(
                'SELECT * FROM password_resets WHERE user_id = ?',
                [testUserId]
            );

            expect(tokens).to.have.lengthOf(1);
            expect(tokens[0].token).to.equal(token2);
            expect(tokens[0].token).to.not.equal(token1);
        });
    });

    describe('POST /api/auth/reset-password', () => {
        let validToken;

        beforeEach(async () => {
            // Generate a valid token before each test
            const res = await request(BASE_URL)
                .post('/api/auth/forgot-password')
                .send({ email: testUserEmail });
            validToken = res.body.token;
        });

        it('should reset password with valid token', async () => {
            const newPassword = 'NewPassword123!';

            const res = await request(BASE_URL)
                .post('/api/auth/reset-password')
                .send({
                    token: validToken,
                    newPassword: newPassword
                });

            expect(res.status).to.equal(200);
            expect(res.body.success).to.be.true;
            expect(res.body.message).to.include('Password aggiornata');
        });

        it('should reject reset with invalid token', async () => {
            const res = await request(BASE_URL)
                .post('/api/auth/reset-password')
                .send({
                    token: 'invalid-token-1234567890',
                    newPassword: 'NewPassword123!'
                });

            expect(res.status).to.equal(400);
            expect(res.body.success).to.be.false;
            expect(res.body.message).to.include('Token non valido');
        });

        it('should reject reset with expired token', async () => {
            // Manually set token expiry to past
            await db.execute(
                'UPDATE password_resets SET expires_at = DATE_SUB(NOW(), INTERVAL 2 HOUR) WHERE token = ?',
                [validToken]
            );

            const res = await request(BASE_URL)
                .post('/api/auth/reset-password')
                .send({
                    token: validToken,
                    newPassword: 'NewPassword123!'
                });

            expect(res.status).to.equal(400);
            expect(res.body.success).to.be.false;
            expect(res.body.message).to.include('scaduto');
        });

        it('should reject reset with weak password', async () => {
            const res = await request(BASE_URL)
                .post('/api/auth/reset-password')
                .send({
                    token: validToken,
                    newPassword: 'weak'
                });

            expect(res.status).to.equal(400);
            expect(res.body.success).to.be.false;
        });

        it('should reject used token (one-time use)', async () => {
            const newPassword = 'NewPassword123!';

            // First reset - should succeed
            const res1 = await request(BASE_URL)
                .post('/api/auth/reset-password')
                .send({
                    token: validToken,
                    newPassword: newPassword
                });

            expect(res1.status).to.equal(200);

            // Second reset with same token - should fail
            const res2 = await request(BASE_URL)
                .post('/api/auth/reset-password')
                .send({
                    token: validToken,
                    newPassword: 'AnotherPassword456!'
                });

            expect(res2.status).to.equal(400);
            expect(res2.body.success).to.be.false;
            expect(res2.body.message).to.include('Token non valido');
        });

        it('should reject reset without token', async () => {
            const res = await request(BASE_URL)
                .post('/api/auth/reset-password')
                .send({
                    newPassword: 'NewPassword123!'
                });

            expect(res.status).to.equal(400);
            expect(res.body.success).to.be.false;
        });

        it('should reject reset without newPassword', async () => {
            const res = await request(BASE_URL)
                .post('/api/auth/reset-password')
                .send({
                    token: validToken
                });

            expect(res.status).to.equal(400);
            expect(res.body.success).to.be.false;
        });
    });
});
