const mysql = require('mysql2/promise');

async function resetDatabase() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: ''
        });

        console.log('Connesso a MySQL...');
        
        // Drop e ricrea database
        await connection.execute('DROP DATABASE IF EXISTS dashboard_db');
        console.log('✓ Database droppato');
        
        await connection.execute('CREATE DATABASE dashboard_db');
        console.log('✓ Database creato');
        
        await connection.end();
        
        // Riconnettiti al database specifico
        const dbConnection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'dashboard_db'
        });
        
        // Crea tabella users
        await dbConnection.execute(`
            CREATE TABLE users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ Tabella users creata');
        
        // Crea tabella profiles
        await dbConnection.execute(`
            CREATE TABLE profiles (
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
        console.log('✓ Tabella profiles creata');
        
        // Crea tabella messages
        await dbConnection.execute(`
            CREATE TABLE messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(200) NOT NULL,
                content TEXT NOT NULL,
                author VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ Tabella messages creata');
        
        // Crea tabella timesheet
        await dbConnection.execute(`
            CREATE TABLE timesheet (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                date DATE NOT NULL,
                hours DECIMAL(5,2) NOT NULL,
                project VARCHAR(200),
                type VARCHAR(100),
                description TEXT,
                status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);
        console.log('✓ Tabella timesheet creata');
        
        // Crea tabella expense_reimbursement
        await dbConnection.execute(`
            CREATE TABLE expense_reimbursement (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                date DATE NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                category VARCHAR(100) NOT NULL,
                payment_method VARCHAR(50),
                description TEXT,
                receipt_url VARCHAR(500),
                status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);
        console.log('✓ Tabella expense_reimbursement creata');
        
        // Crea tabella payslips
        await dbConnection.execute(`
            CREATE TABLE payslips (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                month INT NOT NULL,
                year INT NOT NULL,
                gross_amount DECIMAL(10,2) NOT NULL,
                net_amount DECIMAL(10,2) NOT NULL,
                issue_date DATE NOT NULL,
                issued_by VARCHAR(100) NOT NULL,
                salary_details JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                UNIQUE KEY unique_user_month_year (user_id, month, year)
            )
        `);
        console.log('✓ Tabella payslips creata');

        // Crea tabella password_resets
        await dbConnection.execute(`
            CREATE TABLE password_resets (
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
        console.log('✓ Tabella password_resets creata');
        
        // Inserisci messaggi di esempio
        await dbConnection.execute(`
            INSERT INTO messages (title, content, author) VALUES 
            ('Compleanno di Pietro', 'Ragazzi, venerdì è il mio compleanno, quindi non fate colazione che porto io delle cose dolci da mangiare in sala comune! :)', 'Pietro Rossi'),
            ('Corso di formazione', 'Ricordo a tutto il team DESIGN che lunedì c\\'è il corso in presenza di Figma.', 'Flora Morelli'),
            ('Promemoria', 'Ricordati di aggiornare le tue informazioni di profilo se necessario.', 'HR')
        `);
        
        await dbConnection.end();
        console.log('\n✅ Database resettato con successo!');
        
    } catch (error) {
        console.error('❌ Errore:', error);
        process.exit(1);
    }
}

resetDatabase();