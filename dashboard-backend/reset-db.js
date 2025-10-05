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
        
        // Inserisci messaggi di esempio
        await dbConnection.execute(`
            INSERT INTO messages (title, content, author) VALUES 
            ('Benvenuto nella Dashboard', 'Questa è la tua dashboard personale. Qui puoi visualizzare messaggi e gestire il tuo profilo.', 'Sistema'),
            ('Aggiornamento Sistema', 'Il sistema è stato aggiornato con nuove funzionalità per migliorare la tua esperienza.', 'Admin'),
            ('Promemoria', 'Ricordati di aggiornare le tue informazioni di profilo se necessario.', 'HR')
        `);
        console.log('✓ Messaggi inseriti');
        
        await dbConnection.end();
        console.log('\n✅ Database resettato con successo!');
        
    } catch (error) {
        console.error('❌ Errore:', error);
        process.exit(1);
    }
}

resetDatabase();