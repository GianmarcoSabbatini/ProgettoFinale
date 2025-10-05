<template>
  <div class="login-page-wrapper">
    <div class="login-container">
      <h1>Azienda Intranet</h1>
      <p>Qui scrivi un testo che vuoi tu.</p>
      
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

const handleLogin = () => {
  if (!form.email || !form.password) {
      alert('Per favore, inserisci email e password.');
      return;
  }
  authStore.login(form.email, form.password);
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
    background-color: #4B0082;
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    transition: background-color 0.3s, transform 0.2s;
}
.submit-btn:hover {
    background-color: #6a0dad;
    transform: translateY(-2px);
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
</style>