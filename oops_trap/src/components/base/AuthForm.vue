<template>
  <form class="auth-form" @submit.prevent="handleSubmit">
    <div v-if="fields.includes('name')" class="auth-form__field">
      <div class="input-container">
        <input
          v-model="form.name"
          type="text"
          class="auth-form__input"
          required
          @focus="focusedField = 'name'"
          @blur="focusedField = null"
        />
        <label
          class="auth-form__label floating-label"
          :class="{
            'floating-label--active': form.name || focusedField === 'name',
          }"
        >
          Name
        </label>
      </div>
    </div>

    <div v-if="fields.includes('password')" class="auth-form__field">
      <div class="input-container">
        <input
          v-model="form.password"
          type="password"
          class="auth-form__input"
          required
          @focus="focusedField = 'password'"
          @blur="focusedField = null"
        />
        <label
          class="auth-form__label floating-label"
          :class="{
            'floating-label--active':
              form.password || focusedField === 'password',
          }"
        >
          Password
        </label>
      </div>
    </div>

    <div v-if="fields.includes('confirmPassword')" class="auth-form__field">
      <div class="input-container">
        <input
          v-model="form.confirmPassword"
          type="password"
          class="auth-form__input"
          required
          @focus="focusedField = 'confirmPassword'"
          @blur="focusedField = null"
        />
        <label
          class="auth-form__label floating-label"
          :class="{
            'floating-label--active':
              form.confirmPassword || focusedField === 'confirmPassword',
          }"
        >
          Confirm Password
        </label>
      </div>
      <div v-if="showPasswordError" class="auth-form__error">
        🚫 Passwords don't match
      </div>
      <div v-if="showPasswordSuccess" class="auth-form__success">
        ✅ Passwords match
      </div>
    </div>

    <div class="auth-form__actions">
      <BaseButton type="submit" size="large" class="auth-form__submit">
        {{ submitText }}
      </BaseButton>
    </div>
  </form>
</template>

<script>
import BaseButton from "./BaseButton.vue";
import { showError } from "@/utils/notification-wrapper";

export default {
  name: "AuthForm",
  components: { BaseButton },

  props: {
    fields: {
      type: Array,
      default: () => ["name", "password", "confirmPassword"],
    },
    submitText: {
      type: String,
      default: "Sign Up",
    },
    initialData: {
      type: Object,
      default: () => ({}),
    },
  },

  emits: ["submit"],

  data() {
    return {
      form: {
        name: "",
        password: "",
        confirmPassword: "",
        ...this.initialData,
      },
      focusedField: null,
    };
  },

  computed: {
    showPasswordError() {
      return (
        this.fields.includes("confirmPassword") &&
        this.form.confirmPassword &&
        this.form.password !== this.form.confirmPassword
      );
    },
    showPasswordSuccess() {
      return (
        this.fields.includes("confirmPassword") &&
        this.form.confirmPassword &&
        this.form.password === this.form.confirmPassword
      );
    },
  },

  methods: {
    handleSubmit() {
      if (
        this.fields.includes("confirmPassword") &&
        this.form.password !== this.form.confirmPassword
      ) {
        showError("Passwords don't match");
        return;
      }

      this.$emit("submit", { ...this.form });
    },
  },
};
</script>

<style scoped>
input,
label {
  color: white;
  font-family: "Irish Grover", system-ui;
  font-weight: 400;
  font-style: normal;
}

.auth-form__field {
  margin-bottom: 24px;
  position: relative;
}

.input-container {
  position: relative;
  background-color: #457270;
  border-radius: 8px;
}

.auth-form__error {
  color: #560f0f;
  font-size: 14px;
  margin-top: 8px;
  margin-bottom: -22px;
  font-family: "Irish Grover", system-ui;
}

.auth-form__success {
  color: rgb(19, 41, 46);
  font-size: 14px;
  margin-top: 8px;
  margin-bottom: -22px;
  font-family: "Irish Grover", system-ui;
}
.auth-form__input {
  width: 100%;
  padding: 16px 12px 8px;
  border: 2px solid #e1e1e1;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s;
  box-sizing: border-box;
  background: transparent;
  z-index: 2;
  position: relative;

  box-shadow: 0 4px 4px rgba(255, 255, 255, 0.4);
}

.auth-form__input:focus {
  outline: none;
  border-color: #457270;
}

.floating-label {
  position: absolute;
  top: 50%;
  left: 12px;
  transform: translateY(-50%);
  font-size: 16px;
  font-weight: 500;
  transition: all 0.2s ease;
  pointer-events: none;
  z-index: 1;
  padding: 0 4px;
  margin: 0;
}

.floating-label--active,
.auth-form__input:focus + .floating-label {
  top: 4px;
  font-size: 12px;
  color: white;
  transform: translateY(0);
}

.auth-form__actions {
  margin-top: 32px;
}

.auth-form__submit {
  width: 100%;
  transition: all 0.2s ease-in-out;
  border-radius: 8px;
  max-width: 100%;
}

.auth-form__submit:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

@media (max-width: 480px) {
  .auth-form {
    padding: 32px 24px;
    max-width: 280px;
  }
}

@media (min-width: 768px) {
  .auth-form {
    max-width: 350px;
    padding: 45px 35px;
    border-radius: 14px;
  }
}

@media (min-width: 1024px) {
  .auth-form {
    max-width: 380px;
    padding: 50px 40px;
    border-radius: 16px;
  }
}
</style>
