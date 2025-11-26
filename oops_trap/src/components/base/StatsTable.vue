<template>
  <div class="stats-table-wrapper">
    <table class="stats-table">
      <thead class="stats-table__header">
        <tr>
          <th class="stats-table__cell stats-table__cell--header">Map</th>
          <th class="stats-table__cell stats-table__cell--header">Role</th>
          <th class="stats-table__cell stats-table__cell--header">Time</th>
        </tr>
      </thead>
      <tbody class="stats-table__body">
        <tr
          v-for="(row, index) in tableData"
          :key="index"
          class="stats-table__row"
        >
          <td class="stats-table__cell">{{ row.map }}</td>
          <td class="stats-table__cell">{{ row.role }}</td>
          <td class="stats-table__cell">{{ row.time }}</td>
        </tr>

        <tr v-if="tableData.length === 0" class="stats-table__row">
          <td colspan="3" class="stats-table__cell stats-table__cell--empty">
            No statistics available
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: 'StatsTable',

  props: {
    data: {
      type: Array,
      default: () => []
    }
  },

  data() {
    return {
      tableData: []
    }
  },

  watch: {
    data: {
      immediate: true,
      handler(newData) {
        this.tableData = newData || []
      }
    }
  },

  mounted() {
    if (this.data && this.data.length > 0) {
      this.tableData = this.data
    }
  }
}
</script>

<style scoped>
.stats-table-container {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 20px;
  width: 85%;
  max-height: 500px;
  margin: 0 auto;
}

.stats-table-wrapper {
  max-height: 60vh;
  min-height: 400px;
  overflow-y: auto;
  border-radius: 8px;
  background: rgba(69, 114, 112, 0.3);
  width: 100%;
}

.stats-table-wrapper::-webkit-scrollbar {
  width: 6px;
}

.stats-table-wrapper::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.stats-table-wrapper::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.stats-table-wrapper::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

.stats-table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Irish Grover', system-ui;
  color: white;
  margin: 0 auto;
}

.stats-table__header {
  position: sticky;
  top: 0;
  background: rgba(69, 114, 112);
  backdrop-filter: blur(5px);
}

.stats-table__row {
  transition: background-color 0.2s ease;
}

.stats-table__row:nth-child(even) {
  background: rgba(255, 255, 255, 0.05);
}

.stats-table__row:hover {
  background: rgba(0, 0, 0, 0.1);
}

.stats-table__cell {
  padding: 12px 16px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 18px;
}

.stats-table__cell--header {
  font-weight: bold;
  font-size: 22px;
  color: #ffd700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}
</style>
