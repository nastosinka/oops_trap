import { initYandexMetrika } from 'yandex-metrika-vue3';

// Инициализация
const yandexMetrika = initYandexMetrika({
  id: 106318124, // ваш ID счётчика
  webvisor: true,
  router: router, // передаём экземпляр router
  // другие опции
});

export default yandexMetrika;