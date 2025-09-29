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
          <h2>Su di te</h2>
          <img :src="user.profileImageUrl" alt="User profile picture" class="profile-picture">
          <div v-if="!isEditing" class="profile-details">
            <div v-for="(value, key) in userDisplayData" :key="key" class="detail-item">
                <span class="detail-label">{{ key }}</span>
                <strong class="detail-value">{{ value }}</strong>
            </div>
          </div>
          
          <!-- Form di modifica -->
          <div v-if="isEditing" class="profile-edit-form">
            <div v-for="(value, key) in userLabels" :key="key" class="edit-item">
              <label :for="key" class="edit-label">{{ value }}</label>
              <input 
                :id="key"
                v-model="editableUser[key]" 
                type="text" 
                class="edit-input"
                :placeholder="value"
              >
            </div>
          </div>
          
          <div class="profile-actions">
            <button v-if="!isEditing" @click="startEditing" class="edit-button">
              <i class="fas fa-pencil-alt"></i> Modifica
            </button>
            <div v-if="isEditing" class="edit-actions">
              <button @click="saveProfile" class="save-button">
                <i class="fas fa-check"></i> Salva
              </button>
              <button @click="cancelEditing" class="cancel-button">
                <i class="fas fa-times"></i> Annulla
              </button>
            </div>
          </div>
        </aside>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const messages = ref([]);
const user = ref({});
const isEditing = ref(false);
const editableUser = ref({});

const userLabels = {
    timeInCompany: 'In azienda da',
    department: 'Dipartimento',
    role: 'Posizione/ruolo',
    manager: 'Responsabile',
    project: 'Progetti',
    birthDate: 'Data di nascita',
    positionLocation: 'Posizione dell\'ufficio',
    education: 'Istruzione',
    courses: 'Corsi e formazione',
    certifications: 'Certificati',
    languages: 'Conoscenza delle lingue'
};

const userDisplayData = computed(() => {
    const displayData = {};
    for (const key in userLabels) {
        if (user.value[key]) {
            displayData[userLabels[key]] = user.value[key];
        }
    }
    return displayData;
});

const handleLogout = () => {
    authStore.logout();
};

const startEditing = () => {
    isEditing.value = true;
    // Copia i dati attuali nel form di modifica
    editableUser.value = { ...user.value };
};

const cancelEditing = () => {
    isEditing.value = false;
    editableUser.value = {};
};

const saveProfile = async () => {
    try {
        const response = await axios.put('http://localhost:3001/api/user/profile', editableUser.value);
        if (response.data.success) {
            user.value = response.data.profile;
            isEditing.value = false;
            alert('Profilo aggiornato con successo!');
        }
    } catch (error) {
        console.error('Errore nell\'aggiornamento del profilo:', error);
        alert('Errore nell\'aggiornamento del profilo');
    }
};

onMounted(async () => {
  try {
    const messagesResponse = await axios.get('http://localhost:3001/api/messages');
    messages.value = messagesResponse.data;

    const userResponse = await axios.get('http://localhost:3001/api/user/profile');
    user.value = userResponse.data;
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
.profile-picture {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 1.5rem;
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

.profile-edit-form {
  margin-bottom: 1rem;
}

.edit-item {
  margin-bottom: 1rem;
}

.edit-label {
  display: block;
  color: var(--text-light);
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
}

.edit-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.9rem;
  font-family: inherit;
  box-sizing: border-box;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.edit-input:focus {
  outline: none;
  border-color: #4B0082;
  box-shadow: 0 0 0 3px rgba(75, 0, 130, 0.1);
}

.profile-actions {
  margin-top: 1.5rem;
}

.edit-button {
  width: 100%;
  padding: 0.8rem;
  background-color: var(--primary-purple);
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
}

.edit-button:hover {
  background-color: #d6d3ff;
  transform: translateY(-1px);
}

.edit-button .fas { margin-right: 0.5rem; }

.edit-actions {
  display: flex;
  gap: 0.75rem;
}

.save-button, .cancel-button {
  flex: 1;
  padding: 0.8rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
}

.save-button {
  background-color: #28a745;
  color: white;
}

.save-button:hover {
  background-color: #218838;
  transform: translateY(-1px);
}

.cancel-button {
  background-color: #6c757d;
  color: white;
}

.cancel-button:hover {
  background-color: #5a6268;
  transform: translateY(-1px);
}

.save-button .fas, .cancel-button .fas {
  margin-right: 0.5rem;
}
@media (max-width: 900px) {
  .main-panel { grid-template-columns: 1fr; }
  .quick-actions { grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); }
}
</style>