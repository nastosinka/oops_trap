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
  dsn: "https://eadcbc33a1eade14aa6ae86fb5314d03@o4510349567393797.ingest.de.sentry.io/4510349569425488",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
  integrations: [
    Sentry.browserTracingIntegration({ router })
  ],
  // Tracing
  tracesSampleRate: 1.0, // Capture 100% of the transactions
  // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
  tracePropagationTargets: ["localhost", /^\//],
  // Logs
  enableLogs: true
});

app.use(createPinia());
app.use(router);

app.mount("#app");
