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
      isDragging: false,
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
        } catch {
          alert("Неверный JSON файл");
        }
      };
      reader.readAsText(file);
    },

    transformMouseToImage(x, y) {
      return { x: x / this.scale, y: y / this.scale };
    },

    // расстояние от точки до линии
    pointToSegmentDist(px, py, x1, y1, x2, y2) {
      const A = px - x1;
      const B = py - y1;
      const C = x2 - x1;
      const D = y2 - y1;

      const dot = A * C + B * D;
      const lenSq = C * C + D * D;
      let param = -1;
      if (lenSq !== 0) param = dot / lenSq;

      let xx, yy;
      if (param < 0) {
        xx = x1;
        yy = y1;
      } else if (param > 1) {
        xx = x2;
        yy = y2;
      } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
      }

      const dx = px - xx;
      const dy = py - yy;
      return Math.sqrt(dx * dx + dy * dy);
    },

    onMouseDown(event) {
      const rect = this.$refs.canvas.getBoundingClientRect();
      const mouse = this.transformMouseToImage(
        event.clientX - rect.left,
        event.clientY - rect.top
      );

      // создание нового полигона
      if (this.selectedPolygonIndex === null) {
        this.currentPolygon.points.push(mouse);
        this.draw();
        return;
      }

      // редактирование существующего
      const poly = this.polygons[this.selectedPolygonIndex];

      // сначала проверяем — попали ли в точку
      for (let i = 0; i < poly.points.length; i++) {
        const p = poly.points[i];
        if (Math.hypot(p.x - mouse.x, p.y - mouse.y) < 10 / this.scale) {
          this.draggedPointIndex = i;
          this.isDragging = true;
          return;
        }
      }

      // иначе ищем ближайшую сторону
      let bestDist = Infinity;
      let insertIndex = -1;

      for (let i = 0; i < poly.points.length; i++) {
        const a = poly.points[i];
        const b = poly.points[(i + 1) % poly.points.length];

        const dist = this.pointToSegmentDist(mouse.x, mouse.y, a.x, a.y, b.x, b.y);
        if (dist < bestDist) {
          bestDist = dist;
          insertIndex = i + 1;
        }
      }

      // добавляем точку между вершинами
      poly.points.splice(insertIndex, 0, mouse);
      this.draw();
    },

    onMouseMove(event) {
      if (!this.isDragging) return;
      if (this.selectedPolygonIndex === null) return;
      if (this.draggedPointIndex === null) return;

      const rect = this.$refs.canvas.getBoundingClientRect();
      const mouse = this.transformMouseToImage(
        event.clientX - rect.left,
        event.clientY - rect.top
      );

      const poly = this.polygons[this.selectedPolygonIndex];
      poly.points[this.draggedPointIndex] = mouse;
      this.draw();
    },

    onMouseUp() {
      this.isDragging = false;
      this.draggedPointIndex = null;
    },

    onKeyDown(e) {
      if (e.key.toLowerCase() === "z" && this.isDragging) {
        if (this.selectedPolygonIndex === null) return;
        const poly = this.polygons[this.selectedPolygonIndex];

        if (this.draggedPointIndex !== null && poly.points.length > 2) {
          poly.points.splice(this.draggedPointIndex, 1);
          this.draggedPointIndex = null;
          this.draw();
        }
      }
    },

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

      // полигоны
      this.polygons.forEach((poly, idx) => {
        if (!poly.points.length) return;

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

        // точки выбранного полигона
        if (idx === this.selectedPolygonIndex) {
          poly.points.forEach((pt) => {
            ctx.beginPath();
            ctx.arc(pt.x * this.scale, pt.y * this.scale, 5, 0, Math.PI * 2);
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
