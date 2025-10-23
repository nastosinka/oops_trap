<template>
  <button :class="['base-button', `base-button--${size}`]" @click="handleClick">
    <div class="base-button__content">
      <slot>{{ label }}</slot>
    </div>
  </button>
</template>

<script>
export default {
  name: "BaseButton",

  props: {
    label: {
      type: String,
      default: "",
    },
    size: {
      type: String,
      default: "medium",
      validator: (value) => ["small", "medium", "large"].includes(value),
    },
  },

  emits: ["click"],

  methods: {
    handleClick(event) {
      this.$emit("click", event);
    },
  },
};
</script>

<style>
.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
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

  font-family: "Irish Grover", system-ui;
  font-weight: 400;
  font-style: normal;

  transition: all 0.2s ease-in-out;
  border-radius: 8px;
  width: 80%;
}

.base-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.base-button--small {
  padding: 8px 16px;
  font-size: 14px;
  min-height: 32px;
}

.base-button--medium {
  padding: 12px 24px;
  font-size: 16px;
  min-height: 40px;
}

.base-button--large {
  padding: 16px 32px;
  font-size: 30px;
  font-weight: bolder;
  min-height: 48px;
}
</style>
