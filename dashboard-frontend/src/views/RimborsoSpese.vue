<template>
  <div class="rimborso-page">
    <MainHeader />
    
    <!-- Quick Actions -->
    <QuickActions activePage="rimborso-spese" />

    <!-- Main Content -->
    <main class="rimborso-content">
      <!-- Form per inserire rimborso -->
      <div class="rimborso-form-section">
        <h2><i class="fas fa-plus-circle"></i> Richiedi Rimborso</h2>
        <form @submit.prevent="addRimborso" class="rimborso-form">
          <div class="form-row">
            <div class="form-group">
              <label for="date">Data Spesa</label>
              <input 
                type="date" 
                id="date" 
                v-model="newRimborso.date" 
                required
                :max="today"
              >
            </div>
            <div class="form-group">
              <label for="amount">Importo (€)</label>
              <input 
                type="number" 
                id="amount" 
                v-model.number="newRimborso.amount" 
                min="0.01" 
                step="0.01" 
                required
                placeholder="Es. 25.50"
              >
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="category">Categoria</label>
              <select id="category" v-model="newRimborso.category" required>
                <option value="">Seleziona categoria</option>
                <option value="Trasporto">Trasporto</option>
                <option value="Vitto e Alloggio">Vitto e Alloggio</option>
                <option value="Materiale Ufficio">Materiale Ufficio</option>
                <option value="Formazione">Formazione</option>
                <option value="Tecnologia">Tecnologia</option>
                <option value="Altro">Altro</option>
              </select>
            </div>
            <div class="form-group">
              <label for="payment">Metodo Pagamento</label>
              <select id="payment" v-model="newRimborso.payment" required>
                <option value="">Seleziona metodo</option>
                <option value="Carta di Credito">Carta di Credito</option>
                <option value="Contanti">Contanti</option>
                <option value="Bonifico">Bonifico</option>
              </select>
            </div>
          </div>

          <div class="form-group full-width">
            <label for="description">Descrizione</label>
            <textarea 
              id="description" 
              v-model="newRimborso.description" 
              rows="3"
              placeholder="Descrivi la spesa sostenuta..."
              required
            ></textarea>
          </div>

          <div class="form-group full-width">
            <label for="receipt">Ricevuta/Fattura</label>
            <div class="file-upload">
              <input 
                type="file" 
                id="receipt" 
                @change="handleFileUpload"
                accept=".pdf,.jpg,.jpeg,.png"
              >
              <label for="receipt" class="file-upload-label">
                <i class="fas fa-cloud-upload-alt"></i>
                <span>{{ fileName || 'Carica file (PDF, JPG, PNG)' }}</span>
              </label>
            </div>
          </div>

          <button type="submit" class="submit-btn">
            <i class="fas fa-paper-plane"></i> Invia Richiesta
          </button>
        </form>
      </div>

      <!-- Lista rimborsi -->
      <div class="rimborsi-list-section">
        <div class="list-header">
          <h2><i class="fas fa-list"></i> Storico Rimborsi</h2>
          <div class="filter-status">
            <button 
              @click="selectedStatus = 'all'" 
              :class="{ active: selectedStatus === 'all' }"
              class="filter-btn"
            >
              Tutti
            </button>
            <button 
              @click="selectedStatus = 'pending'" 
              :class="{ active: selectedStatus === 'pending' }"
              class="filter-btn"
            >
              In Attesa
            </button>
            <button 
              @click="selectedStatus = 'approved'" 
              :class="{ active: selectedStatus === 'approved' }"
              class="filter-btn"
            >
              Approvati
            </button>
            <button 
              @click="selectedStatus = 'rejected'" 
              :class="{ active: selectedStatus === 'rejected' }"
              class="filter-btn"
            >
              Rifiutati
            </button>
          </div>
        </div>

        <!-- Statistiche -->
        <div class="stats-cards">
          <div class="stat-card">
            <div class="stat-icon blue">
              <i class="fas fa-receipt"></i>
            </div>
            <div class="stat-info">
              <p class="stat-label">Totale Richiesto</p>
              <h3 class="stat-value">€ {{ totalRequested.toFixed(2) }}</h3>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon green">
              <i class="fas fa-check-circle"></i>
            </div>
            <div class="stat-info">
              <p class="stat-label">Approvato</p>
              <h3 class="stat-value">€ {{ totalApproved.toFixed(2) }}</h3>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon orange">
              <i class="fas fa-clock"></i>
            </div>
            <div class="stat-info">
              <p class="stat-label">In Attesa</p>
              <h3 class="stat-value">€ {{ totalPending.toFixed(2) }}</h3>
            </div>
          </div>
        </div>

        <!-- Lista rimborsi -->
        <div class="rimborsi-list">
          <div v-if="filteredRimborsi.length === 0" class="no-rimborsi">
            <i class="fas fa-inbox"></i>
            <p>Nessuna richiesta trovata</p>
          </div>

          <div 
            v-for="rimborso in filteredRimborsi" 
            :key="rimborso.id" 
            class="rimborso-card"
          >
            <div class="rimborso-header">
              <div class="rimborso-info">
                <h3 class="rimborso-category">{{ rimborso.category }}</h3>
                <span class="rimborso-date">
                  <i class="fas fa-calendar"></i>
                  {{ formatDate(rimborso.date) }}
                </span>
              </div>
              <div class="rimborso-amount-status">
                <div class="rimborso-amount">€ {{ rimborso.amount.toFixed(2) }}</div>
                <span class="status-badge" :class="rimborso.status">
                  {{ getStatusLabel(rimborso.status) }}
                </span>
              </div>
            </div>
            <div class="rimborso-body">
              <p class="rimborso-description">{{ rimborso.description }}</p>
              <div class="rimborso-details">
                <span class="detail-item">
                  <i class="fas fa-credit-card"></i>
                  {{ rimborso.payment }}
                </span>
                <span class="detail-item" v-if="rimborso.receipt">
                  <i class="fas fa-paperclip"></i>
                  {{ rimborso.receipt }}
                </span>
              </div>
            </div>
            <div class="rimborso-footer">
              <button 
                @click="openDeleteModal(rimborso.id)" 
                class="delete-rimborso-btn"
                v-if="rimborso.status === 'pending'"
              >
                <i class="fas fa-trash"></i> Elimina
              </button>
              <button 
                @click="downloadReceipt(rimborso)"
                class="download-receipt-btn"
                v-if="rimborso.receipt"
              >
                <i class="fas fa-download"></i> Scarica Ricevuta
              </button>
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
        <p class="delete-modal-text">Sei sicuro di voler eliminare questa richiesta di rimborso? Questa azione non può essere annullata.</p>
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

// Form data
const today = new Date().toISOString().split('T')[0];
const fileName = ref('');
const newRimborso = ref({
  date: today,
  amount: null,
  category: '',
  payment: '',
  description: '',
  receipt: null
});

// Rimborsi list
const rimborsiList = ref([]);
const loading = ref(false);

// Delete modal
const showDeleteModal = ref(false);
const rimborsoToDelete = ref(null);

const openDeleteModal = (id) => {
  rimborsoToDelete.value = id;
  showDeleteModal.value = true;
};

const cancelDelete = () => {
  showDeleteModal.value = false;
  rimborsoToDelete.value = null;
};

const confirmDelete = async () => {
  if (rimborsoToDelete.value) {
    await deleteRimborso(rimborsoToDelete.value);
    showDeleteModal.value = false;
    rimborsoToDelete.value = null;
  }
};

// Load expense reimbursements from backend
const loadExpenses = async () => {
  try {
    loading.value = true;
    const response = await axios.get(`${API_URL}/api/expenses`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    });
    
    if (response.data.success) {
      // Map backend data to frontend format
      rimborsiList.value = response.data.expenses.map(expense => ({
        id: expense.id,
        date: expense.date,
        amount: parseFloat(expense.amount),
        category: expense.category,
        payment: expense.payment_method,
        description: expense.description,
        receipt: expense.receipt_url,
        status: expense.status
      }));
    }
  } catch (error) {
    console.error('Errore caricamento rimborsi:', error);
    notificationStore.showNotification('Errore nel caricamento dei rimborsi', 'error');
  } finally {
    loading.value = false;
  }
};

// Load expenses on component mount
onMounted(() => {
  loadExpenses();
});

const selectedStatus = ref('all');

// Handle file upload
const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    fileName.value = file.name;
    newRimborso.value.receipt = file.name;
  }
};


// Add rimborso
const addRimborso = async () => {
  if (!newRimborso.value.date || !newRimborso.value.amount || !newRimborso.value.category || 
      !newRimborso.value.payment || !newRimborso.value.description) {
    notificationStore.showNotification('Compila tutti i campi obbligatori', 'warning');
    return;
  }

  try {
    loading.value = true;

    const expenseData = {
      date: newRimborso.value.date,
      amount: parseFloat(newRimborso.value.amount),
      category: newRimborso.value.category,
      payment_method: newRimborso.value.payment, // Backend expects payment_method
      description: newRimborso.value.description,
      receipt_url: newRimborso.value.receipt || null
    };

    const response = await axios.post(`${API_URL}/api/expenses`, expenseData, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    });

    // Map backend response to frontend format
    const expense = response.data.expense;
    const rimborso = {
      id: expense.id,
      date: expense.date,
      amount: parseFloat(expense.amount),
      category: expense.category,
      payment: expense.payment_method,
      description: expense.description,
      receipt: expense.receipt_url,
      status: expense.status || 'pending'
    };

    rimborsiList.value.unshift(rimborso);
    
    // Reset form
    newRimborso.value = {
      date: today,
      amount: null,
      category: '',
      payment: '',
      description: '',
      receipt: null
    };
    fileName.value = '';
    document.getElementById('receipt').value = '';

    // Mostra notifiche
    notificationStore.showNotification('Richiesta di rimborso inviata con successo!', 'success');
    headerNotificationStore.addNotification(
      'Sistema',
      `Nuovo rimborso spese di €${rimborso.amount} per ${rimborso.category}`,
      'success'
    );

  } catch (error) {
    console.error('Error adding expense:', error);
    notificationStore.showNotification(
      error.response?.data?.error || 'Errore durante l\'invio della richiesta',
      'error'
    );
  } finally {
    loading.value = false;
  }
};

// Delete rimborso
const deleteRimborso = async (id) => {
  try {
    loading.value = true;

    await axios.delete(`${API_URL}/api/expenses/${id}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    });

    rimborsiList.value = rimborsiList.value.filter(r => r.id !== id);
    notificationStore.showNotification('Richiesta eliminata con successo', 'success');
    
    // Aggiungi notifica nella campanella
    headerNotificationStore.addNotification(
      'Sistema',
      'Hai eliminato una richiesta di rimborso spese',
      'info'
    );

  } catch (error) {
    console.error('Error deleting expense:', error);
    notificationStore.showNotification(
      error.response?.data?.error || 'Errore durante l\'eliminazione',
      'error'
    );
  } finally {
    loading.value = false;
  }
};

// Filter rimborsi
const filteredRimborsi = computed(() => {
  if (selectedStatus.value === 'all') {
    return rimborsiList.value;
  }
  return rimborsiList.value.filter(r => r.status === selectedStatus.value);
});

// Computed statistics
const totalRequested = computed(() => {
  return rimborsiList.value.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
});

const totalApproved = computed(() => {
  return rimborsiList.value
    .filter(r => r.status === 'approved')
    .reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
});

const totalPending = computed(() => {
  return rimborsiList.value
    .filter(r => r.status === 'pending')
    .reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
});

// Format date
const formatDate = (dateString) => {
  if (!dateString) return 'Data non disponibile';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return 'Data non valida';
  }
  
  const options = { day: '2-digit', month: 'long', year: 'numeric' };
  return date.toLocaleDateString('it-IT', options);
};

// Get status label
const getStatusLabel = (status) => {
  const labels = {
    pending: 'In Attesa',
    approved: 'Approvato',
    rejected: 'Rifiutato'
  };
  return labels[status] || status;
};

// Download receipt
const downloadReceipt = (rimborso) => {
  if (!rimborso.receipt) {
    notificationStore.showNotification('Nessuna ricevuta disponibile', 'warning');
    return;
  }

  // Crea un elemento <a> temporaneo per simulare il download
  // Nota: Attualmente il backend non gestisce il vero storage dei file
  // Questo simula il download creando un file di testo con le info del rimborso
  
  const content = `
RICEVUTA RIMBORSO SPESE
========================

Data: ${formatDate(rimborso.date)}
Categoria: ${rimborso.category}
Importo: €${rimborso.amount.toFixed(2)}
Metodo di Pagamento: ${rimborso.payment}
Descrizione: ${rimborso.description}
Status: ${getStatusLabel(rimborso.status)}
File Originale: ${rimborso.receipt}

========================
Generato il ${new Date().toLocaleDateString('it-IT')}
  `.trim();

  const blob = new Blob([content], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ricevuta-${rimborso.id}-${rimborso.receipt}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
  
  notificationStore.showNotification('Ricevuta scaricata con successo', 'success');
};
</script>

<style scoped>
.rimborso-page {
  min-height: 100vh;
  background-color: #fafafb;
  font-family: 'DM Sans', sans-serif;
}

/* Quick Actions */
/* Main Content */
.rimborso-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 2rem;
}

/* Form Section */
.rimborso-form-section {
  background-color: #ffffff;
  border-radius: 12px;
  border: 1px solid #e7e7ee;
  padding: 2rem;
  height: fit-content;
  position: sticky;
  top: 2rem;
}

.rimborso-form-section h2 {
  font-size: 1.3rem;
  margin-bottom: 1.5rem;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.rimborso-form-section h2 i {
  color: #4b00e9;
}

.rimborso-form {
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
  color: #333;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 0.75rem;
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

/* File Upload */
.file-upload {
  position: relative;
}

.file-upload input[type="file"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.file-upload-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem;
  border: 2px dashed #e7e7ee;
  border-radius: 8px;
  background-color: #fafafb;
  cursor: pointer;
  transition: all 0.2s;
  color: #666;
}

.file-upload-label:hover {
  border-color: #4b00e9;
  background-color: #f8f7fe;
  color: #4b00e9;
}

.file-upload-label i {
  font-size: 1.5rem;
}

.submit-btn {
  background: linear-gradient(135deg, #4b00e9 0%, #6b2aff 100%);
  color: white;
  border: none;
  padding: 0.9rem 1.5rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(75, 0, 233, 0.3);
}

/* List Section */
.rimborsi-list-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.list-header h2 {
  font-size: 1.3rem;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
}

.list-header h2 i {
  color: #4b00e9;
}

.filter-status {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #e7e7ee;
  background-color: white;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  color: #666;
}

.filter-btn:hover {
  border-color: #4b00e9;
  color: #4b00e9;
}

.filter-btn.active {
  background-color: #4b00e9;
  border-color: #4b00e9;
  color: white;
}

/* Stats Cards */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.stat-card {
  background: linear-gradient(135deg, #fafafb 0%, #ffffff 100%);
  border: 1px solid #e7e7ee;
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: white;
}

.stat-icon.blue {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.stat-icon.green {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.stat-icon.orange {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 0.85rem;
  color: #777;
  margin: 0 0 0.25rem 0;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
  margin: 0;
}

/* Rimborsi List */
.rimborsi-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.no-rimborsi {
  background-color: #ffffff;
  border-radius: 12px;
  border: 1px solid #e7e7ee;
  padding: 3rem;
  text-align: center;
  color: #999;
}

.no-rimborsi i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.3;
}

.rimborso-card {
  background-color: #ffffff;
  border-radius: 12px;
  border: 1px solid #e7e7ee;
  padding: 1.5rem;
  transition: all 0.2s;
}

.rimborso-card:hover {
  box-shadow: 0 4px 12px rgba(75, 0, 233, 0.08);
}

.rimborso-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e7e7ee;
}

.rimborso-info h3 {
  font-size: 1.1rem;
  color: #333;
  margin: 0 0 0.5rem 0;
}

.rimborso-date {
  color: #666;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.rimborso-date i {
  color: #4b00e9;
}

.rimborso-amount-status {
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-end;
}

.rimborso-amount {
  font-size: 1.3rem;
  font-weight: 700;
  color: #4b00e9;
}

.status-badge {
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.pending {
  background-color: #fff3e0;
  color: #e65100;
}

.status-badge.approved {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-badge.rejected {
  background-color: #ffebee;
  color: #c62828;
}

.rimborso-body {
  margin-bottom: 1rem;
}

.rimborso-description {
  color: #666;
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 0.75rem;
}

.rimborso-details {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.detail-item {
  color: #777;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.detail-item i {
  color: #4b00e9;
}

.rimborso-footer {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.delete-rimborso-btn,
.download-receipt-btn {
  padding: 0.6rem 1rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid;
}

.delete-rimborso-btn {
  background-color: transparent;
  border-color: #dc3545;
  color: #dc3545;
}

.delete-rimborso-btn:hover {
  background-color: #dc3545;
  color: white;
}

.download-receipt-btn {
  background-color: transparent;
  border-color: #4b00e9;
  color: #4b00e9;
}

.download-receipt-btn:hover {
  background-color: #4b00e9;
  color: white;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .rimborso-content { padding: 1.5rem; grid-template-columns: 1fr; }
  .rimborso-form-section { position: static; }
  .stats-cards { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 768px) {
  .rimborso-content { padding: 1rem; }
  .rimborso-form-section { padding: 1.5rem; }
  .form-row { grid-template-columns: 1fr; }
  .stats-cards { grid-template-columns: 1fr; }
  .list-header { flex-direction: column; align-items: flex-start; }
  .rimborso-header { flex-direction: column; gap: 1rem; }
  .rimborso-amount-status { align-items: flex-start; }
  .rimborso-footer { flex-direction: column; }
  .delete-rimborso-btn, .download-receipt-btn { width: 100%; justify-content: center; }
}

@media (max-width: 480px) {
  .rimborso-content { padding: 0.75rem; }
  .rimborso-form-section { padding: 1rem; }
  .rimborso-card { padding: 1rem; }
  .stats-cards { gap: 0.75rem; }
  .filter-status { width: 100%; }
  .filter-btn { flex: 1; }
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
