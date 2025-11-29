<template>
  <div>
    <a :href="to" @click.prevent="goToAnother"> {{ title }} </a>
  </div>
</template>

<script>
export default {
  name: "MyRouterLink",
  props: {
    to: {
      type: String,
      default: "",
    },
    title: {
      type: String,
      default: "",
    },
  },
  methods: {
    goToAnother() {
      this.$router.push(this.to);
    },
    linkReturn() {
      return this.to;
    },
  },
};
</script>
