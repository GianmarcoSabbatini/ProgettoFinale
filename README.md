# 📊 Dashboard Aziendale - Progetto Finale

Sistema completo di gestione aziendale con dashboard interattiva, timesheet, rimborsi spese e generazione buste paga.

## 🎯 Caratteristiche Principali

### ✨ Funzionalità
- **Autenticazione Completa**: Registrazione, login, reset password con token crittografico
- **Dashboard Interattiva**: Visualizzazione statistiche e attività in tempo reale
- **Gestione Timesheet**: Tracciamento ore lavorate con calcolo automatico
- **Rimborsi Spese**: Sistema di gestione spese con allegati e stati di approvazione
- **Buste Paga**: Generazione automatica PDF con calcoli netti/lordi
- **Sistema di Notifiche**: Notifiche toast per feedback utente
- **Responsive Design**: Interfaccia ottimizzata per desktop e mobile

### 🔒 Sicurezza
- **JWT Authentication**: Token Bearer per autenticazione stateless
- **Password Hashing**: bcrypt con 10 rounds
- **Rate Limiting**: Protezione da brute-force (5 tentativi login/15min)
- **Input Validation**: Sanitizzazione e validazione con express-validator
- **SQL Injection Prevention**: Prepared statements parametrizzati
- **Security Headers**: Helmet.js per XSS, clickjacking, MIME sniffing
- **CORS Protection**: Whitelist origini consentite
- **Logging Completo**: Winston con rotazione giornaliera

## 🏗️ Architettura

### Stack Tecnologico

**Backend:**
- Node.js + Express.js
- MySQL (database relazionale)
- JWT per autenticazione
- bcryptjs per hashing password
- Winston per logging
- Mocha + Chai per testing

**Frontend:**
- Vue.js 3 (Composition API)
- Pinia (state management)
- Vue Router
- Axios per chiamate API
- jsPDF per generazione PDF
- Font Awesome per icone

### Struttura del Progetto

```
ProgettoFinale/
├── dashboard-backend/           # Server Node.js + Express
│   ├── config/                  # Configurazioni (logger, email)
│   ├── middleware/              # Middleware (auth, logger)
│   ├── test/                    # Test suite (unit + integration)
│   ├── logs/                    # File di log (rotazione giornaliera)
│   ├── server.js               # Entry point backend
│   ├── package.json
│   └── .env.example            # Template variabili ambiente
│
├── dashboard-frontend/          # Client Vue.js
│   ├── src/
│   │   ├── components/         # Componenti riutilizzabili
│   │   ├── views/              # Pagine dell'applicazione
│   │   ├── router/             # Configurazione routing
│   │   ├── stores/             # Pinia stores (auth, notifications)
│   │   ├── config/             # Configurazione API
│   │   ├── app.vue             # Componente root
│   │   └── main.js             # Entry point frontend
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── START-SERVERS.bat            # Script avvio automatico
├── STOP-SERVERS.bat             # Script stop server
└── README.md                    # Questo file
```

## 🚀 Installazione e Avvio

### Prerequisiti

- **Node.js** >= 16.x
- **MySQL** >= 8.x
- **npm** o **yarn**

### 1. Clonare il Repository

```bash
git clone https://github.com/GianmarcoSabbatini/ProgettoFinale.git
cd ProgettoFinale
```

### 2. Configurare il Backend

```bash
cd dashboard-backend
npm install
```

**Creare file `.env`** dalla template:

```bash
cp .env.example .env
```

**Modificare `.env`** con i tuoi parametri:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tua_password_mysql
DB_DATABASE=dashboard_db

# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Secret - IMPORTANTE: Generare una chiave sicura!
# Genera con: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=genera_chiave_sicura_64_caratteri

# Frontend URL (per CORS)
FRONTEND_URL=http://localhost:5173

# Logging
LOG_LEVEL=debug
```

⚠️ **IMPORTANTE**: Generare un JWT_SECRET sicuro:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Configurare il Frontend

```bash
cd ../dashboard-frontend
npm install
```

**Creare file `.env`** (opzionale, ha valori di default):

```bash
cp .env.example .env
```

```env
VITE_API_URL=http://localhost:3001
```

### 4. Avvio Rapido (Windows)

**Dalla root del progetto:**

```bash
START-SERVERS.bat
```

Questo script:
1. Ferma eventuali processi Node esistenti
2. Avvia il backend sulla porta 3001
3. Avvia il frontend sulla porta 5173
4. Apre automaticamente il browser

**Per fermare i server:**

```bash
STOP-SERVERS.bat
```

### 5. Avvio Manuale

**Backend:**

```bash
cd dashboard-backend
npm start
# Server disponibile su http://localhost:3001
```

**Frontend (nuovo terminale):**

```bash
cd dashboard-frontend
npm run dev
# App disponibile su http://localhost:5173
```

## 📊 Database

Il database viene **creato automaticamente** al primo avvio del backend.

### Tabelle Create

- `users` - Utenti del sistema
- `profiles` - Profili utente estesi
- `timesheet_entries` - Voci timesheet
- `expense_reports` - Rimborsi spese
- `payslips` - Buste paga
- `messages` - Sistema messaggi
- `password_resets` - Token reset password

### Schema

Consulta il codice in `server.js` (funzione `initDB()`) per lo schema completo.

## 🔐 API Endpoints

### Autenticazione

| Metodo | Endpoint | Descrizione | Auth |
|--------|----------|-------------|------|
| POST | `/api/register` | Registrazione nuovo utente | No |
| POST | `/api/login` | Login utente | No |
| POST | `/api/auth/forgot-password` | Richiesta reset password | No |
| POST | `/api/auth/reset-password` | Reset password con token | No |

### Profilo

| Metodo | Endpoint | Descrizione | Auth |
|--------|----------|-------------|------|
| GET | `/api/profile/:userId` | Ottieni profilo utente | Sì |
| PUT | `/api/profile/:userId` | Aggiorna profilo | Sì |

### Timesheet

| Metodo | Endpoint | Descrizione | Auth |
|--------|----------|-------------|------|
| POST | `/api/timesheet` | Crea voce timesheet | Sì |
| GET | `/api/timesheet/:userId` | Lista timesheet utente | Sì |
| PUT | `/api/timesheet/:id` | Aggiorna voce | Sì |
| DELETE | `/api/timesheet/:id` | Elimina voce | Sì |

### Rimborsi Spese

| Metodo | Endpoint | Descrizione | Auth |
|--------|----------|-------------|------|
| POST | `/api/expenses` | Crea rimborso | Sì |
| GET | `/api/expenses/:userId` | Lista rimborsi utente | Sì |
| PUT | `/api/expenses/:id` | Aggiorna rimborso | Sì |
| DELETE | `/api/expenses/:id` | Elimina rimborso | Sì |

### Buste Paga

| Metodo | Endpoint | Descrizione | Auth |
|--------|----------|-------------|------|
| POST | `/api/payslips/generate` | Genera busta paga da timesheet | Sì |
| GET | `/api/payslips/:userId` | Lista buste paga utente | Sì |
| PUT | `/api/payslips/:id/recalculate` | Ricalcola busta paga | Sì |
| DELETE | `/api/payslips/:id` | Elimina busta paga | Sì |

### Dashboard

| Metodo | Endpoint | Descrizione | Auth |
|--------|----------|-------------|------|
| GET | `/api/dashboard/:userId` | Statistiche dashboard | Sì |

## 🧪 Testing

### Backend Tests

```bash
cd dashboard-backend

# Esegui tutti i test
npm test

# Test con coverage
npm run test:coverage

# Solo test unitari
npm run test:unit

# Solo test di integrazione
npm run test:integration

# Test in modalità watch
npm run test:watch
```

**Test Suite Include:**
- Test unitari (validazione, auth utils)
- Test di integrazione (API endpoints)
- Test di sicurezza (SQL injection, XSS)
- Coverage reporting con nyc

## 📱 Pagine Applicazione

1. **Login** (`/login`) - Autenticazione con password visibility toggle
2. **Registrazione** (`/register`) - Creazione nuovo account
3. **Reset Password** (`/reset-password`) - Recupero password con token
4. **Dashboard** (`/dashboard`) - Panoramica statistiche e attività
5. **Timesheet** (`/timesheet`) - Gestione ore lavorate
6. **Rimborso Spese** (`/rimborso-spese`) - Gestione spese
7. **Buste Paga** (`/buste-paga`) - Visualizzazione e generazione PDF

## 🔧 Configurazione Avanzata

### Cambio Porte

**Backend** - Modificare in `.env`:
```env
PORT=3001
```

**Frontend** - Modificare in `vite.config.js`:
```javascript
export default defineConfig({
  server: {
    port: 5173
  }
})
```

### Logging

Configurare livello log in `.env`:
```env
LOG_LEVEL=debug  # debug, info, warn, error
```

I log sono salvati in:
- `dashboard-backend/logs/application-YYYY-MM-DD.log`
- `dashboard-backend/logs/error-YYYY-MM-DD.log`

### Rate Limiting

Modificare in `server.js`:

```javascript
// Login limiter
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minuti
    max: 5, // 5 tentativi
    message: { success: false, message: 'Troppi tentativi...' }
});

// API limiter
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 100 // 100 richieste
});
```

## 🛡️ Sicurezza - Best Practices Implementate

### ✅ OWASP Top 10 Coverage

1. **Injection** - Prepared statements parametrizzati
2. **Broken Authentication** - JWT sicuro, password policy robusta
3. **Sensitive Data Exposure** - Password hashing, .env in .gitignore
4. **XML External Entities** - N/A (no XML)
5. **Broken Access Control** - Middleware verifyToken, controllo userId
6. **Security Misconfiguration** - Helmet.js, CORS configurato
7. **XSS** - Input sanitization, nessun v-html
8. **Insecure Deserialization** - N/A (JSON sicuro)
9. **Using Components with Known Vulnerabilities** - npm audit
10. **Insufficient Logging** - Winston con audit trail completo

### 🔐 Password Policy

- Minimo 8 caratteri
- Almeno 1 maiuscola
- Almeno 1 minuscola
- Almeno 1 numero
- Hashing bcrypt con 10 rounds

### 🔑 Reset Password

- Token crittografico sicuro (32 byte random)
- Scadenza 1 ora
- Token usa-e-getta
- Invalidazione token precedenti

## 🚀 Deploy in Produzione

### Checklist Pre-Deploy

- [ ] Generare JWT_SECRET sicuro (64+ caratteri)
- [ ] Configurare password MySQL robusta
- [ ] Impostare `NODE_ENV=production`
- [ ] Configurare HTTPS con reverse proxy (Nginx/Apache)
- [ ] Eseguire `npm audit` e risolvere vulnerabilità
- [ ] Configurare backup automatici database
- [ ] Impostare monitoring (PM2, New Relic, etc.)
- [ ] Configurare FRONTEND_URL con dominio produzione
- [ ] Build frontend: `npm run build`
- [ ] Testare tutti gli endpoint

### Esempio Configurazione Nginx

```nginx
server {
    listen 80;
    server_name tuodominio.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tuodominio.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Frontend
    location / {
        root /path/to/dashboard-frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### PM2 Process Manager

```bash
npm install -g pm2

# Avvio backend
cd dashboard-backend
pm2 start server.js --name dashboard-backend

# Avvio frontend (se necessario)
cd ../dashboard-frontend
pm2 start npm --name dashboard-frontend -- run dev

# Salva configurazione
pm2 save

# Avvio automatico al boot
pm2 startup
```

## 🐛 Troubleshooting

### Problema: Errore connessione database

**Soluzione:**
1. Verificare MySQL sia avviato: `mysql -u root -p`
2. Controllare credenziali in `.env`
3. Verificare porta MySQL (default 3306)

### Problema: CORS error

**Soluzione:**
1. Verificare `FRONTEND_URL` in backend `.env`
2. Controllare porta frontend corrisponda (5173)
3. Verificare origin in console browser

### Problema: JWT token non valido

**Soluzione:**
1. Verificare JWT_SECRET sia lo stesso in `.env`
2. Controllare scadenza token
3. Rifare login per ottenere nuovo token

### Problema: Rate limit troppo restrittivo

**Soluzione:**
Temporaneamente aumentare limiti in `server.js` durante sviluppo:
```javascript
max: 100, // invece di 5 per login
```

## 📄 Licenza

Progetto accademico - Tutti i diritti riservati

## 👨‍💻 Autore

**Gianmarco Sabbatini**
- GitHub: [@GianmarcoSabbatini](https://github.com/GianmarcoSabbatini)

## 🙏 Ringraziamenti

Progetto finale sviluppato per il corso di sviluppo web.

### Tecnologie utilizzate:
- Vue.js Team per il framework frontend
- Express.js Team per il framework backend
- MySQL per il database
- Tutti i maintainer delle librerie open source utilizzate

---

**Versione:** 1.0.0  
**Ultimo aggiornamento:** Novembre 2025
