<template>
  <div class="reset-page-wrapper">
    <div class="reset-container">
      <div class="reset-logo">
        <svg class="logo-icon" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="reset-logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
            </linearGradient>
          </defs>
          <circle cx="20" cy="20" r="18" fill="none" stroke="url(#reset-logo-gradient)" stroke-width="2"/>
          <circle cx="20" cy="12" r="4" fill="url(#reset-logo-gradient)"/>
          <circle cx="14" cy="24" r="4" fill="url(#reset-logo-gradient)"/>
          <circle cx="26" cy="24" r="4" fill="url(#reset-logo-gradient)"/>
          <line x1="20" y1="16" x2="16" y2="21" stroke="url(#reset-logo-gradient)" stroke-width="2" stroke-linecap="round"/>
          <line x1="20" y1="16" x2="24" y2="21" stroke="url(#reset-logo-gradient)" stroke-width="2" stroke-linecap="round"/>
          <line x1="18" y1="24" x2="22" y2="24" stroke="url(#reset-logo-gradient)" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      <h1>Reimposta Password</h1>
      <p v-if="!step2">Inserisci la tua email per richiedere il reset della password.</p>
      <p v-else>Inserisci il token ricevuto e la nuova password.</p>
      
      <!-- Step 1: Request token -->
      <form v-if="!step2" @submit.prevent="handleRequestReset">
        <div class="form-group">
          <label for="email">Indirizzo email</label>
          <input type="email" id="email" v-model="form.email" required>
        </div>
        <button type="submit" class="submit-btn" :disabled="loading">
          <span v-if="!loading">RICHIEDI TOKEN</span>
          <span v-else>Invio in corso...</span>
        </button>
      </form>

      <!-- Step 2: Reset password with token -->
      <form v-else @submit.prevent="handleResetPassword">
        <div class="form-group">
          <label for="token">Token di reset</label>
          <input type="text" id="token" v-model="form.token" required placeholder="Incolla qui il token ricevuto">
          <small class="hint">Il token è valido per 1 ora</small>
        </div>
        <div class="form-group">
          <label for="newPassword">Nuova password</label>
          <input type="password" id="newPassword" v-model="form.newPassword" required minlength="6">
          <small class="hint">Minimo 6 caratteri</small>
        </div>
        <div class="form-group">
          <label for="confirmPassword">Conferma password</label>
          <input type="password" id="confirmPassword" v-model="form.confirmPassword" required minlength="6">
        </div>
        <button type="submit" class="submit-btn" :disabled="loading">
          <span v-if="!loading">REIMPOSTA PASSWORD</span>
          <span v-else>Aggiornamento in corso...</span>
        </button>
        <button type="button" class="back-btn" @click="goBackToStep1">Torna indietro</button>
      </form>

      <!-- Token display (solo in dev) -->
      <div v-if="tokenDisplay" class="token-display">
        <h3>Token generato:</h3>
        <div class="token-box">
          <code>{{ tokenDisplay }}</code>
          <button @click="copyToken" class="copy-btn">
            <i class="fas fa-copy"></i> Copia
          </button>
        </div>
        <p class="token-info">
          <i class="fas fa-info-circle"></i> 
          Scade: {{ tokenExpiry }}
        </p>
      </div>
      
      <div class="login-link">
        <p><router-link to="/login">Torna al login</router-link></p>
      </div>
    </div>

    <!-- Snackbar -->
    <transition name="snackbar">
      <div v-if="snackbar.show" :class="['snackbar', snackbar.type]">
        <i :class="snackbar.type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'"></i>
        <span>{{ snackbar.message }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';
import API_URL from '@/config/api';

const router = useRouter();
const route = useRoute();

const step2 = ref(false);
const loading = ref(false);
const tokenDisplay = ref('');
const tokenExpiry = ref('');

const form = reactive({
  email: '',
  token: '',
  newPassword: '',
  confirmPassword: ''
});

// Controlla se c'è un token nell'URL
onMounted(() => {
  const urlToken = route.query.token;
  if (urlToken) {
    form.token = urlToken;
    step2.value = true;
  }
});

const snackbar = reactive({
  show: false,
  message: '',
  type: 'error'
});

const showSnackbar = (message, type = 'error') => {
  snackbar.message = message;
  snackbar.type = type;
  snackbar.show = true;
  
  setTimeout(() => {
    snackbar.show = false;
  }, 5000);
};

const handleRequestReset = async () => {
  if (!form.email) {
    showSnackbar('Inserisci un indirizzo email valido.', 'error');
    return;
  }

  loading.value = true;
  
  try {
    const response = await axios.post(`${API_URL}/api/auth/forgot-password`, {
      email: form.email
    });

    if (response.data.success) {
      // Controlla se siamo in sviluppo e abbiamo il token
      if (response.data.devInfo && response.data.devInfo.token) {
        showSnackbar('Token generato! (Modalità sviluppo)', 'success');
        
        tokenDisplay.value = response.data.devInfo.token;
        form.token = response.data.devInfo.token;
        
        if (response.data.devInfo.expiresAt) {
          const expiryDate = new Date(response.data.devInfo.expiresAt);
          tokenExpiry.value = expiryDate.toLocaleString('it-IT');
        }
        
        // Mostra URL preview se disponibile (Ethereal)
        if (response.data.devInfo.previewUrl) {
          console.log('📧 Preview email:', response.data.devInfo.previewUrl);
          showSnackbar(`Email inviata! Link preview in console`, 'success');
        }
        
        setTimeout(() => {
          step2.value = true;
        }, 1000);
      } else {
        // Produzione: email inviata
        showSnackbar('Se l\'email esiste, riceverai le istruzioni per il reset.', 'success');
      }
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Errore durante la richiesta. Riprova.';
    showSnackbar(errorMessage, 'error');
  } finally {
    loading.value = false;
  }
};

const handleResetPassword = async () => {
  if (!form.token || !form.newPassword || !form.confirmPassword) {
    showSnackbar('Compila tutti i campi.', 'error');
    return;
  }

  if (form.newPassword.length < 6) {
    showSnackbar('La password deve essere di almeno 6 caratteri.', 'error');
    return;
  }

  if (form.newPassword !== form.confirmPassword) {
    showSnackbar('Le password non coincidono.', 'error');
    return;
  }

  loading.value = true;
  
  try {
    const response = await axios.post(`${API_URL}/api/auth/reset-password`, {
      token: form.token,
      newPassword: form.newPassword
    });

    if (response.data.success) {
      showSnackbar('Password aggiornata con successo! Ora puoi effettuare il login.', 'success');
      
      // Reindirizza al login dopo 2 secondi
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Errore durante il reset. Verifica il token.';
    showSnackbar(errorMessage, 'error');
  } finally {
    loading.value = false;
  }
};

const goBackToStep1 = () => {
  step2.value = false;
  tokenDisplay.value = '';
  form.token = '';
  form.newPassword = '';
  form.confirmPassword = '';
};

const copyToken = () => {
  navigator.clipboard.writeText(tokenDisplay.value);
  showSnackbar('Token copiato negli appunti!', 'success');
};
</script>

<style scoped>
.reset-page-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.reset-container {
  background: white;
  padding: 3rem 2.5rem;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 450px;
  width: 100%;
  text-align: center;
}

.reset-logo {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.logo-icon {
  width: 80px;
  height: 80px;
}

h1 {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #1f2937;
}

p {
  color: #6b7280;
  font-size: 0.95rem;
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
  text-align: left;
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #374151;
  font-size: 0.95rem;
}

.form-group input {
  width: 100%;
  padding: 0.875rem;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.hint {
  display: block;
  margin-top: 0.375rem;
  font-size: 0.8rem;
  color: #9ca3af;
}

.submit-btn {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 1rem;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(99, 102, 241, 0.3);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.back-btn {
  width: 100%;
  padding: 0.875rem;
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: #e5e7eb;
}

.token-display {
  margin-top: 2rem;
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 10px;
  border: 2px dashed #d1d5db;
}

.token-display h3 {
  font-size: 1rem;
  margin-bottom: 1rem;
  color: #374151;
}

.token-box {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: white;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.token-box code {
  flex: 1;
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  color: #6366f1;
  word-break: break-all;
  text-align: left;
}

.copy-btn {
  padding: 0.5rem 0.875rem;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.copy-btn:hover {
  background: #4f46e5;
}

.token-info {
  margin-top: 0.875rem;
  font-size: 0.85rem;
  color: #6b7280;
}

.token-info i {
  color: #6366f1;
  margin-right: 0.375rem;
}

.login-link {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.login-link p {
  margin: 0;
  font-size: 0.95rem;
  color: #6b7280;
}

.login-link a {
  color: #6366f1;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.2s ease;
}

.login-link a:hover {
  color: #4f46e5;
  text-decoration: underline;
}

/* Snackbar */
.snackbar {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  color: #1f2937;
  padding: 1rem 1.5rem;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 300px;
  z-index: 1000;
  border-left: 4px solid;
}

.snackbar.success {
  border-left-color: #10b981;
}

.snackbar.success i {
  color: #10b981;
}

.snackbar.error {
  border-left-color: #ef4444;
}

.snackbar.error i {
  color: #ef4444;
}

.snackbar i {
  font-size: 1.25rem;
}

.snackbar span {
  font-size: 0.95rem;
  font-weight: 500;
}

.snackbar-enter-active, .snackbar-leave-active {
  transition: all 0.3s ease;
}

.snackbar-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

.snackbar-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

/* Responsive */
@media (max-width: 768px) {
  .reset-container {
    padding: 2rem 1.5rem;
  }

  h1 {
    font-size: 1.5rem;
  }

  .token-box code {
    font-size: 0.7rem;
  }
}
</style>
