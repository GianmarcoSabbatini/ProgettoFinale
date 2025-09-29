const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// --- Dati Finti (Mock Data) ---

const mockMessages = [
    { id: 1, author: 'Alisa Filatova', avatar: '...', timestamp: '20 Aprile alle 14:22', content: 'Le considerazioni ideologiche di alto livello, così come la struttura organizzativa consolidata, consentono di valutare l\'importanza dei sistemi di partecipazione di massa.' },
    { id: 2, author: 'Poljakova Maia', avatar: '...', timestamp: '19 Aprile alle 16:55', content: 'L\'importanza di questi problemi è così evidente che il nuovo modello di attività organizzativa contribuisce alla preparazione e realizzazione di ulteriori direzioni di sviluppo.' },
    { id: 3, author: 'Aleksandrov Evgenij', avatar: '...', timestamp: '19 Aprile alle 15:04', content: 'Pertanto, la struttura organizzativa consolidata gioca un ruolo importante nella formazione delle direzioni di sviluppo progressivo.' },
    { id: 4, author: 'Gnezdilova Alina', avatar: '...', timestamp: '19 Aprile alle 14:30', content: 'Tuttavia, non bisogna dimenticare che i confini e il luogo di formazione del personale richiedono la definizione e la chiarificazione delle posizioni occupate dai partecipanti rispetto agli obiettivi posti.' },
    { id: 5, author: 'Kakurin Bergey', avatar: '...', timestamp: '19 Aprile alle 14:28', content: 'D\'altra parte, la continua crescita quantitativa e l\'ambito della nostra attività giocano un ruolo importante nella formazione delle condizioni corrispondenti per l\'attivazione.' }
];

const mockUserProfile = {
    name: 'Jane Doe',
    profileImageUrl: 'https://images.unsplash.com/photo-1594744806549-83a81231315a?auto=format&fit=crop&w=400&q=80',
    timeInCompany: '3 anni 28 giorni',
    department: 'Team Sviluppo Front-End',
    role: 'Tech Lead',
    manager: 'Pietro Rossi',
    project: 'Hero Wars Mobile Unity',
    birthDate: '15 gennaio 1991',
    positionLocation: 'Mosca',
    education: 'Laurea in Ingegneria - Ricercatore nel campo della nanotecnica',
    courses: 'Data Science by Afeasian University nel 2017',
    certifications: 'Nessuno',
    languages: 'Inglese, Russo, Spagnolo'
};

// --- Dati utenti registrati (simulazione database) ---
const registeredUsers = [
    { id: 1, email: 'johndoe@example.com', password: 'password123', name: 'John Doe' }
];

// --- API Endpoints ---

// Endpoint per la REGISTRAZIONE
app.post('/api/register', (req, res) => {
    const { name, email, password, profile } = req.body;
    console.log(`Tentativo di registrazione: ${name} - ${email}`);

    // Verifica se l'utente esiste già
    const existingUser = registeredUsers.find(user => user.email === email);
    if (existingUser) {
        return res.status(400).json({
            success: false,
            message: 'Un utente con questa email è già registrato.'
        });
    }

    // Validazione semplice
    if (!name || !email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Tutti i campi sono obbligatori.'
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'La password deve essere di almeno 6 caratteri.'
        });
    }

    // Aggiungi nuovo utente
    const newUser = {
        id: registeredUsers.length + 1,
        name,
        email,
        password
    };
    registeredUsers.push(newUser);

    // Se sono stati forniti dati del profilo, aggiorna il mockUserProfile
    if (profile) {
        Object.assign(mockUserProfile, {
            name: name,
            ...profile
        });
    }

    res.json({
        success: true,
        message: 'Registrazione completata con successo!',
        token: 'fake-jwt-token-for-demo-purposes'
    });
});

// Endpoint per il LOGIN
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    console.log(`Tentativo di login con email: ${email}`);

    // Verifica le credenziali contro gli utenti registrati
    const user = registeredUsers.find(u => u.email === email && u.password === password);
    if (user) {
        res.json({
            success: true,
            message: 'Login effettuato con successo!',
            token: 'fake-jwt-token-for-demo-purposes'
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Email o password non validi.'
        });
    }
});

// Endpoint per ottenere i messaggi
app.get('/api/messages', (req, res) => {
    res.json(mockMessages);
});

// Endpoint per ottenere il profilo utente
app.get('/api/user/profile', (req, res) => {
    res.json(mockUserProfile);
});

// Endpoint per aggiornare il profilo utente
app.put('/api/user/profile', (req, res) => {
    const updateData = req.body;
    console.log('Aggiornamento profilo:', updateData);

    // In una vera applicazione, qui aggiorneresti il database
    // Per ora aggiorniamo il mock object
    Object.keys(updateData).forEach(key => {
        if (mockUserProfile.hasOwnProperty(key)) {
            mockUserProfile[key] = updateData[key];
        }
    });

    res.json({
        success: true,
        message: 'Profilo aggiornato con successo!',
        profile: mockUserProfile
    });
});

// Avvio del server
app.listen(PORT, () => {
    console.log(`🚀 Backend server in ascolto su http://localhost:${PORT}`);
});