<template>
  <div class="map-editor">
    <h1>Редактор карты</h1>

    <div class="controls">
      <label>Загрузить карту (изображение):</label>
      <input type="file" accept="image/*" @change="onMapFileChange" />

      <label>Загрузить JSON карты:</label>
      <input type="file" accept=".json" @change="onJsonFileChange" />

      <label>Название полигона:</label>
      <input v-model="currentPolygon.name" placeholder="Название" />

      <label>Тип полигона:</label>
      <select v-model="currentPolygon.type">
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

      <label
        v-if="
          currentPolygon.type === 'rope' ||
          currentPolygon.type === 'vine' ||
          currentPolygon.type === 'water'
        "
      >
        Таймер (ms):
        <input v-model.number="currentPolygon.timer" type="number" />
      </label>

      <label v-if="currentPolygon.type === 'trap'">
        Активна:
        <input v-model="currentPolygon.isActive" type="checkbox" />
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
      selectedPolygonIndex: null,
      draggedPointIndex: null,
      scale: 1,
      canvasWidth: 800,
      canvasHeight: 600,
    };
  },
  mounted() {
    window.addEventListener("resize", this.onWindowResize);
    this.onWindowResize();
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.onWindowResize);
  },
  methods: {
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
    onJsonFileChange(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          this.polygons = data.polygons || [];
          this.draw();
        } catch (err) {
          alert("Неверный JSON файл");
        }
      };
      reader.readAsText(file);
    },
    transformMouseToImage(x, y) {
      return { x: x / this.scale, y: y / this.scale };
    },
    onMouseDown(event) {
      if (this.selectedPolygonIndex === null) return;
      const rect = this.$refs.canvas.getBoundingClientRect();
      const mousePos = this.transformMouseToImage(
        event.clientX - rect.left,
        event.clientY - rect.top
      );
      const poly = this.polygons[this.selectedPolygonIndex];

      // ищем точку для перетаскивания
      this.draggedPointIndex = null;
      for (let i = 0; i < poly.points.length; i++) {
        const pt = poly.points[i];
        const dx = pt.x - mousePos.x;
        const dy = pt.y - mousePos.y;
        if (Math.sqrt(dx * dx + dy * dy) < 10 / this.scale) {
          this.draggedPointIndex = i;
          break;
        }
      }

      // если не нашли точку → создаем новую
      if (this.draggedPointIndex === null) {
        poly.points.push(mousePos);
      }

      this.draw();
    },
    onMouseMove(event) {
      if (
        this.selectedPolygonIndex === null ||
        this.draggedPointIndex === null
      )
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
    finishPolygon() {
      if (this.currentPolygon.points.length < 2) {
        alert("Полигон должен иметь минимум 2 точки");
        return;
      }
      this.polygons.push({ ...this.currentPolygon });
      this.currentPolygon.points = [];
      this.currentPolygon.name = "";
      this.currentPolygon.timer = 0;
      this.currentPolygon.isActive = true;
      this.draw();
    },
    draw() {
      const canvas = this.$refs.canvas;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // фон темный
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

      // отрисовка полигонов
      this.polygons.forEach((poly, idx) => {
        if (!poly.points || poly.points.length === 0) return;
        ctx.beginPath();
        ctx.moveTo(poly.points[0].x * this.scale, poly.points[0].y * this.scale);
        for (let i = 1; i < poly.points.length; i++) {
          ctx.lineTo(poly.points[i].x * this.scale, poly.points[i].y * this.scale);
        }
        ctx.closePath();
        ctx.fillStyle =
          idx === this.selectedPolygonIndex
            ? "rgba(255,0,0,0.3)"
            : "rgba(0,255,0,0.2)";
        ctx.fill();
        ctx.strokeStyle = idx === this.selectedPolygonIndex ? "red" : "lime";
        ctx.stroke();

        // отрисовка точек выбранного полигона
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

      // текущий полигон
      if (this.currentPolygon.points.length > 0) {
        ctx.beginPath();
        ctx.moveTo(this.currentPolygon.points[0].x * this.scale, this.currentPolygon.points[0].y * this.scale);
        for (let i = 1; i < this.currentPolygon.points.length; i++) {
          ctx.lineTo(this.currentPolygon.points[i].x * this.scale, this.currentPolygon.points[i].y * this.scale);
        }
        ctx.strokeStyle = "cyan";
        ctx.stroke();
      }
    },
    selectPolygon(index) {
      this.selectedPolygonIndex = index;
      this.draw();
    },
    deletePolygon(index) {
      this.polygons.splice(index, 1);
      this.selectedPolygonIndex = null;
      this.draw();
    },
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
