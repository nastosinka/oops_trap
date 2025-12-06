<template>
  <div ref="gameField" class="game-field">
    <img
      class="player"
      :src="currentSprite"
      :style="{
        left: player.x + '%',
        top: player.y + '%',
      }"
    />
  </div>
</template>

<script>
// import { useUserStore } from "@/stores/user";
import idleFrame from "@/assets/images/players/1/bl1.png";
import walk1 from "@/assets/images/players/1/bl2.png";
import walk2 from "@/assets/images/players/1/bl1.png";

export default {
  name: "GamePlayer",

  data() {
    return {
      //-------------
      //auth
      //-------------
      //userId: null, // ← будет храниться id игрока из Pinia / JWT

      //-----------------------------
      //images for walk
      //-----------------------------
      idleFrame, //нужна ли картинка состояния покоя?
      animationFrames: [walk1, walk2],

      player: {
        x: 10, //world units (0–100)
        y: 10,
        speed: 1,
      },

      isMoving: false,
      animationIndex: 0,
      animationInterval: null,
    };
  },

  computed: {
    //Текущий отображаемый кадр
    currentSprite() {
      return this.isMoving
        ? this.animationFrames[this.animationIndex]
        : this.idleFrame;
    },
  },

  mounted() {
    //-----------------------------
    //load auth data
    //-----------------------------
    // const userStore = useUserStore();
    // this.userId = userStore.userId;

    window.addEventListener("keydown", this.handleMove);
    window.addEventListener("keyup", this.stopAnimationSafely);
  },

  beforeUnmount() {
    window.removeEventListener("keydown", this.handleMove);
    window.removeEventListener("keyup", this.stopAnimationSafely);
  },

  methods: {
    handleMove(event) {
      const key = event.key.toLowerCase();
      let moved = false;

      switch (key) {
        case "w":
          this.player.y -= this.player.speed;
          moved = true;
          break;
        case "s":
          this.player.y += this.player.speed;
          moved = true;
          break;
        case "a":
          this.player.x -= this.player.speed;
          moved = true;
          break;
        case "d":
          this.player.x += this.player.speed;
          moved = true;
          break;
      }

      if (moved) {
        this.isMoving = true;
        this.startAnimation();
        this.keepInsideField();

        //-----------------------------
        //send movement to server
        //-----------------------------
        //this.sendMoveToServer();
      }
    },
    //сохраняем игрока внутри экрана
    keepInsideField() {
      if (this.player.x < 0) this.player.x = 0;
      if (this.player.y < 0) this.player.y = 0;
      if (this.player.x > 100) this.player.x = 100;
      if (this.player.y > 100) this.player.y = 100;
    },

    //-----------------------------
    //animation
    //-----------------------------
    startAnimation() {
      if (this.animationInterval) return;

      this.animationInterval = setInterval(() => {
        this.animationIndex =
          (this.animationIndex + 1) % this.animationFrames.length;
      }, 200); //скорость смены кадров
    },

    stopAnimationSafely() {
      //вызывается, когда отпускаются wasd
      this.isMoving = false;
      this.stopAnimation();
    },

    stopAnimation() {
      clearInterval(this.animationInterval);
      this.animationInterval = null;
      this.animationIndex = 0; //вернуться к idle
    },

    //-----------------------------
    //websocket
    //-----------------------------
    // sendMoveToServer() {
    //   gameSocket.emit("playerMove", {
    //     userId: this.userId,
    //     x: this.player.x,
    //     y: this.player.y
    //   });
    // }
  },
};
</script>

<style>
.game-field {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #f0f0f0;
  overflow: hidden;
}

.player {
  position: absolute;
  width: 32px;
  height: 32px;
  image-rendering: pixelated;
}
</style>
