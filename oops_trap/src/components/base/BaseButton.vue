<template>
  <button class="base-button" @click="handleClick">
    <div class="base-button__content">
      <slot>{{ label }}</slot>
    </div>
  </button>
</template>

<script>
export default {
  name: 'BaseButton',

  props: {
    label: {
      type: String,
      default: ''
    }
  },

  emits: ['click'],

  methods: {
    handleClick(event) {
      this.$emit('click', event)
    }
  }
}
</script>

<style>
.base-button {
  border: none;
  border-radius: 8px;
  font-family: inherit;
  text-decoration: none;
  cursor: pointer;
  outline: none;
  line-height: 1;

  background-color: rgba(69, 114, 112);
  color: white;
  box-shadow: 0 4px 4px rgba(255, 255, 255, 0.4);

  font-family: 'Irish Grover', system-ui;
  font-weight: 400;
  font-style: normal;
  min-height: 44px;
}

.base-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

@media (min-width: 1200px) {
  .base-button {
    max-width: 400px;
    width: 90%;
    font-size: 24px;
    padding: 8px 40px;
  }
}

@media (min-width: 768px) and (max-width: 1199px) {
  .base-button {
    max-width: 350px;
    width: 90%;
    font-size: 20px;
    padding: 8px 28px;
  }
}

@media (max-width: 767px) {
  .base-button {
    max-width: 300px;
    width: 80%;
    font-size: 16px;
    padding: 8px 16px;
  }
}

@media (max-width: 480px) {
  .base-button {
    max-width: 250px;
    width: 80%;
    font-size: 14px;
    padding: 8px 12px;
  }
}
</style>
