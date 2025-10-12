import { createRouter, createWebHistory } from 'vue-router'
import DefaultLayout from '../DefaultLayout.vue'
import DashboardView from '../views/DashboardView.vue'
import LoginView from '../views/LoginView.vue'
import ProfileView from '../views/ProfileView.vue'
import OpinioesView from '../views/OpinioesView.vue'
import EmocoesView from '../views/EmocoesView.vue'
import TopicosView from '../views/TopicosView.vue'
import TendenciasView from '../views/TendenciasView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'login', component: LoginView },
    {
      path: '/',
      component: DefaultLayout,
      children: [
        { path: '', name: 'dashboard', component: DashboardView },
        { path: 'profile', name: 'profile', component: ProfileView },
        { path: 'opinioes', name: 'opinioes', component: OpinioesView },
        { path: 'emocoes', name: 'emocoes', component: EmocoesView },
        { path: 'topicos', name: 'topicos', component: TopicosView },
        { path: 'tendencias', name: 'tendencias', component: TendenciasView },
      ],
    },
  ],
})

export default router
