<template>
  <div class="home-page">
    <div class="home-container">
      <div class="buttons-container">
        <BaseButton label="Sign Up" @click="showSignUpModal = true" />
        <BaseButton label="Sign In" @click="showSignInModal = true" />
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
      v-if="showSignInModal"
      title="Sign In"
      :fields="['name', 'password']"
      submit-text="Sign In"
      @close="showSignInModal = false"
      @submit="handleSignIn"
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
import { Modal } from "ant-design-vue";
import { showSuccess } from "@/utils/notification-wrapper";
import { useUserStore } from "@/stores/user";

export default {
  name: "HomePage",
  components: {
    BaseButton,
    UniversalModal,
  },

  data() {
    return {
      showSignUpModal: false,
      showSignInModal: false,
      showRulesModal: false,
    };
  },

  methods: {
    async handleSignUp(formData) {
      try {
        const userStore = useUserStore();

        if (formData.password.length < 6) {
          throw new Error("Password must be at least 6 characters long");
        }

        if (formData.password !== formData.confirmPassword) {
          throw new Error("Passwords do not match");
        }

        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            username: formData.name,
            password: formData.password,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Registration failed");
        }

        const userData = {
          name: data.user?.username || formData.name,
          id: data.user?.id,
        };

        //userStore.login(userData, data.token);
        userStore.login(userData);
        //localStorage.setItem("token", data.token);

        this.showSignUpModal = false;
        showSuccess("Registration successful!");
        console.log("✅ User registered:", userData);

        this.$router.push("/createLobby");
      } catch (error) {
        console.error("❌ Registration error:", error);
        Modal.error({
          title: "Registration Error",
          content: error.message || "Registration failed. Please try again.",
          okText: "OK",
        });
      }
    },

    async handleSignIn(formData) {
      try {
        const userStore = useUserStore();

        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            username: formData.name,
            password: formData.password,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Login failed");
        }

        const userData = {
          name: data.user?.username || formData.name,
          id: data.user?.id,
        };

        //userStore.login(userData, data.token);
        userStore.login(userData);
        //localStorage.setItem("token", data.token);

        this.showSignInModal = false;
        showSuccess("Login successful!");
        console.log("✅ User signed in:", userData);

        this.$router.push("/createLobby");
      } catch (error) {
        console.error("❌ Login error:", error);
        Modal.error({
          title: "Login Error",
          content:
            error.message || "Login failed. Please check your credentials.",
          okText: "OK",
        });
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
