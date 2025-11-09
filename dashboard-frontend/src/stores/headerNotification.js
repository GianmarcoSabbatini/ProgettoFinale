import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useHeaderNotificationStore = defineStore('headerNotification', () => {
    const notifications = ref([]);
    let notificationIdCounter = 1;

    function addNotification(sender, message, type = 'info') {
        // Validazione sender: evita valori vuoti, null, undefined o "0"
        if (!sender || sender === '0' || String(sender).trim() === '') {
            if (import.meta.env.DEV) {
                console.warn('Tentativo di creare notifica con sender invalido:', sender);
            }
            sender = 'Sistema'; // Valore di default
        }
        
        const now = new Date();
        const timeString = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        
        notifications.value.unshift({
            id: notificationIdCounter++,
            sender: sender,
            message: message,
            time: timeString,
            type: type
        });
    }

    function removeNotification(id) {
        notifications.value = notifications.value.filter(n => n.id !== id);
    }

    function clearAllNotifications() {
        notifications.value = [];
    }

    function getNotificationIcon(type) {
        switch(type) {
            case 'success': return 'fas fa-check-circle';
            case 'warning': return 'fas fa-exclamation-triangle';
            case 'message': return 'fas fa-envelope';
            default: return 'fas fa-info-circle';
        }
    }

    return {
        notifications,
        addNotification,
        removeNotification,
        clearAllNotifications,
        getNotificationIcon
    };
});
