<template>
    <div class="game-field" ref="gameField">
        <img class="player" :src="currentSprite" 
        :style="{
            left: player.x + 'px',
            top: player.y + 'px'
        }" />
    </div>
</template>
  
<script>
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
                x: 10,  //world units (0–100)
                y: 10,
                speed: 20
            },

            isMoving: false,
            animationIndex: 0,
            animationInterval: null,

            // Границы из родительского компонента
            parentBounds: {
                left: 0,
                top: 0,
                width: 0,
                height: 0
            }
        };
    },

    computed: {
        //Текущий отображаемый кадр
        currentSprite() {
            return this.isMoving
                ? this.animationFrames[this.animationIndex]
                : this.idleFrame;
        }
    },

    mounted() {
        //-----------------------------
        //load auth data
        //-----------------------------
        // const userStore = useUserStore();
        // this.userId = userStore.userId;

        // Получаем границы родительского контейнера (MapOfGame)
        this.updateParentBounds();
        // Начинаем следить за изменением размеров экрана родителя
        window.addEventListener("resize", this.updateParentBounds);

        window.addEventListener("keydown", this.handleMove);
        window.addEventListener("keyup", this.stopAnimationSafely);

        // Также обновляем при изменении размеров родителя
        this.observeParentResize();
    },

    beforeUnmount() { // добавились штуки из mounted
        window.removeEventListener("resize", this.updateParentBounds);
        window.removeEventListener("keydown", this.handleMove);
        window.removeEventListener("keyup", this.stopAnimationSafely);

        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    },

    methods: {
        observeParentResize() {
            // 1. Проверяем, поддерживает ли браузер ResizeObserver
            if ('ResizeObserver' in window) {

                // 2. Находим РОДИТЕЛЬСКИЙ элемент
                const parentElement = this.$el.parentElement;
                // this.$el - это корневой элемент компонента (.game-field)
                // .parentElement - его непосредственный родитель (.game-content в MapOfGame)

                // 3. Проверяем, что родитель существует
                if (parentElement) {

                    // 4. Создаём НАБЛЮДАТЕЛЬ
                    this.resizeObserver = new ResizeObserver(this.updateParentBounds);
                    // ResizeObserver - современный браузерный API
                    // Он будет ВЫЗЫВАТЬ updateParentBounds КАЖДЫЙ РАЗ, 
                    // когда размеры parentElement изменяются

                    // 5. Начинаем наблюдение
                    this.resizeObserver.observe(parentElement);
                    // Теперь при ЛЮБОМ изменении размеров .game-content
                    // автоматически вызовется updateParentBounds()
                }
            }
        },

        updateParentBounds() {
            // 1. Снова находим родительский элемент
            const parentElement = this.$el?.parentElement;
            // ?. - Опциональная цепочка (optional chaining)
            // Если this.$el не существует, вернёт undefined вместо ошибки

            // 2. Проверяем, что родитель существует
            if (!parentElement) return; // Выходим если родителя нет

            // 3. Получаем ТОЧНЫЕ РАЗМЕРЫ родителя
            const rect = parentElement.getBoundingClientRect();
            // getBoundingClientRect() возвращает объект с:
            // - width: ширина в пикселях
            // - height: высота в пикселях
            // - top, left, right, bottom: позиции относительно viewport
            // - x, y: координаты

            // 4. Сохраняем границы в data
            this.parentBounds = {
                left: 0,   // В системе координат РОДИТЕЛЯ, поэтому 0
                top: 0,    // Начинаем отсчёт от левого верхнего угла родителя
                width: rect.width,   // Например: 1280px
                height: rect.height  // Например: 720px (16:9)
            };

            // 5. Логируем для отладки
            console.log('Границы родителя:', this.parentBounds);
            // В консоли увидишь: {left: 0, top: 0, width: 1280, height: 720}

            // 6. Корректируем позицию игрока
            this.keepInsideParent();
            // Если игрок был у края, а карта уменьшилась - 
            // он будет "подвинут" внутрь новых границ
        },

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
                this.keepInsideParent()

                //-----------------------------
                //send movement to server
                //-----------------------------
                //this.sendMoveToServer();
            }
        },
        //сохраняем игрока внутри экрана родителя
        keepInsideParent() {
            const playerWidth = 32;
            const playerHeight = 32;

            // Левая граница
            if (this.player.x < 0) {
                this.player.x = 0;
            }

            // Верхняя граница
            if (this.player.y < 0) {
                this.player.y = 0;
            }

            // Правая граница (учитываем ширину спрайта)
            if (this.player.x > this.parentBounds.width - playerWidth) {
                this.player.x = this.parentBounds.width - playerWidth;
            }

            // Нижняя граница (учитываем высоту спрайта)
            if (this.player.y > this.parentBounds.height - playerHeight) {
                this.player.y = this.parentBounds.height - playerHeight;
            }
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
    }
};
</script>

<!-- добавлено scoped, чтобы точно не повлиять на чужие стили-->
<style scoped>  .game-field {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: transparent;
      /* заимствуем фон у родителя */
      overflow: hidden;
  }

  .player {
      position: absolute;
      width: 32px;
      height: 32px;
      image-rendering: pixelated;
  }
</style>
