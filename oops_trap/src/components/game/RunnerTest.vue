<template>
  <div ref="gameField" class="game-field">
    <div
      class="player"
      :class="playerClasses"
      :style="playerStyle"
    ></div>
  </div>
</template>

<script>
  import idle from "@/assets/images/players/1/bp1.png";
  import walk1 from "@/assets/images/players/1/bp1.png";
  import walk2 from "@/assets/images/players/1/bp2.png";

  export default {
    name: "GamePlayer",

    data() {
      return {
        idle,
        walk1,
        walk2,

        player: {
          x: 100,
          y: 100,
          speed: 4,
          dir: "right",
        },

        moving: {
          left: false,
          right: false,
          up: false,
          down: false,
        },

        animLoop: null,

        gameArea: {
          width: 0,
          height: 0,
          scale: 1,
          baseWidth: 1280,
          baseHeight: 720,
        },
      };
    },

    computed: {
      playerClasses() {
        return {
          walking: this.isWalking,
          left: this.player.dir === "left",
          right: this.player.dir === "right",
        };
      },

      isWalking() {
        return (
          this.moving.left ||
          this.moving.right ||
          this.moving.up ||
          this.moving.down
        );
      },

      basePlayerSize() {
        return {
          width: 50,
          height: 80,
        };
      },

      playerSize() {
        return {
          width: this.basePlayerSize.width * this.gameArea.scale,
          height: this.basePlayerSize.height * this.gameArea.scale,
        };
      },

      actualSpeed() {
        return this.player.speed * this.gameArea.scale;
      },

      playerStyle() {
        return {
          left: this.player.x + "px",
          top: this.player.y + "px",
          width: this.playerSize.width + "px",
          height: this.playerSize.height + "px",
        };
      },
    },

  mounted() {
    window.addEventListener("keydown", this.keyDown);
    window.addEventListener("keyup", this.keyUp);

    this.startLoop();
    this.updateParentBounds();
    this.findAndConnectToParent();
  },

  beforeUnmount() {
    window.removeEventListener("keydown", this.keyDown);
    window.removeEventListener("keyup", this.keyUp);
    cancelAnimationFrame(this.animLoop);
  },

  methods: {
    updateGameArea(newGameArea) {
      const oldScale = this.gameArea.scale;
      const newScale = newGameArea.scale;

      this.gameArea = { ...newGameArea };

      // scale coordinates too
      if (oldScale !== newScale && oldScale > 0) {
        const ratio = newScale / oldScale;
        this.player.x *= ratio;
        this.player.y *= ratio;
      }

      this.keepInsideParent();
    },
    findAndConnectToParent() {
      let parent = this.$parent;
      let attempts = 0;

      while (parent && attempts < 10) {
        if (parent.getGameArea) {
          const area = parent.getGameArea();
          if (area) {
            this.updateGameArea(area);
            return;
          }
        }
        parent = parent.$parent;
        attempts++;
      }

      // fallback
      this.updateParentBounds();
    },
    
    keyDown(e) {
      const k = e.key.toLowerCase();
      if (k === "a") this.moving.left = true;
      if (k === "d") this.moving.right = true;
      if (k === "w") this.moving.up = true;
      if (k === "s") this.moving.down = true;

      if (k === "a") this.player.dir = "left";
      if (k === "d") this.player.dir = "right";
    },

    keyUp(e) {
      const k = e.key.toLowerCase();
      if (k === "a") this.moving.left = false;
      if (k === "d") this.moving.right = false;
      if (k === "w") this.moving.up = false;
      if (k === "s") this.moving.down = false;
    },

    startLoop() {
      const step = () => {
        let speed = this.actualSpeed;

        if (this.moving.left) this.player.x -= speed;
        if (this.moving.right) this.player.x += speed;
        if (this.moving.up) this.player.y -= speed;
        if (this.moving.down) this.player.y += speed;

        this.keepInsideParent();

        this.animLoop = requestAnimationFrame(step);
      };

      this.animLoop = requestAnimationFrame(step);
    },

    keepInsideParent() {
      const W = this.gameArea.width;
      const H = this.gameArea.height;

      const pw = this.playerSize.width;
      const ph = this.playerSize.height;

      if (!W || !H) return;

      if (this.player.x < 0) this.player.x = 0;
      if (this.player.y < 0) this.player.y = 0;

      if (this.player.x > W - pw) this.player.x = W - pw;
      if (this.player.y > H - ph) this.player.y = H - ph;
    },
    
    //--------------------------------------
    // fallback auto-resolution of bounds
    //--------------------------------------
    updateParentBounds() {
      const parentEl = this.$el?.parentElement;
      if (!parentEl) return;

      const rect = parentEl.getBoundingClientRect();

      // baseWidth — keep original comment & approach
      this.gameArea = {
        width: rect.width,
        height: rect.height,
        baseWidth: 1280,
        baseHeight: 720,
        scale: rect.width / 1280,
      };

      this.keepInsideParent();
    },
  },
};

</script>

<style>
  .game-field {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #ddd;
}

.player {
  background-image: url("@/assets/images/players/1/bp1.png");
  position: absolute;
  image-rendering: pixelated;
  background-size: contain;
  background-repeat: no-repeat;
  z-index: 10;
}

/* direction */
.player.right {
  transform: scaleX(1);
}
.player.left {
  transform: scaleX(-1);
}

/* walking animation */
.player.walking {
  animation: walkAnim 0.2s steps(2) infinite;
}

@keyframes walkAnim {
  0%   { background-image: url("@/assets/images/players/1/bp1.png"); }
  50%  { background-image: url("@/assets/images/players/1/bp2.png"); }
  100% { background-image: url("@/assets/images/players/1/bp1.png"); }
}

</style>
