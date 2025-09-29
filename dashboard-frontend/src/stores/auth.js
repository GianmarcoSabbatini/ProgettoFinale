import { defineStore } from 'pinia';
import axios from 'axios';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

export const useAuthStore = defineStore('auth', () => {
    // Inizializza il token dal localStorage per mantenere il login
    const token = ref(localStorage.getItem('token'));
    const router = useRouter();

    // Una proprietà "computed" per sapere se l'utente è autenticato
    const isAuthenticated = computed(() => !!token.value);

    function setToken(newToken) {
        localStorage.setItem('token', newToken);
        token.value = newToken;
    }

    function clearToken() {
        localStorage.removeItem('token');
        token.value = null;
    }

    async function login(email, password) {
        try {
            const response = await axios.post('http://localhost:3001/api/login', { email, password });
            if (response.data.success) {
                setToken(response.data.token);
                // Usa il router per reindirizzare alla dashboard
                router.push({ name: 'Dashboard' }); 
            }
        } catch (error) {
            console.error('Errore di login:', error.response?.data?.message || error.message);
            alert('Credenziali non valide!');
        }
    }

    async function register(name, email, password) {
        try {
            const response = await axios.post('http://localhost:3001/api/register', { name, email, password });
            if (response.data.success) {
                setToken(response.data.token);
                alert('Registrazione completata con successo!');
                // Usa il router per reindirizzare alla dashboard
                router.push({ name: 'Dashboard' }); 
            }
        } catch (error) {
            console.error('Errore di registrazione:', error.response?.data?.message || error.message);
            alert(error.response?.data?.message || 'Errore durante la registrazione!');
        }
    }

    async function registerWithProfile(registrationData) {
        try {
            const response = await axios.post('http://localhost:3001/api/register', registrationData);
            if (response.data.success) {
                setToken(response.data.token);
                alert('Registrazione completata con successo!');
                // Usa il router per reindirizzare alla dashboard
                router.push({ name: 'Dashboard' }); 
            }
        } catch (error) {
            console.error('Errore di registrazione:', error.response?.data?.message || error.message);
            alert(error.response?.data?.message || 'Errore durante la registrazione!');
        }
    }

    function logout() {
        clearToken();
        // Usa il router per reindirizzare al login
        router.push({ name: 'Login' });
    }

    return { token, isAuthenticated, login, register, registerWithProfile, logout };
});