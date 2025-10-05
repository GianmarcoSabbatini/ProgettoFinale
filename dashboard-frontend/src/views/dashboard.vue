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
        <div class="notification-container">
          <i @click="toggleNotifications" class="fas fa-bell action-icon" :class="{ 'has-notifications': notifications.length > 0 }"></i>
          <span v-if="notifications.length > 0" class="notification-badge">{{ notifications.length }}</span>
          
          <!-- Dropdown Notifiche -->
          <transition name="dropdown">
            <div v-if="showNotifications" class="notifications-dropdown">
              <div class="notifications-header">
                <h3>Notifiche</h3>
                <button @click="clearAllNotifications" class="clear-all-btn">Cancella tutto</button>
              </div>
              <div class="notifications-list">
                <div v-if="notifications.length === 0" class="no-notifications">
                  <i class="fas fa-inbox"></i>
                  <p>Nessuna notifica</p>
                </div>
                <div 
                  v-for="notification in notifications" 
                  :key="notification.id" 
                  class="notification-item"
                  :class="'notification-' + notification.type"
                >
                  <div class="notification-icon">
                    <i :class="getNotificationIcon(notification.type)"></i>
                  </div>
                  <div class="notification-content">
                    <div class="notification-sender">{{ notification.sender }}</div>
                    <div class="notification-message">{{ notification.message }}</div>
                    <div class="notification-time">{{ notification.time }}</div>
                  </div>
                  <button @click="removeNotification(notification.id)" class="remove-notification">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>
            </div>
          </transition>
        </div>
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
                <div class="avatar" :style="{ backgroundColor: getAvatarColor(message.author) }">
                  {{ getAuthorInitials(message.author) }}
                </div>
                <div>
                    <strong>{{ message.author }}</strong>
                    <small>{{ formatDate(message.created_at) }}</small>
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
              <span>{{ isEditing ? 'Salva le modifiche' : 'Modifica' }}</span>
            </button>
          </div>
          <div class="avatar-circle" :style="{ backgroundColor: user.avatar || '#4ECDC4' }">
            {{ getInitials(user.nome, user.cognome) }}
          </div>
          <h3 class="user-name">{{ user.nome }} {{ user.cognome }}</h3>
          <p class="user-email">{{ user.email }}</p>
          
          <!-- Divider -->
          <div class="profile-divider"></div>
          
          <!-- Modalità visualizzazione -->
          <div v-if="!isEditing" class="profile-details">
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

// Sistema Notifiche
const showNotifications = ref(false);
const notifications = ref([]);
let notificationIdCounter = 1;

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value;
};

const addNotification = (sender, message, type = 'info') => {
  const now = new Date();
  const timeString = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  
  notifications.value.unshift({
    id: notificationIdCounter++,
    sender: sender,
    message: message,
    time: timeString,
    type: type // 'info', 'success', 'warning', 'message'
  });
};

const removeNotification = (id) => {
  notifications.value = notifications.value.filter(n => n.id !== id);
};

const clearAllNotifications = () => {
  notifications.value = [];
};

const getNotificationIcon = (type) => {
  switch(type) {
    case 'success': return 'fas fa-check-circle';
    case 'warning': return 'fas fa-exclamation-triangle';
    case 'message': return 'fas fa-envelope';
    default: return 'fas fa-info-circle';
  }
};

// Funzione per formattare la data
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Oggi';
  } else if (diffDays === 1) {
    return 'Ieri';
  } else if (diffDays < 7) {
    return `${diffDays} giorni fa`;
  } else {
    return date.toLocaleDateString('it-IT');
  }
};

// Funzione per ottenere le iniziali
const getInitials = (nome, cognome) => {
    if (!nome || !cognome) return '';
    return (nome.charAt(0) + cognome.charAt(0)).toUpperCase();
};

// Funzione per ottenere le iniziali dall'autore del messaggio
const getAuthorInitials = (author) => {
  const authorMap = {
    'SISTEMA': 'SY',
    'ADMIN': 'AD',
    'HR': 'HR',
    'Sistema': 'SY',
    'Admin': 'AD'
  };
  
  // Se è un autore speciale, usa la mappa
  if (authorMap[author]) {
    return authorMap[author];
  }
  
  // Altrimenti, estrai iniziali da nome e cognome
  const parts = author.split(' ');
  if (parts.length >= 2) {
    // Prendi prima lettera del nome e prima lettera del cognome
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
  
  // Se è una singola parola, prendi le prime 2 lettere
  return author.substring(0, 2).toUpperCase();
};

// Funzione per ottenere il colore avatar basato sull'autore
const getAvatarColor = (author) => {
  const colorMap = {
    'SISTEMA': '#6366f1',    // Indaco (sistema tecnico)
    'Sistema': '#6366f1',
    'ADMIN': '#ef4444',      // Rosso (amministrativo)
    'Admin': '#ef4444',
    'HR': '#10b981',         // Verde (risorse umane)
    'Hr': '#10b981',
    'Pietro Rossi': '#f59e0b',  // Arancione
    'Flora Morelli': '#ec4899'  // Rosa
  };
  
  return colorMap[author] || '#8b5cf6'; // Viola di default
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
      
      // Aggiungi notifica nel sistema
      addNotification('SISTEMA', 'Il tuo profilo è stato aggiornato con successo', 'success');
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
    console.log('Messaggi ricevuti:', messages.value);

    const profileResponse = await axios.get('http://localhost:3001/api/profile', {
        headers: {
            'Authorization': `Bearer ${authStore.token}`
        }
    });
    user.value = profileResponse.data.profile;
    
    // Aggiungi notifiche di esempio
    addNotification('SISTEMA', 'Benvenuto nella dashboard aziendale!', 'info');
    addNotification('HR', 'Ricordati di completare il tuo profilo con Job Title e Team', 'warning');
    addNotification('ADMIN', 'Nuove policy aziendali disponibili nella sezione Documenti', 'message');
  } catch (error) {
    console.error("Errore nel caricamento dei dati:", error);
  }
});
</script>

<style scoped>
/* Stili della Dashboard */
#app-container {
  width: 100%;
  min-height: 100vh;
  background-color: #fafafb;
  font-family: 'DM Sans', sans-serif;
}
.main-header {
  display: flex;
  align-items: center;
  padding: 1rem 2rem;
  background-color: #ffffff;
  border-bottom: 1px solid #e0e0e0;
}
.logo { font-size: 1.5rem; font-weight: bold; }
.main-nav { margin: 0 auto; display: flex; gap: 1.5rem; }
.nav-link { text-decoration: none; color: #777; font-weight: 500; }
.nav-link.active { color: #333; }
.header-actions { display: flex; align-items: center; gap: 1.5rem; font-size: 1.2rem; color: #777; }

/* Sistema Notifiche */
.notification-container {
  position: relative;
}

.action-icon {
  background-color: #fafafb;
  padding: 0.6rem;
  border-radius: 100%;
  border: 1px solid #e7e7ee;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.action-icon.has-notifications {
  animation: bellRing 2s ease-in-out infinite;
}

@keyframes bellRing {
  0%, 100% { transform: rotate(0deg); }
  10%, 30% { transform: rotate(-10deg); }
  20%, 40% { transform: rotate(10deg); }
}

.notification-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: #ef4444;
  color: white;
  font-size: 0.7rem;
  font-weight: bold;
  padding: 0.15rem 0.4rem;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

.notifications-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 380px;
  max-height: 500px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  z-index: 1000;
  overflow: hidden;
}

.notifications-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e0e0e0;
  background-color: #fafafb;
}

.notifications-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

.clear-all-btn {
  background: none;
  border: none;
  color: #4b00e9;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s;
}

.notifications-list {
  max-height: 400px;
  overflow-y: auto;
}

.no-notifications {
  text-align: center;
  padding: 3rem 1rem;
  color: #999;
}

.no-notifications i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #ddd;
}

.no-notifications p {
  margin: 0;
  font-size: 0.95rem;
}

.notification-item {
  display: flex;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f5f5f5;
  transition: background-color 0.2s;
  cursor: pointer;
}

.notification-item:hover {
  background-color: #fafafb;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.notification-success .notification-icon {
  background-color: #d1fae5;
  color: #10b981;
}

.notification-warning .notification-icon {
  background-color: #fef3c7;
  color: #f59e0b;
}

.notification-message .notification-icon {
  background-color: #dbeafe;
  color: #3b82f6;
}

.notification-info .notification-icon {
  background-color: #e0e7ff;
  color: #6366f1;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-sender {
  font-weight: 600;
  font-size: 0.9rem;
  color: #333;
  margin-bottom: 0.25rem;
}

.notification-message {
  font-size: 0.85rem;
  color: #44444f;
  line-height: 1.4;
  margin-bottom: 0.25rem;
}

.notification-time {
  font-size: 0.75rem;
  color: #999;
}

.remove-notification {
  flex-shrink: 0;
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 1rem;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.remove-notification:hover {
  background-color: #fee;
  color: #ef4444;
}

/* Animazione Dropdown */
.dropdown-enter-active, .dropdown-leave-active {
  transition: all 0.3s ease;
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.action-icon:hover {
  background-color: #e8e6ff;
}
.logout-button { 
  background: none; 
  border: none; 
  cursor: pointer; 
  color: #777; 
  font-size: 1.2rem; 
  padding: 0; 
}
.dashboard-content { padding: 2rem; max-width: 1400px; margin: 0 auto; }
.quick-actions { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem; margin-bottom: 2rem; }
.action-card {
  flex: 1;
  background-color: #e8e1f9;
  border: 2px solid #e8e1f9;
  border-radius: 16px;
  padding: 1.5rem 1rem;
  text-align: center;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}
.action-card:hover { border: 2px solid #4b00e9; transition: ease-in 0.2s; }
.action-card .icon { display: block; font-size: 1.5rem; margin-bottom: 0.5rem; color: #4b00e9; }
.action-card span { font-family: 'DM Sans', sans-serif; color: #4b00e9; }
.main-panel { 
  display: grid; 
  grid-template-columns: 2fr 1fr; 
  gap: 2rem; 
  align-items: start;
}
h2 { font-size: 1.2rem; margin-bottom: 1.5rem; }
.message-board, .user-profile {
  background-color: #ffffff;
  border-radius: 12px;
  border: 1px solid #e7e7ee;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.message-board h2 {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #f5f5f5;
}

.message-item { 
  padding: 1.25rem;
  margin-bottom: 0.75rem;
  background-color: #fafafb;
  border-radius: 10px;
  border: 1px solid #f0f0f0;
  transition: all 0.3s ease;
}

.message-item:hover {
  background-color: #f5f5ff;
  border-color: #e8e6ff;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.08);
}

.message-item:last-child { 
  margin-bottom: 0;
}

.message-author { 
  display: flex; 
  align-items: center; 
  gap: 1rem; 
  margin-bottom: 0.75rem; 
}

.avatar { 
  width: 48px; 
  height: 48px; 
  border-radius: 50%; 
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 0.95rem;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  letter-spacing: 0.5px;
}

.message-author > div { 
  display: flex; 
  flex-direction: column;
  gap: 0.15rem;
}

.message-author strong {
  color: #333;
  font-size: 0.95rem;
  font-weight: 600;
}

.message-author small { 
  color: #999; 
  font-size: 0.8rem;
  font-weight: 400;
}

.message-title {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin: 0.5rem 0 0.4rem 0;
}

.message-content { 
  color: #44444f; 
  line-height: 1.6; 
  margin: 0;
  font-size: 0.9rem;
  padding-left: 0;
}

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
  color: #333;
}

.user-email {
  font-size: 0.9rem;
  color: #777;
  text-align: center;
  margin-bottom: 0;
}

.profile-divider {
  border-bottom: 1px solid #e0e0e0;
  padding: 1rem 0;
  margin-bottom: 1rem;
}

.profile-details {
  text-align: left;
}

.user-job, .user-team {
  font-size: 0.9rem;
  color: #333;
  text-align: left;
  margin: 0.5rem 0;
  line-height: 1.6;
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
  padding: 0.6rem 1.2rem;
  background-color: transparent;
  color: #4b00e9;
  border: 2px solid #4b00e9;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.edit-btn i {
  font-size: 1rem;
}

.edit-btn span {
  text-decoration: underline;
}

.edit-btn:hover {
  background-color: #4b00e9;
  color: white;
}

.edit-btn:hover span {
  text-decoration: none;
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
  color: #333;
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
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
  border-bottom: 1px solid #e0e0e0;
  font-size: 0.9rem;
  gap: 0.25rem;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label { 
  color: #777; 
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-value {
  color: #333;
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