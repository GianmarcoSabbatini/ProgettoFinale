const request = require('supertest');
const { expect } = require('chai');
const mysql = require('mysql2/promise');

const BASE_URL = 'http://localhost:3001';

describe('Payslips API', function() {
    this.timeout(10000);
    
    let db;
    let authToken;
    let testUserId;

    before(async function() {
        console.log('\n  💰 Testing Payslips System...\n');
        
        // Connect to database
        db = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_DATABASE || 'dashboard_db'
        });

        // Create test user and login
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('TestPassword123!', 10);
        
        const [result] = await db.execute(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            ['payslipuser', 'payslipuser@example.com', hashedPassword]
        );
        testUserId = result.insertId;

        await db.execute(
            'INSERT INTO profiles (user_id, nome, cognome) VALUES (?, ?, ?)',
            [testUserId, 'Payslip', 'Test']
        );

        // Login to get token
        const loginRes = await request(BASE_URL)
            .post('/api/login')
            .send({
                email: 'payslipuser@example.com',
                password: 'TestPassword123!'
            });
        authToken = loginRes.body.token;
    });

    after(async function() {
        // Cleanup
        if (testUserId) {
            await db.execute('DELETE FROM payslips WHERE user_id = ?', [testUserId]);
            await db.execute('DELETE FROM timesheet_entries WHERE user_id = ?', [testUserId]);
            await db.execute('DELETE FROM profiles WHERE user_id = ?', [testUserId]);
            await db.execute('DELETE FROM users WHERE id = ?', [testUserId]);
        }
        await db.end();
    });

    beforeEach(async function() {
        // Clear timesheet and payslips before each test
        await db.execute('DELETE FROM payslips WHERE user_id = ?', [testUserId]);
        await db.execute('DELETE FROM timesheet_entries WHERE user_id = ?', [testUserId]);
    });

    describe('POST /api/payslips/generate', () => {
        it('should generate payslip from timesheet entries', async () => {
            // Create timesheet entries
            const [entry1] = await db.execute(
                'INSERT INTO timesheet_entries (user_id, date, hours, description, hourly_rate) VALUES (?, ?, ?, ?, ?)',
                [testUserId, '2025-11-01', 8, 'Development work', 25.00]
            );
            const [entry2] = await db.execute(
                'INSERT INTO timesheet_entries (user_id, date, hours, description, hourly_rate) VALUES (?, ?, ?, ?, ?)',
                [testUserId, '2025-11-02', 7.5, 'Testing', 25.00]
            );

            const res = await request(BASE_URL)
                .post('/api/payslips/generate')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    userId: testUserId,
                    month: 'Novembre',
                    year: 2025
                });

            expect(res.status).to.equal(201);
            expect(res.body.success).to.be.true;
            expect(res.body.payslip).to.be.an('object');
            expect(res.body.payslip.total_hours).to.equal(15.5); // 8 + 7.5
            expect(res.body.payslip.gross_amount).to.equal('387.50'); // 15.5 * 25
        });

        it('should calculate correct net amount (30% deductions)', async () => {
            // Create timesheet entry
            await db.execute(
                'INSERT INTO timesheet_entries (user_id, date, hours, description, hourly_rate) VALUES (?, ?, ?, ?, ?)',
                [testUserId, '2025-11-01', 10, 'Work', 20.00]
            );

            const res = await request(BASE_URL)
                .post('/api/payslips/generate')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    userId: testUserId,
                    month: 'Novembre',
                    year: 2025
                });

            expect(res.status).to.equal(201);
            const grossAmount = parseFloat(res.body.payslip.gross_amount);
            const netAmount = parseFloat(res.body.payslip.net_amount);
            
            expect(grossAmount).to.equal(200.00); // 10 * 20
            expect(netAmount).to.equal(140.00); // 200 * 0.70
        });

        it('should reject generation without timesheet entries', async () => {
            const res = await request(BASE_URL)
                .post('/api/payslips/generate')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    userId: testUserId,
                    month: 'Novembre',
                    year: 2025
                });

            expect(res.status).to.equal(400);
            expect(res.body.success).to.be.false;
            expect(res.body.message).to.include('Nessuna voce timesheet');
        });

        it('should require authentication', async () => {
            const res = await request(BASE_URL)
                .post('/api/payslips/generate')
                .send({
                    userId: testUserId,
                    month: 'Novembre',
                    year: 2025
                });

            expect(res.status).to.equal(401);
        });

        it('should reject generation without required fields', async () => {
            const res = await request(BASE_URL)
                .post('/api/payslips/generate')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    userId: testUserId
                    // Missing month and year
                });

            expect(res.status).to.equal(400);
            expect(res.body.success).to.be.false;
        });

        it('should handle multiple hourly rates correctly', async () => {
            // Create entries with different rates
            await db.execute(
                'INSERT INTO timesheet_entries (user_id, date, hours, description, hourly_rate) VALUES (?, ?, ?, ?, ?)',
                [testUserId, '2025-11-01', 5, 'Junior work', 15.00]
            );
            await db.execute(
                'INSERT INTO timesheet_entries (user_id, date, hours, description, hourly_rate) VALUES (?, ?, ?, ?, ?)',
                [testUserId, '2025-11-02', 5, 'Senior work', 30.00]
            );

            const res = await request(BASE_URL)
                .post('/api/payslips/generate')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    userId: testUserId,
                    month: 'Novembre',
                    year: 2025
                });

            expect(res.status).to.equal(201);
            const grossAmount = parseFloat(res.body.payslip.gross_amount);
            expect(grossAmount).to.equal(225.00); // (5*15) + (5*30)
        });
    });

    describe('PUT /api/payslips/:id/recalculate', () => {
        let payslipId;

        beforeEach(async function() {
            // Create timesheet entries
            await db.execute(
                'INSERT INTO timesheet_entries (user_id, date, hours, description, hourly_rate) VALUES (?, ?, ?, ?, ?)',
                [testUserId, '2025-11-01', 8, 'Work', 20.00]
            );

            // Generate payslip
            const res = await request(BASE_URL)
                .post('/api/payslips/generate')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    userId: testUserId,
                    month: 'Novembre',
                    year: 2025
                });

            payslipId = res.body.payslip.id;
        });

        it('should recalculate payslip when timesheet changes', async () => {
            // Add more hours
            await db.execute(
                'INSERT INTO timesheet_entries (user_id, date, hours, description, hourly_rate) VALUES (?, ?, ?, ?, ?)',
                [testUserId, '2025-11-03', 4, 'Extra work', 20.00]
            );

            const res = await request(BASE_URL)
                .put(`/api/payslips/${payslipId}/recalculate`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).to.equal(200);
            expect(res.body.success).to.be.true;
            expect(res.body.payslip.total_hours).to.equal(12); // 8 + 4
            expect(res.body.payslip.gross_amount).to.equal('240.00'); // 12 * 20
        });

        it('should recalculate with updated timesheet values', async () => {
            // Update existing timesheet entry
            await db.execute(
                'UPDATE timesheet_entries SET hours = 10 WHERE user_id = ? AND date = ?',
                [testUserId, '2025-11-01']
            );

            const res = await request(BASE_URL)
                .put(`/api/payslips/${payslipId}/recalculate`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).to.equal(200);
            const grossAmount = parseFloat(res.body.payslip.gross_amount);
            expect(grossAmount).to.equal(200.00); // 10 * 20
        });

        it('should require authentication for recalculation', async () => {
            const res = await request(BASE_URL)
                .put(`/api/payslips/${payslipId}/recalculate`);

            expect(res.status).to.equal(401);
        });

        it('should reject recalculation of non-existent payslip', async () => {
            const res = await request(BASE_URL)
                .put('/api/payslips/999999/recalculate')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).to.equal(404);
            expect(res.body.success).to.be.false;
        });
    });

    describe('GET /api/payslips', () => {
        beforeEach(async function() {
            // Create timesheet and generate payslip
            await db.execute(
                'INSERT INTO timesheet_entries (user_id, date, hours, description, hourly_rate) VALUES (?, ?, ?, ?, ?)',
                [testUserId, '2025-11-01', 8, 'Work', 20.00]
            );

            await request(BASE_URL)
                .post('/api/payslips/generate')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    userId: testUserId,
                    month: 'Novembre',
                    year: 2025
                });
        });

        it('should get all payslips for user', async () => {
            const res = await request(BASE_URL)
                .get('/api/payslips')
                .set('Authorization', `Bearer ${authToken}`)
                .query({ userId: testUserId });

            expect(res.status).to.equal(200);
            expect(res.body.success).to.be.true;
            expect(res.body.payslips).to.be.an('array');
            expect(res.body.payslips).to.have.lengthOf.at.least(1);
        });

        it('should require authentication', async () => {
            const res = await request(BASE_URL)
                .get('/api/payslips')
                .query({ userId: testUserId });

            expect(res.status).to.equal(401);
        });

        it('should return empty array for user with no payslips', async () => {
            // Create another user without payslips
            const [result] = await db.execute(
                'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                ['emptyuser', 'empty@example.com', 'hash']
            );
            const emptyUserId = result.insertId;

            const res = await request(BASE_URL)
                .get('/api/payslips')
                .set('Authorization', `Bearer ${authToken}`)
                .query({ userId: emptyUserId });

            expect(res.status).to.equal(200);
            expect(res.body.payslips).to.be.an('array');
            expect(res.body.payslips).to.have.lengthOf(0);

            // Cleanup
            await db.execute('DELETE FROM users WHERE id = ?', [emptyUserId]);
        });
    });

    describe('Payslip Calculations - Edge Cases', () => {
        it('should handle decimal hours correctly', async () => {
            await db.execute(
                'INSERT INTO timesheet_entries (user_id, date, hours, description, hourly_rate) VALUES (?, ?, ?, ?, ?)',
                [testUserId, '2025-11-01', 7.75, 'Work', 22.50]
            );

            const res = await request(BASE_URL)
                .post('/api/payslips/generate')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    userId: testUserId,
                    month: 'Novembre',
                    year: 2025
                });

            expect(res.status).to.equal(201);
            const grossAmount = parseFloat(res.body.payslip.gross_amount);
            expect(grossAmount).to.be.closeTo(174.38, 0.01); // 7.75 * 22.50
        });

        it('should handle large numbers of hours', async () => {
            // Simulate overtime month (160+ hours)
            for (let i = 1; i <= 20; i++) {
                await db.execute(
                    'INSERT INTO timesheet_entries (user_id, date, hours, description, hourly_rate) VALUES (?, ?, ?, ?, ?)',
                    [testUserId, `2025-11-${String(i).padStart(2, '0')}`, 8, 'Work', 25.00]
                );
            }

            const res = await request(BASE_URL)
                .post('/api/payslips/generate')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    userId: testUserId,
                    month: 'Novembre',
                    year: 2025
                });

            expect(res.status).to.equal(201);
            expect(res.body.payslip.total_hours).to.equal(160); // 20 days * 8 hours
            const grossAmount = parseFloat(res.body.payslip.gross_amount);
            expect(grossAmount).to.equal(4000.00); // 160 * 25
        });

        it('should handle INPS deduction calculation', async () => {
            await db.execute(
                'INSERT INTO timesheet_entries (user_id, date, hours, description, hourly_rate) VALUES (?, ?, ?, ?, ?)',
                [testUserId, '2025-11-01', 10, 'Work', 20.00]
            );

            const res = await request(BASE_URL)
                .post('/api/payslips/generate')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    userId: testUserId,
                    month: 'Novembre',
                    year: 2025
                });

            const grossAmount = parseFloat(res.body.payslip.gross_amount);
            const inpsDeduction = parseFloat(res.body.payslip.inps_deduction);
            
            expect(inpsDeduction).to.be.closeTo(grossAmount * 0.10, 0.01); // 10% INPS
        });

        it('should handle IRPEF deduction calculation', async () => {
            await db.execute(
                'INSERT INTO timesheet_entries (user_id, date, hours, description, hourly_rate) VALUES (?, ?, ?, ?, ?)',
                [testUserId, '2025-11-01', 10, 'Work', 20.00]
            );

            const res = await request(BASE_URL)
                .post('/api/payslips/generate')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    userId: testUserId,
                    month: 'Novembre',
                    year: 2025
                });

            const grossAmount = parseFloat(res.body.payslip.gross_amount);
            const irpefDeduction = parseFloat(res.body.payslip.irpef_deduction);
            
            expect(irpefDeduction).to.be.closeTo(grossAmount * 0.20, 0.01); // 20% IRPEF
        });
    });
});


