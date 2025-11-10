import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useLoadingStore = defineStore('loading', () => {
  const isLoading = ref(false);
  const loadingMessage = ref('Caricamento...');

  function startLoading(message = 'Caricamento...') {
    isLoading.value = true;
    loadingMessage.value = message;
  }

  function stopLoading() {
    isLoading.value = false;
    loadingMessage.value = 'Caricamento...';
  }

  return {
    isLoading,
    loadingMessage,
    startLoading,
    stopLoading,
  };
});
