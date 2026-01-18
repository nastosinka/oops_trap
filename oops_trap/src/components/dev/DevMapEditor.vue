<template>
  <div class="map-editor">
    <h1>Редактор карты.</h1>

    <div class="controls">
      <label>Загрузить карту (изображение):</label>
      <input type="file" accept="image/*" @change="onMapFileChange" />

      <label>Загрузить JSON карты:</label>
      <input type="file" accept=".json" @change="onJsonFileChange" />

      <!-- === Редактирование/создание названия === -->
      <label>Название полигона:</label>
      <input
        v-model="polygonEditor.name"
        placeholder="Название"
        @input="applyPolygonEdit"
      />

      <!-- === Редактирование/создание типа === -->
      <label>Тип полигона:</label>
      <select v-model="polygonEditor.type" @change="applyPolygonEdit">
        <option value="rope">Канат</option>
        <option value="vine">Лианы</option>
        <option value="water">Вода</option>
        <option value="lava">Лава</option>
        <option value="spike">Колья</option>
        <option value="boundary">Границы</option>
        <option value="spawn">Спавн</option>
        <option value="goal">Финиш</option>
        <option value="trap">Ловушка</option>
      </select>

      <!-- === timer === -->
      <label
        v-if="
          polygonEditor.type === 'rope' ||
          polygonEditor.type === 'vine' ||
          polygonEditor.type === 'water'
        "
      >
        Таймер (ms):
        <input
          v-model.number="polygonEditor.timer"
          type="number"
          @input="applyPolygonEdit"
        />
      </label>

      <!-- === isActive === -->
      <label v-if="polygonEditor.type === 'trap'">
        Активна:
        <input
          v-model="polygonEditor.isActive"
          type="checkbox"
          @change="applyPolygonEdit"
        />
      </label>

      <button @click="finishPolygon">Закончить полигон</button>
      <button @click="saveJson">Сохранить JSON</button>
    </div>

    <div ref="canvasContainer" class="canvas-container">
      <canvas
        ref="canvas"
        @mousedown="onMouseDown"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
      ></canvas>
    </div>

    <div class="polygon-list">
      <h2>Список полигонов</h2>
      <ul>
        <li
          v-for="(poly, index) in polygons"
          :key="index"
          :style="{ color: selectedPolygonIndex === index ? 'red' : 'white' }"
          @click="selectPolygon(index)"
        >
          {{ index + 1 }}. {{ poly.name || poly.type }} ({{ poly.type }})
          <button @click.stop="deletePolygon(index)">Удалить</button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      mapImage: null,
      polygons: [],
      currentPolygon: {
        name: "",
        type: "rope",
        points: [],
        timer: 0,
        isActive: true,
      },

      /** объект, через который редактируется выбранный полигон */
      polygonEditor: {
        name: "",
        type: "rope",
        timer: 0,
        isActive: true,
      },

      selectedPolygonIndex: null,
      draggedPointIndex: null,

      scale: 1,
      canvasWidth: 800,
      canvasHeight: 600,
    };
  },

  mounted() {
    window.addEventListener("resize", this.onWindowResize);
    window.addEventListener("keydown", this.onKeyDown);
    this.onWindowResize();
  },

  beforeUnmount() {
    window.removeEventListener("resize", this.onWindowResize);
    window.removeEventListener("keydown", this.onKeyDown);
  },

  methods: {
    /* Масштабирование */
    onWindowResize() {
      const container = this.$refs.canvasContainer;
      if (!container || !this.mapImage) return;

      const maxWidth = container.clientWidth;
      const maxHeight = window.innerHeight - container.offsetTop - 20;

      const scaleX = maxWidth / this.mapImage.width;
      const scaleY = maxHeight / this.mapImage.height;

      this.scale = Math.min(scaleX, scaleY);

      this.canvasWidth = this.mapImage.width * this.scale;
      this.canvasHeight = this.mapImage.height * this.scale;

      const canvas = this.$refs.canvas;
      canvas.width = this.canvasWidth;
      canvas.height = this.canvasHeight;
      this.draw();
    },

    /* Загрузка картинки карты */
    onMapFileChange(event) {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          this.mapImage = img;
          this.onWindowResize();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    },

    /* Загрузка JSON */
    onJsonFileChange(event) {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          this.polygons = data.polygons || [];
          this.selectPolygon(null);
          this.draw();
        } catch (err) {
          alert("Неверный JSON файл");
        }
      };
      reader.readAsText(file);
    },

    /* Перевод координат */
    transformMouseToImage(x, y) {
      return { x: x / this.scale, y: y / this.scale };
    },

    /* Клик мыши */
    onMouseDown(event) {
      const rect = this.$refs.canvas.getBoundingClientRect();
      const mousePos = this.transformMouseToImage(
        event.clientX - rect.left,
        event.clientY - rect.top
      );

      /* --- если выбран полигон → редактируем --- */
      if (this.selectedPolygonIndex !== null) {
        const poly = this.polygons[this.selectedPolygonIndex];

        // ищем точку для перетаскивания
        this.draggedPointIndex = null;
        for (let i = 0; i < poly.points.length; i++) {
          const pt = poly.points[i];
          const dx = pt.x - mousePos.x;
          const dy = pt.y - mousePos.y;
          if (Math.sqrt(dx * dx + dy * dy) < 10 / this.scale) {
            this.draggedPointIndex = i;
            return;
          }
        }

        // если не нашли точку — вставляем новую на ближайшее ребро
        let bestDist = Infinity;
        let bestIndex = 0;

        for (let i = 0; i < poly.points.length; i++) {
          const a = poly.points[i];
          const b = poly.points[(i + 1) % poly.points.length];

          const t = Math.max(
            0,
            Math.min(
              1,
              ((mousePos.x - a.x) * (b.x - a.x) +
                (mousePos.y - a.y) * (b.y - a.y)) /
                ((b.x - a.x) ** 2 + (b.y - a.y) ** 2)
            )
          );

          const proj = { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) };
          const dist = Math.hypot(mousePos.x - proj.x, mousePos.y - proj.y);

          if (dist < bestDist) {
            bestDist = dist;
            bestIndex = i + 1;
          }
        }

        poly.points.splice(bestIndex, 0, mousePos);
        this.draggedPointIndex = bestIndex;
        this.draw();
        return;
      }

      /* --- иначе создаём новый полигон --- */
      this.currentPolygon.points.push(mousePos);
      this.draw();
    },

    /* Движение мыши */
    onMouseMove(event) {
      if (this.draggedPointIndex === null || this.selectedPolygonIndex === null)
        return;

      const rect = this.$refs.canvas.getBoundingClientRect();
      const mousePos = this.transformMouseToImage(
        event.clientX - rect.left,
        event.clientY - rect.top
      );

      const poly = this.polygons[this.selectedPolygonIndex];
      poly.points[this.draggedPointIndex] = mousePos;

      this.draw();
    },

    onMouseUp() {
      this.draggedPointIndex = null;
    },

    /* Удаление точки кнопкой Z */
    onKeyDown(e) {
      if (!this.selectedPolygonIndex || this.draggedPointIndex === null) return;

      if (e.key.toLowerCase() === "z") {
        const poly = this.polygons[this.selectedPolygonIndex];

        if (poly.points.length > 2) {
          poly.points.splice(this.draggedPointIndex, 1);
          this.draggedPointIndex = null;
          this.draw();
        }
      }
    },

    /* Завершение нового полигона */
    finishPolygon() {
      if (this.currentPolygon.points.length < 2) {
        alert("Полигон должен иметь минимум 2 точки");
        return;
      }

      this.polygons.push({ ...this.currentPolygon });

      this.currentPolygon = {
        name: "",
        type: "rope",
        points: [],
        timer: 0,
        isActive: true,
      };

      this.draw();
    },

    /* Выбор полигона */
    selectPolygon(index) {
      this.selectedPolygonIndex = index;

      if (index === null) {
        this.polygonEditor = {
          name: "",
          type: "rope",
          timer: 0,
          isActive: true,
        };
        this.draw();
        return;
      }

      const poly = this.polygons[index];

      this.polygonEditor = {
        name: poly.name || "",
        type: poly.type,
        timer: poly.timer ?? 0,
        isActive: poly.isActive ?? true,
      };

      this.draw();
    },

    /* === Применение изменений к выбранному полигону === */
    applyPolygonEdit() {
      if (this.selectedPolygonIndex === null) return;

      const poly = this.polygons[this.selectedPolygonIndex];
      poly.name = this.polygonEditor.name;
      poly.type = this.polygonEditor.type;
      poly.timer = this.polygonEditor.timer;
      poly.isActive = this.polygonEditor.isActive;

      this.draw();
    },

    /* Удаление полигона */
    deletePolygon(index) {
      this.polygons.splice(index, 1);
      this.selectedPolygonIndex = null;
      this.draw();
    },

    /* Сохранить JSON */
    saveJson() {
      const data = { polygons: this.polygons };
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "map.json";
      a.click();
      URL.revokeObjectURL(url);
    },

    /* Рисование */
    draw() {
      const canvas = this.$refs.canvas;
      const ctx = canvas.getContext("2d");

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#1e1e1e";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (this.mapImage) {
        ctx.drawImage(
          this.mapImage,
          0,
          0,
          this.mapImage.width * this.scale,
          this.mapImage.height * this.scale
        );
      }

      this.polygons.forEach((poly, idx) => {
        ctx.beginPath();
        ctx.moveTo(
          poly.points[0].x * this.scale,
          poly.points[0].y * this.scale
        );
        for (let i = 1; i < poly.points.length; i++) {
          ctx.lineTo(
            poly.points[i].x * this.scale,
            poly.points[i].y * this.scale
          );
        }
        ctx.closePath();

        ctx.fillStyle =
          idx === this.selectedPolygonIndex
            ? "rgba(255,0,0,0.3)"
            : "rgba(0,255,0,0.2)";
        ctx.fill();

        ctx.strokeStyle = idx === this.selectedPolygonIndex ? "red" : "lime";
        ctx.stroke();

        if (idx === this.selectedPolygonIndex) {
          poly.points.forEach((pt) => {
            ctx.beginPath();
            ctx.arc(pt.x * this.scale, pt.y * this.scale, 5, 0, 2 * Math.PI);
            ctx.fillStyle = "yellow";
            ctx.fill();
            ctx.strokeStyle = "black";
            ctx.stroke();
          });
        }
      });

      if (this.currentPolygon.points.length > 0) {
        ctx.beginPath();
        ctx.moveTo(
          this.currentPolygon.points[0].x * this.scale,
          this.currentPolygon.points[0].y * this.scale
        );
        for (let i = 1; i < this.currentPolygon.points.length; i++) {
          ctx.lineTo(
            this.currentPolygon.points[i].x * this.scale,
            this.currentPolygon.points[i].y * this.scale
          );
        }
        ctx.strokeStyle = "cyan";
        ctx.stroke();
      }
    },
  },
};
</script>

<style scoped>
.map-editor {
  display: flex;
  flex-direction: column;
  padding: 10px;
  background: #1e1e1e;
  color: white;
  font-family: sans-serif;
}
.controls {
  margin-bottom: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  color: white;
}
.canvas-container {
  border: 1px solid #555;
  display: inline-block;
  position: relative;
  width: 100%;
  text-align: center;
}
canvas {
  display: block;
  margin: 0 auto;
  cursor: crosshair;
  background: #1e1e1e;
  max-width: 100%;
  height: auto;
}
.polygon-list {
  margin-top: 10px;
}
.polygon-list ul {
  list-style: none;
  padding: 0;
}
.polygon-list li {
  margin: 5px 0;
  cursor: pointer;
}
</style>
