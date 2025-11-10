import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useNotificationStore = defineStore('notification', () => {
  const notification = ref({
    show: false,
    message: '',
    type: 'success', // 'success' o 'error'
  });

  function showNotification(message, type = 'success') {
    notification.value = {
      show: true,
      message,
      type,
    };

    setTimeout(() => {
      notification.value.show = false;
    }, 4000);
  }

  function hideNotification() {
    notification.value.show = false;
  }

  return {
    notification,
    showNotification,
    hideNotification,
  };
});
