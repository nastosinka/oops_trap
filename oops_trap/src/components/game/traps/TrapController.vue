<template>
  <div class="trap-controller">
    <BaseButton
      v-for="trap in traps"
      :key="trap.id"
      :disabled="cooldowns[trap.id]"
      @click="activateTrap(trap)"
    >
      {{ trap.name }}
    </BaseButton>
  </div>
</template>

<script setup>
import BaseButton from "@/components/base/BaseButton.vue";
import { reactive } from "vue";

const props = defineProps({
  traps: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(["activate"]);

const cooldowns = reactive({});

function activateTrap(trap) {
  if (cooldowns[trap.id]) return;

  emit("activate", trap);

  cooldowns[trap.id] = true;
  setTimeout(() => {
    cooldowns[trap.id] = false;
  }, 20000);
}
</script>

<style scoped>
.trap-controller {
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  z-index: 300;
  max-width: 300px;
}

.trap-controller ::v-deep(.base-button) {
  min-height: 36px;
  max-width: 140px;
  font-size: 14px;   
  padding: 6px 12px; 
}
</style>
