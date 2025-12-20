<template>
  <div class="other-players-container">
    <div
      v-for="player in processedPlayers"
      :key="player.id"
      class="other-player"
      :class="playerClasses(player)"
      :style="playerStyle(player)"
    >
      <div class="player-sprite"></div>

      <div v-if="showNames" class="player-name">
        {{ player.name }}
        <span v-if="player.isHost" class="host-badge">Host</span>
        <span v-if="player.trapper" class="trapper-badge">Trapper</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, inject, ref } from "vue";

/* ----------------------------------
   Props
---------------------------------- */

const props = defineProps({
  players: {
    type: Array,
    default: () => [],
  },
  showNames: {
    type: Boolean,
    default: true,
  },
});

/* ----------------------------------
   Inject (🔥 РЕАКТИВНО)
---------------------------------- */

const gameArea = inject("gameArea", ref({ scale: 1 }));

/* ----------------------------------
   Constants
---------------------------------- */

const SPRITE_WIDTH = 24;
const SPRITE_HEIGHT = 48;

/* ----------------------------------
   Normalization
---------------------------------- */

const processedPlayers = computed(() =>
  Array.isArray(props.players)
    ? props.players.map((p) => ({
        id: String(p.id),
        name: p.name ?? `Player ${p.id}`,
        x: Number(p.x) || 0,
        y: Number(p.y) || 0,
        lastImage: Number(p.lastImage) || 1,
        isHost: !!p.isHost,
        trapper: !!p.trapper,
      }))
    : []
);

/* ----------------------------------
   Styles
---------------------------------- */

function playerStyle(player) {
  const scale = gameArea.value.scale || 1;

  return {
    position: "absolute",
    left: Math.round(player.x * scale) + "px",
    top: Math.round(player.y * scale) + "px",
    width: Math.round(SPRITE_WIDTH * scale) + "px",
    height: Math.round(SPRITE_HEIGHT * scale) + "px",
    zIndex: player.trapper ? 15 : 10,
    pointerEvents: "none",
  };
}

/* ----------------------------------
   Classes
---------------------------------- */

function playerClasses(player) {
  return {
    "is-host": player.isHost,
    "is-trapper": player.trapper,
    [`player-${player.lastImage}`]: true,
  };
}
</script>

<style scoped>
/* ------------------------------------------------------------------
   Контейнер
-------------------------------------------------------------------*/

.other-players-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* ------------------------------------------------------------------
   Игрок
-------------------------------------------------------------------*/

.other-player {
  position: absolute;
  image-rendering: pixelated;
}

/* ------------------------------------------------------------------
   Спрайт
-------------------------------------------------------------------*/

.player-sprite {
  width: 100%;
  height: 100%;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

/* Спрайты по кадрам */
.other-player.player-1 .player-sprite {
  background-image: url("/src/assets/images/1_R.png");
}

.other-player.player-2 .player-sprite {
  background-image: url("/src/assets/images/2_L.png");
}

.other-player.player-3 .player-sprite {
  background-image: url("/src/assets/images/3_R.png");
}

.other-player.player-4 .player-sprite {
  background-image: url("/src/assets/images/4_L.png");
}

/* ------------------------------------------------------------------
   Хост и траппер
-------------------------------------------------------------------*/

.other-player.is-host .player-sprite {
  filter: drop-shadow(0 0 5px gold);
}

.other-player.is-trapper .player-sprite {
  filter: drop-shadow(0 0 5px red);
}

/* ------------------------------------------------------------------
   Имя игрока
-------------------------------------------------------------------*/

.player-name {
  position: absolute;
  top: -24px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  white-space: nowrap;
  pointer-events: auto;
  font-weight: bold;
}

/* ------------------------------------------------------------------
   Отладка
-------------------------------------------------------------------*/

.debug-coords {
  position: absolute;
  top: 28px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 0, 0, 0.7);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-family: monospace;
}
</style>
