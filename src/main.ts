import { createApp } from 'vue'
import { createPinia } from 'pinia' // Importe o createPinia
import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia() // Crie a instância do Pinia

app.use(pinia) // Use o Pinia
app.use(router)

app.mount('#app')
