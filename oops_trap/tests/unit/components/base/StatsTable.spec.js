import { mount } from "@vue/test-utils";
import StatsTable from "@/components/base/StatsTable.vue";
import { describe, it, expect, afterEach } from "vitest";

describe("StatsTable.vue", () => {
  let wrapper;

  const mockData = [
    { map: 1, role: "mafia", time: "2:05" },
    { map: 2, role: "civilian", time: "3:15" },
    { map: 1, role: "civilian", time: "1:45" },
  ];

  const createWrapper = (propsData = {}) => {
    return mount(StatsTable, {
      props: propsData,
    });
  };

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe("Рендеринг компонента", () => {
    it("должен отображать заголовки таблицы", () => {
      wrapper = createWrapper();

      const headers = wrapper.findAll("th");
      expect(headers).toHaveLength(3);
      expect(headers[0].text()).toBe("Map");
      expect(headers[1].text()).toBe("Role");
      expect(headers[2].text()).toBe("Time");
    });

    it("должен отображать строки с данными", () => {
      wrapper = createWrapper({ data: mockData });

      const dataRows = wrapper.findAll("tbody tr");
      expect(dataRows).toHaveLength(mockData.length);

      const firstRowCells = dataRows[0].findAll("td");
      expect(firstRowCells[0].text()).toBe("1");
      expect(firstRowCells[1].text()).toBe("mafia");
      expect(firstRowCells[2].text()).toBe("2:05");
    });

    it("должен отображать сообщение при отсутствии данных", () => {
      wrapper = createWrapper({ data: [] });

      const emptyCell = wrapper.find('td[colspan="3"]');
      expect(emptyCell.exists()).toBe(true);
      expect(emptyCell.text()).toBe("No statistics available");
    });
  });

  describe("Watcher для props data", () => {
    it("должен обновлять tableData при изменении props data", async () => {
      wrapper = createWrapper({ data: [] });
      expect(wrapper.vm.tableData).toEqual([]);

      await wrapper.setProps({ data: mockData });
      expect(wrapper.vm.tableData).toEqual(mockData);
    });

    it("должен обновлять отображение при изменении данных", async () => {
      wrapper = createWrapper({ data: [] });

      let emptyCell = wrapper.find('td[colspan="3"]');
      expect(emptyCell.exists()).toBe(true);

      await wrapper.setProps({ data: mockData });

      emptyCell = wrapper.find('td[colspan="3"]');
      expect(emptyCell.exists()).toBe(false);

      const dataRows = wrapper.findAll("tbody tr");
      expect(dataRows).toHaveLength(mockData.length);
    });
  });

  describe("Обработка граничных случаев", () => {
    it("должен работать с одним элементом в массиве", () => {
      const singleItem = [{ map: 1, role: "mafia", time: "1:00" }];
      wrapper = createWrapper({ data: singleItem });

      const dataRows = wrapper.findAll("tbody tr");
      expect(dataRows).toHaveLength(1);

      const cells = dataRows[0].findAll("td");
      expect(cells[0].text()).toBe("1");
      expect(cells[1].text()).toBe("mafia");
      expect(cells[2].text()).toBe("1:00");
    });
  });
});
