import { createYandexMetrika } from 'yandex-metrika-vue3'

const yandexMetrika = createYandexMetrika({
  id: YOUR_COUNTER_ID, // замените на ваш ID счетчика
  router, // передаем router для отслеживания переходов
  env: process.env.NODE_ENV,
  options: {
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: true,
    ecommerce: true
  }
})

export default yandexMetrika