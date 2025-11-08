<template>
  <div class="login-page-wrapper">
    <div class="login-container">
      <h1>CoreTeam Digital</h1>
      <p>La tua piattaforma aziendale integrata.</p>
      
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="email">Indirizzo email</label>
          <input type="email" id="email" v-model="form.email" required>
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" v-model="form.password" required>
        </div>
        <div class="forgot-password">
            <a href="#">Password dimenticata?</a>
        </div>
        <button type="submit" class="submit-btn">ENTRA NEL PORTALE</button>
      </form>
      
      <div class="register-link">
        <p>Non hai un account? <router-link to="/register">Registrati qui</router-link></p>
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
import { reactive } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

const form = reactive({
  email: 'johndoe@example.com', // Pre-compilato per comodità
  password: 'password123',      // Pre-compilato per comodità
});

// Snackbar state
const snackbar = reactive({
  show: false,
  message: '',
  type: 'error' // 'success' o 'error'
});

const showSnackbar = (message, type = 'error') => {
  snackbar.message = message;
  snackbar.type = type;
  snackbar.show = true;
  
  setTimeout(() => {
    snackbar.show = false;
  }, 4000); // Nasconde dopo 4 secondi
};

const handleLogin = async () => {
  if (!form.email || !form.password) {
      showSnackbar('Per favore, inserisci email e password.', 'error');
      return;
  }
  
  try {
    await authStore.login(form.email, form.password);
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Credenziali non valide. Riprova.';
    showSnackbar(errorMessage, 'error');
  }
};
</script>

<style scoped>
/* Stili del Login.vue */
.login-page-wrapper {
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
.login-container {
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
.login-container p {
    margin: 0 0 35px;
    font-size: 15px;
    color: #888;
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
.forgot-password {
    text-align: right;
    margin-top: -10px;
    margin-bottom: 25px;
}
.forgot-password a {
    color: #555;
    font-size: 13px;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.3s;
}
.forgot-password a:hover {
    color: #4B0082;
}
.submit-btn {
    width: 100%;
    padding: 16px;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}

.submit-btn:hover {
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.submit-btn:active {
    transform: translateY(0);
}
.register-link {
    text-align: center;
    margin-top: 25px;
}
.register-link p {
    margin: 0;
    font-size: 14px;
    color: #666;
}
.register-link a {
    color: #4B0082;
    text-decoration: none;
    font-weight: 500;
}
.register-link a:hover {
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
@media (max-width: 768px) {  .login-container { padding: 1rem; }  .login-box { padding: 2rem 1.5rem; max-width: 100%; }  .login-title { font-size: 1.8rem; }  .login-subtitle { font-size: 0.9rem; }  .input-group label { font-size: 0.85rem; }  .input-group input { padding: 0.85rem 1rem; font-size: 0.95rem; }  .login-btn { padding: 0.85rem; font-size: 0.95rem; }}@media (max-width: 480px) {  .login-box { padding: 1.5rem 1rem; }  .login-title { font-size: 1.5rem; }  .login-subtitle { font-size: 0.85rem; }  .snackbar { width: calc(100% - 2rem); left: 1rem; right: 1rem; }}</style>
