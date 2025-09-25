import { createApp } from 'vue'
import { createPinia } from 'pinia'
import vkBridge from '@vkontakte/vk-bridge'
import App from './App.vue'
import router from './router'

vkBridge.send('VKWebAppInit')

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
