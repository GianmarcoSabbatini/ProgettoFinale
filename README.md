# 📊 Dashboard Aziendale

Dashboard moderna e sicura per la gestione del profilo utente e messaggi aziendali, costruita con Vue.js 3 e Node.js.

## ✨ Caratteristiche Principali

### 🔐 Autenticazione & Sicurezza
- **JWT (JSON Web Tokens)** con scadenza automatica (24h)
- **Registrazione multi-step** con validazione completa
- **Password hashing** con bcrypt (10 rounds)
- **Rate Limiting** - Protezione da brute force
- **Input Validation** - express-validator su tutti gli endpoint
- **Security Headers** - Helmet configurato
- **CORS** - Configurazione sicura per produzione

### 👤 Gestione Profilo
- Avatar generato automaticamente con iniziali e colore casuale
- Modifica Job Title e Team in tempo reale
- Visualizzazione dati utente (nome, cognome, email)
- Interface di editing integrata

### 💬 Sistema Messaggi
- Bacheca messaggi aziendali
- CRUD completo (Create, Read, Update, Delete)
- Autorizzazione per modifica/eliminazione
- Visualizzazione in tempo reale

### 📝 Logging Professionale
- **Winston** - Sistema di logging enterprise-grade
- **Rotazione automatica** dei file di log
- **Livelli di log** configurabili (error, warn, info, http, debug)
- **Audit trail** completo per sicurezza

## 🛠️ Tecnologie

### Frontend
- **Vue.js 3** - Framework JavaScript progressivo
- **Vite** - Build tool veloce
- **Pinia** - State management moderno
- **Vue Router** - Routing con guard di autenticazione
- **Axios** - HTTP client con interceptor
- **Font Awesome** - Icone

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web minimalista
- **MySQL2** - Database relazionale con connection pooling
- **JWT** - JSON Web Tokens per autenticazione
- **bcryptjs** - Password hashing sicuro
- **Winston** - Logging professionale
- **Helmet** - Security headers
- **express-validator** - Validazione input
- **express-rate-limit** - Protezione DDoS/brute force

### Sicurezza
- ✅ JWT authentication
- ✅ Rate limiting
- ✅ Input validation & sanitization
- ✅ SQL Injection prevention
- ✅ XSS protection
- ✅ CORS configurato
- ✅ Security headers (Helmet)
- ✅ Password policy enforced
- ✅ Environment variables
- ✅ Connection pooling

## 📁 Struttura Progetto

```
ProgettoFinale/
├── dashboard-backend/          # API Node.js + Express
│   ├── config/
│   │   └── logger.js          # Configurazione Winston
│   ├── middleware/
│   │   ├── auth.js            # Verifica JWT
│   │   └── logger.js          # Logging HTTP requests
│   ├── logs/                  # File di log (auto-generati)
│   ├── server.js              # Server principale
│   ├── .env                   # Variabili d'ambiente (NON committare!)
│   ├── .env.example           # Template configurazione
│   └── package.json
│
├── dashboard-frontend/         # Applicazione Vue.js
│   ├── src/
│   │   ├── views/             # Pagine (Login, Register, Dashboard, ecc.)
│   │   ├── stores/            # Pinia stores (auth, notification, loading)
│   │   ├── router/            # Configurazione routing + guards
│   │   ├── config/            # Configurazione API
│   │   └── main.js
│   ├── .env                   # Variabili d'ambiente frontend
│   ├── .env.example           # Template
│   └── package.json
│
├── START-SERVERS.bat          # Avvio automatico
├── STOP-SERVERS.bat           # Stop automatico
├── QUICK-RESTART.bat          # Riavvio rapido
├── CHECK-STATUS.bat           # Verifica stato
├── SECURITY.md                # Guida sicurezza
├── LOGGING.md                 # Documentazione logging
└── README.md
```

## 🚀 Installazione e Avvio

### Prerequisiti
- **Node.js** 16.x o superiore
- **MySQL** (XAMPP consigliato)
- **Git**

### 1. Clona il Repository
```bash
git clone https://github.com/GianmarcoSabbatini/ProgettoFinale.git
cd ProgettoFinale
```

### 2. Configurazione Environment Variables

#### Backend
```bash
cd dashboard-backend
cp .env.example .env
# Edita .env e configura:
# - DB_PASSWORD (password MySQL)
# - JWT_SECRET (genera chiave sicura)
```

**Genera JWT_SECRET sicuro:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### Frontend
```bash
cd dashboard-frontend
cp .env.example .env
# Verifica VITE_API_URL (default: http://localhost:3001)
```

### 3. Installazione Dipendenze

#### Backend
```bash
cd dashboard-backend
npm install
```

#### Frontend
```bash
cd dashboard-frontend
npm install
```

### 4. Avvio Automatico (Windows)
```bash
# Assicurati che MySQL sia attivo (XAMPP)
# Poi esegui dalla root del progetto:
START-SERVERS.bat
```

Il sistema:
1. Ferma eventuali processi esistenti
2. Avvia il backend (porta 3001)
3. Avvia il frontend (porta 5173)
4. Apre il browser automaticamente

### 5. Setup Manuale (Alternativo)

#### Backend
```bash
cd dashboard-backend
npm install
node server.js
```

#### Frontend
```bash
cd dashboard-frontend
npm install
npm run dev
```

#### Database
Il database viene creato automaticamente al primo avvio del backend.
Per resettarlo:
```bash
cd dashboard-backend
node reset-db.js
```

## 🔧 Script Utili

| Script | Descrizione |
|--------|-------------|
| `START-SERVERS.bat` | Avvia backend + frontend automaticamente |
| `STOP-SERVERS.bat` | Ferma tutti i processi node/npm/vite |
| `QUICK-RESTART.bat` | Riavvio rapido per sviluppo |
| `CHECK-STATUS.bat` | Verifica stato server e connettività |
| `FIND-FRONTEND.bat` | Trova e apre il frontend su diverse porte |

## 🧪 Test di Sicurezza

Il progetto include una suite completa di test automatizzati per verificare sicurezza e funzionalità.

### Esecuzione Test
```bash
cd dashboard-backend
node test-security.js
```

### Test Inclusi (10 test)
- ✅ Registrazione utente con JWT
- ✅ Login con credenziali valide
- ✅ Protezione endpoint senza token (HTTP 401)
- ✅ Accesso autorizzato con token valido
- ✅ Rifiuto token JWT invalidi
- ✅ Input validation (SQL injection, XSS)
- ✅ Rate limiting (brute force protection)
- ✅ Security headers (Helmet)
- ✅ CORS configuration
- ✅ Connection pool stress test (20 richieste simultanee)

### Risultati
**Ultimo test:** 9 Ottobre 2025  
**Esito:** ✅ **100% Test Superati (10/10)**

Vedi `TEST-RESULTS.md` per il report completo.

## 🌐 URL di Sviluppo

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api
- **Database**: MySQL localhost:3306

## � Database Schema

### Tabella `users`
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### Tabella `profiles`
```sql
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
```

### Tabella `messages`
```sql
CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    author VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

## 🎨 Design Features

### Sistema Avatar
- 15 colori predefiniti
- Generazione automatica con iniziali (es. "Mario Rossi" → "MR")
- Colore assegnato casualmente alla registrazione

### Notifiche Snackbar
- Posizionate in basso a destra (32px margin)
- Auto-chiusura dopo 4 secondi
- Animazioni fluide (slide-in/out)
- Tipi: Success (verde) ed Error (rosso)

### Responsive Design
- Layout adattivo per desktop e mobile
- Grid system per dashboard
- Card-based UI moderna

## � API Endpoints

### Authentication
- `POST /api/register` - Registrazione nuovo utente
- `POST /api/login` - Login utente

### Profile
- `GET /api/profile` - Recupera profilo utente
- `PUT /api/profile` - Aggiorna job_title e team

### Messages
- `GET /api/messages` - Lista messaggi bacheca

## 📱 Funzionalità Implementate

- [x] Registrazione multi-step (Account → Profilo)
- [x] Login con validazione
- [x] Dashboard con profilo utente
- [x] Avatar automatico con iniziali
- [x] Modifica Job Title e Team
- [x] Sistema notifiche snackbar
- [x] Bacheca messaggi
- [x] Logout
- [x] State management con Pinia
- [x] Routing protetto
- [x] Validazione form client-side
- [x] Error handling completo

## 🧪 Testing

### Verifica Stato Sistema
```bash
CHECK-STATUS.bat
```

### Test Manuale
1. Registra un nuovo utente
2. Login con le credenziali
3. Modifica Job Title e Team
4. Verifica le snackbar di successo/errore
5. Logout e re-login

## 🐛 Troubleshooting

### Il frontend non si carica
```bash
# Verifica che Vite sia attivo sulla porta 5173
FIND-FRONTEND.bat
```

### Il backend non risponde
```bash
# Verifica che MySQL sia attivo in XAMPP
# Poi riavvia i server
QUICK-RESTART.bat
```

### Errore "Cannot connect to database"
1. Apri XAMPP
2. Avvia MySQL
3. Riavvia il backend: `cd dashboard-backend && node server.js`

## 👨‍💻 Autore

**Gianmarco Sabbatini**
- GitHub: [@GianmarcoSabbatini](https://github.com/GianmarcoSabbatini)

## 📝 License

Questo progetto è distribuito sotto licenza MIT.

## 🙏 Ringraziamenti

- Vue.js team per il framework
- Node.js community
- Font Awesome per le icone
- Unsplash per le immagini di background

---

⭐ **Se questo progetto ti è stato utile, lascia una star su GitHub!**
