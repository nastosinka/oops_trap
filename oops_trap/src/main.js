import { createApp } from "vue";
import { createPinia } from "pinia";
import vkBridge from "@vkontakte/vk-bridge";
import App from "./App.vue";
import router from "./router";
import "@mdi/font/css/materialdesignicons.css";


import * as Sentry from "@sentry/vue";

vkBridge.send("VKWebAppInit");

const app = createApp(App);

Sentry.init({
  app,
  dsn: import.meta.env.VITE_SENTRY_DSN,
  release: "myapp@1.0.0",
  environment: import.meta.env.MODE,
  sendDefaultPii: true,
  integrations: [Sentry.browserTracingIntegration({ router })],
  tracesSampleRate: 1.0, 
  tracePropagationTargets: ["localhost", import.meta.env.VITE_SERVER_IP, /^\//],
  enableLogs: true,
});

app.config.errorHandler = (err) => {
  Sentry.captureException(err);
  console.error(err);
};

app.use(createPinia());

app.use(router);

app.mount("#app");
