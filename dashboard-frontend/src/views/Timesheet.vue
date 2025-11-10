<template>
  <div class="timesheet-page">
    <MainHeader />
    
    <!-- Quick Actions (same as dashboard) -->
    <QuickActions activePage="timesheet" />

    <!-- Main Content -->
    <main class="timesheet-content">
      <!-- Timesheet Form -->
      <div class="timesheet-form-section">
        <h2><i class="fas fa-plus-circle"></i> Inserisci Ore Lavorate</h2>
        <form @submit.prevent="addTimesheetEntry" class="timesheet-form">
          <div class="form-row">
            <div class="form-group">
              <label for="date">Data</label>
              <input 
                type="date" 
                id="date" 
                v-model="newEntry.date" 
                required
                :max="today"
              >
            </div>
            <div class="form-group">
              <label for="project">Progetto</label>
              <select id="project" v-model="newEntry.project" required>
                <option value="">Seleziona progetto</option>
                <option value="Dashboard Aziendale">Dashboard Aziendale</option>
                <option value="App Mobile">App Mobile</option>
                <option value="Gestione Clienti">Gestione Clienti</option>
                <option value="E-commerce">E-commerce</option>
                <option value="Sistema CRM">Sistema CRM</option>
                <option value="Formazione">Formazione</option>
                <option value="Altro">Altro</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="hours">Ore</label>
              <input 
                type="number" 
                id="hours" 
                v-model.number="newEntry.hours" 
                min="0.5" 
                max="24" 
                step="0.5" 
                required
                placeholder="Es. 8"
              >
            </div>
            <div class="form-group">
              <label for="type">Tipo Attività</label>
              <select id="type" v-model="newEntry.type" required>
                <option value="">Seleziona tipo</option>
                <option value="Sviluppo">Sviluppo</option>
                <option value="Design">Design</option>
                <option value="Meeting">Meeting</option>
                <option value="Testing">Testing</option>
                <option value="Documentazione">Documentazione</option>
                <option value="Supporto">Supporto</option>
              </select>
            </div>
          </div>

          <div class="form-group full-width">
            <label for="description">Descrizione</label>
            <textarea 
              id="description" 
              v-model="newEntry.description" 
              rows="3"
              placeholder="Descrivi brevemente l'attività svolta..."
              required
            ></textarea>
          </div>

          <button type="submit" class="submit-btn">
            <i class="fas fa-save"></i> Inserisci nel Timesheet
          </button>
        </form>
      </div>

      <!-- Timesheet Entries -->
      <div class="timesheet-entries-section">
        <div class="entries-header">
          <h2><i class="fas fa-history"></i> Ore Registrate</h2>
          <div class="filter-week">
            <label>Settimana:</label>
            <select v-model="selectedWeek" @change="filterByWeek">
              <option value="current">Settimana corrente</option>
              <option value="last">Settimana scorsa</option>
              <option value="all">Tutte</option>
            </select>
          </div>
        </div>

        <!-- Summary Cards -->
        <div class="summary-cards">
          <div class="summary-card">
            <div class="summary-icon blue">
              <i class="fas fa-clock"></i>
            </div>
            <div class="summary-info">
              <p class="summary-label">Ore Totali</p>
              <p class="summary-value">{{ totalHours }} h</p>
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-icon green">
              <i class="fas fa-calendar-check"></i>
            </div>
            <div class="summary-info">
              <p class="summary-label">Giorni Lavorati</p>
              <p class="summary-value">{{ uniqueDays }}</p>
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-icon purple">
              <i class="fas fa-project-diagram"></i>
            </div>
            <div class="summary-info">
              <p class="summary-label">Progetti Attivi</p>
              <p class="summary-value">{{ uniqueProjects }}</p>
            </div>
          </div>
        </div>

        <!-- Entries List -->
        <div class="entries-list">
          <div v-if="groupedEntries.length === 0" class="no-entries">
            <i class="fas fa-inbox"></i>
            <p>Nessuna registrazione trovata</p>
          </div>

          <!-- Grouped by day -->
          <div 
            v-for="dayGroup in groupedEntries" 
            :key="dayGroup.date" 
            class="day-group"
          >
            <div class="day-header">
              <div class="day-date">
                <i class="fas fa-calendar"></i>
                <span>{{ formatEntryDate(dayGroup.date) }}</span>
              </div>
              <div class="day-total">
                <i class="fas fa-clock"></i>
                <strong>{{ dayGroup.regularHours }} / 8 ore</strong>
                <span 
                  v-if="dayGroup.overtimeHours > 0"
                  class="overtime-badge"
                >
                  + {{ dayGroup.overtimeHours }} straordinario
                </span>
                <span 
                  class="hours-badge" 
                  :class="dayGroup.regularHours === 8 ? 'complete' : (dayGroup.regularHours > 0 ? 'incomplete' : 'empty')"
                >
                  {{ dayGroup.regularHours === 8 ? '✓ Completo' : '⚠ Incompleto' }}
                </span>
              </div>
            </div>
            
            <!-- Activities for this day -->
            <div class="day-activities">
              <div 
                v-for="entry in dayGroup.entries" 
                :key="entry.id" 
                class="activity-card"
              >
                <div class="activity-header">
                  <div class="activity-project">
                    <span class="project-badge">{{ entry.project }}</span>
                    <span class="type-badge" :class="entry.type.toLowerCase()">
                      {{ entry.type }}
                    </span>
                  </div>
                  <div class="activity-hours">
                    <strong>{{ entry.hours }} h</strong>
                  </div>
                </div>
                <p class="activity-description">{{ entry.description }}</p>
                <button @click="openDeleteModal(entry.id)" class="delete-activity-btn">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>

  <!-- Snackbar per notifiche -->
  <transition name="snackbar">
    <div v-if="notificationStore.notification.show" :class="['snackbar', notificationStore.notification.type]">
      <i :class="notificationStore.notification.type === 'success' ? 'fas fa-check-circle' : notificationStore.notification.type === 'warning' ? 'fas fa-exclamation-triangle' : 'fas fa-exclamation-circle'"></i>
      <span>{{ notificationStore.notification.message }}</span>
    </div>
  </transition>

  <!-- Modale Conferma Eliminazione -->
  <transition name="modal">
    <div v-if="showDeleteModal" class="modal-overlay" @click="cancelDelete">
      <div class="delete-modal-content" @click.stop>
        <div class="delete-modal-icon">
          <i class="fas fa-trash-alt"></i>
        </div>
        <h3 class="delete-modal-title">Conferma Eliminazione</h3>
        <p class="delete-modal-text">Sei sicuro di voler eliminare questa registrazione? Questa azione non può essere annullata.</p>
        <div class="delete-modal-actions">
          <button @click="cancelDelete" class="cancel-delete-btn">
            <i class="fas fa-times"></i> Annulla
          </button>
          <button @click="confirmDelete" class="confirm-delete-btn">
            <i class="fas fa-trash-alt"></i> Elimina
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useNotificationStore } from '../stores/notification';
import { useHeaderNotificationStore } from '../stores/headerNotification';
import { useAuthStore } from '../stores/auth';
import axios from 'axios';
import API_URL from '../config/api';
import MainHeader from '../components/MainHeader.vue';
import QuickActions from '../components/QuickActions.vue';

const notificationStore = useNotificationStore();
const headerNotificationStore = useHeaderNotificationStore();
const authStore = useAuthStore();

// Dati del form
const today = new Date().toISOString().split('T')[0];
const newEntry = ref({
  date: today,
  project: '',
  hours: null,
  type: '',
  description: ''
});

// Voci del timesheet
const timesheetEntries = ref([]);
const loading = ref(false);

// Modale di eliminazione
const showDeleteModal = ref(false);
const entryToDelete = ref(null);

const openDeleteModal = (id) => {
  entryToDelete.value = id;
  showDeleteModal.value = true;
};

const cancelDelete = () => {
  showDeleteModal.value = false;
  entryToDelete.value = null;
};

const confirmDelete = async () => {
  if (entryToDelete.value) {
    await deleteEntry(entryToDelete.value);
    showDeleteModal.value = false;
    entryToDelete.value = null;
  }
};

// Carica voci timesheet dal backend
const loadTimesheetEntries = async () => {
  try {
    loading.value = true;
    const response = await axios.get(`${API_URL}/api/timesheet`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    });
    
    if (response.data.success) {
      // Converti ore in numero per evitare concatenazione stringa
      timesheetEntries.value = response.data.entries.map(entry => ({
        ...entry,
        hours: parseFloat(entry.hours)
      }));
    }
  } catch (error) {
    console.error('Errore caricamento timesheet:', error);
    notificationStore.showNotification('Errore nel caricamento del timesheet', 'error');
  } finally {
    loading.value = false;
  }
};

// Carica voci al montaggio del componente
onMounted(() => {
  loadTimesheetEntries();
});

const selectedWeek = ref('current');

// Aggiungi nuova voce
const addTimesheetEntry = async () => {
  if (!newEntry.value.date || !newEntry.value.project || !newEntry.value.hours || !newEntry.value.type || !newEntry.value.description) {
    notificationStore.showNotification('Compila tutti i campi obbligatori', 'warning');
    return;
  }

  try {
    loading.value = true;
    const response = await axios.post(`${API_URL}/api/timesheet`, {
      date: newEntry.value.date,
      project: newEntry.value.project,
      hours: parseFloat(newEntry.value.hours),
      type: newEntry.value.type,
      description: newEntry.value.description
    }, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    });

    if (response.data.success) {
      // Aggiungi alla lista locale con ore come numero
      const newEntryData = {
        ...response.data.entry,
        hours: parseFloat(response.data.entry.hours)
      };
      timesheetEntries.value.unshift(newEntryData);
      
      // Resetta form
      newEntry.value = {
        date: today,
        project: '',
        hours: null,
        type: '',
        description: ''
      };

      // Mostra notifiche
      notificationStore.showNotification('Registrazione ore salvata con successo!', 'success');
      headerNotificationStore.addNotification(
        'Sistema',
        `Nuova registrazione: ${newEntryData.hours}h per ${newEntryData.project}`,
        'success'
      );
    }
  } catch (error) {
    console.error('Errore salvataggio timesheet:', error);
    const message = error.response?.data?.message || 'Errore durante il salvataggio';
    notificationStore.showNotification(message, 'error');
  } finally {
    loading.value = false;
  }
};

// Elimina voce
const deleteEntry = async (id) => {
  try {
    loading.value = true;
    const response = await axios.delete(`${API_URL}/api/timesheet/${id}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    });

    if (response.data.success) {
      timesheetEntries.value = timesheetEntries.value.filter(entry => entry.id !== id);
      notificationStore.showNotification('Registrazione eliminata', 'success');
      
      // Aggiungi notifica nella campanella
      headerNotificationStore.addNotification(
        'Sistema',
        'Hai eliminato una registrazione ore dal timesheet',
        'info'
      );
    }
  } catch (error) {
    console.error('Errore eliminazione timesheet:', error);
    const message = error.response?.data?.message || 'Errore durante l\'eliminazione';
    notificationStore.showNotification(message, 'error');
  } finally {
    loading.value = false;
  }
};

// Filtra voci
const filteredEntries = computed(() => {
  if (selectedWeek.value === 'all') {
    return timesheetEntries.value;
  }

  const now = new Date();
  const entries = timesheetEntries.value.filter(entry => {
    const entryDate = new Date(entry.date);
    const diffDays = Math.floor((now - entryDate) / (1000 * 60 * 60 * 24));

    if (selectedWeek.value === 'current') {
      return diffDays <= 7;
    } else if (selectedWeek.value === 'last') {
      return diffDays > 7 && diffDays <= 14;
    }
    return true;
  });

  return entries;
});

// Raggruppa voci per data (più recenti prima)
const groupedEntries = computed(() => {
  const groups = {};
  
  // Raggruppa per data (normalizza formato data)
  filteredEntries.value.forEach(entry => {
    // Normalizza data in formato YYYY-MM-DD per assicurare il raggruppamento funzioni
    const dateKey = entry.date.split('T')[0]; // Rimuovi ora se presente
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(entry);
  });
  
  // Converti in array e ordina per data (più recenti prima)
  const groupedArray = Object.keys(groups)
    .sort((a, b) => new Date(b) - new Date(a))
    .map(date => {
      const totalHours = groups[date].reduce((sum, entry) => sum + parseFloat(entry.hours || 0), 0);
      const regularHours = Math.min(totalHours, 8);
      const overtimeHours = Math.max(totalHours - 8, 0);
      
      return {
        date,
        entries: groups[date],
        totalHours: parseFloat(totalHours.toFixed(2)),
        regularHours: parseFloat(regularHours.toFixed(2)),
        overtimeHours: parseFloat(overtimeHours.toFixed(2))
      };
    });
  
  return groupedArray;
});

// Statistiche calcolate
const totalHours = computed(() => {
  const total = filteredEntries.value.reduce((sum, entry) => sum + parseFloat(entry.hours || 0), 0);
  return parseFloat(total.toFixed(2));
});

const uniqueDays = computed(() => {
  const dates = [...new Set(filteredEntries.value.map(entry => entry.date))];
  return dates.length;
});

const uniqueProjects = computed(() => {
  const projects = [...new Set(filteredEntries.value.map(entry => entry.project))];
  return projects.length;
});

// Formatta data
const formatEntryDate = (dateString) => {
  const date = new Date(dateString);
  const options = { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' };
  return date.toLocaleDateString('it-IT', options);
};

const filterByWeek = () => {
  // Filtro gestito dalla proprietà computed
};
</script>

<style scoped>
.timesheet-page {
  min-height: 100vh;
  background-color: #fafafb;
  font-family: 'DM Sans', sans-serif;
}

/* Azioni Rapide (identiche alla dashboard) */
/* Contenuto Principale */
.timesheet-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 2rem;
}

/* Form Timesheet */
.timesheet-form-section {
  background-color: #ffffff;
  border-radius: 12px;
  border: 1px solid #e7e7ee;
  padding: 2rem;
  height: fit-content;
  position: sticky;
  top: 2rem;
}

.timesheet-form-section h2 {
  font-size: 1.3rem;
  margin-bottom: 1.5rem;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.timesheet-form-section h2 i {
  color: #4b00e9;
}

.timesheet-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #555;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 0.85rem 1rem;
  border: 1px solid #e7e7ee;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: 'DM Sans', sans-serif;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #4b00e9;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.submit-btn {
  padding: 1rem;
  background: linear-gradient(135deg, #4b00e9 0%, #6366f1 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  font-family: 'DM Sans', sans-serif;
}

.submit-btn:hover {
  background: linear-gradient(135deg, #3600a8 0%, #4b00e9 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(75, 0, 233, 0.3);
}

/* Timesheet Entries */
.timesheet-entries-section {
  background-color: #ffffff;
  border-radius: 12px;
  border: 1px solid #e7e7ee;
  padding: 2rem;
}

.entries-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.entries-header h2 {
  font-size: 1.3rem;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
}

.entries-header h2 i {
  color: #4b00e9;
}

.filter-week {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.filter-week label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #555;
}

.filter-week select {
  padding: 0.6rem 1rem;
  border: 1px solid #e7e7ee;
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
}

/* Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.summary-card {
  background: linear-gradient(135deg, #fafafb 0%, #ffffff 100%);
  border: 1px solid #e7e7ee;
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.summary-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: white;
}

.summary-icon.blue {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.summary-icon.green {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.summary-icon.purple {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}

.summary-info {
  flex: 1;
}

.summary-label {
  font-size: 0.85rem;
  color: #777;
  margin: 0 0 0.25rem 0;
}

.summary-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
  margin: 0;
}

/* Entries List */
.entries-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.no-entries {
  background-color: #ffffff;
  border-radius: 12px;
  border: 1px solid #e7e7ee;
  padding: 3rem;
  text-align: center;
  color: #999;
}

.no-entries i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.3;
}

/* Day Group Container */
.day-group {
  background-color: #ffffff;
  border-radius: 12px;
  border: 1px solid #e7e7ee;
  overflow: hidden;
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  background: linear-gradient(135deg, #f8f7fe 0%, #f0edfc 100%);
  border-bottom: 2px solid #e8e1f9;
}

.day-date {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #333;
  font-size: 1rem;
  font-weight: 600;
}

.day-date i {
  color: #4b00e9;
  font-size: 1.1rem;
}

.day-total {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: #4b00e9;
  font-size: 0.95rem;
}

.day-total i {
  font-size: 1.1rem;
}

.day-total strong {
  font-size: 1.1rem;
}

.hours-badge {
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.hours-badge.complete {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.hours-badge.incomplete {
  background-color: #fff3e0;
  color: #e65100;
}

.overtime-badge {
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
  color: white;
  margin-left: 0.5rem;
  box-shadow: 0 2px 4px rgba(238, 90, 36, 0.3);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 2px 4px rgba(238, 90, 36, 0.3);
  }
  50% {
    box-shadow: 0 2px 8px rgba(238, 90, 36, 0.5);
  }
}

/* Day Activities */
.day-activities {
  padding: 1rem 1.5rem 1.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Activity Card (singola attività dentro il giorno) */
.activity-card {
  background-color: #fafafb;
  border: 1px solid #e7e7ee;
  border-radius: 8px;
  padding: 1.25rem 3rem 1.25rem 1.25rem; /* padding-right aumentato per fare spazio al pulsante */
  transition: all 0.2s;
  position: relative;
}

.activity-card:hover {
  box-shadow: 0 4px 12px rgba(75, 0, 233, 0.08);
  border-color: #d0c9e6;
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  gap: 1rem; /* gap per separare i contenuti */
}

.activity-project {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  flex: 1; /* occupa lo spazio disponibile */
}

.project-badge {
  background-color: #e8e1f9;
  color: #4b00e9;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
}

.type-badge {
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.type-badge.sviluppo {
  background-color: #e3f2fd;
  color: #1976d2;
}

.type-badge.design {
  background-color: #f3e5f5;
  color: #7b1fa2;
}

.type-badge.meeting {
  background-color: #fff3e0;
  color: #e65100;
}

.type-badge.testing {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.type-badge.documentazione {
  background-color: #fce4ec;
  color: #c2185b;
}

.type-badge.formazione {
  background-color: #e0f2f1;
  color: #00695c;
}

.activity-hours {
  color: #4b00e9;
  font-size: 0.95rem;
  white-space: nowrap; /* evita che il testo vada a capo */
  margin-right: 0.5rem; /* spazio dal bordo per non sovrapporsi al pulsante */
}

.activity-hours strong {
  font-size: 1.1rem;
}

.activity-description {
  color: #666;
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 0.5rem;
}

.delete-activity-btn {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background-color: transparent;
  color: #dc3545;
  border: 1px solid transparent;
  padding: 0.4rem;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1; /* assicura che sia sopra gli altri elementi */
}

.delete-activity-btn:hover {
  background-color: #dc3545;
  color: white;
  border-color: #dc3545;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .timesheet-content { padding: 1.5rem; grid-template-columns: 1fr; }
  .timesheet-form-section { position: static; }
  .summary-cards { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 768px) {
  .timesheet-content { padding: 1rem; }
  .timesheet-form-section { padding: 1.5rem; }
  .timesheet-entries-section { padding: 1.5rem; }
  .form-row { grid-template-columns: 1fr; }
  .summary-cards { grid-template-columns: 1fr; }
  .entries-header { flex-direction: column; align-items: flex-start; }
}

@media (max-width: 480px) {
  .timesheet-content { padding: 0.75rem; }
  .timesheet-form-section { padding: 1rem; }
  .timesheet-entries-section { padding: 1rem; }
  .entry-header { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
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

.snackbar.warning {
  background-color: #f59e0b;
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

/* Delete Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 1rem;
}

.delete-modal-content {
  background-color: #ffffff;
  border-radius: 16px;
  width: 100%;
  max-width: 450px;
  padding: 2rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
}

.delete-modal-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem auto;
  background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: #ef4444;
}

.delete-modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 1rem;
}

.delete-modal-text {
  font-size: 0.95rem;
  color: #666;
  line-height: 1.6;
  margin-bottom: 2rem;
}

.delete-modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.cancel-delete-btn,
.confirm-delete-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cancel-delete-btn {
  background-color: #f5f5f5;
  color: #666;
}

.cancel-delete-btn:hover {
  background-color: #e0e0e0;
  color: #333;
}

.confirm-delete-btn {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
}

.confirm-delete-btn:hover {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

.confirm-delete-btn:active {
  transform: translateY(0);
}

/* Modal animations */
.modal-enter-active {
  animation: modalFadeIn 0.3s ease-out;
}

.modal-leave-active {
  animation: modalFadeOut 0.3s ease-in;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes modalFadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
</style>
