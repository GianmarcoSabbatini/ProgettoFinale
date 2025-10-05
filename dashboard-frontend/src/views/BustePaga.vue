<template>
  <div class="buste-paga-page">
    <!-- Main Header (sempre visibile) -->
    <MainHeader />
    
    <!-- Quick Actions (same as dashboard) -->
    <section class="quick-actions">
      <router-link to="/buste-paga" class="action-card active">
        <i class="fas fa-file-invoice-dollar icon"></i>
        <span>Buste Paga</span>
      </router-link>
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

    <!-- Main Content -->
    <main class="buste-paga-content">
      <div class="filters-section">
        <div class="filter-group">
          <label>Anno:</label>
          <select v-model="selectedYear" @change="filterBustePaga">
            <option value="all">Tutti</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>
        <div class="stats-card">
          <div class="stat-item">
            <span class="stat-label">Buste disponibili:</span>
            <span class="stat-value">{{ filteredBustePaga.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Anno corrente:</span>
            <span class="stat-value">{{ new Date().getFullYear() }}</span>
          </div>
        </div>
      </div>

      <!-- Lista Buste Paga -->
      <div class="buste-paga-grid">
        <div 
          v-for="busta in filteredBustePaga" 
          :key="busta.id" 
          class="busta-card"
        >
          <div class="busta-header">
            <div class="busta-icon">
              <i class="fas fa-file-pdf"></i>
            </div>
            <div class="busta-info">
              <h3 class="busta-month">{{ busta.mese }}</h3>
              <p class="busta-year">{{ busta.anno }}</p>
            </div>
          </div>
          
          <div class="busta-details">
            <div class="detail-row">
              <span class="detail-label">Importo Lordo:</span>
              <span class="detail-value">€ {{ formatCurrency(busta.importoLordo) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Importo Netto:</span>
              <span class="detail-value netto">€ {{ formatCurrency(busta.importoNetto) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Data emissione:</span>
              <span class="detail-value">{{ busta.dataEmissione }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Emessa da:</span>
              <span class="detail-value">{{ busta.emessaDa }}</span>
            </div>
          </div>

          <div class="busta-actions">
            <button @click="downloadBusta(busta)" class="download-btn">
              <i class="fas fa-download"></i> Scarica PDF
            </button>
            <button @click="viewBusta(busta)" class="view-btn">
              <i class="fas fa-eye"></i> Visualizza
            </button>
          </div>

          <div class="busta-status" :class="busta.status">
            <i class="fas fa-check-circle"></i> {{ busta.status === 'pagato' ? 'Pagato' : 'In elaborazione' }}
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredBustePaga.length === 0" class="empty-state">
        <i class="fas fa-inbox"></i>
        <h3>Nessuna busta paga disponibile</h3>
        <p>Non ci sono buste paga per il periodo selezionato.</p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useNotificationStore } from '@/stores/notification';
import MainHeader from '@/components/MainHeader.vue';

const notificationStore = useNotificationStore();
const selectedYear = ref('all');

// Dati finti delle buste paga
const bustePaga = ref([
  {
    id: 1,
    mese: 'Settembre 2025',
    anno: 2025,
    importoLordo: 3500.00,
    importoNetto: 2450.00,
    dataEmissione: '01/10/2025',
    emessaDa: 'Contabilità - Dott.ssa Rossi',
    status: 'pagato'
  },
  {
    id: 2,
    mese: 'Agosto 2025',
    anno: 2025,
    importoLordo: 3500.00,
    importoNetto: 2450.00,
    dataEmissione: '01/09/2025',
    emessaDa: 'Contabilità - Dott.ssa Rossi',
    status: 'pagato'
  },
  {
    id: 3,
    mese: 'Luglio 2025',
    anno: 2025,
    importoLordo: 3500.00,
    importoNetto: 2450.00,
    dataEmissione: '01/08/2025',
    emessaDa: 'Contabilità - Dott.ssa Rossi',
    status: 'pagato'
  },
  {
    id: 4,
    mese: 'Giugno 2025',
    anno: 2025,
    importoLordo: 3500.00,
    importoNetto: 2450.00,
    dataEmissione: '01/07/2025',
    emessaDa: 'Contabilità - Dott.ssa Rossi',
    status: 'pagato'
  },
  {
    id: 5,
    mese: 'Maggio 2025',
    anno: 2025,
    importoLordo: 3500.00,
    importoNetto: 2450.00,
    dataEmissione: '01/06/2025',
    emessaDa: 'Contabilità - Dott.ssa Rossi',
    status: 'pagato'
  },
  {
    id: 6,
    mese: 'Dicembre 2024',
    anno: 2024,
    importoLordo: 4200.00,
    importoNetto: 2950.00,
    dataEmissione: '01/01/2025',
    emessaDa: 'Contabilità - Dott. Bianchi',
    status: 'pagato'
  },
  {
    id: 7,
    mese: 'Novembre 2024',
    anno: 2024,
    importoLordo: 3500.00,
    importoNetto: 2450.00,
    dataEmissione: '01/12/2024',
    emessaDa: 'Contabilità - Dott. Bianchi',
    status: 'pagato'
  },
  {
    id: 8,
    mese: 'Ottobre 2024',
    anno: 2024,
    importoLordo: 3500.00,
    importoNetto: 2450.00,
    dataEmissione: '01/11/2024',
    emessaDa: 'Contabilità - Dott. Bianchi',
    status: 'pagato'
  }
]);

const filteredBustePaga = computed(() => {
  if (selectedYear.value === 'all') {
    return bustePaga.value;
  }
  return bustePaga.value.filter(busta => busta.anno === parseInt(selectedYear.value));
});

const formatCurrency = (value) => {
  return value.toFixed(2).replace('.', ',');
};

const downloadBusta = (busta) => {
  notificationStore.showNotification(`Download busta paga ${busta.mese} avviato`, 'success');
  // Simula download
  console.log('Download busta:', busta);
};

const viewBusta = (busta) => {
  notificationStore.showNotification(`Apertura busta paga ${busta.mese}...`, 'info');
  // Simula visualizzazione
  console.log('Visualizza busta:', busta);
};

const filterBustePaga = () => {
  // Il filtering è gestito dal computed property
};
</script>

<style scoped>
.buste-paga-page {
  min-height: 100vh;
  background-color: #fafafb;
  font-family: 'DM Sans', sans-serif;
}

/* Quick Actions (identiche alla dashboard) */
.quick-actions { 
  display: grid; 
  grid-template-columns: repeat(5, 1fr); 
  gap: 1rem; 
  margin-bottom: 2rem;
  padding: 2rem 2rem 0 2rem;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
}

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
  text-decoration: none;
  display: block;
}

.action-card:hover { 
  border: 2px solid #4b00e9; 
  transition: ease-in 0.2s; 
}

.action-card.active {
  background-color: #4b00e9;
  border-color: #4b00e9;
}

.action-card .icon { 
  display: block; 
  font-size: 1.5rem; 
  margin-bottom: 0.5rem; 
  color: #4b00e9; 
}

.action-card.active .icon {
  color: white;
}

.action-card span { 
  font-family: 'DM Sans', sans-serif; 
  color: #4b00e9; 
}

.action-card.active span {
  color: white;
}

/* Main Content */
.buste-paga-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

/* Filters */
.filters-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  background-color: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.filter-group label {
  font-weight: 600;
  color: #333;
}

.filter-group select {
  padding: 0.75rem 1rem;
  border: 2px solid #e7e7ee;
  border-radius: 8px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-group select:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.stats-card {
  display: flex;
  gap: 2rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.85rem;
  color: #666;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #6366f1;
}

/* Grid Buste Paga */
.buste-paga-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.busta-card {
  background-color: white;
  border-radius: 12px;
  border: 2px solid #e7e7ee;
  padding: 1.5rem;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.busta-card:hover {
  border-color: #6366f1;
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.15);
  transform: translateY(-4px);
}

.busta-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f5f5f5;
}

.busta-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  color: #ef4444;
}

.busta-info h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: #333;
}

.busta-info p {
  margin: 0.25rem 0 0 0;
  font-size: 0.9rem;
  color: #666;
}

/* Details */
.busta-details {
  margin-bottom: 1.5rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f5f5f5;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  font-size: 0.9rem;
  color: #666;
}

.detail-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
}

.detail-value.netto {
  color: #10b981;
  font-size: 1.1rem;
}

/* Actions */
.busta-actions {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.download-btn,
.view-btn {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.download-btn {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

.download-btn:hover {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.view-btn {
  background-color: #f5f5f5;
  color: #666;
}

.view-btn:hover {
  background-color: #e7e7ee;
  color: #333;
}

/* Status */
.busta-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
}

.busta-status.pagato {
  background-color: #d1fae5;
  color: #065f46;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #999;
}

.empty-state i {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.3;
}

.empty-state h3 {
  font-size: 1.5rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.empty-state p {
  font-size: 1rem;
  color: #999;
}

/* Responsive */
@media (max-width: 768px) {
  .page-title {
    font-size: 2rem;
  }

  .filters-section {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .buste-paga-grid {
    grid-template-columns: 1fr;
  }

  .stats-card {
    justify-content: space-between;
  }
}
</style>
