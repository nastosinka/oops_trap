<template>
    <div class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal__header">
          <h2 class="modal__title">{{ title }}</h2>
          <button class="modal__close" @click="closeModal">×</button>
        </div>
        
        <div class="modal__body">
          <AuthForm @submit="handleAuthSubmit" />
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import AuthForm from '@/components/base/AuthForm.vue'
  
  export default {
    name: 'AuthModal',
    
    components: {
      AuthForm
    },
    
    props: {
      title: {
        type: String,
        default: 'Sign In'
      }
    },
    
    emits: ['close', 'submit'],
    
    methods: {
      closeModal() {
        this.$emit('close')
      },
      
      handleAuthSubmit(formData) {
        this.$emit('submit', formData)
      }
    }
  }
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
    width: 100%;
    max-width: 420px;
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .modal__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24px 24px 0;
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
  
  .modal__body {
    padding: 0 24px 24px;
  }
  </style>