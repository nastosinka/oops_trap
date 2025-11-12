import { createApp } from "vue";
import { createPinia } from "pinia";
import vkBridge from "@vkontakte/vk-bridge";
import App from "./App.vue";
import router from "./router";
import "@mdi/font/css/materialdesignicons.css";

import * as Sentry from "@sentry/vue";
import { BrowserTracing } from "@sentry/tracing";

vkBridge.send("VKWebAppInit");

const app = createApp(App);

Sentry.init({
  app,
  dsn: "https://eadcbc33a1eade14aa6ae86fb5314d03@o4510349567393797.ingest.de.sentry.io/4510349569425488",
  integrations: [
    new BrowserTracing({
      routingInstrumentation: Sentry.vueRouterInstrumentation(router),
      tracingOrigins: ["localhost", /^\//],
    }),
  ],
  tracesSampleRate: 1.0,
});

app.use(createPinia());
app.use(router);

app.mount("#app");
