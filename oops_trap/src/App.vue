<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
export default {
  name: "App",
  mounted() {
    // // Временный тест Sentry
    // if (Sentry) {
    //   Sentry.captureMessage("App.vue mounted - test message");
    //   Sentry.captureException(new Error("App.vue mounted - test error"));
    // }
  },
};
</script>

<style>
#app {
  font-family: "Segoe UI", Roboto, sans-serif;
}
</style>
