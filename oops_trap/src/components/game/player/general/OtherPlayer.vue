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

const SPRITE_WIDTH = 24;
const SPRITE_HEIGHT = 48;
const prevXMap = new Map();

const processedPlayers = computed(() =>
  Array.isArray(props.players)
    ? props.players.map((p) => {
        const id = String(p.id);
        const x = Number(p.x) || 0;
        let face = "right";

        // Определяем направление игрока на основе lastImage
        if (p.lastImage === 7) {
          face = "left"; // Игрок стоит и смотрит влево
        } else if (p.lastImage === 8) {
          face = "right"; // Игрок стоит и смотрит вправо
        } else if (p.lastImage < 3) {
          face = "left"; // Если lastImage < 3, значит игрок смотрит влево
        } else {
          face = "right"; // Если lastImage >= 3, значит игрок смотрит вправо
        }

        console.log(p.lastImage);

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

function playerClasses(player) {
  return {
    "face-left": player.face === "left",
    "face-right": player.face === "right",
    walking: player.lastImage < 7 || player.lastImage > 8, // если lastImage не 7 или 8, значит игрок двигается
    mirror: player.face === "left", // зеркалирование при движении влево
  };
}
</script>

<style scoped>
.other-players-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.other-player {
  position: absolute;
  image-rendering: pixelated;
}

.player-sprite {
  width: 100%;
  height: 100%;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

/* Статичный спрайт, если игрок стоит */
.face-right .player-sprite:not(.walking) {
  background-image: url("@/assets/images/players/1/bp2.png");
}

.face-left .player-sprite:not(.walking) {
  background-image: url("@/assets/images/players/1/bp2.png");
}

/* Анимация для движения вправо */
@keyframes walkRight {
  0% {
    background-image: url("@/assets/images/players/1/bp1.png");
  }
  33% {
    background-image: url("@/assets/images/players/1/bp2.png");
  }
  66% {
    background-image: url("@/assets/images/players/1/bp3.png");
  }
  100% {
    background-image: url("@/assets/images/players/1/bp1.png");
  }
}

/* Анимация для движения влево */
@keyframes walkLeft {
  0% {
    background-image: url("@/assets/images/players/1/bp1.png");
  }
  33% {
    background-image: url("@/assets/images/players/1/bp2.png");
  }
  66% {
    background-image: url("@/assets/images/players/1/bp3.png");
  }
  100% {
    background-image: url("@/assets/images/players/1/bp1.png");
  }
}

.face-right .player-sprite {
  animation: walkRight 0.6s steps(3) infinite;
}

.face-left .player-sprite {
  animation: walkLeft 0.6s steps(3) infinite;
}

.mirror .player-sprite {
  transform: scaleX(-1);
}

.other-player.is-host .player-sprite {
  filter: drop-shadow(0 0 5px gold);
}

.other-player.is-trapper .player-sprite {
  filter: drop-shadow(0 0 5px red);
}

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
</style>
