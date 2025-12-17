<template>
  <div v-if="gameArea" class="player" :class="playerClasses" :style="playerStyle"></div>
</template>

<script>
import idle from "@/assets/images/players/1/bp1.png";
import walk1 from "@/assets/images/players/1/bp1.png";
import walk2 from "@/assets/images/players/1/bp2.png";
import walk3 from "@/assets/images/players/1/bp3.png";

// Хитбокс игрока (физика)
const HITBOX = {
  offsetX: 6,
  offsetY: 10,
  width: 12,
  height: 32,
};

const STEP_HEIGHT = 6;

export default {
  name: "RunnerPhysics",
  props: {
    gameArea: { type: Object, required: true },
    polygons: { type: Array, default: () => [] },
  },
  data() {
    return {
      pos: { x: 1800, y: 800 },
      velocity: { x: 0, y: 0 },
      speed: 3,
      gravity: 0.4,
      isOnGround: false,
      onVine: false,
      dir: "right",
      keys: new Set(),
      animationFrame: null,
      SPAWN_POINT: { x: 105, y: 150 },

      idle,
      walk1,
      walk2,
      walk3,
    };
  },
  computed: {
    isWalking() {
      return this.keys.has("a") || this.keys.has("d") || this.keys.has("w") || this.keys.has("s");
    },
    playerClasses() {
      return {
        walking: this.isWalking,
        left: this.dir === "left",
        right: this.dir === "right",
      };
    },
    playerStyle() {
      return {
        left: this.pos.x * this.gameArea.scale + "px",
        top: this.pos.y * this.gameArea.scale + "px",
        width: 24 * this.gameArea.scale + "px",
        height: 48 * this.gameArea.scale + "px",
        transform: `scaleX(${this.dir === "left" ? -1 : 1})`,
      };
    },
  },
  mounted() {
    this.loop = this.loop.bind(this);
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
      const key = e.key.toLowerCase();

      // Поддержка русской и английской раскладки
      const mapping = {
        w: ["w", "ц"],
        a: ["a", "ф"],
        s: ["s", "ы"],
        d: ["d", "в"],
      };

      for (const [action, keys] of Object.entries(mapping)) {
        if (keys.includes(key)) {
          this.keys.add(action); // добавляем английский символ в Set
          if (action === "a") this.dir = "left";
          if (action === "d") this.dir = "right";
        }
      }
    },

    handleKeyUp(e) {
      const key = e.key.toLowerCase();
      const mapping = {
        w: ["w", "ц"],
        a: ["a", "ф"],
        s: ["s", "ы"],
        d: ["d", "в"],
      };

      for (const [action, keys] of Object.entries(mapping)) {
        if (keys.includes(key)) {
          this.keys.delete(action);
        }
      }
    },


    pointInPolygon(x, y, polygon) {
      let inside = false;
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;
        const intersect =
          yi > y !== yj > y &&
          x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
      }
      return inside;
    },

    polygonUnderPlayer(type) {
      // Возвращает true, если игрок внутри полигона типа type
      return this.polygons.some((poly) =>
        poly.type === type &&
        this.pointInPolygon(
          this.pos.x + HITBOX.offsetX + HITBOX.width / 2,
          this.pos.y + HITBOX.offsetY + HITBOX.height / 2,
          poly.points
        )
      );
    },

    checkGround() {
      const y = this.pos.y + HITBOX.offsetY + HITBOX.height + 1;
      const xs = [
        this.pos.x + HITBOX.offsetX + 2,
        this.pos.x + HITBOX.offsetX + HITBOX.width / 2,
        this.pos.x + HITBOX.offsetX + HITBOX.width - 2,
      ];
      return this.polygons.some(
        (poly) =>
          poly.type === "boundary" &&
          xs.some((x) => this.pointInPolygon(x, y, poly.points))
      );
    },

    checkWall(dir) {
      const x =
        dir === "left"
          ? this.pos.x + HITBOX.offsetX - 1
          : this.pos.x + HITBOX.offsetX + HITBOX.width + 1;
      const ys = [
        this.pos.y + HITBOX.offsetY + 4,
        this.pos.y + HITBOX.offsetY + HITBOX.height / 2,
        this.pos.y + HITBOX.offsetY + HITBOX.height - 4,
      ];
      return this.polygons.some(
        (poly) =>
          poly.type === "boundary" &&
          ys.some((y) => this.pointInPolygon(x, y, poly.points))
      );
    },

    checkCeiling() {
      const y = this.pos.y + HITBOX.offsetY - 1;
      const xs = [
        this.pos.x + HITBOX.offsetX + 2,
        this.pos.x + HITBOX.offsetX + HITBOX.width / 2,
        this.pos.x + HITBOX.offsetX + HITBOX.width - 2,
      ];
      return this.polygons.some(
        (poly) =>
          poly.type === "boundary" &&
          xs.some((x) => this.pointInPolygon(x, y, poly.points))
      );
    },

    loop() {
      // ===== X =====
      let moveX = 0;
      if (this.keys.has("a")) moveX = -this.speed;
      if (this.keys.has("d")) moveX = this.speed;

      if (moveX !== 0) {
        const dir = moveX < 0 ? "left" : "right";
        this.pos.x += moveX;

        if (this.checkWall(dir)) {
          // пробуем "ступеньку"
          let climbed = false;
          let climbedPixels = 0;
          for (let i = 1; i <= STEP_HEIGHT; i++) {
            this.pos.y -= 1;
            climbedPixels++;
            if (!this.checkWall(dir) && !this.checkCeiling()) {
              climbed = true;
              break;
            }
          }
          if (!climbed) {
            this.pos.y += climbedPixels;
            this.pos.x -= moveX;
          }
        }
      }

      // ===== Y =====
      const inWater = this.polygonUnderPlayer("water");
      const onVine = this.polygonUnderPlayer("vine");

      this.onVine = onVine;

      // Проверка на границы сверху/снизу имеет приоритет
      const hittingCeiling = this.checkCeiling();
      const hittingGround = this.checkGround();

      if (onVine) {
        // Лиана: вертикальное движение
        if (this.keys.has("w")) this.pos.y -= this.speed;
        if (this.keys.has("s")) this.pos.y += this.speed;
        this.velocity.y = 0;
        this.isOnGround = false;
      } else if (inWater && !hittingGround) {
        // Вода: вертикальное движение и отсутствие падения
        if (this.keys.has("w")) this.pos.y -= this.speed / 2;
        if (this.keys.has("s")) this.pos.y += this.speed / 2;

        // Прыжок из воды по Space
        if (this.keys.has(" ") || this.keys.has("Spacebar")) {
          this.velocity.y = -6.7; // сила прыжка
          this.isOnGround = false;
        } else {
          this.velocity.y = 0;
        }
      } else {
        // Обычная физика
        if ((this.keys.has("w") || this.keys.has(" ")) && this.isOnGround) {
          this.velocity.y = -6.7;
          this.isOnGround = false;
        }

        this.velocity.y += this.gravity;
        this.pos.y += this.velocity.y;

        if (this.velocity.y < 0 && hittingCeiling) {
          this.pos.y -= this.velocity.y;
          this.velocity.y = 0;
        }

        if (this.velocity.y >= 0) {
          if (hittingGround) {
            this.isOnGround = true;
            this.velocity.y = 0;

            // прилипание к полу
            let snap = 0;
            while (this.checkGround() && snap++ < 10) {
              this.pos.y -= 0.5;
            }
          } else {
            this.isOnGround = false;
          }
        }
      }

      this.animationFrame = requestAnimationFrame(this.loop);
      if (this.polygonUnderPlayer("spike") || this.polygonUnderPlayer("lava")) {
        // Находим полигон spawn
        const spawnPoly = this.polygons.find(p => p.type === "spawn");
        if (spawnPoly) {
          // Находим центр полигона
          const sum = spawnPoly.points.reduce((acc, p) => {
            acc.x += p.x;
            acc.y += p.y;
            return acc;
          }, { x: 0, y: 0 });

          const center = {
            x: sum.x / spawnPoly.points.length,
            y: sum.y / spawnPoly.points.length,
          };

          // Перемещаем игрока в центр полигона spawn
          this.pos.x = center.x - HITBOX.offsetX - HITBOX.width / 2;
          this.pos.y = center.y - HITBOX.offsetY - HITBOX.height / 2;
          this.velocity.y = 0;
        }
      }
    },
  },
};
</script>

<style scoped>
.player {
  position: absolute;
  width: 24px;
  height: 48px;
  image-rendering: pixelated;
  background-image: url("@/assets/images/players/1/bp1.png");
  background-size: contain;
  background-repeat: no-repeat;
  z-index: 100;
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
