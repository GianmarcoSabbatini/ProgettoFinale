<template>
  <section class="quick-actions">
    <router-link 
      to="/dashboard" 
      class="action-card" 
      :class="{ active: activePage === 'dashboard' }"
    >
      <i class="fas fa-home icon"></i>
      <span>Dashboard</span>
    </router-link>
    <router-link 
      to="/buste-paga" 
      class="action-card"
      :class="{ active: activePage === 'buste-paga' }"
    >
      <i class="fas fa-file-invoice-dollar icon"></i>
      <span>Buste Paga</span>
    </router-link>
    <router-link 
      to="/timesheet" 
      class="action-card"
      :class="{ active: activePage === 'timesheet' }"
    >
      <i class="fas fa-clock icon"></i>
      <span>Timesheet</span>
    </router-link>
    <router-link 
      to="/rimborso-spese" 
      class="action-card"
      :class="{ active: activePage === 'rimborso-spese' }"
    >
      <i class="fas fa-wallet icon"></i>
      <span>Rimborso spese</span>
    </router-link>
  </section>
</template>

<script setup>
defineProps({
  activePage: {
    type: String,
    required: true,
    validator: (value) => ['dashboard', 'buste-paga', 'timesheet', 'rimborso-spese'].includes(value)
  }
});
</script>

<style scoped>
.quick-actions { 
  display: flex; 
  justify-content: center; 
  gap: 1rem; 
  margin-bottom: 2rem;
  padding: 2rem 2rem 0 2rem;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
}

.action-card {
  flex: 0 1 auto;
  min-width: 180px;
  max-width: 220px;
  background-color: #e8e1f9;
  border: 2px solid #e8e1f9;
  border-radius: 16px;
  padding: 1.5rem 1rem;
  text-align: center;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.action-card:hover { 
  border-color: #4b00e9;
  transform: translateY(-2px);
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

/* Responsive styles */
@media (max-width: 1024px) {
  .quick-actions { 
    flex-wrap: wrap; 
    gap: 0.75rem;
    padding: 1.5rem 1.5rem 0 1.5rem;
  }
  
  .action-card { 
    padding: 1.25rem 0.75rem; 
    min-width: 150px;
  }
  
  .action-card .icon { 
    font-size: 1.3rem; 
  }
  
  .action-card span { 
    font-size: 0.85rem; 
  }
}

@media (max-width: 768px) {
  .quick-actions { 
    flex-direction: column; 
    gap: 0.75rem; 
    margin-bottom: 1.5rem;
    padding: 1rem 1rem 0 1rem;
  }
  
  .action-card { 
    padding: 1rem 0.5rem; 
    max-width: 100%;
  }
  
  .action-card .icon { 
    font-size: 1.2rem; 
    margin-bottom: 0.4rem; 
  }
  
  .action-card span { 
    font-size: 0.8rem; 
  }
}

@media (max-width: 480px) {
  .quick-actions { 
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem 0.75rem 0 0.75rem;
  }
  
  .action-card { 
    padding: 1rem;
    max-width: 100%;
  }
  
  .action-card .icon { 
    font-size: 1.3rem; 
  }
  
  .action-card span { 
    font-size: 0.85rem; 
  }
}
</style>
