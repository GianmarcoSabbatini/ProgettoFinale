# 📊 Dashboard Aziendale

Dashboard moderna per la gestione del profilo utente e messaggi aziendali, costruita con Vue.js 3 e Node.js.

## ✨ Caratteristiche Principali

### 🔐 Autenticazione
- Registrazione multi-step (2 fasi)
- Login sicuro con JWT
- Password hashing con bcrypt
- Sistema di notifiche snackbar

### 👤 Gestione Profilo
- Avatar generato automaticamente con iniziali e colore casuale
- Modifica Job Title e Team in tempo reale
- Visualizzazione dati utente (nome, cognome, email)
- Interface di editing integrata

### � Sistema Messaggi
- Bacheca messaggi aziendali
- Visualizzazione messaggi in tempo reale
- Design card-based moderno

## 🛠️ Tecnologie

### Frontend
- **Vue.js 3** - Framework JavaScript progressivo
- **Vite** - Build tool veloce
- **Pinia** - State management
- **Vue Router** - Routing
- **Axios** - HTTP client
- **Font Awesome** - Icone

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **MySQL** - Database relazionale
- **bcryptjs** - Password hashing
- **CORS** - Cross-Origin Resource Sharing

## 📁 Struttura Progetto

```
ProgettoFinale/
├── dashboard-backend/          # API Node.js + Express
│   ├── server.js              # Server principale
│   ├── reset-db.js            # Script reset database
│   └── package.json
│
├── dashboard-frontend/         # Applicazione Vue.js
│   ├── src/
│   │   ├── views/             # Pagine (Login, Register, Dashboard)
│   │   ├── stores/            # Pinia stores (auth, notification)
│   │   ├── router/            # Configurazione routing
│   │   └── main.js
│   ├── index.html
│   └── package.json
│
├── START-SERVERS.bat          # Avvio automatico
├── STOP-SERVERS.bat           # Stop automatico
├── QUICK-RESTART.bat          # Riavvio rapido
├── CHECK-STATUS.bat           # Verifica stato
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

### 2. Avvio Automatico (Windows)
```bash
# Assicurati che MySQL sia attivo (XAMPP)
# Poi esegui:
START-SERVERS.bat
```

Il sistema:
1. Ferma eventuali processi esistenti
2. Avvia il backend (porta 3001)
3. Avvia il frontend (porta 5173)
4. Apre il browser automaticamente

### 3. Setup Manuale (Alternativo)

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
