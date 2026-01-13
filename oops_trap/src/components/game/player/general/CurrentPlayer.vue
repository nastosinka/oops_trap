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
  emits: ["player-move"],
  data() {
    return {
      pos: { x: 1850, y: 100 },
      velocity: { x: 0, y: 0 },
      speed: 3,
      gravity: 0.4,
      isOnGround: false,
      onVine: false,
      dir: "right",
      keys: new Set(),
      animationFrame: null,
      respawnTimeout: null,
      currentFrame: 0,

      lastSentPos: { x: 0, y: 0 },
      lastSendTime: 0,
      sendInterval: 50, // отправляем каждые 50мс (20 раз в секунду)

      idle,
      walk1,
      walk2,
      walk3,
    };
  },
  computed: {
    isWalking() {
      return (
        this.keys.has("a") ||
        this.keys.has("d") ||
        this.keys.has("w") ||
        this.keys.has("s")
      );
    },
    playerClasses() {
      return {
        walking: this.isWalking,
        left: this.dir === "left",
        right: this.dir === "right",
      };
    },
    playerStyle() {
      const scale = this.gameArea.scale;

      const screenX = Math.round(this.pos.x * scale) / scale;
      const screenY = Math.round(this.pos.y * scale) / scale;

      const flip = this.dir === "left" ? -1 : 1;

      return {
        transform: `translate(${screenX}px, ${screenY}px) scaleX(${flip})`,
        width: "24px",
        height: "48px",
      };
    }



  },
  mounted() {
    this.loop = this.loop.bind(this);
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    this.loop();
    this.setSpawnFromPolygon();
    // Отправляем начальные координаты
    this.sendCoords();
  },
  beforeUnmount() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    cancelAnimationFrame(this.animationFrame);
  },
  methods: {
    // Новые вспомогательные методы
    addToY(value) {
      this.pos.y = parseFloat((this.pos.y + value).toFixed(2));
    },

    subtractFromY(value) {
      this.pos.y = parseFloat((this.pos.y - value).toFixed(2));
    },

    addToX(value) {
      this.pos.x = parseFloat((this.pos.x + value).toFixed(2));
    },
    setSpawnFromPolygon() {
      const spawnPoly = this.polygons.find(p => p.type === "spawn");
      if (!spawnPoly || !spawnPoly.points.length) return;

      const center = this.getPolygonCenter(spawnPoly.points);
      const pos = this.spawnToPos(center);

      this.pos.x = pos.x;
      this.pos.y = pos.y;
      this.velocity.y = 0;

      this.sendCoords(true);
    },
    handleKeyDown(e) {
      const key = e.key.toLowerCase();

      // Поддержка русской и английской раскладки
      const mapping = {
        w: ["w", "ц"],
        a: ["a", "ф"],
        s: ["s", "ы"],
        d: ["d", "в"],
        q: ["q", "й"]
      };

      for (const [action, keys] of Object.entries(mapping)) {
        if (keys.includes(key)) {
          this.keys.add(action);
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
        q: ["q", "й"]
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

    polygonUnderPlayer(type) {
      return this.polygons.some(
        (poly) =>
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

    // ✅ ДОБАВЛЕНО: Метод отправки координат с троттлингом
    sendCoords(force = false) {
      const now = Date.now();
      const timePassed = now - this.lastSendTime;

      // Проверяем, изменилась ли позиция
      const posChanged =
        this.lastSentPos.x !== this.pos.x || this.lastSentPos.y !== this.pos.y;

      // Отправляем если: форсированно ИЛИ (прошло время И позиция изменилась)
      if (force || (timePassed >= this.sendInterval && posChanged)) {
        this.lastSentPos = { x: this.pos.x, y: this.pos.y };
        this.lastSendTime = now;

        this.$emit("player-move", {
          x: this.pos.x,
          y: this.pos.y,
          lastImage: this.isWalking ? (this.currentFrame % 3) + 1 : 1,
        });
      }
    },
    loop() {
      // ===== X =====
      let moveX = 0;
      if (this.keys.has("a")) {
        moveX = -this.speed;
        this.dir = "left";
      }
      if (this.keys.has("d")) {
        moveX = this.speed;
        this.dir = "right";
      }

      if (moveX !== 0) {
        const dir = moveX < 0 ? "left" : "right";
        this.pos.x += moveX;

        if (this.checkWall(dir)) {
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
      const onRope = this.polygonUnderPlayer("rope");

      const hittingCeiling = this.checkCeiling();
      const hittingGround = this.checkGround();

      // ПРЫЖОК С КАНАТА ПО КНОПКЕ Q - САМОЕ ГЛАВНОЕ!
      if (this.keys.has("q") && (onVine || onRope)) {
        this.onVine = false;
        this.isOnGround = false;

        // ОГРОМНОЕ перемещение влево (телепортация + прыжок)
        this.pos.x -= 1; // ← ТЕЛЕПОРТАЦИЯ на 100px влево

        // Плюс обычный прыжок
        this.velocity.y = -6.7;
        this.velocity.x = -9; // Дополнительный импульс влево

        // Выходим из метода loop раньше, чтобы избежать конфликтов
        this.sendCoords();
        this.animationFrame = requestAnimationFrame(this.loop);
        return;
      }

      // Обычная физика
      if (onVine || onRope) {
        this.onVine = true;
        if (this.keys.has("w")) this.pos.y -= this.speed;
        if (this.keys.has("s")) this.pos.y += this.speed;
        this.velocity.y = 0;
        this.velocity.x = 0;
        this.isOnGround = false;
      } else if (inWater && !hittingGround) {
        if (this.keys.has("w")) this.pos.y -= this.speed / 2;
        if (this.keys.has("s")) this.pos.y += this.speed / 2;

        if (this.keys.has(" ") || this.keys.has("Spacebar") || this.keys.has("q")) {
          this.velocity.y = -6.7;
          this.velocity.x = 0;
          this.isOnGround = false;
        } else {
          this.velocity.y = 0;
        }
      } else {
        if ((this.keys.has("w") || this.keys.has(" ") || this.keys.has("q")) && this.isOnGround) {
          this.velocity.y = -6.7;
          this.isOnGround = false;
        }

        this.velocity.y += this.gravity;

        // Горизонтальное движение от velocity (например, после прыжка с каната)
        if (this.velocity.x !== 0) {
          this.pos.x += this.velocity.x;

          // Плавное замедление
          if (this.velocity.x > 0) {
            this.velocity.x = Math.max(0, this.velocity.x - 0.5);
          } else if (this.velocity.x < 0) {
            this.velocity.x = Math.min(0, this.velocity.x + 0.5);
          }
        }

        this.pos.y += this.velocity.y;

        if (this.velocity.y < 0 && hittingCeiling) {
          this.pos.y -= this.velocity.y;
          this.velocity.y = 0;
        }

        if (this.velocity.y >= 0) {
          if (hittingGround) {
            this.isOnGround = true;
            this.velocity.y = 0;
            this.velocity.x = 0;

            let snap = 0;
            while (this.checkGround() && snap++ < 10) {
              this.pos.y -= 1;
            }
          } else {
            this.isOnGround = false;
          }
        }
      }

      this.sendCoords();

      if (this.isWalking) {
        this.currentFrame = (this.currentFrame + 1) % 3;
      }

      this.animationFrame = requestAnimationFrame(this.loop);

      if (
        (this.polygonUnderPlayer("spike") || this.polygonUnderPlayer("lava")) &&
        !this.respawnTimeout
      ) {
        this.respawnTimeout = setTimeout(() => {
          this.setSpawnFromPolygon();
          this.respawnTimeout = null;
        }, 500);
      }
    }
  },
};
</script>

<style scoped>
.player {
  background-image: url("@/assets/images/players/1/bp1.png");
  background-size: contain;
  background-repeat: no-repeat;
  transform: translate3d(0, 0, 0);
  will-change: transform;
  backface-visibility: hidden;
  z-index: 200;
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
