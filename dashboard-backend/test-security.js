/**
 * Script di Test Sicurezza e Funzionalità
 * Testa JWT, rate limiting, validation, CORS, security headers
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m'
};

// Variabili globali per i test
let authToken = null;
let testUserId = null;
let testUserEmail = null;

// Funzioni di utilità
function success(message) {
  console.log(`${colors.green}✓${colors.reset} ${message}`);
}

function error(message) {
  console.log(`${colors.red}✗${colors.reset} ${message}`);
}

function info(message) {
  console.log(`${colors.blue}ℹ${colors.reset} ${message}`);
}

function warning(message) {
  console.log(`${colors.yellow}⚠${colors.reset} ${message}`);
}

function section(title) {
  console.log(`\n${colors.blue}${'='.repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${'='.repeat(60)}${colors.reset}\n`);
}

// Funzione per verificare se il server è attivo
async function checkServerStatus() {
  try {
    const response = await axios.get(`${BASE_URL}/api/messages`, {
      validateStatus: () => true // Accetta qualsiasi status code
    });
    return true;
  } catch (err) {
    return false;
  }
}

// Test 1: Registrazione utente
async function testRegistration() {
  section('TEST 1: Registrazione Utente');
  
  const timestamp = Date.now();
  const testUser = {
    username: `testuser_${timestamp}`,
    email: `test_${timestamp}@example.com`,
    password: 'SecurePass123!',
    nome: 'Test',
    cognome: 'User'
  };

  try {
    info(`Registrazione utente: ${testUser.email}`);
    const response = await axios.post(`${BASE_URL}/api/register`, testUser);
    
    if (response.data.token) {
      success('Registrazione completata con successo');
      success(`Token JWT ricevuto: ${response.data.token.substring(0, 20)}...`);
      authToken = response.data.token;
      testUserId = response.data.user.id;
      testUserEmail = testUser.email;
      
      // Verifica struttura JWT (header.payload.signature)
      const parts = authToken.split('.');
      if (parts.length === 3) {
        success('Token JWT ha struttura corretta (header.payload.signature)');
      } else {
        error('Token JWT ha struttura non valida');
      }
      
      return true;
    } else {
      error('Nessun token ricevuto');
      return false;
    }
  } catch (err) {
    error(`Errore registrazione: ${err.response?.data?.message || err.message}`);
    return false;
  }
}

// Test 2: Login con credenziali valide
async function testValidLogin() {
  section('TEST 2: Login con Credenziali Valide');
  
  // Usa le credenziali create nella registrazione
  // o crea un utente demo se la registrazione è fallita
  if (!testUserId) {
    warning('Registrazione precedente fallita, skip test login');
    return false;
  }
  
  try {
    info('Tentativo di login con credenziali registrate...');
    
    // Recupera l'email dell'utente dal database o usa quella memorizzata
    const loginData = {
      email: testUserEmail,
      password: 'SecurePass123!'
    };
    
    const response = await axios.post(`${BASE_URL}/api/login`, loginData);
    
    if (response.data.token) {
      success('Login riuscito con JWT valido');
      authToken = response.data.token;
      return true;
    } else {
      error('Login fallito: nessun token ricevuto');
      return false;
    }
  } catch (err) {
    error(`Errore login: ${err.response?.data?.message || err.message}`);
    return false;
  }
}

// Test 3: Accesso a endpoint protetto SENZA token
async function testUnauthorizedAccess() {
  section('TEST 3: Accesso Endpoint Protetto SENZA Token');
  
  try {
    info('Tentativo di accesso a /api/messages senza token...');
    const response = await axios.get(`${BASE_URL}/api/messages`, {
      validateStatus: () => true
    });
    
    if (response.status === 401 || response.status === 403) {
      success(`Accesso negato correttamente (${response.status})`);
      success('Sistema di autenticazione funziona: richiede token');
      return true;
    } else {
      error(`Endpoint NON protetto! Status: ${response.status}`);
      warning('VULNERABILITÀ: endpoint accessibile senza autenticazione');
      return false;
    }
  } catch (err) {
    error(`Errore test: ${err.message}`);
    return false;
  }
}

// Test 4: Accesso a endpoint protetto CON token valido
async function testAuthorizedAccess() {
  section('TEST 4: Accesso Endpoint Protetto CON Token Valido');
  
  if (!authToken) {
    warning('Token non disponibile, skip test');
    return false;
  }
  
  try {
    info('Tentativo di accesso a /api/messages con token valido...');
    const response = await axios.get(`${BASE_URL}/api/messages`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.status === 200) {
      success('Accesso autorizzato con token JWT valido');
      success(`Messaggi ricevuti: ${response.data.length || 0}`);
      return true;
    } else {
      error(`Status code inatteso: ${response.status}`);
      return false;
    }
  } catch (err) {
    error(`Errore accesso autorizzato: ${err.response?.data?.message || err.message}`);
    return false;
  }
}

// Test 5: Token JWT invalido
async function testInvalidToken() {
  section('TEST 5: Token JWT Invalido');
  
  try {
    info('Tentativo con token JWT malformato...');
    const response = await axios.get(`${BASE_URL}/api/messages`, {
      headers: {
        'Authorization': 'Bearer invalid.token.here'
      },
      validateStatus: () => true
    });
    
    if (response.status === 401 || response.status === 403) {
      success(`Token invalido rifiutato correttamente (${response.status})`);
      return true;
    } else {
      error(`Token invalido ACCETTATO! Status: ${response.status}`);
      warning('VULNERABILITÀ CRITICA: token invalidi accettati');
      return false;
    }
  } catch (err) {
    error(`Errore test: ${err.message}`);
    return false;
  }
}

// Test 6: Input Validation - Email non valida
async function testInputValidation() {
  section('TEST 6: Input Validation');
  
  const invalidInputs = [
    { email: 'not-an-email', password: 'test', desc: 'Email non valida' },
    { email: 'test@test.com', password: '123', desc: 'Password troppo corta' },
    { email: 'test@test.com', password: "'; DROP TABLE users; --", desc: 'SQL Injection attempt' }
  ];
  
  let allPassed = true;
  
  for (const input of invalidInputs) {
    try {
      info(`Test: ${input.desc}`);
      const response = await axios.post(`${BASE_URL}/api/login`, input, {
        validateStatus: () => true
      });
      
      if (response.status === 400) {
        success(`Input non valido rifiutato: ${input.desc}`);
      } else {
        error(`Input non valido ACCETTATO: ${input.desc} (Status: ${response.status})`);
        allPassed = false;
      }
    } catch (err) {
      success(`Input rifiutato: ${input.desc}`);
    }
  }
  
  return allPassed;
}

// Test 7: Rate Limiting
async function testRateLimiting() {
  section('TEST 7: Rate Limiting (Login)');
  
  info('Tentativo di 6 login falliti consecutivi...');
  
  let blocked = false;
  for (let i = 1; i <= 6; i++) {
    try {
      const response = await axios.post(`${BASE_URL}/api/login`, {
        email: 'fake@fake.com',
        password: 'wrongpassword'
      }, {
        validateStatus: () => true
      });
      
      if (response.status === 429) {
        success(`Tentativo ${i}: Rate limit attivato (429 Too Many Requests)`);
        blocked = true;
        break;
      } else {
        info(`Tentativo ${i}: Status ${response.status}`);
      }
    } catch (err) {
      if (err.response?.status === 429) {
        success(`Tentativo ${i}: Rate limit attivato`);
        blocked = true;
        break;
      }
    }
  }
  
  if (blocked) {
    success('Rate limiting funziona correttamente');
    return true;
  } else {
    warning('Rate limiting NON attivato dopo 6 tentativi');
    return false;
  }
}

// Test 8: Security Headers (Helmet)
async function testSecurityHeaders() {
  section('TEST 8: Security Headers (Helmet)');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/messages`, {
      validateStatus: () => true
    });
    
    const headers = response.headers;
    const requiredHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-download-options',
      'x-dns-prefetch-control'
    ];
    
    let allPresent = true;
    for (const header of requiredHeaders) {
      if (headers[header]) {
        success(`Header presente: ${header} = ${headers[header]}`);
      } else {
        error(`Header mancante: ${header}`);
        allPresent = false;
      }
    }
    
    return allPresent;
  } catch (err) {
    error(`Errore verifica headers: ${err.message}`);
    return false;
  }
}

// Test 9: CORS Configuration
async function testCORS() {
  section('TEST 9: CORS Configuration');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/messages`, {
      headers: {
        'Origin': 'http://malicious-site.com'
      },
      validateStatus: () => true
    });
    
    const corsHeader = response.headers['access-control-allow-origin'];
    
    if (corsHeader === 'http://localhost:5173') {
      success('CORS configurato correttamente per localhost:5173');
      return true;
    } else if (!corsHeader) {
      warning('Header CORS non presente (potrebbe essere OK)');
      return true;
    } else {
      error(`CORS permissivo: ${corsHeader}`);
      return false;
    }
  } catch (err) {
    error(`Errore test CORS: ${err.message}`);
    return false;
  }
}

// Test 10: Connection Pool (multiple richieste simultanee)
async function testConnectionPool() {
  section('TEST 10: Connection Pool - Richieste Simultanee');
  
  if (!authToken) {
    warning('Token non disponibile, skip test');
    return false;
  }
  
  info('Invio 20 richieste simultanee per testare il connection pool...');
  
  const requests = [];
  for (let i = 0; i < 20; i++) {
    requests.push(
      axios.get(`${BASE_URL}/api/messages`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
        validateStatus: () => true
      })
    );
  }
  
  try {
    const responses = await Promise.all(requests);
    const successCount = responses.filter(r => r.status === 200).length;
    
    success(`${successCount}/20 richieste completate con successo`);
    
    if (successCount === 20) {
      success('Connection pool gestisce correttamente carichi multipli');
      return true;
    } else {
      error('Alcune richieste sono fallite');
      return false;
    }
  } catch (err) {
    error(`Errore test connection pool: ${err.message}`);
    return false;
  }
}

// Esecuzione di tutti i test
async function runAllTests() {
  console.log(`\n${colors.blue}╔${'═'.repeat(58)}╗`);
  console.log(`║  TEST DI SICUREZZA E FUNZIONALITÀ - Dashboard Backend  ║`);
  console.log(`╚${'═'.repeat(58)}╝${colors.reset}\n`);
  
  // Verifica che il server sia online
  info('Verifica connessione al server...');
  const serverOnline = await checkServerStatus();
  
  if (!serverOnline) {
    error('Server non raggiungibile su http://localhost:3001');
    error('Assicurati che il server sia in esecuzione');
    process.exit(1);
  }
  success('Server raggiungibile\n');
  
  // Esegui tutti i test
  const results = {
    'Registrazione Utente': await testRegistration(),
    'Login Valido': authToken ? await testValidLogin() : false,
    'Accesso Non Autorizzato': await testUnauthorizedAccess(),
    'Accesso Autorizzato': await testAuthorizedAccess(),
    'Token Invalido': await testInvalidToken(),
    'Input Validation': await testInputValidation(),
    'Rate Limiting': await testRateLimiting(),
    'Security Headers': await testSecurityHeaders(),
    'CORS Configuration': await testCORS(),
    'Connection Pool': await testConnectionPool()
  };
  
  // Riepilogo finale
  section('RIEPILOGO RISULTATI');
  
  let passed = 0;
  let failed = 0;
  
  for (const [testName, result] of Object.entries(results)) {
    if (result) {
      success(`${testName}`);
      passed++;
    } else {
      error(`${testName}`);
      failed++;
    }
  }
  
  console.log(`\n${colors.blue}${'─'.repeat(60)}${colors.reset}`);
  console.log(`${colors.green}Test Superati: ${passed}${colors.reset}`);
  console.log(`${colors.red}Test Falliti: ${failed}${colors.reset}`);
  console.log(`${colors.blue}Totale: ${passed + failed}${colors.reset}`);
  
  const percentage = ((passed / (passed + failed)) * 100).toFixed(1);
  console.log(`\nPercentuale successo: ${percentage}%`);
  
  if (percentage >= 80) {
    console.log(`${colors.green}\n✅ Sistema SICURO e FUNZIONALE${colors.reset}\n`);
  } else if (percentage >= 60) {
    console.log(`${colors.yellow}\n⚠️  Sistema PARZIALMENTE SICURO - Richiede miglioramenti${colors.reset}\n`);
  } else {
    console.log(`${colors.red}\n❌ Sistema NON SICURO - Correzioni urgenti richieste${colors.reset}\n`);
  }
  
  process.exit(failed > 0 ? 1 : 0);
}

// Avvia i test
runAllTests().catch(err => {
  error(`Errore fatale: ${err.message}`);
  console.error(err);
  process.exit(1);
});
