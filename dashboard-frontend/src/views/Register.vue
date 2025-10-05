<template>
  <div class="register-page-wrapper">
    <div class="register-container">
      <h1>Registrazione</h1>
      <p>{{ currentStep === 1 ? 'Crea un nuovo account per accedere alla piattaforma.' : 'Completa il tuo profilo.' }}</p>
      
      <!-- Indicatore di step -->
      <div class="step-indicator">
        <div class="step" :class="{ active: currentStep >= 1, completed: currentStep > 1 }">1</div>
        <div class="step-line" :class="{ completed: currentStep > 1 }"></div>
        <div class="step" :class="{ active: currentStep >= 2 }">2</div>
      </div>
      
      <form @submit.prevent="handleSubmit">
        <!-- Step 1: Dati account -->
        <div v-if="currentStep === 1" class="step-content">
          <div class="form-group">
            <label for="email">Indirizzo email</label>
            <input type="email" id="email" v-model="form.email" required>
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" v-model="form.password" required>
          </div>
          <div class="form-group">
            <label for="confirmPassword">Conferma password</label>
            <input type="password" id="confirmPassword" v-model="form.confirmPassword" required>
          </div>
        </div>

        <!-- Step 2: Dati profilo -->
        <div v-if="currentStep === 2" class="step-content">
          <div class="form-group">
            <label for="nome">Nome</label>
            <input type="text" id="nome" v-model="form.nome" placeholder="es. Mario" required>
          </div>
          <div class="form-group">
            <label for="cognome">Cognome</label>
            <input type="text" id="cognome" v-model="form.cognome" placeholder="es. Rossi" required>
          </div>
          <div class="form-group">
            <label for="jobTitle">Job Title</label>
            <input type="text" id="jobTitle" v-model="form.jobTitle" placeholder="es. Frontend Developer" required>
          </div>
          <div class="form-group">
            <label for="team">Team di appartenenza</label>
            <select id="team" v-model="form.team" required>
              <option value="" disabled>Seleziona un team</option>
              <option value="Design">Design</option>
              <option value="Development">Development</option>
              <option value="Marketing">Marketing</option>
              <option value="Human Resources">Human Resources</option>
            </select>
          </div>
        </div>

        <!-- Pulsanti di navigazione -->
        <div class="button-group">
          <button v-if="currentStep === 2" type="button" @click="previousStep" class="secondary-btn">← Indietro</button>
          <button v-if="currentStep === 1" type="button" @click="nextStep" class="submit-btn">Avanti →</button>
          <button v-if="currentStep === 2" type="submit" class="submit-btn">Completa Registrazione</button>
        </div>
      </form>
      
      <div class="login-link">
        <p>Hai già un account? <router-link to="/login">Accedi qui</router-link></p>
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
import { reactive, ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const currentStep = ref(1);

// Snackbar state
const snackbar = reactive({
  show: false,
  message: '',
  type: 'success' // 'success' o 'error'
});

const showSnackbar = (message, type = 'success') => {
  snackbar.message = message;
  snackbar.type = type;
  snackbar.show = true;
  
  setTimeout(() => {
    snackbar.show = false;
  }, 4000); // Nasconde dopo 4 secondi
};

// Colori disponibili per gli avatar
const avatarColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DFE6E9', '#74B9FF', '#A29BFE', '#FD79A8', '#FDCB6E',
    '#6C5CE7', '#00B894', '#E17055', '#0984E3', '#D63031'
];

// Funzione per generare un colore casuale dall'array
const getRandomColor = () => {
    return avatarColors[Math.floor(Math.random() * avatarColors.length)];
};

const form = reactive({
  // Step 1: Dati account
  email: '',
  password: '',
  confirmPassword: '',
  // Step 2: Dati profilo
  nome: '',
  cognome: '',
  jobTitle: '',
  team: '',
  avatarColor: getRandomColor() // Colore generato automaticamente
});

const nextStep = () => {
  // Validazione step 1
  if (!form.email || !form.password || !form.confirmPassword) {
    showSnackbar('Per favore, compila tutti i campi.', 'error');
    return;
  }
  
  if (form.password !== form.confirmPassword) {
    showSnackbar('Le password non coincidono.', 'error');
    return;
  }
  
  if (form.password.length < 6) {
    showSnackbar('La password deve essere di almeno 6 caratteri.', 'error');
    return;
  }
  
  currentStep.value = 2;
};

const previousStep = () => {
  currentStep.value = 1;
};

const handleSubmit = () => {
  if (currentStep.value === 1) {
    nextStep();
  } else {
    handleRegister();
  }
};

const handleRegister = async () => {
  // Validazione step 2
  if (!form.nome || !form.cognome || !form.jobTitle || !form.team) {
    showSnackbar('Per favore, compila tutti i campi.', 'error');
    return;
  }
  
  // Prepara i dati per la registrazione
  const registrationData = {
    username: form.email.split('@')[0],
    email: form.email,
    password: form.password,
    nome: form.nome,
    cognome: form.cognome,
    jobTitle: form.jobTitle,
    team: form.team,
    avatar: form.avatarColor
  };
  
  try {
    await authStore.register(
      registrationData.username,
      registrationData.email,
      registrationData.password,
      registrationData.nome,
      registrationData.cognome,
      registrationData.jobTitle,
      registrationData.team,
      registrationData.avatar
    );
    
    // Se la registrazione ha successo, lo store gestirà il redirect e la notifica
  } catch (error) {
    // Gestione errori
    const errorMessage = error.response?.data?.message || 'Errore durante la registrazione. Riprova.';
    showSnackbar(errorMessage, 'error');
  }
};
</script>

<style scoped>
.register-page-wrapper {
    margin: 0;
    font-family: 'Inter', sans-serif;
    color: #333;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #6a0dad;
    background-image: linear-gradient(rgba(75, 0, 130, 0.85), rgba(75, 0, 130, 0.85)), url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1950&q=80');
    background-size: cover;
    background-position: center;
}

.register-container {
    background-color: white;
    padding: 40px;
    border-radius: 24px;
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 420px;
    box-sizing: border-box;
    text-align: center;
    margin: 20px;
}

h1 {
    margin: 0 0 10px;
    font-size: 26px;
    font-weight: 700;
    color: #1a1a1a;
}

.register-container p {
    margin: 0 0 25px;
    font-size: 15px;
    color: #888;
}

.step-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 0 30px;
}

.step {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 16px;
    background-color: #e9ecef;
    color: #6c757d;
    transition: all 0.3s;
}

.step.active {
    background-color: #4B0082;
    color: white;
}

.step.completed {
    background-color: #28a745;
    color: white;
}

.step-line {
    width: 60px;
    height: 2px;
    background-color: #e9ecef;
    transition: all 0.3s;
}

.step-line.completed {
    background-color: #28a745;
}

.step-content {
    animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateX(20px); }
    to { opacity: 1; transform: translateX(0); }
}

.form-group {
    margin-bottom: 20px;
    text-align: left;
}

.form-group label {
    display: block;
    font-size: 13px;
    color: #555;
    margin-bottom: 8px;
    font-weight: 500;
}

.form-group input,
.form-group select {
    width: 100%;
    padding: 14px;
    border: 1px solid #ddd;
    border-radius: 10px;
    font-size: 14px;
    font-family: 'Inter', sans-serif;
    box-sizing: border-box;
    transition: border-color 0.3s, box-shadow 0.3s;
    background-color: white;
}

.form-group input:focus,
.form-group select:focus {
    outline: none;
    border-color: #4B0082;
    box-shadow: 0 0 0 3px rgba(75, 0, 130, 0.1);
}

.submit-btn {
    width: 100%;
    padding: 16px;
    background-color: #4B0082;
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    transition: background-color 0.3s, transform 0.2s;
    margin-bottom: 25px;
}

.submit-btn:hover {
    background-color: #6a0dad;
    transform: translateY(-2px);
}

.button-group {
    display: flex;
    gap: 12px;
    margin-bottom: 25px;
}

.secondary-btn {
    flex: 1;
    padding: 16px;
    background-color: #6c757d;
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    transition: background-color 0.3s, transform 0.2s;
}

.secondary-btn:hover {
    background-color: #5a6268;
    transform: translateY(-2px);
}

.submit-btn {
    flex: 1;
}

.login-link {
    text-align: center;
}

.login-link p {
    margin: 0;
    font-size: 14px;
    color: #666;
}

.login-link a {
    color: #4B0082;
    text-decoration: none;
    font-weight: 500;
}

.login-link a:hover {
    text-decoration: underline;
}

/* Snackbar Styles */
.snackbar {
  position: fixed;
  bottom: 32px;
  right: 32px;
  min-width: 300px;
  max-width: 400px;
  padding: 16px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 6px rgba(0, 0, 0, 0.1);
  z-index: 9999;
  backdrop-filter: blur(10px);
}

.snackbar.success {
  background-color: #10b981;
  color: white;
}

.snackbar.error {
  background-color: #ef4444;
  color: white;
}

.snackbar i {
  font-size: 20px;
  flex-shrink: 0;
}

.snackbar span {
  flex: 1;
  line-height: 1.4;
}

/* Animazioni Snackbar */
.snackbar-enter-active {
  animation: slideInRight 0.4s ease-out;
}

.snackbar-leave-active {
  animation: slideOutRight 0.3s ease-in;
}

@keyframes slideInRight {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOutRight {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(400px);
    opacity: 0;
  }
}
</style>