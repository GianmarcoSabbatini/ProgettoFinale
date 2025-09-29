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
            <label for="name">Nome e cognome</label>
            <input type="text" id="name" v-model="form.name" required>
          </div>
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
            <label for="department">Dipartimento</label>
            <input type="text" id="department" v-model="form.department" placeholder="es. Team Sviluppo Front-End" required>
          </div>
          <div class="form-group">
            <label for="role">Posizione/ruolo</label>
            <input type="text" id="role" v-model="form.role" placeholder="es. Tech Lead" required>
          </div>
          <div class="form-group">
            <label for="manager">Responsabile</label>
            <input type="text" id="manager" v-model="form.manager" placeholder="es. Pietro Rossi" required>
          </div>
          <div class="form-group">
            <label for="project">Progetti</label>
            <input type="text" id="project" v-model="form.project" placeholder="es. Hero Wars Mobile Unity" required>
          </div>
          <div class="form-group">
            <label for="birthDate">Data di nascita</label>
            <input type="text" id="birthDate" v-model="form.birthDate" placeholder="es. 15 gennaio 1991" required>
          </div>
          <div class="form-group">
            <label for="positionLocation">Posizione dell'ufficio</label>
            <input type="text" id="positionLocation" v-model="form.positionLocation" placeholder="es. Milano" required>
          </div>
          <div class="form-group">
            <label for="education">Istruzione</label>
            <input type="text" id="education" v-model="form.education" placeholder="es. Laurea in Informatica" required>
          </div>
          <div class="form-group">
            <label for="courses">Corsi e formazione</label>
            <input type="text" id="courses" v-model="form.courses" placeholder="es. React Certification 2023">
          </div>
          <div class="form-group">
            <label for="certifications">Certificati</label>
            <input type="text" id="certifications" v-model="form.certifications" placeholder="es. AWS Certified">
          </div>
          <div class="form-group">
            <label for="languages">Conoscenza delle lingue</label>
            <input type="text" id="languages" v-model="form.languages" placeholder="es. Italiano, Inglese, Spagnolo" required>
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
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const currentStep = ref(1);

const form = reactive({
  // Step 1: Dati account
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  // Step 2: Dati profilo
  department: '',
  role: '',
  manager: '',
  project: '',
  birthDate: '',
  positionLocation: '',
  education: '',
  courses: '',
  certifications: '',
  languages: ''
});

const nextStep = () => {
  // Validazione step 1
  if (!form.name || !form.email || !form.password || !form.confirmPassword) {
    alert('Per favore, compila tutti i campi.');
    return;
  }
  
  if (form.password !== form.confirmPassword) {
    alert('Le password non coincidono.');
    return;
  }
  
  if (form.password.length < 6) {
    alert('La password deve essere di almeno 6 caratteri.');
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

const handleRegister = () => {
  // Validazione step 2
  const requiredFields = ['department', 'role', 'manager', 'project', 'birthDate', 'positionLocation', 'education', 'languages'];
  const missingFields = requiredFields.filter(field => !form[field]);
  
  if (missingFields.length > 0) {
    alert('Per favore, compila tutti i campi obbligatori.');
    return;
  }
  
  // Prepara i dati per la registrazione
  const registrationData = {
    name: form.name,
    email: form.email,
    password: form.password,
    profile: {
      department: form.department,
      role: form.role,
      manager: form.manager,
      project: form.project,
      birthDate: form.birthDate,
      positionLocation: form.positionLocation,
      education: form.education,
      courses: form.courses || 'Nessuno',
      certifications: form.certifications || 'Nessuno',
      languages: form.languages,
      timeInCompany: '0 giorni', // Nuovo utente
      profileImageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80' // Avatar di default
    }
  };
  
  authStore.registerWithProfile(registrationData);
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

.form-group input {
    width: 100%;
    padding: 14px;
    border: 1px solid #ddd;
    border-radius: 10px;
    font-size: 14px;
    font-family: 'Inter', sans-serif;
    box-sizing: border-box;
    transition: border-color 0.3s, box-shadow 0.3s;
}

.form-group input:focus {
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
</style>