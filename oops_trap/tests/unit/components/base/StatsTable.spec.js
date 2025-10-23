import { mount } from "@vue/test-utils";
import { describe, it, expect, beforeEach } from "vitest";
import StatsTable from "@/components/base/StatsTable.vue";

describe("StatsTable", () => {
  let wrapper;

  const defaultTableData = [
    { map: "Vector", role: "trapmaker", time: "1:08" },
    { map: "Lucky", role: "runner", time: "2:09" },
    { map: "Vector", role: "runner", time: "1:15" },
    { map: "Lucky", role: "trapmaker", time: "2:25" },
  ];

  const customData = [
    { map: "Forest", role: "runner", time: "3:15" },
    { map: "Desert", role: "trapmaker", time: "4:20" },
  ];

  const createWrapper = (props = {}) => {
    return mount(StatsTable, {
      props: {
        data: [],
        ...props,
      },
    });
  };

  describe("Initial Rendering", () => {
    it("renders table with correct structure", () => {
      wrapper = createWrapper();

      const table = wrapper.find(".stats-table");
      expect(table.exists()).toBe(true);

      const thead = table.find("thead");
      expect(thead.exists()).toBe(true);

      const tbody = table.find("tbody");
      expect(tbody.exists()).toBe(true);
    });

    it("renders correct table headers", () => {
      wrapper = createWrapper();

      const headers = wrapper.findAll(".stats-table__cell--header");
      expect(headers).toHaveLength(3);
      expect(headers[0].text()).toBe("Map");
      expect(headers[1].text()).toBe("Role");
      expect(headers[2].text()).toBe("Time");
    });

    it("renders default table data when no props provided", () => {
      wrapper = createWrapper();

      const rows = wrapper.findAll(".stats-table__row");
      expect(rows).toHaveLength(defaultTableData.length);

      const cells = wrapper.findAll(
        ".stats-table__cell:not(.stats-table__cell--header)"
      );
      expect(cells).toHaveLength(defaultTableData.length * 3);

      expect(cells[0].text()).toBe("Vector");
      expect(cells[1].text()).toBe("trapmaker");
      expect(cells[2].text()).toBe("1:08");
    });
  });

  describe("Data Handling", () => {
    it("uses prop data when provided", () => {
      wrapper = createWrapper({ data: customData });

      const rows = wrapper.findAll(".stats-table__row");
      expect(rows).toHaveLength(customData.length);

      const cells = wrapper.findAll(
        ".stats-table__cell:not(.stats-table__cell--header)"
      );
      expect(cells[0].text()).toBe("Forest");
      expect(cells[1].text()).toBe("runner");
      expect(cells[2].text()).toBe("3:15");
    });

    it("uses default data when empty array prop is provided", () => {
      wrapper = createWrapper({ data: [] });

      const rows = wrapper.findAll(".stats-table__row");
      expect(rows).toHaveLength(defaultTableData.length);
    });

    it("uses default data when no data prop is provided", () => {
      wrapper = createWrapper();

      const rows = wrapper.findAll(".stats-table__row");
      expect(rows).toHaveLength(defaultTableData.length);
    });

    it("handles data with different structures", () => {
      const mixedData = [
        { map: "Test", role: "test", time: "0:00" },
        { map: "Another", role: "another", time: "1:11" },
      ];

      wrapper = createWrapper({ data: mixedData });

      const rows = wrapper.findAll(".stats-table__row");
      expect(rows).toHaveLength(mixedData.length);

      const cells = wrapper.findAll(
        ".stats-table__cell:not(.stats-table__cell--header)"
      );
      expect(cells[0].text()).toBe("Test");
      expect(cells[1].text()).toBe("test");
      expect(cells[2].text()).toBe("0:00");
    });
  });

  describe("Table Rows and Cells", () => {
    beforeEach(() => {
      wrapper = createWrapper();
    });

    it("renders correct number of table rows", () => {
      const rows = wrapper.findAll(".stats-table__row");
      expect(rows).toHaveLength(defaultTableData.length);
    });

    it("renders three cells per row", () => {
      const rows = wrapper.findAll(".stats-table__row");

      rows.forEach((row) => {
        const cells = row.findAll(".stats-table__cell");
        expect(cells).toHaveLength(3);
      });
    });

    it("displays correct data in each row", () => {
      const rows = wrapper.findAll(".stats-table__row");

      defaultTableData.forEach((rowData, index) => {
        const cells = rows[index].findAll(".stats-table__cell");
        expect(cells[0].text()).toBe(rowData.map);
        expect(cells[1].text()).toBe(rowData.role);
        expect(cells[2].text()).toBe(rowData.time);
      });
    });
  });

  describe("Component Data", () => {
    it("initializes with correct default tableData", () => {
      wrapper = createWrapper();

      expect(wrapper.vm.tableData).toEqual(defaultTableData);
    });

    it("initializes nickname as empty string", () => {
      wrapper = createWrapper();

      expect(wrapper.vm.nickname).toBe("");
    });

    it("updates tableData when prop data is provided in created hook", () => {
      wrapper = createWrapper({ data: customData });

      expect(wrapper.vm.tableData).toEqual(customData);
    });

    it("keeps default tableData when empty prop data is provided", () => {
      wrapper = createWrapper({ data: [] });

      expect(wrapper.vm.tableData).toEqual(defaultTableData);
    });
  });

  describe("Edge Cases", () => {
    it("handles empty data array", () => {
      wrapper = createWrapper({ data: [] });

      const rows = wrapper.findAll(".stats-table__row");
      expect(rows).toHaveLength(defaultTableData.length);
    });

    it("handles single row of data", () => {
      const singleRowData = [{ map: "Single", role: "test", time: "0:00" }];
      wrapper = createWrapper({ data: singleRowData });

      const rows = wrapper.findAll(".stats-table__row");
      expect(rows).toHaveLength(1);

      const cells = rows[0].findAll(".stats-table__cell");
      expect(cells[0].text()).toBe("Single");
      expect(cells[1].text()).toBe("test");
      expect(cells[2].text()).toBe("0:00");
    });

    it("handles large dataset", () => {
      const largeData = Array.from({ length: 50 }, (_, i) => ({
        map: `Map${i}`,
        role: i % 2 === 0 ? "runner" : "trapmaker",
        time: `${i}:${i.toString().padStart(2, "0")}`,
      }));

      wrapper = createWrapper({ data: largeData });

      const rows = wrapper.findAll(".stats-table__row");
      expect(rows).toHaveLength(50);
    });

    it("handles data with special characters", () => {
      const specialData = [
        { map: "Map & More", role: "runner/trapmaker", time: "1:30" },
      ];

      wrapper = createWrapper({ data: specialData });

      const cells = wrapper.findAll(
        ".stats-table__cell:not(.stats-table__cell--header)"
      );
      expect(cells[0].text()).toBe("Map & More");
      expect(cells[1].text()).toBe("runner/trapmaker");
      expect(cells[2].text()).toBe("1:30");
    });
  });
});
