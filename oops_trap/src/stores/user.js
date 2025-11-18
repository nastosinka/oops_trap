import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useUserStore = defineStore('user', () => {
  
  const user = ref(null);
  const token = ref(null);
  const sessionId = ref(null);

  const userId = computed(() => user.value?.id || null);
  const userName = computed(() => user.value?.name || 'Guest');
  const isAuthenticated = computed(() => !!token.value);

  const initializeUser = () => {
    if (!sessionId.value) {
      sessionId.value = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    const userData = sessionStorage.getItem(`user_${sessionId.value}`);
    const tokenData = sessionStorage.getItem(`token_${sessionId.value}`);
    
    if (userData) user.value = JSON.parse(userData);
    if (tokenData) token.value = tokenData;
  };

  const setUser = (userData) => {
    user.value = userData;
    sessionStorage.setItem(`user_${sessionId.value}`, JSON.stringify(userData));
  };

  const setToken = (tokenData) => {
    token.value = tokenData;
    sessionStorage.setItem(`token_${sessionId.value}`, tokenData);
  };

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
  };

  const logout = () => {
    user.value = null;
    token.value = null;
    sessionStorage.removeItem(`user_${sessionId.value}`);
    sessionStorage.removeItem(`token_${sessionId.value}`);
    sessionId.value = null;
  };

  return {

    user,
    token,
    sessionId,
    
    userId,
    userName,
    isAuthenticated,

    initializeUser,
    setUser,
    setToken,
    login,
    logout
  };
});