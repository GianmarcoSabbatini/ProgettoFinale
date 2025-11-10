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

// Middleware di sicurezza
app.use(helmet());
app.use(compression());

// Configurazione CORS
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL].filter(Boolean)
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', process.env.FRONTEND_URL].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Permetti richieste senza origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json());
app.use(requestLogger);

// Rate Limiting (disabilitato in ambiente di test)
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

// Connessione al database
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

// Inizializza database
async function initDB() {
    try {
        logger.info('Inizializzazione database...');
        
        // Prima connessione senza database per crearlo
        const tempDb = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: ''
        });
        
        await tempDb.execute('CREATE DATABASE IF NOT EXISTS dashboard_db');
        await tempDb.end();
        
        logger.info('Database dashboard_db verificato/creato');
        
        // Ora connettiti al database specifico usando il pool di connessioni
        db = mysql.createPool(dbConfig);
        
        // Testa la connessione
        await db.query('SELECT 1');
        logger.info('✅ Connesso a MySQL con successo (connection pool)');
        logger.logDatabase('Connessione MySQL Pool', true, { database: 'dashboard_db' });

        // Crea tabelle
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
                hourly_rate DECIMAL(10,2) DEFAULT 15.00,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);
        logger.debug('Tabella profiles verificata/creata');
        
        // Aggiungi colonna hourly_rate se non esiste (per database esistenti)
        try {
            await db.execute(`
                ALTER TABLE profiles 
                ADD COLUMN hourly_rate DECIMAL(10,2) DEFAULT 15.00
            `);
            logger.info('Colonna hourly_rate aggiunta alla tabella profiles');
        } catch (error) {
            if (error.code !== 'ER_DUP_FIELDNAME') {
                logger.debug('Colonna hourly_rate già esistente o errore: ' + error.message);
            }
        }

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

        // Aggiungi messaggi di esempio se vuoto
        const [messages] = await db.execute('SELECT COUNT(*) as count FROM messages');
        if (messages[0].count === 0) {
            await db.execute(`
                INSERT INTO messages (title, content, author) VALUES 
                ('Benvenuto in CoreTeam Digital', 'Questa è la tua dashboard personale. Qui puoi visualizzare messaggi, gestire il tuo profilo, timesheet e molto altro.', 'Sistema'),
                ('Aggiornamento Sistema', 'Il sistema è stato aggiornato con nuove funzionalità per migliorare la tua esperienza lavorativa.', 'Admin'),
                ('Promemoria', 'Ricordati di registrare le tue ore nel timesheet e di aggiornare le tue informazioni di profilo se necessario.', 'Risorse Umane')
            `);
            logger.info('Messaggi di esempio inseriti nel database');
        }

        // Crea tabella timesheet
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

        // Crea tabella expense_reimbursement
        await db.execute(`
            CREATE TABLE IF NOT EXISTS expense_reimbursement (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                date DATE NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                category VARCHAR(100) NOT NULL,
                payment_method VARCHAR(100) NOT NULL,
                description TEXT NOT NULL,
                receipt_url VARCHAR(255),
                status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        logger.debug('Tabella expense_reimbursement verificata/creata');

        // Crea tabella payslips
        await db.execute(`
            CREATE TABLE IF NOT EXISTS payslips (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                month VARCHAR(50) NOT NULL,
                year INT NOT NULL,
                gross_amount DECIMAL(10,2) NOT NULL,
                net_amount DECIMAL(10,2) NOT NULL,
                issue_date DATE NOT NULL,
                issued_by VARCHAR(100) NOT NULL,
                status ENUM('paid', 'pending') DEFAULT 'paid',
                salary_details JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        logger.debug('Tabella payslips verificata/creata');

        // Crea tabella password_resets
        await db.execute(`
            CREATE TABLE IF NOT EXISTS password_resets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                token VARCHAR(64) NOT NULL UNIQUE,
                expires_at DATETIME NOT NULL,
                used BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_token (token),
                INDEX idx_expires (expires_at)
            )
        `);
        logger.debug('Tabella password_resets verificata/creata');
        
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

// ==================== PASSWORD RESET ====================

// Richiedi reset password
app.post('/api/auth/forgot-password', [
    body('email').isEmail().normalizeEmail()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email non valida' 
            });
        }

        const { email } = req.body;
        
        logger.info('Richiesta reset password', { email });

        // Trova utente
        const [users] = await db.execute('SELECT id, username, email FROM users WHERE email = ?', [email]);
        
        if (users.length === 0) {
            // Per sicurezza, non rivelare se l'email esiste o meno
            logger.warn('Reset password richiesto per email non esistente', { email });
            return res.json({
                success: true,
                message: 'Se l\'email esiste, riceverai un token per il reset',
                token: null
            });
        }

        const user = users[0];

        // Genera token casuale
        const crypto = require('crypto');
        const token = crypto.randomBytes(32).toString('hex');
        
        // Token valido per 1 ora
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        // Elimina vecchi token per questo utente
        await db.execute('DELETE FROM password_resets WHERE user_id = ?', [user.id]);

        // Salva nuovo token
        await db.execute(
            'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
            [user.id, token, expiresAt]
        );

        logger.info('Token reset password generato', { 
            userId: user.id, 
            username: user.username,
            expiresAt 
        });

        // Risposta con il token (senza invio email)
        res.json({
            success: true,
            message: 'Token generato con successo. Usa il token per reimpostare la password.',
            token: token,
            expiresAt: expiresAt.toISOString(),
            email: user.email
        });

    } catch (error) {
        logger.error('Errore durante richiesta reset password', {
            error: error.message,
            stack: error.stack,
            email: req.body.email
        });
        
        res.status(500).json({
            success: false,
            message: 'Errore durante la richiesta di reset password'
        });
    }
});

// Reset password con token
app.post('/api/auth/reset-password', [
    body('token').notEmpty().isLength({ min: 64, max: 64 }),
    body('newPassword').isLength({ min: 6 }).withMessage('La password deve essere di almeno 6 caratteri')
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

        const { token, newPassword } = req.body;
        
        logger.info('Tentativo reset password con token');

        // Trova token valido
        const [resets] = await db.execute(
            `SELECT pr.*, u.username, u.email 
             FROM password_resets pr 
             JOIN users u ON pr.user_id = u.id 
             WHERE pr.token = ? AND pr.used = FALSE AND pr.expires_at > NOW()`,
            [token]
        );

        if (resets.length === 0) {
            logger.warn('Token reset password non valido o scaduto', { token: token.substring(0, 10) + '...' });
            return res.status(400).json({
                success: false,
                message: 'Token non valido o scaduto'
            });
        }

        const reset = resets[0];

        // Hash nuova password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Aggiorna password utente
        await db.execute(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, reset.user_id]
        );

        // Marca token come usato
        await db.execute(
            'UPDATE password_resets SET used = TRUE WHERE id = ?',
            [reset.id]
        );

        logger.info('Password resettata con successo', { 
            userId: reset.user_id, 
            username: reset.username 
        });

        res.json({
            success: true,
            message: 'Password aggiornata con successo',
            user: {
                id: reset.user_id,
                username: reset.username,
                email: reset.email
            }
        });

    } catch (error) {
        logger.error('Errore durante reset password', {
            error: error.message,
            stack: error.stack
        });
        
        res.status(500).json({
            success: false,
            message: 'Errore durante il reset della password'
        });
    }
});

// ==================== PROFILE ====================

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
// API TIMESHEET
// ============================================

// GET tutte le voci del timesheet dell'utente
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

// POST nuova voce timesheet
app.post('/api/timesheet', verifyToken, [
    body('date').isDate(),
    body('project').trim().notEmpty(),
    body('hours').isFloat({ min: 0.5, max: 24 }).withMessage('Le ore devono essere tra 0.5 e 24'),
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

// DELETE voce timesheet
app.delete('/api/timesheet/:id', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        
        logger.info('Tentativo di eliminazione timesheet', { userId, entryId: id });
        
        // Verifica proprietà
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
    body('amount').isFloat({ min: 0.01 }).withMessage('L\'importo deve essere maggiore di 0'),
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
        const { date, amount, category, payment_method, description, receipt_url } = req.body;
        
        logger.info('Inserimento rimborso', { userId, date, category, amount });
        
        const [result] = await db.execute(
            'INSERT INTO expense_reimbursement (user_id, date, amount, category, payment_method, description, receipt_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [userId, date, amount, category, payment_method, description, receipt_url || null]
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
                receipt_url: receipt_url || null,
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

// ============================================
// PAYSLIPS API
// ============================================

// GET all payslips for user
app.get('/api/payslips', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const [payslips] = await db.execute(
            'SELECT * FROM payslips WHERE user_id = ? ORDER BY year DESC, FIELD(month, "Dicembre", "Novembre", "Ottobre", "Settembre", "Agosto", "Luglio", "Giugno", "Maggio", "Aprile", "Marzo", "Febbraio", "Gennaio") DESC',
            [userId]
        );
        
        logger.debug('Buste paga recuperate', { userId, count: payslips.length });
        
        res.json({
            success: true,
            payslips
        });
    } catch (error) {
        logger.error('Errore durante il recupero delle buste paga', {
            error: error.message,
            userId: req.user.userId
        });
        
        res.status(500).json({
            success: false,
            message: 'Errore durante il recupero delle buste paga'
        });
    }
});

// POST new payslip (admin only - per ora senza verifica admin)
app.post('/api/payslips', verifyToken, [
    body('month').trim().notEmpty(),
    body('year').isInt({ min: 2000, max: 2100 }),
    body('gross_amount').isFloat({ min: 0.01 }),
    body('net_amount').isFloat({ min: 0.01 }),
    body('issue_date').isDate(),
    body('issued_by').trim().notEmpty()
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
        const { month, year, gross_amount, net_amount, issue_date, issued_by, salary_details } = req.body;
        
        logger.info('Inserimento busta paga', { userId, month, year });
        
        const [result] = await db.execute(
            'INSERT INTO payslips (user_id, month, year, gross_amount, net_amount, issue_date, issued_by, salary_details) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, month, year, gross_amount, net_amount, issue_date, issued_by, JSON.stringify(salary_details || {})]
        );
        
        logger.info('Busta paga inserita con successo', { userId, payslipId: result.insertId });
        
        res.json({
            success: true,
            message: 'Busta paga creata con successo',
            payslip: {
                id: result.insertId,
                user_id: userId,
                month,
                year,
                gross_amount,
                net_amount,
                issue_date,
                issued_by,
                status: 'paid'
            }
        });
    } catch (error) {
        logger.error('Errore durante inserimento busta paga', {
            error: error.message,
            userId: req.user.userId
        });
        
        res.status(500).json({
            success: false,
            message: 'Errore durante la creazione della busta paga'
        });
    }
});

// POST generate payslip from timesheet
app.post('/api/payslips/generate', verifyToken, [
    body('month').trim().notEmpty(),
    body('year').isInt({ min: 2000, max: 2100 })
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
        const { month, year } = req.body;
        
        logger.info('Generazione busta paga da timesheet', { userId, month, year });
        
        // Get user profile with hourly rate
        const [profiles] = await db.execute(
            'SELECT p.*, CONCAT(p.nome, " ", p.cognome) as full_name, p.hourly_rate FROM profiles p WHERE p.user_id = ?',
            [userId]
        );
        
        if (profiles.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Profilo utente non trovato'
            });
        }
        
        const profile = profiles[0];
        const hourlyRate = parseFloat(profile.hourly_rate) || 15.00;
        
        // Check if payslip already exists for this month/year
        const [existing] = await db.execute(
            'SELECT id FROM payslips WHERE user_id = ? AND month = ? AND year = ?',
            [userId, month, year]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Busta paga già esistente per questo periodo'
            });
        }
        
        // Get timesheet entries for the specified month/year
        const monthNum = getMonthNumber(month);
        const [timeEntries] = await db.execute(
            'SELECT * FROM timesheet WHERE user_id = ? AND MONTH(date) = ? AND YEAR(date) = ?',
            [userId, monthNum, year]
        );
        
        if (timeEntries.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Nessuna registrazione timesheet trovata per questo periodo'
            });
        }
        
        // Calculate total hours
        const totalHours = timeEntries.reduce((sum, entry) => sum + parseFloat(entry.hours), 0);
        
        // Calculate gross amount (simple: hours * hourly_rate)
        const grossAmount = totalHours * hourlyRate;
        
        // Calculate deductions
        const inpsRate = 0.0919; // 9.19% INPS
        const inpsAmount = grossAmount * inpsRate;
        
        // IRPEF progressive (simplified)
        let irpefAmount = 0;
        if (grossAmount <= 15000) {
            irpefAmount = grossAmount * 0.23;
        } else if (grossAmount <= 28000) {
            irpefAmount = 15000 * 0.23 + (grossAmount - 15000) * 0.27;
        } else if (grossAmount <= 55000) {
            irpefAmount = 15000 * 0.23 + 13000 * 0.27 + (grossAmount - 28000) * 0.38;
        } else {
            irpefAmount = 15000 * 0.23 + 13000 * 0.27 + 27000 * 0.38 + (grossAmount - 55000) * 0.41;
        }
        
        // Calculate net amount
        const totalDeductions = inpsAmount + irpefAmount;
        const netAmount = grossAmount - totalDeductions;
        
        // Prepare salary details JSON
        const salaryDetails = {
            hourly_rate: hourlyRate,
            total_hours: totalHours,
            gross_base: grossAmount,
            deductions: {
                inps: {
                    rate: inpsRate,
                    amount: inpsAmount
                },
                irpef: {
                    amount: irpefAmount
                }
            },
            total_deductions: totalDeductions,
            net_amount: netAmount,
            timesheet_entries: timeEntries.length
        };
        
        // Create issue date (first day of next month)
        const issueDate = new Date(year, monthNum, 1);
        const issueDateStr = issueDate.toISOString().split('T')[0];
        
        // Insert payslip
        const [result] = await db.execute(
            'INSERT INTO payslips (user_id, month, year, gross_amount, net_amount, issue_date, issued_by, salary_details) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, month, year, grossAmount.toFixed(2), netAmount.toFixed(2), issueDateStr, 'CoreTeam Digital - Sistema Automatico', JSON.stringify(salaryDetails)]
        );
        
        logger.info('Busta paga generata con successo', { 
            userId, 
            payslipId: result.insertId,
            totalHours,
            grossAmount: grossAmount.toFixed(2),
            netAmount: netAmount.toFixed(2)
        });
        
        res.json({
            success: true,
            message: 'Busta paga generata con successo',
            payslip: {
                id: result.insertId,
                user_id: userId,
                month,
                year,
                gross_amount: grossAmount.toFixed(2),
                net_amount: netAmount.toFixed(2),
                issue_date: issueDateStr,
                issued_by: 'CoreTeam Digital - Sistema Automatico',
                status: 'paid',
                details: salaryDetails
            }
        });
    } catch (error) {
        logger.error('Errore durante generazione busta paga', {
            error: error.message,
            userId: req.user.userId
        });
        
        res.status(500).json({
            success: false,
            message: 'Errore durante la generazione della busta paga'
        });
    }
});

// PUT update/recalculate existing payslip
app.put('/api/payslips/:id/recalculate', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const payslipId = req.params.id;
        
        logger.info('Ricalcolo busta paga', { userId, payslipId });
        
        // Get existing payslip
        const [payslips] = await db.execute(
            'SELECT * FROM payslips WHERE id = ? AND user_id = ?',
            [payslipId, userId]
        );
        
        if (payslips.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Busta paga non trovata'
            });
        }
        
        const payslip = payslips[0];
        const { month, year } = payslip;
        
        // Get user profile with hourly rate
        const [profiles] = await db.execute(
            'SELECT p.*, CONCAT(p.nome, " ", p.cognome) as full_name, p.hourly_rate FROM profiles p WHERE p.user_id = ?',
            [userId]
        );
        
        if (profiles.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Profilo utente non trovato'
            });
        }
        
        const profile = profiles[0];
        const hourlyRate = parseFloat(profile.hourly_rate) || 15.00;
        
        // Get timesheet entries for the specified month/year
        const monthNum = getMonthNumber(month);
        
        logger.debug('Ricalcolo - dati mese', { month, monthNum, year });
        
        const [timeEntries] = await db.execute(
            'SELECT * FROM timesheet WHERE user_id = ? AND MONTH(date) = ? AND YEAR(date) = ?',
            [userId, monthNum, year]
        );
        
        logger.debug('Ricalcolo - timesheet trovati', { count: timeEntries.length });
        
        if (timeEntries.length === 0) {
            logger.warn('Ricalcolo fallito: nessun timesheet', { userId, month, year, monthNum });
            return res.status(400).json({
                success: false,
                message: 'Nessuna registrazione timesheet trovata per questo periodo'
            });
        }
        
        // Calculate total hours
        const totalHours = timeEntries.reduce((sum, entry) => sum + parseFloat(entry.hours), 0);
        
        // Calculate gross amount
        const grossAmount = totalHours * hourlyRate;
        
        // Calculate deductions
        const inpsRate = 0.0919; // 9.19% INPS
        const inpsAmount = grossAmount * inpsRate;
        
        // IRPEF progressive (simplified)
        let irpefAmount = 0;
        if (grossAmount <= 15000) {
            irpefAmount = grossAmount * 0.23;
        } else if (grossAmount <= 28000) {
            irpefAmount = 15000 * 0.23 + (grossAmount - 15000) * 0.27;
        } else if (grossAmount <= 55000) {
            irpefAmount = 15000 * 0.23 + 13000 * 0.27 + (grossAmount - 28000) * 0.38;
        } else {
            irpefAmount = 15000 * 0.23 + 13000 * 0.27 + 27000 * 0.38 + (grossAmount - 55000) * 0.41;
        }
        
        // Calculate net amount
        const totalDeductions = inpsAmount + irpefAmount;
        const netAmount = grossAmount - totalDeductions;
        
        // Prepare salary details JSON
        const salaryDetails = {
            hourly_rate: hourlyRate,
            total_hours: totalHours,
            gross_base: grossAmount,
            deductions: {
                inps: {
                    rate: inpsRate,
                    amount: inpsAmount
                },
                irpef: {
                    amount: irpefAmount
                }
            },
            total_deductions: totalDeductions,
            net_amount: netAmount,
            timesheet_entries: timeEntries.length,
            last_updated: new Date().toISOString()
        };
        
        // Update payslip
        await db.execute(
            'UPDATE payslips SET gross_amount = ?, net_amount = ?, salary_details = ? WHERE id = ? AND user_id = ?',
            [grossAmount.toFixed(2), netAmount.toFixed(2), JSON.stringify(salaryDetails), payslipId, userId]
        );
        
        logger.info('Busta paga ricalcolata con successo', { 
            userId, 
            payslipId,
            totalHours,
            grossAmount: grossAmount.toFixed(2),
            netAmount: netAmount.toFixed(2)
        });
        
        res.json({
            success: true,
            message: 'Busta paga aggiornata con successo',
            payslip: {
                id: payslipId,
                user_id: userId,
                month,
                year,
                gross_amount: grossAmount.toFixed(2),
                net_amount: netAmount.toFixed(2),
                issue_date: payslip.issue_date,
                issued_by: payslip.issued_by,
                status: payslip.status,
                details: salaryDetails
            }
        });
    } catch (error) {
        logger.error('Errore durante ricalcolo busta paga', {
            error: error.message,
            userId: req.user.userId,
            payslipId: req.params.id
        });
        
        res.status(500).json({
            success: false,
            message: 'Errore durante il ricalcolo della busta paga'
        });
    }
});

// Helper function to convert month name to number
function getMonthNumber(monthName) {
    const months = {
        'Gennaio': 1, 'Febbraio': 2, 'Marzo': 3, 'Aprile': 4,
        'Maggio': 5, 'Giugno': 6, 'Luglio': 7, 'Agosto': 8,
        'Settembre': 9, 'Ottobre': 10, 'Novembre': 11, 'Dicembre': 12
    };
    return months[monthName] || 1;
}

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