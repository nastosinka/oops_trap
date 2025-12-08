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

export default {
  name: "TestPhysics",

  props: {
    gameArea: {
      type: Object,
      required: true,
      default: () => ({
        scale: 1,
        baseWidth: 1920,
        baseHeight: 1080,
      }),
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

    loop() {
      //gorizont
      if (this.keys.has("a")) {
        this.velocity.x = -this.speed;
      } else if (this.keys.has("d")) {
        this.velocity.x = this.speed;
      } else {
        this.velocity.x = 0;
      }

      //jump
      if (this.keys.has("w") && this.isOnGround) {
        this.velocity.y = -10;
        this.isOnGround = false;
      }

      //gravity
      this.velocity.y += this.gravity;

      this.pos.x += this.velocity.x;
      this.pos.y += this.velocity.y;

      //left boundary
      if (this.pos.x < 0) {
        this.pos.x = 0;
      }

      //right
      const maxX = this.gameArea?.baseWidth - 64; // 64 = sprite width
      if (this.pos.x > maxX) {
        this.pos.x = maxX;
      }

      //top
      if (this.pos.y < 0) {
        this.pos.y = 0;
        this.velocity.y = 0;
      }

      //bottom
      const floorY = this.gameArea?.baseHeight - 100;
      if (this.pos.y > floorY) {
        this.pos.y = floorY;
        this.velocity.y = 0;
        this.isOnGround = true;
      }

      this.animationFrame = requestAnimationFrame(this.loop);
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
}

.player.walking {
  animation: walkAnim 0.2s steps(2) infinite;
}

@keyframes walkAnim {
  0% {
    background-image: url("@/assets/images/players/1/bp1.png");
  }
  50% {
    background-image: url("@/assets/images/players/1/bp2.png");
  }
  100% {
    background-image: url("@/assets/images/players/1/bp1.png");
  }
}
</style>
