<template>
  <header class="main-header">
    <div class="logo">
      <svg class="logo-icon" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <!-- Cerchio esterno -->
        <circle cx="20" cy="20" r="18" fill="none" stroke="url(#gradient1)"
stroke-width="2" />
        <!-- Tre figure interconnesse (team) -->
        <circle cx="20" cy="12" r="4" fill="url(#gradient1)" />
        <circle cx="14" cy="24" r="4" fill="url(#gradient1)" />
        <circle cx="26" cy="24" r="4" fill="url(#gradient1)" />
        <!-- Linee di connessione -->
        <line
          x1="20"
          y1="16"
          x2="16"
          y2="20"
          stroke="url(#gradient1)"
          stroke-width="2"
          stroke-linecap="round"
        />
        <line
          x1="20"
          y1="16"
          x2="24"
          y2="20"
          stroke="url(#gradient1)"
          stroke-width="2"
          stroke-linecap="round"
        />
        <line
          x1="18"
          y1="24"
          x2="22"
          y2="24"
          stroke="url(#gradient1)"
          stroke-width="2"
          stroke-linecap="round"
        />
        <!-- Gradiente -->
        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color: #6366f1; stop-opacity: 1" />
            <stop offset="100%" style="stop-color: #8b5cf6; stop-opacity: 1" />
          </linearGradient>
        </defs>
      </svg>
      <span class="logo-text">CoreTeam Digital</span>
    </div>
    <nav class="main-nav">
      <!-- Dashboard action è nelle quick actions di ogni pagina -->
    </nav>
    <div class="header-actions">
      <div class="notification-container">
        <i
          class="fas fa-bell action-icon"
          :class="{ 'has-notifications': headerNotificationStore.notifications.length > 0 }"
          @click="toggleNotifications"
        ></i>
        <span v-if="headerNotificationStore.notifications.length > 0" class="notification-badge">{{
          headerNotificationStore.notifications.length
        }}</span>

        <!-- Dropdown Notifiche -->
        <transition name="dropdown">
          <div v-if="showNotifications" class="notifications-dropdown">
            <div class="notifications-header">
              <h3>Notifiche</h3>
              <button
                class="clear-all-btn"
                @click="headerNotificationStore.clearAllNotifications()"
              >
                Cancella tutto
              </button>
            </div>
            <div class="notifications-list">
              <div
                v-if="headerNotificationStore.notifications.length === 0"
                class="no-notifications"
              >
                <i class="fas fa-inbox"></i>
                <p>Nessuna notifica</p>
              </div>
              <div
                v-for="notification in headerNotificationStore.notifications"
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
                <button
                  class="remove-notification"
                  @click="headerNotificationStore.removeNotification(notification.id)"
                >
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>
        </transition>
      </div>
      <button class="logout-button" title="Logout" @click="openLogoutModal">
        <i class="fas fa-sign-out-alt action-icon"></i>
      </button>
    </div>

    <!-- Modale Conferma Logout -->
    <transition name="modal">
      <div v-if="showLogoutModal" class="modal-overlay" @click="cancelLogout">
        <div class="logout-modal-content" @click.stop>
          <div class="logout-modal-icon">
            <i class="fas fa-sign-out-alt"></i>
          </div>
          <h3 class="logout-modal-title">Conferma Logout</h3>
          <p class="logout-modal-text">Sei sicuro di voler uscire dal tuo account?</p>
          <div class="logout-modal-actions">
            <button class="cancel-logout-modal-btn" @click="cancelLogout">
              <i class="fas fa-times"></i> Annulla
            </button>
            <button class="confirm-logout-btn" @click="confirmLogout">
              <i class="fas fa-sign-out-alt"></i> Esci
            </button>
          </div>
        </div>
      </div>
    </transition>
  </header>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useHeaderNotificationStore } from '@/stores/headerNotification';

const authStore = useAuthStore();
const headerNotificationStore = useHeaderNotificationStore();

// Sistema Notifiche
const showNotifications = ref(false);

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value;
};

const getNotificationIcon = (type) => {
  switch (type) {
    case 'success':
      return 'fas fa-check-circle';
    case 'warning':
      return 'fas fa-exclamation-triangle';
    case 'message':
      return 'fas fa-envelope';
    default:
      return 'fas fa-info-circle';
  }
};

// Logout con modale
const showLogoutModal = ref(false);

const openLogoutModal = () => {
  showLogoutModal.value = true;
};

const cancelLogout = () => {
  showLogoutModal.value = false;
};

const confirmLogout = () => {
  showLogoutModal.value = false;
  authStore.logout();
};
</script>

<style scoped>
.main-header {
  display: flex;
  align-items: center;
  padding: 1rem 2rem;
  background-color: #ffffff;
  border-bottom: 1px solid #e0e0e0;
}
.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.5rem;
  font-weight: bold;
}
.logo-icon {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
}
.logo-text {
  font-size: 1.25rem;
  font-weight: 700;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.main-nav {
  margin: 0 auto;
  display: flex;
  gap: 1.5rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  font-size: 1.2rem;
  color: #777;
}

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
  0%,
  100% {
    transform: rotate(0deg);
  }
  10%,
  30% {
    transform: rotate(-10deg);
  }
  20%,
  40% {
    transform: rotate(10deg);
  }
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

.clear-all-btn:hover {
  color: #3600a8;
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
  background-color: #f0f0f0;
  color: #666;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.3s ease;
}

.dropdown-enter-from,
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

/* Logout Modal */
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
  z-index: 2000;
  padding: 1rem;
}

.logout-modal-content {
  background-color: #ffffff;
  border-radius: 16px;
  width: 100%;
  max-width: 450px;
  padding: 2rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
}

.logout-modal-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem auto;
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: #ff9800;
}

.logout-modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 1rem;
}

.logout-modal-text {
  font-size: 0.95rem;
  color: #666;
  line-height: 1.6;
  margin-bottom: 2rem;
}

.logout-modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.cancel-logout-modal-btn,
.confirm-logout-btn {
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
  font-family: 'DM Sans', sans-serif;
}

.cancel-logout-modal-btn {
  background-color: #f5f5f5;
  color: #666;
}

.cancel-logout-modal-btn:hover {
  background-color: #e0e0e0;
  color: #333;
}

.confirm-logout-btn {
  background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
}

.confirm-logout-btn:hover {
  background: linear-gradient(135deg, #f57c00 0%, #ef6c00 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.4);
}

.confirm-logout-btn:active {
  transform: translateY(0);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

@media (max-width: 1024px) {
  .main-header {
    padding: 0.75rem 1.5rem;
  }
  .logo {
    font-size: 1.3rem;
  }
  .logo-icon {
    width: 32px;
    height: 32px;
  }
  .logo-text {
    font-size: 1.15rem;
  }
}

@media (max-width: 768px) {
  .main-header {
    padding: 0.75rem 1rem;
  }
  .logo {
    font-size: 1.2rem;
    gap: 0.5rem;
  }
  .logo-icon {
    width: 28px;
    height: 28px;
  }
  .logo-text {
    font-size: 1.05rem;
  }
  .main-nav {
    display: flex;
  }
  .header-actions {
    gap: 1rem;
    font-size: 1.1rem;
  }
  .notifications-dropdown {
    width: 320px;
    max-height: 400px;
    right: -10px;
  }
  .notifications-header {
    padding: 0.85rem 1rem;
  }
  .notifications-header h3 {
    font-size: 1rem;
  }
  .notification-item {
    padding: 0.85rem 1rem;
  }
  .notification-icon {
    width: 36px;
    height: 36px;
    font-size: 0.9rem;
  }
  .notification-sender {
    font-size: 0.85rem;
  }
  .notification-message {
    font-size: 0.8rem;
  }
  .notification-time {
    font-size: 0.7rem;
  }
  .logout-modal-content {
    padding: 1.5rem;
    max-width: 90%;
  }
  .logout-modal-icon {
    width: 70px;
    height: 70px;
    font-size: 1.8rem;
  }
  .logout-modal-title {
    font-size: 1.3rem;
  }
  .logout-modal-text {
    font-size: 0.9rem;
  }
  .cancel-logout-modal-btn,
  .confirm-logout-btn {
    padding: 0.65rem 1.25rem;
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .main-header {
    padding: 0.75rem;
  }
  .logo {
    font-size: 1.1rem;
    gap: 0.4rem;
  }
  .logo-icon {
    width: 24px;
    height: 24px;
  }
  .logo-text {
    font-size: 0.95rem;
  }
  .header-actions {
    gap: 0.75rem;
    font-size: 1rem;
  }
  .notifications-dropdown {
    width: calc(100vw - 20px);
    right: -5px;
  }
  .logout-modal-actions {
    flex-direction: column;
    gap: 0.5rem;
  }
  .cancel-logout-modal-btn,
  .confirm-logout-btn {
    width: 100%;
  }
}
</style>
