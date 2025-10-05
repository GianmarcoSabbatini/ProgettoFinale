import { defineStore } from 'pinia';
import axios from 'axios';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useNotificationStore } from './notification';

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

    async function register(username, email, password, nome, cognome, jobTitle, team, avatar) {
        const notificationStore = useNotificationStore();
        
        try {
            const registrationData = { 
                username, 
                email, 
                password,
                nome,
                cognome,
                jobTitle,
                team,
                avatar
            };
            
            const response = await axios.post('http://localhost:3001/api/register', registrationData);
            if (response.data.success) {
                setToken(response.data.token);
                
                // Naviga alla dashboard e mostra notifica di successo
                router.push({ name: 'Dashboard' });
                
                // Mostra la notifica dopo un piccolo delay per dare tempo al componente di montarsi
                setTimeout(() => {
                    notificationStore.showNotification('Registrazione completata con successo! Benvenuto nella dashboard.', 'success');
                }, 100);
            }
        } catch (error) {
            console.error('Errore di registrazione:', error.response?.data?.message || error.message);
            // Rilancia l'errore in modo che possa essere gestito dal componente
            throw error;
        }
    }

    function logout() {
        clearToken();
        // Usa il router per reindirizzare al login
        router.push({ name: 'Login' });
    }

    return { token, isAuthenticated, login, register, logout };
});