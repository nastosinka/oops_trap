<template>
  <div class="home-page">
    <div class="home-container">
      <div class="buttons-container">
        <BaseButton label="Sign Up" @click="showSignUpModal = true" />

        <BaseButton label="Sign On" @click="showSignOnModal = true" />

        <BaseButton label="Rules" @click="showRulesModal = true" />
      </div>
    </div>

    <UniversalModal
      v-if="showSignUpModal"
      title="Sign Up"
      :fields="['name', 'password', 'confirmPassword']"
      submit-text="Sign Up"
      @close="showSignUpModal = false"
      @submit="handleSignUp"
    />

    <UniversalModal
      v-if="showSignOnModal"
      title="Sign On"
      :fields="['name', 'password']"
      submit-text="Sign On"
      @close="showSignOnModal = false"
      @submit="handleSignOn"
    />

    <UniversalModal
      v-if="showRulesModal"
      title=""
      type="rules"
      @close="showRulesModal = false"
    />
  </div>
</template>

<script>
import BaseButton from "@/components/base/BaseButton.vue";
import UniversalModal from "@/components/base/UniversalModal.vue";
import { showSuccess } from "@/utils/notification-wrapper";

export default {
  name: "HomePage",
  components: {
    BaseButton,
    UniversalModal,
  },

  data() {
    return {
      showSignUpModal: false,
      showSignOnModal: false,
      showRulesModal: false,
    };
  },

  methods: {
    handleSignUp() {
      // Логика регистрации
      this.showSignInModal = false;
      showSuccess("Login successful!");
      this.$router.push("/createLobby");
    },

    async handleSignOn(values) {
      try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: values.name,
          password: values.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ошибка входа");
      }

      // Сохраняем токен
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      this.showSignOnModal = false;
      showSuccess("Login successful!");
      this.$router.push("/createLobby");
    } catch (err) {
      console.error("Ошибка при входе:", err);
      this.$toast?.error?.(err.message || "Ошибка входа"); // если есть уведомления
    }
    },
  },
};
</script>

<style scoped>
.home-page {
  height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background: url("@/assets/images/background.jpg") center/cover no-repeat;
  position: fixed;
  top: 0;
  left: 0;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.home-container {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 40px 32px;
  width: 100%;
  max-width: 320px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.buttons-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  justify-content: center;
}

@media (max-width: 767px) {
  .home-page {
    padding: 16px;
  }

  .home-container {
    padding: 32px 24px;
    max-width: 280px;
  }

  .buttons-container {
    gap: 14px;
  }
}

@media (min-width: 768px) {
  .home-container {
    max-width: 350px;
    padding: 45px 35px;
    border-radius: 14px;
  }

  .buttons-container {
    gap: 18px;
  }
}

@media (min-width: 1024px) {
  .home-container {
    max-width: 380px;
    padding: 50px 40px;
    border-radius: 16px;
  }

  .buttons-container {
    gap: 20px;
  }
}
</style>
