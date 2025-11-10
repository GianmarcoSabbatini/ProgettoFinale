<template>
  <div class="buste-paga-page">
    <!-- Main Header (sempre visibile) -->
    <MainHeader />

    <!-- Quick Actions (same as dashboard) -->
    <QuickActions active-page="buste-paga" />

    <!-- Main Content -->
    <main class="buste-paga-content">
      <!-- Sezione Generazione Automatica -->
      <div class="generate-section">
        <div class="generate-card">
          <div class="generate-header">
            <i class="fas fa-magic"></i>
            <h3>Genera Busta Paga Automatica</h3>
          </div>
          <p class="generate-description">
            Genera automaticamente la busta paga in base alle ore registrate nel timesheet
          </p>
          <div class="generate-form">
            <div class="form-row">
              <div class="form-field">
                <label>Mese</label>
                <select v-model="generateForm.month">
                  <option value="">Seleziona mese</option>
                  <option value="Gennaio">Gennaio</option>
                  <option value="Febbraio">Febbraio</option>
                  <option value="Marzo">Marzo</option>
                  <option value="Aprile">Aprile</option>
                  <option value="Maggio">Maggio</option>
                  <option value="Giugno">Giugno</option>
                  <option value="Luglio">Luglio</option>
                  <option value="Agosto">Agosto</option>
                  <option value="Settembre">Settembre</option>
                  <option value="Ottobre">Ottobre</option>
                  <option value="Novembre">Novembre</option>
                  <option value="Dicembre">Dicembre</option>
                </select>
              </div>
              <div class="form-field">
                <label>Anno</label>
                <select v-model="generateForm.year">
                  <option value="">Seleziona anno</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                </select>
              </div>
              <button
                class="generate-btn"
                :disabled="!generateForm.month || !generateForm.year || isGenerating"
                @click="generatePayslip"
              >
                <i class="fas fa-cog" :class="{ 'fa-spin': isGenerating }"></i>
                {{ isGenerating ? 'Generazione...' : 'Genera Busta Paga' }}
              </button>
            </div>
          </div>
        </div>
      </div>

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
        <div v-for="busta in filteredBustePaga" :key="busta.id" class="busta-card">
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
            <button class="download-btn" @click="downloadBusta(busta)">
              <i class="fas fa-download"></i> Scarica PDF
            </button>
            <button class="view-btn" @click="viewBusta(busta)">
              <i class="fas fa-eye"></i> Visualizza
            </button>
          </div>

          <div class="busta-status" :class="busta.status">
            <i class="fas fa-check-circle"></i>
            {{ busta.status === 'pagato' ? 'Pagato' : 'In elaborazione' }}
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredBustePaga.length === 0" class="empty-state">
        <i class="fas fa-file-invoice"></i>
        <h3>Nessuna busta paga disponibile</h3>
        <p>Genera la tua prima busta paga dal timesheet utilizzando il form sopra.</p>
        <div class="empty-state-hint">
          <i class="fas fa-lightbulb"></i>
          <span>Assicurati di avere registrato ore nel timesheet per il mese selezionato</span>
        </div>
      </div>
    </main>

    <!-- Modale Dettaglio Busta Paga -->
    <transition name="modal">
      <div v-if="showDetailModal" class="modal-overlay" @click="closeDetailModal">
        <div class="detail-modal-content" @click.stop>
          <div class="detail-modal-header">
            <div class="header-left">
              <div class="pdf-icon">
                <i class="fas fa-file-invoice"></i>
              </div>
              <div>
                <h2>{{ selectedBusta?.mese }}</h2>
                <p class="modal-subtitle">Dettaglio completo busta paga</p>
              </div>
            </div>
            <button class="close-modal-btn" @click="closeDetailModal">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="detail-modal-body">
            <!-- Informazioni Generali -->
            <div class="detail-section">
              <h3 class="section-title">
                <i class="fas fa-info-circle"></i>
                Informazioni Generali
              </h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Periodo di riferimento</span>
                  <span class="info-value">{{ selectedBusta?.mese }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Data emissione</span>
                  <span class="info-value">{{ selectedBusta?.dataEmissione }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Emessa da</span>
                  <span class="info-value">{{ selectedBusta?.emessaDa }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Status pagamento</span>
                  <span class="info-value status-badge" :class="selectedBusta?.status">
                    <i class="fas fa-check-circle"></i>
                    {{ selectedBusta?.status === 'pagato' ? 'Pagato' : 'In elaborazione' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Riepilogo Importi -->
            <div class="detail-section highlight-section">
              <h3 class="section-title">
                <i class="fas fa-euro-sign"></i>
                Riepilogo Importi
              </h3>
              <div class="amounts-grid">
                <div class="amount-card lordo">
                  <span class="amount-label">Retribuzione Lorda</span>
                  <span class="amount-value"
                    >€ {{ formatCurrency(selectedBusta?.importoLordo) }}</span
                  >
                </div>
                <div class="amount-card detrazioni">
                  <span class="amount-label">Totale Detrazioni</span>
                  <span class="amount-value"
                    >€ {{ formatCurrency(selectedBusta?.details?.total_deductions) }}</span
                  >
                </div>
                <div class="amount-card netto">
                  <span class="amount-label">Retribuzione Netta</span>
                  <span class="amount-value"
                    >€ {{ formatCurrency(selectedBusta?.importoNetto) }}</span
                  >
                </div>
              </div>
            </div>

            <!-- Dettaglio Retribuzione -->
            <div class="detail-section">
              <h3 class="section-title">
                <i class="fas fa-list-ul"></i>
                Dettaglio Retribuzione
              </h3>
              <div class="table-container">
                <table class="detail-table">
                  <thead>
                    <tr>
                      <th>Voce</th>
                      <th class="text-right">Importo</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Stipendio Base</td>
                      <td class="text-right">
                        € {{ formatCurrency(selectedBusta?.importoLordo * 0.75) }}
                      </td>
                    </tr>
                    <tr>
                      <td>Scatti di anzianità</td>
                      <td class="text-right">
                        € {{ formatCurrency(selectedBusta?.importoLordo * 0.1) }}
                      </td>
                    </tr>
                    <tr>
                      <td>Indennità varie</td>
                      <td class="text-right">
                        € {{ formatCurrency(selectedBusta?.importoLordo * 0.08) }}
                      </td>
                    </tr>
                    <tr>
                      <td>Superminimo</td>
                      <td class="text-right">
                        € {{ formatCurrency(selectedBusta?.importoLordo * 0.07) }}
                      </td>
                    </tr>
                    <tr class="total-row">
                      <td><strong>Totale Competenze</strong></td>
                      <td class="text-right">
                        <strong>€ {{ formatCurrency(selectedBusta?.importoLordo) }}</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Detrazioni e Contributi -->
            <div class="detail-section">
              <h3 class="section-title">
                <i class="fas fa-calculator"></i>
                Detrazioni e Contributi
              </h3>
              <div class="table-container">
                <table class="detail-table">
                  <thead>
                    <tr>
                      <th>Voce</th>
                      <th class="text-center">Aliquota</th>
                      <th class="text-right">Importo</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Contributi INPS</td>
                      <td class="text-center">
                        {{ formatPercentage(selectedBusta?.details?.deductions?.inps?.rate) }}
                      </td>
                      <td class="text-right text-red">
                        - € {{ formatCurrency(selectedBusta?.details?.deductions?.inps?.amount) }}
                      </td>
                    </tr>
                    <tr>
                      <td>IRPEF</td>
                      <td class="text-center">-</td>
                      <td class="text-right text-red">
                        - € {{ formatCurrency(selectedBusta?.details?.deductions?.irpef?.amount) }}
                      </td>
                    </tr>
                    <tr class="total-row">
                      <td colspan="2"><strong>Totale Detrazioni</strong></td>
                      <td class="text-right text-red">
                        <strong
                          >- €
                          {{ formatCurrency(selectedBusta?.details?.total_deductions) }}</strong
                        >
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Ore Lavorate e Ferie -->
            <div class="detail-section">
              <h3 class="section-title">
                <i class="fas fa-clock"></i>
                Ore Lavorate
              </h3>
              <div class="hours-inline">
                <div class="hours-item">
                  <i class="fas fa-business-time"></i>
                  <div>
                    <span class="hours-label">Ore Ordinarie</span>
                    <span class="hours-value"
                      >{{ selectedBusta?.details?.total_hours || 0 }} ore</span
                    >
                  </div>
                </div>
                <div class="hours-item">
                  <i class="fas fa-star"></i>
                  <div>
                    <span class="hours-label">Straordinari</span>
                    <span class="hours-value">0 ore</span>
                  </div>
                </div>
                <div class="hours-item">
                  <i class="fas fa-plane"></i>
                  <div>
                    <span class="hours-label">Ferie</span>
                    <span class="hours-value"
                      >{{ calculateVacationDays(selectedBusta?.details?.total_hours) }} gg</span
                    >
                  </div>
                </div>
              </div>
            </div>

            <!-- Note -->
            <div class="detail-section">
              <h3 class="section-title">
                <i class="fas fa-sticky-note"></i>
                Note e Comunicazioni
              </h3>
              <div class="notes-box">
                <p>
                  <i class="fas fa-info-circle"></i> Per qualsiasi chiarimento contattare l'ufficio
                  Risorse Umane all'indirizzo hr@coreteamdigital.com
                </p>
                <p>
                  <i class="fas fa-exclamation-triangle"></i> Il 13esima mensilità verrà erogata con
                  la busta paga di dicembre 2025
                </p>
              </div>
            </div>
          </div>

          <div class="detail-modal-footer">
            <button
              class="modal-recalc-btn"
              :disabled="isRecalculating"
              @click="ricalcolaBusta(selectedBusta)"
            >
              <i class="fas fa-sync-alt" :class="{ 'fa-spin': isRecalculating }"></i>
              {{ isRecalculating ? 'Ricalcolo...' : 'Ricalcola' }}
            </button>
            <button class="modal-download-btn" @click="downloadBusta(selectedBusta)">
              <i class="fas fa-download"></i>
              Scarica PDF
            </button>
            <button class="modal-close-btn" @click="closeDetailModal">Chiudi</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useNotificationStore } from '@/stores/notification';
import MainHeader from '@/components/MainHeader.vue';
import QuickActions from '@/components/QuickActions.vue';
import { jsPDF } from 'jspdf';
import API_URL from '@/config/api';

const notificationStore = useNotificationStore();
const selectedYear = ref('all');
const showDetailModal = ref(false);
const selectedBusta = ref(null);
const isGenerating = ref(false);
const isRecalculating = ref(false);
const generateForm = ref({
  month: '',
  year: '',
});

// Dati delle buste paga
const bustePaga = ref([]);

// Fetch payslips from backend
const fetchPayslips = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      notificationStore.showNotification('Sessione scaduta. Effettua il login.', 'error');
      return;
    }

    const response = await fetch(`${API_URL}/api/payslips`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (data.success) {
      // Converti i dati dal backend al formato del frontend
      bustePaga.value = data.payslips.map((p) => {
        // Parse salary_details se è una stringa JSON
        let details = {};
        if (p.salary_details) {
          try {
            details =
              typeof p.salary_details === 'string'
                ? JSON.parse(p.salary_details)
                : p.salary_details;
          } catch (e) {
            // Errore parsing salary_details - usa valori di default
          }
        }

        return {
          id: p.id,
          mese: p.month,
          anno: p.year,
          importoLordo: parseFloat(p.gross_amount),
          importoNetto: parseFloat(p.net_amount),
          dataEmissione: formatDateFromDB(p.issue_date),
          emessaDa: p.issued_by,
          status: p.status === 'paid' ? 'pagato' : 'in elaborazione',
          details: details, // Aggiungi i dettagli completi
        };
      });
    } else {
      notificationStore.showNotification('Errore nel caricamento delle buste paga', 'error');
    }
  } catch (error) {
    notificationStore.showNotification('Errore di connessione', 'error');
  }
};

// Formatta data dal database (YYYY-MM-DD) al formato italiano (DD/MM/YYYY)
const formatDateFromDB = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Load data on mount
onMounted(() => {
  fetchPayslips();
});

// Generate payslip from timesheet
const generatePayslip = async () => {
  if (!generateForm.value.month || !generateForm.value.year) {
    notificationStore.showNotification('Seleziona mese e anno', 'error');
    return;
  }

  isGenerating.value = true;

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      notificationStore.showNotification('Sessione scaduta. Effettua il login.', 'error');
      return;
    }

    const response = await fetch(`${API_URL}/api/payslips/generate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        month: generateForm.value.month,
        year: parseInt(generateForm.value.year),
      }),
    });

    const data = await response.json();

    if (data.success) {
      notificationStore.showNotification(
        `Busta paga generata! Importo netto: €${data.payslip.net_amount}`,
        'success'
      );

      // Resetta il form
      generateForm.value.month = '';
      generateForm.value.year = '';

      // Refresh list
      await fetchPayslips();
    } else {
      notificationStore.showNotification(data.message || 'Errore nella generazione', 'error');
    }
  } catch (error) {
    notificationStore.showNotification('Errore di connessione', 'error');
  } finally {
    isGenerating.value = false;
  }
};

const ricalcolaBusta = async (busta) => {
  if (!busta || !busta.id) {
    notificationStore.showNotification('Errore: busta paga non valida', 'error');
    return;
  }

  isRecalculating.value = true;

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      notificationStore.showNotification('Sessione scaduta. Effettua il login.', 'error');
      return;
    }

    const response = await fetch(`${API_URL}/api/payslips/${busta.id}/recalculate`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    // Log per debug
    if (import.meta.env.DEV) {
      console.log('Risposta ricalcolo:', { status: response.status, data });
    }

    if (!response.ok) {
      notificationStore.showNotification(
        data.message || `Errore ${response.status}: ${response.statusText}`,
        'error'
      );
      return;
    }

    if (data.success) {
      notificationStore.showNotification(
        'Busta paga aggiornata con i dati più recenti!',
        'success'
      );

      // Refresh list
      await fetchPayslips();

      // Aggiorna la busta selezionata nella modale
      if (showDetailModal.value && selectedBusta.value?.id === busta.id) {
        const updatedBusta = bustePaga.value.find((b) => b.id === busta.id);
        if (updatedBusta) {
          selectedBusta.value = updatedBusta;
        }
      }
    } else {
      notificationStore.showNotification(data.message || 'Errore durante il ricalcolo', 'error');
    }
  } catch (error) {
    console.error('Errore ricalcolo:', error);
    notificationStore.showNotification('Errore di connessione', 'error');
  } finally {
    isRecalculating.value = false;
  }
};

const filteredBustePaga = computed(() => {
  if (selectedYear.value === 'all') {
    return bustePaga.value;
  }
  return bustePaga.value.filter((busta) => busta.anno === parseInt(selectedYear.value));
});

const formatCurrency = (value) => {
  if (!value && value !== 0) return '0,00';
  return parseFloat(value).toFixed(2).replace('.', ',');
};

const formatPercentage = (value) => {
  if (!value) return '-';
  return `${(value * 100).toFixed(2)}%`;
};

const calculateVacationDays = (totalHours) => {
  if (!totalHours) return '0.00';
  // Calcolo approssimativo: 2.16 giorni di ferie al mese per 168 ore standard
  const vacationDays = (totalHours / 168) * 2.16;
  return vacationDays.toFixed(2);
};

const downloadBusta = (busta) => {
  // Usa i dati reali dai details
  const details = busta.details || {};
  const detrazioni = details.total_deductions || 0;
  const inpsAmount = details.deductions?.inps?.amount || 0;
  const irpefAmount = details.deductions?.irpef?.amount || 0;
  const totalHours = details.total_hours || 0;
  const hourlyRate = details.hourly_rate || 0;

  // Converti tutto in stringhe per evitare errori jsPDF
  const totalHoursStr = String(totalHours);

  // Crea nuovo documento PDF
  const doc = new jsPDF();

  let y = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // Header principale con brand
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('CORETEAM DIGITAL', pageWidth / 2, 12, { align: 'center' });
  doc.setFontSize(20);
  doc.text('BUSTA PAGA - CEDOLINO', pageWidth / 2, 22, { align: 'center' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(String(busta.mese || 'N/A'), pageWidth / 2, 32, { align: 'center' });

  y = 55;
  doc.setTextColor(0, 0, 0);

  // Sezione Informazioni Generali
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(99, 102, 241);
  doc.text('Informazioni Generali', margin, y);
  y += 8;

  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(`Periodo di riferimento: ${busta.mese}`, margin, y);
  y += 6;
  doc.text(`Data emissione: ${busta.dataEmissione}`, margin, y);
  y += 6;
  doc.text(`Emessa da: ${busta.emessaDa}`, margin, y);
  y += 6;
  doc.text(`Status: ${busta.status === 'pagato' ? 'PAGATO' : 'IN ELABORAZIONE'}`, margin, y);
  y += 12;

  // Sezione Riepilogo Importi (evidenziata)
  doc.setFillColor(248, 247, 254);
  doc.roundedRect(margin, y, contentWidth, 35, 3, 3, 'F');
  y += 8;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(99, 102, 241);
  doc.text('Riepilogo Importi', margin + 5, y);
  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text('Retribuzione Lorda:', margin + 5, y);
  doc.text(`€ ${formatCurrency(busta.importoLordo)}`, pageWidth - margin - 5, y, {
    align: 'right',
  });
  y += 6;

  doc.text('Totale Detrazioni:', margin + 5, y);
  doc.setTextColor(239, 68, 68);
  doc.text(`- € ${formatCurrency(detrazioni)}`, pageWidth - margin - 5, y, { align: 'right' });
  y += 2;

  doc.setDrawColor(150, 150, 150);
  doc.line(margin + 5, y, pageWidth - margin - 5, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(16, 185, 129);
  doc.text('Retribuzione Netta:', margin + 5, y);
  doc.text(`€ ${formatCurrency(busta.importoNetto)}`, pageWidth - margin - 5, y, {
    align: 'right',
  });
  y += 15;

  // Sezione Dettaglio Retribuzione
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(99, 102, 241);
  doc.text('Dettaglio Retribuzione', margin, y);
  y += 8;

  doc.setDrawColor(230, 230, 230);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Tabella retribuzione
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  const retribuzioneData = [
    ['Retribuzione oraria', `€ ${formatCurrency(hourlyRate)}/h`],
    ['Ore lavorate', `${totalHoursStr} ore`],
    ['Totale lordo', `€ ${formatCurrency(busta.importoLordo)}`],
  ];

  retribuzioneData.forEach(([voce, importo]) => {
    doc.text(voce, margin, y);
    doc.text(importo, pageWidth - margin, y, { align: 'right' });
    y += 6;
  });

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('TOTALE COMPETENZE', margin, y);
  doc.text(`€ ${formatCurrency(busta.importoLordo)}`, pageWidth - margin, y, { align: 'right' });
  y += 12;

  // Sezione Detrazioni e Contributi
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(99, 102, 241);
  doc.text('Detrazioni e Contributi', margin, y);
  y += 8;

  doc.setDrawColor(230, 230, 230);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  const detrazioniData = [
    [
      'Contributi INPS',
      formatPercentage(details.deductions?.inps?.rate),
      `€ ${formatCurrency(inpsAmount)}`,
    ],
    ['IRPEF', '-', `€ ${formatCurrency(irpefAmount)}`],
  ];

  detrazioniData.forEach(([voce, aliquota, importo]) => {
    doc.text(voce, margin, y);
    doc.text(aliquota, pageWidth / 2 - 10, y, { align: 'center' });
    doc.setTextColor(239, 68, 68);
    doc.text(`- ${importo}`, pageWidth - margin, y, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    y += 6;
  });

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('TOTALE DETRAZIONI', margin, y);
  doc.setTextColor(239, 68, 68);
  doc.text(`- € ${formatCurrency(detrazioni)}`, pageWidth - margin, y, { align: 'right' });
  doc.setTextColor(0, 0, 0);
  y += 12;

  // Sezione Ore Lavorate
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(99, 102, 241);
  doc.text('Ore Lavorate', margin, y);
  y += 8;

  doc.setDrawColor(230, 230, 230);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(`Ore Ordinarie: ${totalHoursStr} ore`, margin, y);
  doc.text('Straordinari: 0 ore', margin + 60, y);
  y += 12;

  // Sezione Ferie Maturate
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(99, 102, 241);
  doc.text('Ferie Maturate', margin, y);
  y += 8;

  doc.setDrawColor(230, 230, 230);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('FERIE', margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`Maturate nel mese: ${calculateVacationDays(totalHours)} gg`, margin + 5, y);
  y += 12;

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'italic');
  const footerText =
    'Documento generato da CoreTeam Digital il ' + new Date().toLocaleString('it-IT');
  doc.text(footerText, pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.text(
    "Questo documento ha valore informativo. Per certificazioni ufficiali rivolgersi all'ufficio HR.",
    pageWidth / 2,
    y,
    { align: 'center' }
  );

  // Salva il PDF
  const meseStr = String(busta.mese || 'busta-paga');
  const fileName = `coreteam-busta-paga-${meseStr.toLowerCase().replace(/\s/g, '-')}.pdf`;
  doc.save(fileName);

  notificationStore.showNotification(`Busta paga ${busta.mese} scaricata con successo`, 'success');
};

const viewBusta = (busta) => {
  selectedBusta.value = busta;
  showDetailModal.value = true;
};

const closeDetailModal = () => {
  showDetailModal.value = false;
  setTimeout(() => {
    selectedBusta.value = null;
  }, 300);
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
/* Main Content */
.buste-paga-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

/* Generate Section */
.generate-section {
  margin-bottom: 2rem;
}

.generate-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 2rem;
  color: white;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.25);
}

.generate-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.generate-header i {
  font-size: 2rem;
}

.generate-header h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.generate-description {
  margin: 0 0 1.5rem 0;
  opacity: 0.9;
  font-size: 1rem;
}

.generate-form .form-row {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 1rem;
  align-items: end;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field label {
  font-weight: 600;
  font-size: 0.9rem;
}

.form-field select {
  padding: 0.875rem 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.form-field select option {
  background: #764ba2;
  color: white;
}

.form-field select:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.2);
}

.generate-btn {
  padding: 0.875rem 2rem;
  background: white;
  color: #667eea;
  border: none;
  border-radius: 8px;
  font-family: 'DM Sans', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
}

.generate-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.generate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.generate-btn i.fa-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
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

.empty-state i.fa-file-invoice {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.3;
  color: #6366f1;
}

.empty-state h3 {
  font-size: 1.5rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.empty-state p {
  font-size: 1rem;
  color: #999;
  margin-bottom: 1.5rem;
}

.empty-state-hint {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  padding: 1rem 1.5rem;
  border-radius: 12px;
  color: #92400e;
  font-size: 0.9rem;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(251, 191, 36, 0.2);
}

.empty-state-hint i {
  font-size: 1.2rem;
  opacity: 1;
  color: #f59e0b;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .buste-paga-content {
    padding: 1.5rem;
  }
  .buste-paga-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
  .detail-modal-content {
    width: 95%;
    max-width: none;
    margin: 1rem;
  }
}

@media (max-width: 768px) {
  .buste-paga-content {
    padding: 1rem;
  }
  .filters-section {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
    padding: 1.25rem;
  }
  .filter-group {
    width: 100%;
  }
  .filter-group select {
    width: 100%;
  }
  .stats-card {
    justify-content: space-between;
    width: 100%;
  }
  .buste-paga-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  .busta-header {
    padding: 1rem;
  }
  .busta-title {
    font-size: 1rem;
  }
  .busta-details {
    padding: 1rem;
  }
  .detail-label {
    font-size: 0.75rem;
  }
  .detail-value {
    font-size: 0.9rem;
  }
  .busta-amount {
    font-size: 1.1rem;
  }
  .busta-footer {
    padding: 1rem;
    gap: 0.5rem;
  }
  .view-btn,
  .download-btn {
    padding: 0.6rem 1rem;
    font-size: 0.85rem;
  }

  .detail-modal-content {
    width: 100%;
    height: 100vh;
    border-radius: 0;
    margin: 0;
  }
  .detail-modal-body {
    max-height: calc(100vh - 180px);
  }
  .amounts-grid {
    grid-template-columns: 1fr;
  }
  .info-grid {
    grid-template-columns: 1fr;
  }
  .hours-inline {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .buste-paga-content {
    padding: 0.75rem;
  }
  .filters-section {
    padding: 1rem;
  }
  .stats-card {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
  .stat-item {
    justify-content: space-between;
  }
  .busta-footer {
    flex-direction: column;
  }
  .view-btn,
  .download-btn {
    width: 100%;
  }

  .hours-inline {
    flex-direction: column;
  }
  .detail-modal-footer {
    flex-direction: column-reverse;
  }
  .modal-download-btn,
  .modal-close-btn {
    width: 100%;
  }
}

/* Modale Dettaglio Completo */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 1rem;
  overflow-y: auto;
}

.detail-modal-content {
  background-color: #ffffff;
  border-radius: 16px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.detail-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem;
  border-bottom: 2px solid #f5f5f5;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.pdf-icon {
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

.detail-modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
}

.modal-subtitle {
  margin: 0.25rem 0 0 0;
  font-size: 0.9rem;
  color: #666;
}

.close-modal-btn {
  width: 40px;
  height: 40px;
  border: none;
  background-color: #f5f5f5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: #666;
}

.close-modal-btn:hover {
  background-color: #ef4444;
  color: white;
  transform: rotate(90deg);
}

.detail-modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
}

.detail-section {
  margin-bottom: 2rem;
  background-color: #fafafb;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid #e7e7ee;
}

.detail-section.highlight-section {
  background: linear-gradient(135deg, #f8f7fe 0%, #fafafb 100%);
  border: 2px solid #6366f1;
}

.section-title {
  margin: 0 0 1.25rem 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.section-title i {
  color: #6366f1;
  font-size: 1rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background-color: white;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #e7e7ee;
}

.info-label {
  font-size: 0.85rem;
  color: #666;
  font-weight: 500;
}

.info-value {
  font-size: 1rem;
  color: #333;
  font-weight: 600;
}

.info-value.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
  width: fit-content;
}

.info-value.status-badge.pagato {
  background-color: #d1fae5;
  color: #065f46;
}

.amounts-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.amount-card {
  background-color: white;
  padding: 1.5rem;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  border: 2px solid;
  transition: all 0.3s ease;
}

.amount-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.amount-card.lordo {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%);
}

.amount-card.detrazioni {
  border-color: #f59e0b;
  background: linear-gradient(135deg, #fffbeb 0%, #ffffff 100%);
}

.amount-card.netto {
  border-color: #10b981;
  background: linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%);
}

.amount-label {
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
}

.amount-value {
  font-size: 1.8rem;
  font-weight: 700;
}

.amount-card.lordo .amount-value {
  color: #3b82f6;
}

.amount-card.detrazioni .amount-value {
  color: #f59e0b;
}

.amount-card.netto .amount-value {
  color: #10b981;
}

.table-container {
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e7e7ee;
}

.detail-table {
  width: 100%;
  border-collapse: collapse;
}

.detail-table thead {
  background-color: #f8f9fa;
}

.detail-table th {
  padding: 1rem;
  text-align: left;
  font-size: 0.85rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-table td {
  padding: 1rem;
  border-top: 1px solid #f5f5f5;
  font-size: 0.95rem;
  color: #333;
}

.detail-table .text-right {
  text-align: right;
}

.detail-table .text-center {
  text-align: center;
}

.detail-table .text-red {
  color: #ef4444;
  font-weight: 600;
}

.detail-table .total-row {
  background-color: #f8f9fa;
  font-weight: 600;
}

.hours-inline {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.hours-item {
  background-color: white;
  padding: 1.25rem;
  border-radius: 8px;
  border: 1px solid #e7e7ee;
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  min-width: 150px;
  transition: all 0.3s ease;
}

.hours-item:hover {
  border-color: #6366f1;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1);
}

.hours-item i {
  font-size: 1.5rem;
  color: #6366f1;
}

.hours-item > div {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.hours-label {
  font-size: 0.8rem;
  color: #666;
}

.hours-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #333;
}

.leave-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.leave-card {
  background-color: white;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid #e7e7ee;
}

.leave-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f5f5f5;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
}

.leave-header i {
  color: #6366f1;
  font-size: 1.2rem;
}

.leave-stats {
  display: flex;
  justify-content: space-around;
}

.leave-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.leave-stat-label {
  font-size: 0.85rem;
  color: #666;
}

.leave-stat-value {
  font-size: 1.3rem;
  font-weight: 700;
  color: #333;
}

.leave-stat-value.green {
  color: #10b981;
}

.notes-box {
  background-color: white;
  padding: 1.5rem;
  border-radius: 8px;
  border-left: 4px solid #6366f1;
}

.notes-box p {
  margin: 0.75rem 0;
  font-size: 0.9rem;
  color: #666;
  line-height: 1.6;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.notes-box p i {
  color: #6366f1;
  margin-top: 0.25rem;
}

.detail-modal-footer {
  display: flex;
  gap: 1rem;
  padding: 1.5rem 2rem;
  border-top: 2px solid #f5f5f5;
  background-color: #fafafb;
}

.modal-download-btn,
.modal-close-btn,
.modal-recalc-btn {
  flex: 1;
  padding: 1rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.modal-recalc-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.modal-recalc-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.modal-recalc-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.modal-recalc-btn i.fa-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.modal-download-btn {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

.modal-download-btn:hover {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.modal-close-btn {
  background-color: #f5f5f5;
  color: #666;
}

.modal-close-btn:hover {
  background-color: #e7e7ee;
  color: #333;
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

/* ==================== RESPONSIVE DESIGN ==================== */

/* Tablet (max 768px) */
@media (max-width: 768px) {
  .generate-form .form-row {
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  .generate-btn {
    grid-column: 1 / -1;
    width: 100%;
    justify-content: center;
  }

  .filters-section {
    flex-direction: column;
    gap: 1rem;
  }

  .buste-paga-grid {
    grid-template-columns: 1fr;
  }

  /* Modal ottimizzata per tablet */
  .detail-modal-content {
    max-width: 90%;
  }

  .amounts-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}

/* Mobile (max 480px) */
@media (max-width: 480px) {
  .generate-card {
    padding: 1.5rem;
  }

  .generate-header {
    flex-direction: column;
    text-align: center;
  }

  .generate-header h3 {
    font-size: 1.25rem;
  }

  .generate-form .form-row {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .form-field select {
    padding: 0.75rem;
    font-size: 0.9rem;
  }

  .generate-btn {
    padding: 0.75rem 1.5rem;
    font-size: 0.9rem;
  }

  .busta-card {
    padding: 1.25rem;
  }

  /* Modal completamente responsive per mobile */
  .detail-modal-content {
    width: 95%;
    max-width: 100%;
    max-height: 95vh;
    border-radius: 12px;
  }

  .detail-modal-header {
    padding: 1rem 1.25rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .header-left {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .pdf-icon {
    width: 50px;
    height: 50px;
    font-size: 1.5rem;
  }

  .detail-modal-header h2 {
    font-size: 1.25rem;
  }

  .detail-modal-header .date-badge {
    font-size: 0.8rem;
    padding: 0.375rem 0.75rem;
  }

  .close-modal-btn {
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: 32px;
    height: 32px;
    font-size: 1.25rem;
  }

  .detail-modal-body {
    padding: 1.25rem;
  }

  .detail-section {
    padding: 1.25rem;
    margin-bottom: 1.5rem;
  }

  .section-title {
    font-size: 1rem;
    margin-bottom: 1rem;
  }

  .info-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .info-item {
    padding: 0.875rem;
  }

  .info-label {
    font-size: 0.8rem;
  }

  .info-value {
    font-size: 0.95rem;
  }

  /* Amounts grid in una colonna su mobile */
  .amounts-grid {
    grid-template-columns: 1fr;
    gap: 0.875rem;
  }

  .amount-card {
    padding: 1.25rem;
  }

  .amount-label {
    font-size: 0.8rem;
  }

  .amount-icon {
    font-size: 1.25rem;
  }

  .amount-value {
    font-size: 1.5rem;
  }

  /* Footer modal */
  .detail-modal-footer {
    flex-direction: column;
    padding: 1rem 1.25rem;
    gap: 0.75rem;
  }

  .modal-download-btn,
  .modal-close-btn,
  .modal-recalc-btn {
    width: 100%;
    padding: 0.875rem 1.25rem;
    font-size: 0.9rem;
  }

  /* Notes box */
  .notes-box {
    padding: 1rem;
  }

  .notes-box h4 {
    font-size: 0.9rem;
  }

  .notes-box p {
    font-size: 0.85rem;
  }
}

/* Extra small mobile (max 360px) */
@media (max-width: 360px) {
  .detail-modal-content {
    width: 98%;
    border-radius: 8px;
  }

  .detail-modal-header {
    padding: 0.875rem 1rem;
  }

  .detail-modal-body {
    padding: 1rem;
  }

  .detail-section {
    padding: 1rem;
  }

  .amount-card {
    padding: 1rem;
  }

  .amount-value {
    font-size: 1.25rem;
  }
}
</style>
