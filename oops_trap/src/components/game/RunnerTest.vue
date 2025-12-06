<template>
    <div class="game-field" ref="gameField">
        <img class="player" :src="currentSprite" :style="playerStyle" />
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
            //userId: null,  ← будет храниться id игрока из Pinia / JWT

            //-----------------------------
            //images for walk
            //-----------------------------
            idleFrame,
            animationFrames: [walk1, walk2],

            //-----------------------------
            //coordinates now in PIXELS
            //-----------------------------
            player: {
                x: 100,
                y: 100,
                speed: 15
            },

            isMoving: false,
            animationIndex: 0,
            animationInterval: null,

            //-----------------------------
            // game area data (from parent)
            //-----------------------------
            gameArea: {
                width: 0,
                height: 0,
                scale: 1,
                baseWidth: 1280,
                baseHeight: 720
            }
        };
    },

    computed: {
        //Текущий отображаемый кадр
        currentSprite() {
            return this.isMoving
                ? this.animationFrames[this.animationIndex]
                : this.idleFrame;
        },

        //--------------------------------------
        // base player size at scale=1
        //--------------------------------------
        basePlayerSize() {
            return {
                width: 50,
                height: 80
            };
        },

        // масштабированный размер челикуса
        playerSize() {
            return {
                width: this.basePlayerSize.width * this.gameArea.scale,
                height: this.basePlayerSize.height * this.gameArea.scale
            };
        },

        // масштабированная скорость челикуса
        actualSpeed() {
            return this.player.speed * this.gameArea.scale;
        },

        // полный набор масштабируемых признаков игрока
        playerStyle() {
            return {
                left: this.player.x + "px",
                top: this.player.y + "px",
                width: this.playerSize.width + "px",
                height: this.playerSize.height + "px",
            };
        }
    },

    mounted() {
        //-----------------------------
        //load auth data
        //-----------------------------
        // const userStore = useUserStore();
        // this.userId = userStore.userId;

        window.addEventListener("keydown", this.handleMove);
        window.addEventListener("keyup", this.stopAnimationSafely);

        // NEW: auto detect size
        this.updateParentBounds();

        // NEW: find parent MapOfGame
        this.findAndConnectToParent();
    },

    beforeUnmount() {
        window.removeEventListener("keydown", this.handleMove);
        window.removeEventListener("keyup", this.stopAnimationSafely);
    },

    methods: {
        //--------------------------------------
        // receive scale + boundaries from parent
        //--------------------------------------
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

        //--------------------------------------
        // search parent component with getGameArea()
        //--------------------------------------
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
                scale: rect.width / 1280
            };

            this.keepInsideParent();
        },

        handleMove(event) {
            const k = event.key.toLowerCase();
            let moved = false;

            switch (k) {
                case "w":
                    this.player.y -= this.actualSpeed;
                    moved = true;
                    break;

                case "s":
                    this.player.y += this.actualSpeed;
                    moved = true;
                    break;

                case "a":
                    this.player.x -= this.actualSpeed;
                    moved = true;
                    break;

                case "d":
                    this.player.x += this.actualSpeed;
                    moved = true;
                    break;
            }

            if (moved) {
                this.isMoving = true;
                this.startAnimation();
                this.keepInsideParent();

                //-----------------------------
                //send movement to server
                //-----------------------------
                // this.sendMoveToServer();
            }
        },

        //сохраняем игрока внутри экрана родителя
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
        }

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
    }
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
    image-rendering: pixelated;
    z-index: 10;
}
</style>
  