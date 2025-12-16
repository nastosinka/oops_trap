<template>
  <div
    v-if="gameArea"
    class="player"
    :class="playerClasses"
    :style="playerStyle"
  ></div>
</template>

<script>
import idle from "@/assets/images/players/1/bp1.png";
import walk1 from "@/assets/images/players/1/bp1.png";
import walk2 from "@/assets/images/players/1/bp2.png";
import walk3 from "@/assets/images/players/1/bp3.png";

export default {
  name: "RunnerPhysics",

  props: {
    gameArea: {
      type: Object,
      required: true,
      default: () => ({ scale: 1, baseWidth: 1920, baseHeight: 1080 }),
    },
    polygons: {
      type: Array,
      default: () => [],
    },
  },

  emits: ["update:gameArea"],

  data() {
    return {
      pos: { x: 200, y: 200 },
      velocity: { x: 0, y: 0 },
      speed: 3,
      gravity: 0.4,
      isOnGround: false,
      dir: "right",
      keys: new Set(),
      animationFrame: null,

      idle,
      walk1,
      walk2,
      walk3,
    };
  },

  computed: {
    isWalking() {
      return this.keys.has("a") || this.keys.has("d");
    },

    playerClasses() {
      return {
        walking: this.isWalking,
        left: this.dir === "left",
        right: this.dir === "right",
      };
    },

    playerStyle() {
      const flip = this.dir === "left" ? -1 : 1;

      return {
        left: this.pos.x * this.gameArea.scale + "px",
        top: this.pos.y * this.gameArea.scale + "px",
        transform: `scaleX(${flip})`,
        width: 24 * this.gameArea.scale + "px",
        height: 48 * this.gameArea.scale + "px",
        border: "2px solid yellow", // Для отладки
      };
    },
  },

  mounted() {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    this.loop();
  },

  beforeUnmount() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    cancelAnimationFrame(this.animationFrame);
  },

  methods: {
    handleKeyDown(e) {
      const k = e.key.toLowerCase();
      this.keys.add(k);
      if (k === "a") this.dir = "left";
      if (k === "d") this.dir = "right";
    },

    handleKeyUp(e) {
      this.keys.delete(e.key.toLowerCase());
    },

    pointInPolygon(x, y, polygon) {
      let inside = false;
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x,
          yi = polygon[i].y;
        const xj = polygon[j].x,
          yj = polygon[j].y;

        const intersect =
          yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
      }
      return inside;
    },

    checkHitbox() {
      const w = 24;
      const h = 48;

      const points = [
        { x: this.pos.x, y: this.pos.y },
        { x: this.pos.x + w, y: this.pos.y },
        { x: this.pos.x, y: this.pos.y + h },
        { x: this.pos.x + w, y: this.pos.y + h },
      ];

      for (const poly of this.polygons) {
        if (poly.type !== "boundary") continue;

        for (const p of points) {
          if (this.pointInPolygon(p.x, p.y, poly.points)) {
            return true;
          }
        }
      }
      return false;
    },
    // sendCoordsToServer() {
    //     if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    //     this.ws.send(JSON.stringify({
    //     type: "coord_message",
    //     position: {
    //         x: this.pos.x,
    //         y: this.pos.y,
    //     },
    //     lastImage: this.currentSpriteFrame
    //     }));
    // },
    loop() {
      // ===== X =====
      if (this.keys.has("a")) this.velocity.x = -this.speed;
      else if (this.keys.has("d")) this.velocity.x = this.speed;
      else this.velocity.x = 0;

      this.pos.x += this.velocity.x;

      if (this.checkHitbox()) {
        const MAX_STEP = 6;
        const MAX_SLOPE = 0.7;
        let climbed = false;

        for (let step = 1; step <= MAX_STEP; step++) {
          const slope = step / Math.abs(this.velocity.x || 1);

          if (slope > MAX_SLOPE) break;

          this.pos.y -= step;

          if (!this.checkHitbox()) {
            climbed = true;
            break;
          }

          this.pos.y += step;
        }

        if (!climbed) {
          this.pos.x -= this.velocity.x;
          this.velocity.x = 0;
        }
      }

      // ===== Y =====
      if (this.keys.has("w") && this.isOnGround) {
        this.velocity.y = -6.7;
        this.isOnGround = false;
      }

      this.velocity.y += this.gravity;
      this.pos.y += this.velocity.y;

      if (this.checkHitbox()) {
        if (this.velocity.y > 0) this.isOnGround = true;
        this.pos.y -= this.velocity.y;
        this.velocity.y = 0;
      }

      this.animationFrame = requestAnimationFrame(this.loop);
    },
  },
};
</script>

<style scoped>
.player {
  position: absolute;
  width: 24px;
  height: 48px;
  z-index: 10;
  image-rendering: pixelated;
  background-size: contain;
  background-repeat: no-repeat;
  background-image: url("@/assets/images/players/1/bp1.png");
  border: 2px solid yellow; /* для отладки */
}

.player.walking {
  animation: walkAnim 0.2s steps(2) infinite;
}

@keyframes walkAnim {
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
</style>
