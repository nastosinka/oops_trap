<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal" :class="modalClass">
      <div class="modal__header">
        <h2 class="modal__title">{{ title }}</h2>
        <button class="modal__close" @click="closeModal">×</button>
      </div>

      <div class="modal__body">
        <!-- Форма авторизации -->
        <UniversalForm
          v-if="type === 'auth'"
          :fields="fields"
          :submit-text="submitText"
          :initial-data="initialData"
          @submit="handleAuthSubmit"
        />

        <!-- Правила игры -->
        <RulesModal
          v-else-if="type === 'rules'"
          :initial-section="initialSection"
        />

        <!-- Таблица статистики -->
        <StatsTable v-else-if="type === 'stats'" :data="statsData" />

        <!-- Настройки игры -->
        <SettingsModal
          v-else-if="type === 'settings'"
          :players="players"
          :initial-settings="initialSettings"
          @apply="handleSettingsApply"
        />

        <!-- Кастомный контент -->
        <slot v-else>
          {{ content }}
        </slot>
      </div>
    </div>
  </div>
</template>

<script>
import UniversalForm from "@/components/base/UniversalForm.vue";
import RulesModal from "@/components/base/RulesModal.vue";
import StatsTable from "@/components/base/StatsTable.vue";
import SettingsModal from "@/components/base/SettingsModal.vue";

export default {
  name: "UniversalModal",
  components: {
    UniversalForm,
    RulesModal,
    StatsTable,
    SettingsModal,
  },
  props: {
    title: {
      type: String,
      default: "Modal",
    },
    type: {
      type: String,
      default: "auth",
    },
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
    initialSection: {
      type: String,
      default: "common",
    },
    content: {
      type: String,
      default: "",
    },
    statsData: {
      type: Array,
      default: () => [],
    },
    players: {
      type: Array,
      default: () => [],
    },
    initialSettings: {
      type: Object,
      default: () => ({}),
    },
  },

  emits: ["close", "submit", "settings-apply"],

  computed: {
    modalClass() {
      return {
        "modal--rules": this.type === "rules",
        "modal--stats": this.type === "stats",
      };
    },
  },

  methods: {
    closeModal() {
      this.$emit("close");
    },

    handleAuthSubmit(formData) {
      this.$emit("submit", formData);
    },

    handleSettingsApply(settings) {
      this.$emit("settings-apply", settings);
      this.closeModal();
    },
  },
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(52, 106, 101, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 80vw;
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 30px;
}

.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 24px 24px;
}

.modal__title {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  color: white;
  font-family: "Irish Grover", system-ui;
}

.modal__close {
  background: none;
  border: none;
  font-size: 32px;
  cursor: pointer;
  color: white;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.modal:not(.modal--rules):not(.modal--stats) {
  width: 80vw;
  border-radius: 12px;
  max-width: 350px;
}

@media (max-width: 768px) {
  .modal:not(.modal--rules):not(.modal--stats) .modal__title {
    font-size: 18px;
  }

  .modal:not(.modal--rules):not(.modal--stats) .modal__close {
    font-size: 22px;
    width: 34px;
    height: 34px;
  }

  .modal--rules .modal__header,
  .modal--stats .modal__header {
    padding: 00px 0px 10px;
  }
}

@media (min-width: 768px) {
  .modal:not(.modal--rules):not(.modal--stats) .modal__title {
    font-size: 24px;
  }

  .modal:not(.modal--rules):not(.modal--stats) .modal__close {
    font-size: 28px;
    width: 40px;
    height: 40px;
  }

  .modal--rules .modal__header,
  .modal--stats .modal__header {
    padding: 0px 0px 20px;
  }
}
@media (min-width: 1200px) {
  .modal:not(.modal--rules):not(.modal--stats) .modal__title {
    font-size: 30px;
  }

  .modal:not(.modal--rules):not(.modal--stats) .modal__close {
    font-size: 34px;
    width: 46px;
    height: 46px;
  }

  .modal--rules,
  .modal--stats {
    max-width: 1000px;
  }

  .modal--rules .modal__header,
  .modal--stats .modal__header {
    padding: 0px 0px 30px;
  }
}
</style>
