// main.js - Entry point for the bots.pm web application

import './styles.css';
import { createApp } from 'vue';
import App from './App.vue';
import { createRouter, createWebHistory } from 'vue-router';

// Import components
import Login from './components/Login.vue';
import Dashboard from './components/Dashboard.vue';
import Settings from './components/Settings.vue';
import Bots from './components/Bots.vue';

// Create router
const routes = [
  { path: '/', component: Login },
  { path: '/dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/settings', component: Settings, meta: { requiresAuth: true } },
  { path: '/bots', component: Bots, meta: { requiresAuth: true } }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Navigation guard
router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem('authToken');
  
  if (to.matched.some(record => record.meta.requiresAuth) && !isAuthenticated) {
    next('/');
  } else {
    next();
  }
});

// Create app
const app = createApp(App);

// Use router
app.use(router);

// Mount app
app.mount('#app');