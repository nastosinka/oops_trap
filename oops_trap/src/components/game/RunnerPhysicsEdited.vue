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
        width: 64 * this.gameArea.scale + "px",
        height: 64 * this.gameArea.scale + "px",
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

    // Проверка точки внутри полигона
    pointInPolygon(x, y, polygon) {
      let inside = false;
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;

        const intersect =
          ((yi > y) !== (yj > y)) &&
          (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    },

    // Проверка столкновений
    checkCollisions() {
      if (!this.polygons || this.polygons.length === 0) return;

      const playerPoints = [
        { x: this.pos.x, y: this.pos.y }, // верхний левый
        { x: this.pos.x + 64, y: this.pos.y }, // верхний правый
        { x: this.pos.x, y: this.pos.y + 64 }, // нижний левый
        { x: this.pos.x + 64, y: this.pos.y + 64 }, // нижний правый
        { x: this.pos.x + 32, y: this.pos.y + 32 }, // центр
      ];

      this.polygons.forEach(poly => {
        if (poly.type !== "boundary") return;

        for (const pt of playerPoints) {
          if (this.pointInPolygon(pt.x, pt.y, poly.points)) {
            // Откат позиции игрока на предыдущий шаг движения
            this.pos.x -= this.velocity.x;
            this.pos.y -= this.velocity.y;

            // Обнуляем скорость в этом направлении
            this.velocity.x = 0;
            this.velocity.y = 0;

            // Если игрок упал на полигон снизу, ставим на землю
            this.isOnGround = true;
            return;
          }
        }
      });
    },

    loop() {
      if (this.keys.has("a")) this.velocity.x = -this.speed;
      else if (this.keys.has("d")) this.velocity.x = this.speed;
      else this.velocity.x = 0;

      if (this.keys.has("w") && this.isOnGround) {
        this.velocity.y = -10;
        this.isOnGround = false;
      }

      this.velocity.y += this.gravity;
      this.pos.x += this.velocity.x;
      this.pos.y += this.velocity.y;

      // Ограничения по карте
      if (this.pos.x < 0) this.pos.x = 0;
      const maxX = this.gameArea.baseWidth - 64;
      if (this.pos.x > maxX) this.pos.x = maxX;

      if (this.pos.y < 0) {
        this.pos.y = 0;
        this.velocity.y = 0;
      }

      const floorY = this.gameArea.baseHeight - 100;
      if (this.pos.y > floorY) {
        this.pos.y = floorY;
        this.velocity.y = 0;
        this.isOnGround = true;
      }

      this.checkCollisions();

      this.animationFrame = requestAnimationFrame(this.loop);
    },

    updateGameArea(newGameArea) {
      this.gameArea = newGameArea;
    },
  },
};
</script>

<style scoped>
.player {
  position: absolute;
  width: 64px;
  height: 64px;
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
  0% { background-image: url("@/assets/images/players/1/bp1.png"); }
  33% { background-image: url("@/assets/images/players/1/bp2.png"); }
  66% { background-image: url("@/assets/images/players/1/bp3.png"); }
  100% { background-image: url("@/assets/images/players/1/bp1.png"); }
}
</style>
