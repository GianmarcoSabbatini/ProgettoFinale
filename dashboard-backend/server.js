const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const logger = require('./config/logger');
const { requestLogger, errorLogger } = require('./middleware/logger');
const { verifyToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Security Middleware
app.use(helmet());
app.use(compression());

// CORS Configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));

app.use(express.json());
app.use(requestLogger);

// Rate Limiting (disabled in test environment)
const loginLimiter = process.env.NODE_ENV === 'test' ? (req, res, next) => next() : rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minuti
    max: 5,
    message: { success: false, message: 'Troppi tentativi di login. Riprova tra 15 minuti.' }
});

const apiLimiter = process.env.NODE_ENV === 'test' ? (req, res, next) => next() : rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 100,
    message: { success: false, message: 'Troppe richieste. Rallenta.' }
});

app.use('/api/', apiLimiter);

// Database connection
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'dashboard_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

let db;

// Initialize database
async function initDB() {
    try {
        logger.info('Inizializzazione database...');
        
        // First connect without database to create it
        const tempDb = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: ''
        });
        
        await tempDb.execute('CREATE DATABASE IF NOT EXISTS dashboard_db');
        await tempDb.end();
        
        logger.info('Database dashboard_db verificato/creato');
        
        // Now connect to the specific database using connection pool
        db = mysql.createPool(dbConfig);
        
        // Test the connection
        await db.query('SELECT 1');
        logger.info('✅ Connesso a MySQL con successo (connection pool)');
        logger.logDatabase('Connessione MySQL Pool', true, { database: 'dashboard_db' });

        // Create tables
        await db.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        logger.debug('Tabella users verificata/creata');

        await db.execute(`
            CREATE TABLE IF NOT EXISTS profiles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                nome VARCHAR(50) NOT NULL,
                cognome VARCHAR(50) NOT NULL,
                job_title VARCHAR(100),
                team VARCHAR(50),
                avatar VARCHAR(20) DEFAULT '#4ECDC4',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);
        logger.debug('Tabella profiles verificata/creata');

        await db.execute(`
            CREATE TABLE IF NOT EXISTS messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(200) NOT NULL,
                content TEXT NOT NULL,
                author VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        logger.debug('Tabella messages verificata/creata');

        // Add sample messages if empty
        const [messages] = await db.execute('SELECT COUNT(*) as count FROM messages');
        if (messages[0].count === 0) {
            await db.execute(`
                INSERT INTO messages (title, content, author) VALUES 
                ('Benvenuto nella Dashboard', 'Questa è la tua dashboard personale. Qui puoi visualizzare messaggi e gestire il tuo profilo.', 'Sistema'),
                ('Aggiornamento Sistema', 'Il sistema è stato aggiornato con nuove funzionalità per migliorare la tua esperienza.', 'Admin'),
                ('Promemoria', 'Ricordati di aggiornare le tue informazioni di profilo se necessario.', 'HR')
            `);
            logger.info('Messaggi di esempio inseriti nel database');
        }

        // Create timesheet table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS timesheet (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                date DATE NOT NULL,
                project VARCHAR(200) NOT NULL,
                hours DECIMAL(4,2) NOT NULL,
                type VARCHAR(100) NOT NULL,
                description TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        logger.debug('Tabella timesheet verificata/creata');

        // Create expense_reimbursement table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS expense_reimbursement (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                date DATE NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                category VARCHAR(100) NOT NULL,
                payment_method VARCHAR(100) NOT NULL,
                description TEXT NOT NULL,
                receipt_filename VARCHAR(255),
                status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        logger.debug('Tabella expense_reimbursement verificata/creata');
        
        logger.info('Inizializzazione database completata con successo');

    } catch (error) {
        logger.error('❌ Errore critico durante l\'inizializzazione del database', {
            message: error.message,
            code: error.code,
            sqlMessage: error.sqlMessage,
        });
        logger.logDatabase('Inizializzazione database', false, { 
            error: error.message,
            code: error.code 
        });
        console.error('Stack trace completo:', error);
        process.exit(1);
    }
}

// API Endpoints
app.post('/api/register', [
    body('username').trim().isLength({ min: 3, max: 50 }).escape()
        .withMessage('Username deve essere tra 3 e 50 caratteri'),
    body('email').isEmail().normalizeEmail()
        .withMessage('Email non valida'),
    body('password').isLength({ min: 8 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password deve contenere almeno 8 caratteri, una maiuscola, una minuscola e un numero'),
    body('nome').optional().trim().escape(),
    body('cognome').optional().trim().escape()
], async (req, res) => {
    try {
        // Validazione input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.warn('Registrazione fallita: validazione input', { errors: errors.array() });
            return res.status(400).json({ 
                success: false, 
                message: 'Errore di validazione',
                errors: errors.array() 
            });
        }

        const { username, email, password, nome, cognome, jobTitle, team, avatar } = req.body;
        
        logger.info('Tentativo di registrazione', { username, email });

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const [result] = await db.execute(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );

        // Insert profile con valori di default per campi opzionali
        await db.execute(
            'INSERT INTO profiles (user_id, nome, cognome, job_title, team, avatar) VALUES (?, ?, ?, ?, ?, ?)',
            [
                result.insertId, 
                nome || 'User', 
                cognome || '', 
                jobTitle || 'Dipendente', 
                team || 'General', 
                avatar || '#4ECDC4'
            ]
        );
        
        // Genera JWT token
        const token = jwt.sign(
            { userId: result.insertId, username, email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        logger.logAuth('Registrazione', username, true, { userId: result.insertId });
        logger.info('Registrazione completata con successo', { username, userId: result.insertId });

        res.json({
            success: true,
            message: 'Registrazione completata',
            token: token,
            user: {
                id: result.insertId,
                username,
                email
            }
        });

    } catch (error) {
        logger.error('Errore durante la registrazione', {
            error: error.message,
            username: req.body.username,
            email: req.body.email,
        });
        logger.logAuth('Registrazione', req.body.username, false, { error: error.message });
        
        res.status(500).json({
            success: false,
            message: 'Errore durante la registrazione'
        });
    }
});

app.post('/api/login', loginLimiter, [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
], async (req, res) => {
    try {
        // Validazione input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Dati non validi' 
            });
        }

        const { email, password } = req.body;
        
        logger.info('Tentativo di login', { email });

        // Find user
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            logger.warn('Tentativo di login fallito: email non trovata', { email });
            logger.logAuth('Login', email, false, { reason: 'Email non trovata' });
            
            return res.status(400).json({
                success: false,
                message: 'Credenziali non valide'
            });
        }

        const user = users[0];

        // Check password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            logger.warn('Tentativo di login fallito: password errata', { email, username: user.username });
            logger.logAuth('Login', user.username, false, { reason: 'Password errata' });
            
            return res.status(400).json({
                success: false,
                message: 'Credenziali non valide'
            });
        }

        logger.info('Login effettuato con successo', { username: user.username, userId: user.id });
        logger.logAuth('Login', user.username, true, { userId: user.id });

        // Genera JWT token
        const token = jwt.sign(
            { userId: user.id, username: user.username, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: 'Login effettuato',
            token: token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        logger.error('Errore durante il login', {
            error: error.message,
            email: req.body.email,
        });
        
        res.status(500).json({
            success: false,
            message: 'Errore durante il login'
        });
    }
});

app.get('/api/profile', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId; // Preso dal token JWT
        
        logger.debug('Richiesta profilo', { userId });

        const [profiles] = await db.execute(`
            SELECT p.*, u.username, u.email 
            FROM profiles p 
            JOIN users u ON p.user_id = u.id 
            WHERE p.user_id = ?
        `, [userId]);

        if (profiles.length === 0) {
            logger.warn('Profilo non trovato', { userId });
            return res.status(404).json({
                success: false,
                message: 'Profilo non trovato'
            });
        }
        
        logger.debug('Profilo recuperato con successo', { userId });

        res.json({
            success: true,
            profile: profiles[0]
        });

    } catch (error) {
        logger.error('Errore durante il recupero del profilo', {
            error: error.message,
            stack: error.stack,
        });
        
        res.status(500).json({
            success: false,
            message: 'Errore durante il recupero del profilo'
        });
    }
});

app.put('/api/profile', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId; // Preso dal token JWT
        const { job_title, team } = req.body;
        
        logger.info('Aggiornamento profilo', { userId, job_title, team });

        await db.execute(`
            UPDATE profiles 
            SET job_title = ?, team = ? 
            WHERE user_id = ?
        `, [job_title, team, userId]);
        
        logger.info('Profilo aggiornato con successo', { userId });

        res.json({
            success: true,
            message: 'Profilo aggiornato con successo'
        });

    } catch (error) {
        logger.error('Errore durante l\'aggiornamento del profilo', {
            error: error.message,
            userId: req.headers.authorization?.replace('Bearer ', '').replace('demo-token-', ''),
        });
        
        res.status(500).json({
            success: false,
            message: 'Errore durante l\'aggiornamento del profilo'
        });
    }
});

app.get('/api/messages', verifyToken, async (req, res) => {
    try {
        logger.debug('Richiesta lista messaggi');
        
        const [messages] = await db.execute('SELECT * FROM messages ORDER BY created_at DESC');
        
        logger.debug('Messaggi recuperati', { count: messages.length });
        
        res.json({
            success: true,
            messages
        });
    } catch (error) {
        logger.error('Errore durante il recupero dei messaggi', {
            error: error.message,
        });
        
        res.status(500).json({
            success: false,
            message: 'Errore durante il recupero dei messaggi'
        });
    }
});

// POST nuovo messaggio
app.post('/api/messages', verifyToken, [
    body('title').trim().notEmpty().isLength({ max: 200 }),
    body('content').trim().notEmpty(),
    body('author').trim().notEmpty()
], async (req, res) => {
    try {
        // Validazione
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dati non validi',
                errors: errors.array()
            });
        }

        const { title, content, author } = req.body;
        
        logger.info('Creazione nuovo messaggio', { title, author });
        
        await db.execute(
            'INSERT INTO messages (title, content, author) VALUES (?, ?, ?)',
            [title, content, author]
        );
        
        logger.info('Messaggio creato con successo', { title, author });
        
        res.json({
            success: true,
            message: 'Messaggio pubblicato con successo'
        });
    } catch (error) {
        logger.error('Errore durante la creazione del messaggio', {
            error: error.message,
            title: req.body.title,
            author: req.body.author,
        });
        
        res.status(500).json({
            success: false,
            message: 'Errore durante la pubblicazione del messaggio'
        });
    }
});

// PUT modifica messaggio
app.put('/api/messages/:id', verifyToken, [
    body('content').trim().notEmpty(),
    body('author').trim().notEmpty()
], async (req, res) => {
    try {
        // Validazione
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dati non validi'
            });
        }

        const { id } = req.params;
        const { content, author } = req.body;
        
        logger.info('Tentativo di modifica messaggio', { messageId: id, author });
        
        // Verifica che il messaggio appartenga all'autore
        const [messages] = await db.execute('SELECT author FROM messages WHERE id = ?', [id]);
        
        if (messages.length === 0) {
            logger.warn('Tentativo di modificare messaggio inesistente', { messageId: id });
            return res.status(404).json({
                success: false,
                message: 'Messaggio non trovato'
            });
        }
        
        if (messages[0].author !== author) {
            logger.warn('Tentativo non autorizzato di modificare messaggio', { 
                messageId: id, 
                requestAuthor: author, 
                actualAuthor: messages[0].author 
            });
            return res.status(403).json({
                success: false,
                message: 'Non sei autorizzato a modificare questo messaggio'
            });
        }
        
        await db.execute(
            'UPDATE messages SET content = ? WHERE id = ?',
            [content, id]
        );
        
        logger.info('Messaggio modificato con successo', { messageId: id, author });
        
        res.json({
            success: true,
            message: 'Messaggio modificato con successo'
        });
    } catch (error) {
        logger.error('Errore durante la modifica del messaggio', {
            error: error.message,
            messageId: req.params.id,
            author: req.body.author,
        });
        
        res.status(500).json({
            success: false,
            message: 'Errore durante la modifica del messaggio'
        });
    }
});

// DELETE elimina messaggio
app.delete('/api/messages/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { author } = req.body;
        
        if (!author) {
            logger.warn('Tentativo di eliminare messaggio senza autore', { id });
            return res.status(400).json({
                success: false,
                message: 'Autore è obbligatorio'
            });
        }
        
        logger.info('Tentativo di eliminazione messaggio', { messageId: id, author });
        
        // Verifica che il messaggio appartenga all'autore
        const [messages] = await db.execute('SELECT author FROM messages WHERE id = ?', [id]);
        
        if (messages.length === 0) {
            logger.warn('Tentativo di eliminare messaggio inesistente', { messageId: id });
            return res.status(404).json({
                success: false,
                message: 'Messaggio non trovato'
            });
        }
        
        if (messages[0].author !== author) {
            logger.warn('Tentativo non autorizzato di eliminare messaggio', { 
                messageId: id, 
                requestAuthor: author, 
                actualAuthor: messages[0].author 
            });
            return res.status(403).json({
                success: false,
                message: 'Non sei autorizzato a eliminare questo messaggio'
            });
        }
        
        await db.execute('DELETE FROM messages WHERE id = ?', [id]);
        
        logger.info('Messaggio eliminato con successo', { messageId: id, author });
        
        res.json({
            success: true,
            message: 'Messaggio eliminato con successo'
        });
    } catch (error) {
        logger.error('Errore durante l\'eliminazione del messaggio', {
            error: error.message,
            messageId: req.params.id,
            author: req.body.author,
        });
        
        res.status(500).json({
            success: false,
            message: 'Errore durante l\'eliminazione del messaggio'
        });
    }
});

// ============================================
// TIMESHEET API
// ============================================

// GET all timesheet entries for user
app.get('/api/timesheet', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const [entries] = await db.execute(
            'SELECT * FROM timesheet WHERE user_id = ? ORDER BY date DESC, created_at DESC',
            [userId]
        );
        
        logger.debug('Timesheet recuperati', { userId, count: entries.length });
        
        res.json({
            success: true,
            entries
        });
    } catch (error) {
        logger.error('Errore durante il recupero del timesheet', {
            error: error.message,
            userId: req.user.userId
        });
        
        res.status(500).json({
            success: false,
            message: 'Errore durante il recupero del timesheet'
        });
    }
});

// POST new timesheet entry
app.post('/api/timesheet', verifyToken, [
    body('date').isDate(),
    body('project').trim().notEmpty(),
    body('hours').isFloat({ min: 0.5, max: 24 }), // Aumentato a 24 per permettere straordinari
    body('type').trim().notEmpty(),
    body('description').trim().notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dati non validi',
                errors: errors.array()
            });
        }

        const userId = req.user.userId;
        const { date, project, hours, type, description } = req.body;
        
        logger.info('Inserimento timesheet', { userId, date, project, hours });
        
        const [result] = await db.execute(
            'INSERT INTO timesheet (user_id, date, project, hours, type, description) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, date, project, hours, type, description]
        );
        
        logger.info('Timesheet inserito con successo', { userId, entryId: result.insertId });
        
        res.json({
            success: true,
            message: 'Registrazione ore salvata con successo',
            entry: {
                id: result.insertId,
                user_id: userId,
                date,
                project,
                hours,
                type,
                description
            }
        });
    } catch (error) {
        logger.error('Errore durante inserimento timesheet', {
            error: error.message,
            userId: req.user.userId
        });
        
        res.status(500).json({
            success: false,
            message: 'Errore durante il salvataggio del timesheet'
        });
    }
});

// DELETE timesheet entry
app.delete('/api/timesheet/:id', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        
        logger.info('Tentativo di eliminazione timesheet', { userId, entryId: id });
        
        // Verify ownership
        const [entries] = await db.execute(
            'SELECT user_id FROM timesheet WHERE id = ?',
            [id]
        );
        
        if (entries.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Registrazione non trovata'
            });
        }
        
        if (entries[0].user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Non sei autorizzato a eliminare questa registrazione'
            });
        }
        
        await db.execute('DELETE FROM timesheet WHERE id = ?', [id]);
        
        logger.info('Timesheet eliminato con successo', { userId, entryId: id });
        
        res.json({
            success: true,
            message: 'Registrazione eliminata con successo'
        });
    } catch (error) {
        logger.error('Errore durante eliminazione timesheet', {
            error: error.message,
            userId: req.user.userId,
            entryId: req.params.id
        });
        
        res.status(500).json({
            success: false,
            message: 'Errore durante l\'eliminazione'
        });
    }
});

// ============================================
// EXPENSE REIMBURSEMENT API
// ============================================

// GET all expense reimbursements for user
app.get('/api/expenses', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const [expenses] = await db.execute(
            'SELECT * FROM expense_reimbursement WHERE user_id = ? ORDER BY date DESC, created_at DESC',
            [userId]
        );
        
        logger.debug('Rimborsi recuperati', { userId, count: expenses.length });
        
        res.json({
            success: true,
            expenses
        });
    } catch (error) {
        logger.error('Errore durante il recupero dei rimborsi', {
            error: error.message,
            userId: req.user.userId
        });
        
        res.status(500).json({
            success: false,
            message: 'Errore durante il recupero dei rimborsi'
        });
    }
});

// POST new expense reimbursement
app.post('/api/expenses', verifyToken, [
    body('date').isDate(),
    body('amount').isFloat({ min: 0.01 }),
    body('category').trim().notEmpty(),
    body('payment_method').trim().notEmpty(),
    body('description').trim().notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dati non validi',
                errors: errors.array()
            });
        }

        const userId = req.user.userId;
        const { date, amount, category, payment_method, description, receipt_filename } = req.body;
        
        logger.info('Inserimento rimborso', { userId, date, category, amount });
        
        const [result] = await db.execute(
            'INSERT INTO expense_reimbursement (user_id, date, amount, category, payment_method, description, receipt_filename) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [userId, date, amount, category, payment_method, description, receipt_filename || null]
        );
        
        logger.info('Rimborso inserito con successo', { userId, expenseId: result.insertId });
        
        res.json({
            success: true,
            message: 'Richiesta di rimborso inviata con successo',
            expense: {
                id: result.insertId,
                user_id: userId,
                date,
                amount,
                category,
                payment_method,
                description,
                receipt_filename: receipt_filename || null,
                status: 'pending'
            }
        });
    } catch (error) {
        logger.error('Errore durante inserimento rimborso', {
            error: error.message,
            userId: req.user.userId
        });
        
        res.status(500).json({
            success: false,
            message: 'Errore durante il salvataggio del rimborso'
        });
    }
});

// DELETE expense reimbursement (only if pending)
app.delete('/api/expenses/:id', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        
        logger.info('Tentativo di eliminazione rimborso', { userId, expenseId: id });
        
        // Verify ownership and status
        const [expenses] = await db.execute(
            'SELECT user_id, status FROM expense_reimbursement WHERE id = ?',
            [id]
        );
        
        if (expenses.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Rimborso non trovato'
            });
        }
        
        if (expenses[0].user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Non sei autorizzato a eliminare questo rimborso'
            });
        }
        
        if (expenses[0].status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Non puoi eliminare un rimborso già processato'
            });
        }
        
        await db.execute('DELETE FROM expense_reimbursement WHERE id = ?', [id]);
        
        logger.info('Rimborso eliminato con successo', { userId, expenseId: id });
        
        res.json({
            success: true,
            message: 'Rimborso eliminato con successo'
        });
    } catch (error) {
        logger.error('Errore durante eliminazione rimborso', {
            error: error.message,
            userId: req.user.userId,
            expenseId: req.params.id
        });
        
        res.status(500).json({
            success: false,
            message: 'Errore durante l\'eliminazione'
        });
    }
});

// Middleware per gestione errori (deve essere alla fine, dopo tutte le route)
app.use(errorLogger);

// Start server
async function startServer() {
    await initDB();
    app.listen(PORT, () => {
        logger.info(`🚀 Server in esecuzione su http://localhost:${PORT}`);
        logger.info(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`Livello di log: ${logger.level}`);
    });
}

startServer();