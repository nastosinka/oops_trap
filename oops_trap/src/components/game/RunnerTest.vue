<template>
    <div class="game-field">
        <img 
            class="player" 
            :src="currentSprite" 
            :style="playerStyle" 
        />
    </div>
</template>

<script>
import idleFrame from "@/assets/images/players/1/bl1.png";
import walk1 from "@/assets/images/players/1/bl2.png";
import walk2 from "@/assets/images/players/1/bl1.png";

export default {
    name: "RunnerTest",

    data() {
        return {
            idleFrame,
            animationFrames: [walk1, walk2],

            // Координаты в РЕАЛЬНЫХ пикселях игровой области
            player: {
                x: 100,  // пиксели от левого края .game-content
                y: 100,  // пиксели от верхнего края .game-content
                speed: 15  // пиксели за нажатие (будет масштабироваться)
            },

            isMoving: false,
            animationIndex: 0,
            animationInterval: null,
            
            // Данные об игровой области от MapOfGame
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
        currentSprite() {
            return this.isMoving
                ? this.animationFrames[this.animationIndex]
                : this.idleFrame;
        },
        
        // Базовый размер игрока (при масштабе 1)
        basePlayerSize() {
            return {
                width: 50,   // пикселей при scale=1
                height: 80   // пикселей при scale=1
            };
        },
        
        // Фактический размер игрока (с учетом текущего масштаба)
        playerSize() {
            return {
                width: this.basePlayerSize.width * this.gameArea.scale,
                height: this.basePlayerSize.height * this.gameArea.scale
            };
        },
        
        // Фактическая скорость (с учетом масштаба)
        actualSpeed() {
            return this.player.speed * this.gameArea.scale;
        },
        
        // Стиль игрока с масштабированием
        playerStyle() {
            return {
                left: `${this.player.x}px`,
                top: `${this.player.y}px`,
                width: `${this.playerSize.width}px`,
                height: `${this.playerSize.height}px`,
                transform: `scale(${this.gameArea.scale})`, // Дополнительное масштабирование если нужно
                transformOrigin: 'top left'
            };
        }
    },

    mounted() {
        console.log('🎮 RunnerTest загружен');
        
        window.addEventListener("keydown", this.handleMove);
        window.addEventListener("keyup", this.stopAnimationSafely);
        
        // Получаем начальные границы
        this.updateParentBounds();
        
        // Ищем родительский компонент для получения gameArea
        this.findAndConnectToParent();
    },

    beforeUnmount() {
        window.removeEventListener("keydown", this.handleMove);
        window.removeEventListener("keyup", this.stopAnimationSafely);
        
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
        }
    },

    methods: {
        // Метод для обновления данных от MapOfGame
        updateGameArea(newGameArea) {
            console.log('📐 Получены новые данные от MapOfGame:', newGameArea);
            
            // Сохраняем масштаб ДО обновления
            const oldScale = this.gameArea.scale;
            const newScale = newGameArea.scale;
            
            // Обновляем gameArea
            this.gameArea = { ...newGameArea };
            
            // Масштабируем позицию игрока
            if (oldScale !== newScale && oldScale > 0) {
                const scaleRatio = newScale / oldScale;
                this.player.x *= scaleRatio;
                this.player.y *= scaleRatio;
                console.log('🔄 Масштабирована позиция игрока:', {
                    старыйМасштаб: oldScale,
                    новыйМасштаб: newScale,
                    коэффициент: scaleRatio,
                    новаяПозиция: { x: this.player.x, y: this.player.y }
                });
            }
            
            // Проверяем границы
            this.keepInsideParent();
        },
        
        // Поиск родительского компонента для получения gameArea
        findAndConnectToParent() {
            // Вариант 1: Через provide/inject (уже есть в MapOfGame)
            // Вариант 2: Через $parent
            let parent = this.$parent;
            let attempts = 0;
            
            while (parent && attempts < 10) {
                if (parent.getGameArea) {
                    const gameAreaData = parent.getGameArea();
                    if (gameAreaData) {
                        this.updateGameArea(gameAreaData);
                        console.log('✅ Найден родитель с gameArea');
                        return;
                    }
                }
                parent = parent.$parent;
                attempts++;
            }
            
            console.log('⚠️ Не найден родитель с gameArea, использую автоопределение');
            this.updateParentBounds();
        },
        
        updateParentBounds() {
            const parentElement = this.$el?.parentElement;
            if (!parentElement) return;

            const rect = parentElement.getBoundingClientRect();
            
            // Автоматическое определение если нет данных от MapOfGame
            this.gameArea = {
                width: rect.width,
                height: rect.height,
                baseWidth: 1280,
                baseHeight: 720,
                scale: rect.width / baseWidth, // Предполагаем базовую ширину 1280
            };
            
            console.log('📏 Автоопределение границ:', this.gameArea);
            this.keepInsideParent();
        },

        handleMove(event) {
            if (['w', 's', 'a', 'd', 'ц', 'ы', 'ф', 'в'].includes(event.key.toLowerCase())) {
                event.preventDefault(); // Отключаем прокрутку страницы
            }
            
            const key = event.key.toLowerCase();
            let moved = false;

            switch (key) {
                case "w":
                case "ц":
                    this.player.y -= this.actualSpeed;
                    moved = true;
                    break;
                case "s":
                case "ы":
                    this.player.y += this.actualSpeed;
                    moved = true;
                    break;
                case "a":
                case "ф":
                    this.player.x -= this.actualSpeed;
                    moved = true;
                    break;
                case "d":
                case "в":
                    this.player.x += this.actualSpeed;
                    moved = true;
                    break;
            }

            if (moved) {
                this.isMoving = true;
                this.startAnimation();
                this.keepInsideParent();
                
                console.log('🚶 Движение:', {
                    клавиша: key,
                    позиция: { x: this.player.x, y: this.player.y },
                    скорость: this.actualSpeed,
                    масштаб: this.gameArea.scale
                });
            }
        },
        
        keepInsideParent() {
            if (!this.gameArea.width || !this.gameArea.height) return;
            
            const playerWidth = this.playerSize.width;
            const playerHeight = this.playerSize.height;
            
            // Левый край
            if (this.player.x < 0) {
                this.player.x = 0;
            }
            
            // Верхний край
            if (this.player.y < 0) {
                this.player.y = 0;
            }
            
            // Правый край
            if (this.player.x > this.gameArea.width - playerWidth) {
                this.player.x = this.gameArea.width - playerWidth;
            }
            
            // Нижний край
            if (this.player.y > this.gameArea.height - playerHeight) {
                this.player.y = this.gameArea.height - playerHeight;
            }
        },

        startAnimation() {
            if (this.animationInterval) {
                clearInterval(this.animationInterval);
            }
            
            this.animationInterval = setInterval(() => {
                this.animationIndex = (this.animationIndex + 1) % this.animationFrames.length;
            }, 200);
        },

        stopAnimationSafely() {
            this.isMoving = false;
            this.stopAnimation();
        },

        stopAnimation() {
            if (this.animationInterval) {
                clearInterval(this.animationInterval);
                this.animationInterval = null;
            }
            this.animationIndex = 0;
        }
    }
};
</script>

<style scoped>
.game-field {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: transparent;
    overflow: hidden;
    pointer-events: none; /* Клики проходят сквозь */
}

.player {
    position: absolute;
    image-rendering: pixelated;
    transition: all 0.3s ease; /* ← И здесь тоже! */
    will-change: transform, left, top;
    z-index: 7;
}
</style>