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

  emits: ["close", "submit"],

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

    handleAuthSubmit() {
      // this.$emit("submit", formData);
    },

    handleSettingsApply() {
      // this.$emit("settings-apply", settings);
      // this.closeModal();
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
  overflow-y: auto;
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 24px 24px;
  position: sticky;
  top: 0;
  z-index: 10;
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

.modal--rules,
.modal--stats {
  max-width: 1200px;
}

.modal:not(.modal--rules):not(.modal--stats) {
  width: 80vw;
  max-width: 500px;
}

@media (min-width: 1200px) {
  .modal--rules,
  .modal--stats {
    width: 85vw;
    padding: 40px;
  }

  .modal:not(.modal--rules):not(.modal--stats) {
    padding: 30px;
  }

  .modal__title {
    font-size: 40px;
  }
}

@media (min-width: 768px) and (max-width: 1199px) {
  .modal--rules,
  .modal--stats {
    width: 90vw;
    padding: 30px;
  }

  .modal:not(.modal--rules):not(.modal--stats) {
    padding: 25px;
  }

  .modal__title {
    font-size: 32px;
  }
}

@media (max-width: 767px) {
  .modal-overlay {
    padding: 10px;
  }

  .modal {
    width: 95vw;
    border-radius: 12px;
  }

  .modal--rules,
  .modal--stats {
    padding: 20px 15px;
  }

  .modal:not(.modal--rules):not(.modal--stats) {
    padding: 20px;
  }

  .modal__header {
    padding: 15px 15px 0;
  }

  .modal__title {
    font-size: 24px;
  }
}

@media (max-width: 480px) {
  .modal-overlay {
    padding: 5px;
  }

  .modal {
    width: 98vw;
    border-radius: 10px;
  }

  .modal--rules,
  .modal--stats {
    padding: 15px 10px;
  }

  .modal:not(.modal--rules):not(.modal--stats) {
    padding: 15px;
  }

  .modal__header {
    padding: 10px 10px 0;
  }

  .modal__title {
    font-size: 20px;
  }
}
</style>
