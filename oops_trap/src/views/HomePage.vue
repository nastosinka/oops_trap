<template>
    <div class="simple-auth-page">
        <div class="simple-auth-container">
            <div class="buttons-container">
                <BaseButton label="Sign In" @click="showSignInModal = true" size="large" 
                    class="action-button" />

                <BaseButton label="Sign On" @click="showSignOnModal = true" size="large"
                    class="action-button" />

                <BaseButton label="Rules" @click="showRulesModal = true" size="large" 
                    class="action-button" />
            </div>
        </div>

        <AuthModal
            v-if="showSignInModal"
            title="Sign In"
            @close="showSignInModal = false"
            @submit="handleSignIn"
        />
    </div>
</template>

<script>
import BaseButton from '@/components/base/BaseButton.vue'
import AuthModal from '@/components/base/AuthModal.vue'

export default {
    name: 'SimpleAuthPage',
    components: {
        BaseButton,
        AuthModal
    },

    data() {
        return {
            showSignInModal: false,
            showSignOnModal: false,
            showRulesModal: false
        }
    },

    methods: {
        handleSignIn() {
            // Логика входа
            this.showSignInModal = false
        },

        handleSignOn() {
            // Логика регистрации
            this.showSignOnModal = false
        }
    }
}
</script>
  
<style scoped>
.simple-auth-page {
    height: 100vh;
    width: 100vw;
    display: flex;
    align-items: center;
    justify-content: center;
    background: url('@/assets/images/background.jpg') center/cover no-repeat;
    position: fixed;
    top: 0;
    left: 0;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

.simple-auth-container {
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
}

.action-button {
    transition: all 0.2s ease-in-out;
    border-radius: 8px;
    max-width: 100%;
}

.action-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

@media (max-width: 480px) {
    .simple-auth-page {
        padding: 16px;
    }

    .simple-auth-container {
        padding: 32px 24px;
        max-width: 280px;
    }

    .buttons-container {
        gap: 14px;
    }
}

@media (min-width: 768px) {
    .simple-auth-container {
        max-width: 350px;
        padding: 45px 35px;
        border-radius: 14px;
    }

    .buttons-container {
        gap: 18px;
    }
}

@media (min-width: 1024px) {
    .simple-auth-container {
        max-width: 380px;
        padding: 50px 40px;
        border-radius: 16px;
    }

    .buttons-container {
        gap: 20px;
    }
}
</style>