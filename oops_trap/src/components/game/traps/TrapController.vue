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

defineProps({
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
  bottom: 10px;
  left: 0px;
  right: 0px;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  align-items: center;
  z-index: 300;
}

.trap-controller ::v-deep(.base-button) {
  display: inline-flex !important;
  min-height: 36px;
  max-width: 120px;
  font-size: 14px;
  padding: 6px 6px;
  align-items: center;
  justify-content: center;
}
</style>
