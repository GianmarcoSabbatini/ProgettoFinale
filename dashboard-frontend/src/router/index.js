import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import Login from '../views/login.vue';
import Register from '../views/Register.vue';
import ResetPassword from '../views/ResetPassword.vue';
import Dashboard from '../views/dashboard.vue';
import BustePaga from '../views/BustePaga.vue';
import Timesheet from '../views/Timesheet.vue';
import RimborsoSpese from '../views/RimborsoSpese.vue';

const routes = [
  {
    path: '/',
    redirect: '/dashboard', // Redirige a dashboard (che poi il guard verificherà)
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: ResetPassword,
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }, // Questa rotta richiede l'autenticazione
  },
  {
    path: '/buste-paga',
    name: 'BustePaga',
    component: BustePaga,
    meta: { requiresAuth: true }, // Questa rotta richiede l'autenticazione
  },
  {
    path: '/timesheet',
    name: 'Timesheet',
    component: Timesheet,
    meta: { requiresAuth: true }, // Questa rotta richiede l'autenticazione
  },
  {
    path: '/rimborso-spese',
    name: 'RimborsoSpese',
    component: RimborsoSpese,
    meta: { requiresAuth: true }, // Questa rotta richiede l'autenticazione
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation Guard (Controllo prima di ogni cambio di rotta)
router.beforeEach((to, from, next) => {
  // È importante inizializzare lo store qui dentro perché sia disponibile
  const authStore = useAuthStore();

  const isLoggedIn = authStore.isAuthenticated;

  if (to.meta.requiresAuth && !isLoggedIn) {
    // Se la rotta richiede autenticazione e l'utente non è loggato,
    // reindirizzalo al login.
    next({ name: 'Login' });
  } else if ((to.name === 'Login' || to.name === 'Register') && isLoggedIn) {
    // Se l'utente è già loggato e prova ad andare al login o registrazione,
    // reindirizzalo alla dashboard.
    next({ name: 'Dashboard' });
  } else {
    // In tutti gli altri casi, procedi.
    next();
  }
});

export default router;
