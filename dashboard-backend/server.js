const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'dashboard_db'
};

let db;

// Initialize database
async function initDB() {
    try {
        // First connect without database to create it
        const tempDb = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: ''
        });
        
        await tempDb.execute('CREATE DATABASE IF NOT EXISTS dashboard_db');
        await tempDb.end();
        
        // Now connect to the specific database
        db = await mysql.createConnection(dbConfig);
        console.log('✅ Connesso a MySQL');

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

        await db.execute(`
            CREATE TABLE IF NOT EXISTS messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(200) NOT NULL,
                content TEXT NOT NULL,
                author VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Add sample messages if empty
        const [messages] = await db.execute('SELECT COUNT(*) as count FROM messages');
        if (messages[0].count === 0) {
            await db.execute(`
                INSERT INTO messages (title, content, author) VALUES 
                ('Benvenuto nella Dashboard', 'Questa è la tua dashboard personale. Qui puoi visualizzare messaggi e gestire il tuo profilo.', 'Sistema'),
                ('Aggiornamento Sistema', 'Il sistema è stato aggiornato con nuove funzionalità per migliorare la tua esperienza.', 'Admin'),
                ('Promemoria', 'Ricordati di aggiornare le tue informazioni di profilo se necessario.', 'HR')
            `);
        }

    } catch (error) {
        console.error('❌ Errore database:', error);
        process.exit(1);
    }
}

// API Endpoints
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password, nome, cognome, jobTitle, team, avatar } = req.body;

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const [result] = await db.execute(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );

        // Insert profile
        await db.execute(
            'INSERT INTO profiles (user_id, nome, cognome, job_title, team, avatar) VALUES (?, ?, ?, ?, ?, ?)',
            [result.insertId, nome, cognome, jobTitle, team, avatar || '#4ECDC4']
        );

        res.json({
            success: true,
            message: 'Registrazione completata',
            token: 'demo-token-' + result.insertId
        });

    } catch (error) {
        console.error('Errore registrazione:', error);
        res.status(500).json({
            success: false,
            message: 'Errore durante la registrazione'
        });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Credenziali non valide'
            });
        }

        const user = users[0];

        // Check password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: 'Credenziali non valide'
            });
        }

        res.json({
            success: true,
            message: 'Login effettuato',
            token: 'demo-token-' + user.id,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Errore login:', error);
        res.status(500).json({
            success: false,
            message: 'Errore durante il login'
        });
    }
});

app.get('/api/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ success: false, message: 'Token mancante' });
        }

        // Extract user ID from token (demo implementation)
        const userId = token.replace('demo-token-', '');

        const [profiles] = await db.execute(`
            SELECT p.*, u.username, u.email 
            FROM profiles p 
            JOIN users u ON p.user_id = u.id 
            WHERE p.user_id = ?
        `, [userId]);

        if (profiles.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Profilo non trovato'
            });
        }

        res.json({
            success: true,
            profile: profiles[0]
        });

    } catch (error) {
        console.error('Errore profilo:', error);
        res.status(500).json({
            success: false,
            message: 'Errore durante il recupero del profilo'
        });
    }
});

app.put('/api/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ success: false, message: 'Token mancante' });
        }

        // Extract user ID from token (demo implementation)
        const userId = token.replace('demo-token-', '');
        const { job_title, team } = req.body;

        await db.execute(`
            UPDATE profiles 
            SET job_title = ?, team = ? 
            WHERE user_id = ?
        `, [job_title, team, userId]);

        res.json({
            success: true,
            message: 'Profilo aggiornato con successo'
        });

    } catch (error) {
        console.error('Errore aggiornamento profilo:', error);
        res.status(500).json({
            success: false,
            message: 'Errore durante l\'aggiornamento del profilo'
        });
    }
});

app.get('/api/messages', async (req, res) => {
    try {
        const [messages] = await db.execute('SELECT * FROM messages ORDER BY created_at DESC');
        res.json({
            success: true,
            messages
        });
    } catch (error) {
        console.error('Errore messaggi:', error);
        res.status(500).json({
            success: false,
            message: 'Errore durante il recupero dei messaggi'
        });
    }
});

// Start server
async function startServer() {
    await initDB();
    app.listen(PORT, () => {
        console.log(`🚀 Server in esecuzione su http://localhost:${PORT}`);
    });
}

startServer();