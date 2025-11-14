import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import DefaultLayout from '../DefaultLayout.vue'
import DashboardView from '../views/DashboardView.vue'
import LoginView from '../views/LoginView.vue'
import ProfileView from '../views/ProfileView.vue'
import OpinioesView from '../views/OpinioesView.vue'
import SentimentoView from '../views/SentimentoView.vue'
import TopicosView from '../views/TopicosView.vue'
import TendenciasView from '../views/TendenciasView.vue'
import PublicacoesView from '../views/PublicacoesView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { 
      path: '/login', 
      name: 'login', 
      component: LoginView,
      meta: { requiresAuth: false }
    },
    { 
      path: '/register', 
      name: 'register', 
      component: () => import('../views/RegisterView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      component: DefaultLayout,
      meta: { requiresAuth: true },
      children: [
        { path: '', name: 'dashboard', component: DashboardView },
        { path: 'profile', name: 'profile', component: ProfileView },
        { path: 'opinioes', name: 'opinioes', component: OpinioesView },
        { path: 'sentimentos', name: 'sentimentos', component: SentimentoView },
        { path: 'topicos', name: 'topicos', component: TopicosView },
        { path: 'tendencias', name: 'tendencias', component: TendenciasView },
        { path: 'publicacoes', name: 'publicacoes', component: PublicacoesView },
      ],
    },
  ],
})

// Navigation guard para verificar autenticação
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  // Limpa tokens inválidos antes de verificar autenticação
  authStore.clearInvalidAuth()
  
  // Se a rota requer autenticação e o usuário não está autenticado
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login' })
  } 
  // Se o usuário está autenticado e tenta acessar a página de login, redireciona para dashboard
  else if (to.name === 'login' && authStore.isAuthenticated) {
    next({ name: 'dashboard' })
  } 
  else {
    next()
  }
})

export default router
