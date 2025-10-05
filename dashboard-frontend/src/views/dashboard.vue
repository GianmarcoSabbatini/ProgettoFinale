<template>
  <div id="app-container">
    <header class="main-header">
      <div class="logo">Azienda</div>
      <nav class="main-nav">
        <a href="#" class="nav-link active">Home</a>
        <a href="#" class="nav-link">Documenti</a>
        <a href="#" class="nav-link">Assistenza</a>
        <a href="#" class="nav-link">Impostazioni</a>
      </nav>
      <div class="header-actions">
        <i class="fas fa-search action-icon"></i>
        <button @click="handleLogout" class="logout-button" title="Logout">
            <i class="fas fa-sign-out-alt action-icon"></i>
        </button>
      </div>
    </header>

    <main class="dashboard-content">
      <section class="quick-actions">
        <button class="action-card">
          <i class="fas fa-file-alt icon"></i>
          <span>Documenti</span>
        </button>
        <button class="action-card">
          <i class="fas fa-users icon"></i>
          <span>HR Policies</span>
        </button>
        <button class="action-card">
          <i class="fas fa-calendar-alt icon"></i>
          <span>Eventi aziendali</span>
        </button>
        <button class="action-card">
          <i class="fas fa-clock icon"></i>
          <span>Timesheet</span>
        </button>
        <button class="action-card">
          <i class="fas fa-wallet icon"></i>
          <span>Rimborso spese</span>
        </button>
      </section>

      <div class="main-panel">
        <section class="message-board">
          <h2>Ultimi messaggi dalla Bacheca</h2>
          <div v-for="message in messages" :key="message.id" class="message-item">
            <div class="message-author">
                <div class="avatar"></div>
                <div>
                    <strong>{{ message.author }}</strong>
                    <small>{{ message.timestamp }}</small>
                </div>
            </div>
            <p class="message-content">{{ message.content }}</p>
          </div>
        </section>

        <aside class="user-profile">
          <div class="profile-header">
            <h2>Su di te</h2>
            <button @click="toggleEditMode" class="edit-btn">
              <i :class="isEditing ? 'fas fa-save' : 'fas fa-edit'"></i> 
              {{ isEditing ? 'Salva le modifiche' : 'Modifica' }}
            </button>
          </div>
          <div class="avatar-circle" :style="{ backgroundColor: user.avatar || '#4ECDC4' }">
            {{ getInitials(user.nome, user.cognome) }}
          </div>
          <h3 class="user-name">{{ user.nome }} {{ user.cognome }}</h3>
          <p class="user-email">{{ user.email }}</p>
          
          <!-- Modalità visualizzazione -->
          <div v-if="!isEditing">
            <p v-if="user.job_title" class="user-job"><strong>Job Title:</strong> {{ user.job_title }}</p>
            <p v-if="user.team" class="user-team"><strong>Team:</strong> {{ user.team }}</p>
          </div>
          
          <!-- Modalità modifica -->
          <div v-else class="edit-form">
            <div class="form-group">
              <label>Job Title:</label>
              <input v-model="editForm.job_title" type="text" class="form-input" placeholder="Inserisci il tuo ruolo" />
            </div>
            <div class="form-group">
              <label>Team:</label>
              <select v-model="editForm.team" class="form-input">
                <option value="">Seleziona un team</option>
                <option value="Design">Design</option>
                <option value="Development">Development</option>
                <option value="Marketing">Marketing</option>
                <option value="HR">HR</option>
              </select>
            </div>
          </div>
        </aside>
      </div>
    </main>

    <!-- Snackbar globale -->
    <transition name="snackbar">
      <div v-if="notificationStore.notification.show" :class="['snackbar', notificationStore.notification.type]">
        <i :class="notificationStore.notification.type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'"></i>
        <span>{{ notificationStore.notification.message }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notification';

const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const messages = ref([]);
const user = ref({});
const isEditing = ref(false);
const editForm = ref({
  job_title: '',
  team: ''
});

// Funzione per ottenere le iniziali
const getInitials = (nome, cognome) => {
    if (!nome || !cognome) return '';
    return (nome.charAt(0) + cognome.charAt(0)).toUpperCase();
};

const toggleEditMode = async () => {
  if (isEditing.value) {
    // Salva le modifiche
    await saveProfile();
  } else {
    // Entra in modalità modifica
    editForm.value.job_title = user.value.job_title || '';
    editForm.value.team = user.value.team || '';
    isEditing.value = true;
  }
};

const saveProfile = async () => {
  try {
    const response = await axios.put('http://localhost:3001/api/profile', {
      job_title: editForm.value.job_title,
      team: editForm.value.team
    }, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    });
    
    if (response.data.success) {
      // Aggiorna i dati locali
      user.value.job_title = editForm.value.job_title;
      user.value.team = editForm.value.team;
      isEditing.value = false;
      
      // Mostra notifica di successo
      notificationStore.showNotification('Profilo aggiornato con successo!', 'success');
    }
  } catch (error) {
    console.error('Errore nel salvataggio del profilo:', error);
    notificationStore.showNotification('Errore nel salvataggio delle modifiche. Riprova.', 'error');
  }
};

const handleLogout = () => {
    authStore.logout();
};

onMounted(async () => {
  try {
    const messagesResponse = await axios.get('http://localhost:3001/api/messages');
    messages.value = messagesResponse.data.messages || [];

    const profileResponse = await axios.get('http://localhost:3001/api/profile', {
        headers: {
            'Authorization': `Bearer ${authStore.token}`
        }
    });
    user.value = profileResponse.data.profile;
  } catch (error) {
    console.error("Errore nel caricamento dei dati:", error);
  }
});
</script>

<style scoped>
/* Stili della Dashboard */
:root {
  --card-background: #ffffff;
  --primary-purple: #e8e6ff;
  --text-color: #333;
  --text-light: #777;
  --border-color: #e0e0e0;
}
#app-container {
  width: 100%;
}
.main-header {
  display: flex;
  align-items: center;
  padding: 1rem 2rem;
  background-color: var(--card-background);
  border-bottom: 1px solid var(--border-color);
}
.logo { font-size: 1.5rem; font-weight: bold; }
.main-nav { margin: 0 auto; display: flex; gap: 1.5rem; }
.nav-link { text-decoration: none; color: var(--text-light); font-weight: 500; }
.nav-link.active { color: var(--text-color); }
.header-actions { display: flex; align-items: center; gap: 1.5rem; font-size: 1.2rem; color: var(--text-light); }
.logout-button { background: none; border: none; cursor: pointer; color: var(--text-light); font-size: 1.2rem; padding: 0; }
.dashboard-content { padding: 2rem; max-width: 1400px; margin: 0 auto; }
.quick-actions { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem; margin-bottom: 2rem; }
.action-card {
  flex: 1;
  background-color: var(--primary-purple);
  border: none;
  border-radius: 12px;
  padding: 1.5rem 1rem;
  text-align: center;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}
.action-card:hover { transform: translateY(-5px); box-shadow: 0 8px 15px rgba(0,0,0,0.08); }
.action-card .icon { display: block; font-size: 1.5rem; margin-bottom: 0.5rem; color: #4B0082; }
.main-panel { display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; }
h2 { font-size: 1.2rem; margin-bottom: 1.5rem; }
.message-board, .user-profile {
  background-color: var(--card-background);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}
.message-item { border-bottom: 1px solid var(--border-color); padding: 1rem 0; }
.message-item:last-child { border-bottom: none; }
.message-author { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; }
.avatar { width: 40px; height: 40px; border-radius: 50%; background-color: #ccc; }
.message-author div { display: flex; flex-direction: column; }
.message-author small { color: var(--text-light); font-size: 0.8rem; }
.message-content { color: var(--text-light); line-height: 1.5; margin: 0; }

.avatar-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  font-weight: bold;
  color: white;
  margin: 0 auto 1rem auto;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.user-name {
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0.5rem 0 0.25rem 0;
  text-align: center;
  color: var(--text-color);
}

.user-email {
  font-size: 0.9rem;
  color: var(--text-light);
  text-align: center;
  margin-bottom: 1.5rem;
}

.user-job, .user-team {
  font-size: 0.85rem;
  color: var(--text-color);
  text-align: center;
  margin: 0.3rem 0;
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.profile-header h2 {
  margin: 0;
}

.edit-btn {
  padding: 0.5rem 1rem;
  background-color: #4ECDC4;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.3s;
}

.edit-btn:hover {
  background-color: #45b8b0;
}

.edit-form {
  margin-top: 1.5rem;
  padding: 1rem;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.9rem;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #4ECDC4;
}

.profile-details .detail-item {
  display: flex;
  flex-direction: column;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border-color);
  font-size: 0.9rem;
  gap: 0.25rem;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label { 
  color: var(--text-light); 
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-value {
  color: var(--text-color);
  font-weight: 500;
  line-height: 1.4;
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

@media (max-width: 900px) {
  .main-panel { grid-template-columns: 1fr; }
  .quick-actions { grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); }
}
</style>