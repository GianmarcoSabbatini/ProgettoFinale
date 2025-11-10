import { createApp } from 'vue';
import { createPinia } from 'pinia';
import axios from 'axios';

import App from './App.vue';
import router from './router';

// Importa Font Awesome globalmente
import '@fortawesome/fontawesome-free/css/all.css';

// Configurazione globale Axios
axios.defaults.timeout = 10000; // 10 secondi timeout
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Interceptor per gestire errori di rete
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('Timeout della richiesta');
    } else if (!error.response) {
      console.error('Errore di rete - server non raggiungibile');
    }
    return Promise.reject(error);
  }
);

const app = createApp(App);

// Error Handler Globale
app.config.errorHandler = (err, instance, info) => {
  if (import.meta.env.DEV) {
    console.error('Errore globale catturato:', err);
    console.error('Componente:', instance);
    console.error('Info:', info);
  }
  // In produzione potresti inviare a un servizio di tracking errori (es. Sentry)
};

app.use(createPinia());
app.use(router);

app.mount('#app');
