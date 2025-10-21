<template>
    <div class="rules-content-wrapper">
      <div class="rules-accordion">
        <!-- Common Rules -->
        <div class="accordion-item" :class="{ 'accordion-item--active': activeSection === 'common' }">
          <div class="accordion-header" @click="toggleSection('common')">
            <h3 class="accordion-title">Common Rules</h3>
            <span class="accordion-icon">{{ activeSection === 'common' ? '−' : '+' }}</span>
          </div>
          <div v-if="activeSection === 'common'" class="accordion-content">
            <div class="rules-text-content">
              <h4>Basic Game Rules</h4>
              <li>на игру отводится определенное время (зависит от карты и от выбора создателя лобби)</li>
              <li>trapmaker нажимает на кнопочки и активирует динамические ловушки на карте (условие победы - ни один игрок не дошел до конца за отведенное время)</li>
              <li>runners бегут по карте, пытаясь выжить (можно умереть от статических и динамических ловушек, игра на этом для вас завершается, но вам видно оставшуюся катку в режиме зрителя) и добежать до конца за отведенное время (условие победы добежал до конца)</li>
            </div>
          </div>
        </div>
  
        <!-- Trap Maker Rules -->
        <div class="accordion-item" :class="{ 'accordion-item--active': activeSection === 'trapmaker' }">
          <div class="accordion-header" @click="toggleSection('trapmaker')">
            <h3 class="accordion-title">Trap Maker Rules</h3>
            <span class="accordion-icon">{{ activeSection === 'trapmaker' ? '−' : '+' }}</span>
          </div>
          <div v-if="activeSection === 'trapmaker'" class="accordion-content">
            <div class="rules-text-content">
              <h4>Trap Maker Responsibilities</h4>
              <li>Поимать всех!</li>
            </div>
          </div>
        </div>
  
        <!-- Runner Rules -->
        <div class="accordion-item" :class="{ 'accordion-item--active': activeSection === 'runner' }">
          <div class="accordion-header" @click="toggleSection('runner')">
            <h3 class="accordion-title">Runner Rules</h3>
            <span class="accordion-icon">{{ activeSection === 'runner' ? '−' : '+' }}</span>
          </div>
          <div v-if="activeSection === 'runner'" class="accordion-content">
            <div class="rules-text-content">
              <h4>Runner Objectives</h4>
              <li>Выжить любой ценой!</li>
            </div>
          </div>
        </div>
  
        <!-- Maps Rules -->
        <div class="accordion-item" :class="{ 'accordion-item--active': activeSection === 'maps' }">
          <div class="accordion-header" @click="toggleSection('maps')">
            <h3 class="accordion-title">Maps & Environment</h3>
            <span class="accordion-icon">{{ activeSection === 'maps' ? '−' : '+' }}</span>
          </div>
          <div v-if="activeSection === 'maps'" class="accordion-content">
            <div class="rules-text-content">
              <h4>Map Types</h4>
              <li>статические ловушки - просто существуют, не активируются мафией</li>
              <li>динамические ловушки - зоны, в которых активируются ловушки при нажатии кнопки мафией, кнопка и зона при этом уходят в кд и восстанавливается через время</li>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'RulesModal',
    
    props: {
      initialSection: {
        type: String,
        default: 'common'
      }
    },
    
    data() {
      return {
        activeSection: this.initialSection
      }
    },
    
    methods: {
      toggleSection(section) {
        this.activeSection = this.activeSection === section ? null : section
      }
    }
  }
  </script>
  
  <style scoped>

  .rules-accordion {
    background: rgb(26, 88, 85);
  }
  
  .accordion-item {
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.1);
  }
  
  .accordion-item--active {
    background: rgba(255, 255, 255, 0.15);
  }
  
  .accordion-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 2rem;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  
  .accordion-header:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .accordion-title {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 600;
    color: #F5F5F5;
    font-family: "Irish Grover", system-ui;
  }
  
  .accordion-icon {
    font-size: 1.5rem;
    font-weight: 300;
    color: #E0E0E0;
    min-width: 20px;
    text-align: center;
  }
  
  .accordion-content {
    background: rgba(255, 255, 255, 0.05);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .rules-text-content {
    padding: 2rem;
    max-height: 300px;
    overflow-y: auto;
  }
  
  .rules-text-content h4 {
    color: #F5F5F5;
    margin: 1.5rem 0 0.5rem 0;
    font-size: 1.1rem;
    font-family: "Irish Grover", system-ui;
  }
  
  .rules-text-content h4:first-child {
    margin-top: 0;
  }
  
  .rules-text-content ul {
    margin: 0.5rem 0 1rem 0;
    padding-left: 1.5rem;
  }
  
  .rules-text-content li {
    margin: 0.5rem 0;
    line-height: 1.5;
    color: #F5F5F5;
  }
  
  /* Анимации */
  .accordion-content {
    animation: slideDown 0.3s ease-out;
  }
  
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  /* Стилизация скроллбара */
  .rules-text-content::-webkit-scrollbar {
    width: 6px;
  }
  
  .rules-text-content::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
  
  .rules-text-content::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
  }
  
  .rules-text-content::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
  }
  </style>