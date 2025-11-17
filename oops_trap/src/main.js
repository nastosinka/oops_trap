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
  dsn: import.meta.env.SENTRY_DSN,
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  release: "myapp@1.0.0",
  environment: import.meta.env.MODE,
  sendDefaultPii: true,
  integrations: [Sentry.browserTracingIntegration({ router })],
  // Tracing
  tracesSampleRate: 1.0, // Capture 100% of the transactions
  // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
  tracePropagationTargets: ["localhost", /^\//],
  // Logs
  enableLogs: true,
});

app.config.errorHandler = (err) => {
  Sentry.captureException(err);
  console.error(err);
};


app.use(createPinia());
app.use(router);

app.mount("#app");
