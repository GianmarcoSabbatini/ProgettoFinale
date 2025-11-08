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
            <input 
              type="email" 
              id="email" 
              v-model="form.email" 
              @blur="validateEmail"
              :class="{ 'error': emailError }"
              required
            >
            <span v-if="emailError" class="error-message">{{ emailError }}</span>
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <input 
              type="password" 
              id="password" 
              v-model="form.password" 
              @input="validatePassword"
              :class="{ 'error': passwordError }"
              required
            >
            <span v-if="passwordError" class="error-message">{{ passwordError }}</span>
            
            <!-- Indicatori requisiti password -->
            <div class="password-requirements" v-if="form.password">
              <div class="requirement" :class="{ 'met': passwordChecks.length }">
                <i :class="passwordChecks.length ? 'fas fa-check-circle' : 'fas fa-times-circle'"></i>
                Almeno 8 caratteri
              </div>
              <div class="requirement" :class="{ 'met': passwordChecks.uppercase }">
                <i :class="passwordChecks.uppercase ? 'fas fa-check-circle' : 'fas fa-times-circle'"></i>
                Una lettera maiuscola (A-Z)
              </div>
              <div class="requirement" :class="{ 'met': passwordChecks.lowercase }">
                <i :class="passwordChecks.lowercase ? 'fas fa-check-circle' : 'fas fa-times-circle'"></i>
                Una lettera minuscola (a-z)
              </div>
              <div class="requirement" :class="{ 'met': passwordChecks.number }">
                <i :class="passwordChecks.number ? 'fas fa-check-circle' : 'fas fa-times-circle'"></i>
                Un numero (0-9)
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label for="confirmPassword">Conferma password</label>
            <input 
              type="password" 
              id="confirmPassword" 
              v-model="form.confirmPassword" 
              @input="validateConfirmPassword"
              :class="{ 'error': confirmPasswordError }"
              required
            >
            <span v-if="confirmPasswordError" class="error-message">{{ confirmPasswordError }}</span>
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

// Errori di validazione
const emailError = ref('');
const passwordError = ref('');
const confirmPasswordError = ref('');

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
    '#c1121f', '#fb8500', '#2a9d8f', '#023e8a', '#7b2cbf',
    '#ff006e', '#6a994e', '#f08080', '#8f2d56', '#0d00a4'
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

// Computed per verificare i requisiti password
const passwordChecks = computed(() => ({
  length: form.password.length >= 8,
  uppercase: /[A-Z]/.test(form.password),
  lowercase: /[a-z]/.test(form.password),
  number: /[0-9]/.test(form.password)
}));

// Computed per verificare se la password è valida
const isPasswordValid = computed(() => {
  return passwordChecks.value.length && 
         passwordChecks.value.uppercase && 
         passwordChecks.value.lowercase && 
         passwordChecks.value.number;
});

// Funzioni di validazione
const validateEmail = () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!form.email) {
    emailError.value = 'Email obbligatoria';
  } else if (!emailRegex.test(form.email)) {
    emailError.value = 'Formato email non valido';
  } else {
    emailError.value = '';
  }
};

const validatePassword = () => {
  if (!form.password) {
    passwordError.value = 'Password obbligatoria';
  } else if (!isPasswordValid.value) {
    passwordError.value = 'La password non soddisfa tutti i requisiti';
  } else {
    passwordError.value = '';
  }
  
  // Rivalidare anche la conferma password se presente
  if (form.confirmPassword) {
    validateConfirmPassword();
  }
};

const validateConfirmPassword = () => {
  if (!form.confirmPassword) {
    confirmPasswordError.value = 'Conferma password obbligatoria';
  } else if (form.password !== form.confirmPassword) {
    confirmPasswordError.value = 'Le password non coincidono';
  } else {
    confirmPasswordError.value = '';
  }
};

const nextStep = () => {
  // Validazione completa step 1
  validateEmail();
  validatePassword();
  validateConfirmPassword();
  
  if (emailError.value || passwordError.value || confirmPasswordError.value) {
    showSnackbar('Per favore, correggi gli errori nel form.', 'error');
    return;
  }
  
  if (!form.email || !form.password || !form.confirmPassword) {
    showSnackbar('Per favore, compila tutti i campi.', 'error');
    return;
  }
  
  if (!isPasswordValid.value) {
    showSnackbar('La password non soddisfa tutti i requisiti di sicurezza.', 'error');
    return;
  }
  
  if (form.password !== form.confirmPassword) {
    showSnackbar('Le password non coincidono.', 'error');
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
    font-family: 'DM Sans', sans-serif;
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

.form-group input.error,
.form-group select.error {
    border-color: #dc3545;
    background-color: #fff5f5;
}

.form-group input:focus,
.form-group select:focus {
    outline: none;
    border-color: #4B0082;
    box-shadow: 0 0 0 3px rgba(75, 0, 130, 0.1);
}

.form-group input.error:focus {
    border-color: #dc3545;
    box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
}

.error-message {
    display: block;
    color: #dc3545;
    font-size: 12px;
    margin-top: 6px;
    font-weight: 500;
}

/* Password Requirements */
.password-requirements {
    margin-top: 12px;
    padding: 12px;
    background-color: #f8f9fa;
    border-radius: 8px;
    border-left: 3px solid #6c757d;
}

.requirement {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #6c757d;
    margin: 6px 0;
    transition: color 0.3s;
}

.requirement.met {
    color: #28a745;
}

.requirement i {
    font-size: 14px;
}

.requirement .fa-check-circle {
    color: #28a745;
}

.requirement .fa-times-circle {
    color: #dc3545;
}

.button-group {
    display: flex;
    gap: 12px;
    margin-bottom: 25px;
}

/* Stili comuni per entrambi i bottoni */
.submit-btn,
.secondary-btn {
    flex: 1;
    padding: 16px;
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    min-height: 56px;
}

/* Bottone principale (Avanti / Completa Registrazione) - Viola */
.submit-btn {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

.submit-btn:hover {
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.submit-btn:active {
    transform: translateY(0);
}

/* Bottone secondario (Indietro) - Rosso */
.secondary-btn {
    background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
    box-shadow: 0 2px 8px rgba(220, 53, 69, 0.3);
}

.secondary-btn:hover {
    background: linear-gradient(135deg, #c82333 0%, #bd2130 100%);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(220, 53, 69, 0.4);
}

.secondary-btn:active {
    transform: translateY(0);
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
@media (max-width: 768px) {  .register-container { padding: 1rem; }  .register-box { padding: 2rem 1.5rem; max-width: 100%; }  .register-title { font-size: 1.8rem; }  .register-subtitle { font-size: 0.9rem; }  .input-group label { font-size: 0.85rem; }  .input-group input { padding: 0.85rem 1rem; font-size: 0.95rem; }  .register-btn { padding: 0.85rem; font-size: 0.95rem; }}@media (max-width: 480px) {  .register-box { padding: 1.5rem 1rem; }  .register-title { font-size: 1.5rem; }  .register-subtitle { font-size: 0.85rem; }}</style>
