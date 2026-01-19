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
import { computed } from "vue";

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
   Constants
---------------------------------- */

const SPRITE_WIDTH = 24;
const SPRITE_HEIGHT = 48;
const prevXMap = new Map();

/* ----------------------------------
   Normalization
---------------------------------- */

const processedPlayers = computed(() =>
  Array.isArray(props.players)
    ? props.players.map((p) => {
        const id = String(p.id);
        const x = Number(p.x) || 0;

        const prevX = prevXMap.get(id);
        let face = "right";

        if (prevX !== undefined) {
          if (x > prevX) face = "right";
          else if (x < prevX) face = "left";
        }

        prevXMap.set(id, x);

        return {
          id,
          name: p.name ?? `Player ${p.id}`,
          x,
          y: Number(p.y) || 0,
          lastImage: Number(p.lastImage) || 1,
          isHost: !!p.isHost,
          trapper: !!p.trapper,
          face,
        };
      })
    : []
);

/* ----------------------------------
   Styles
---------------------------------- */

function playerStyle(player) {
  return {
    position: "absolute",
    left: Math.round(player.x) + "px",
    top: Math.round(player.y) + "px",
    width: SPRITE_WIDTH + "px",
    height: SPRITE_HEIGHT + "px",
    zIndex: 150,
    pointerEvents: "none",
  };
}

/* ----------------------------------
   Classes
---------------------------------- */

function playerClasses(player) {
  return {
    [`player-${player.lastImage}`]: true,
    "face-left": player.face === "left",
    "face-right": player.face === "right",
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
  background-image: url("@/assets/images/players/1/bp1.png");
}

.other-player.player-2 .player-sprite {
  background-image: url("@/assets/images/players/1/bp1.png");
}

.other-player.player-3 .player-sprite {
  background-image: url("@/assets/images/players/1/bp2.png");
}

.other-player.player-4 .player-sprite {
  background-image: url("@/assets/images/players/1/bp3.png");
}

.other-player.face-left .player-sprite {
  transform: scaleX(-1);
}

.other-player.face-right .player-sprite {
  transform: scaleX(1);
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
