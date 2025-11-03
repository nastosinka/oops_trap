import { mount } from "@vue/test-utils";
import { describe, it, expect, beforeEach } from "vitest";
import SettingsModal from "@/components/base/SettingsModal.vue";
import BaseButton from "@/components/base/BaseButton.vue";

describe("SettingsModal", () => {
  let wrapper;

  const defaultPlayers = [
    { id: 1, name: "Player 1" },
    { id: 2, name: "Player 2" },
    { id: 3, name: "Player 3" },
  ];

  const defaultInitialSettings = {
    map: "city",
    mafia: 2,
    time: "normal",
  };

  const createWrapper = (props = {}) => {
    return mount(SettingsModal, {
      props: {
        players: defaultPlayers,
        initialSettings: {},
        ...props,
      },
      global: {
        components: {
          BaseButton,
        },
      },
    });
  };

  describe("Initial Rendering", () => {
    it("renders all setting groups", () => {
      wrapper = createWrapper();

      const settingGroups = wrapper.findAll(".setting-group");
      expect(settingGroups).toHaveLength(3);

      const settingTitles = wrapper.findAll(".setting-title");
      expect(settingTitles[0].text()).toBe("map type");
      expect(settingTitles[1].text()).toBe("mafia");
      expect(settingTitles[2].text()).toBe("time");
    });

    it("renders map type options", () => {
      wrapper = createWrapper();

      const mapSelect = wrapper.findAll(".setting-select")[0];
      const mapOptions = mapSelect.findAll("option");

      expect(mapOptions).toHaveLength(5);
      expect(mapOptions[1].text()).toBe("city");
      expect(mapOptions[2].text()).toBe("village");
      expect(mapOptions[3].text()).toBe("forest");
      expect(mapOptions[4].text()).toBe("desert");
    });

    it("renders player options for mafia selection", () => {
      wrapper = createWrapper();

      const mafiaSelect = wrapper.findAll(".setting-select")[1];
      const mafiaOptions = mafiaSelect.findAll("option");

      expect(mafiaOptions).toHaveLength(4);
      expect(mafiaOptions[1].text()).toBe("Player 1");
      expect(mafiaOptions[2].text()).toBe("Player 2");
      expect(mafiaOptions[3].text()).toBe("Player 3");
    });

    it("renders time options", () => {
      wrapper = createWrapper();

      const timeSelect = wrapper.findAll(".setting-select")[2];
      const timeOptions = timeSelect.findAll("option");

      expect(timeOptions).toHaveLength(4);
      expect(timeOptions[1].text()).toBe("slow");
      expect(timeOptions[2].text()).toBe("normal");
      expect(timeOptions[3].text()).toBe("quick");
    });

    it("renders apply button", () => {
      wrapper = createWrapper();

      const applyButton = wrapper.findComponent(BaseButton);
      expect(applyButton.props("label")).toBe("Apply");
    });
  });

  describe("Initial Data Setup", () => {
    it("initializes with empty selections when no initial settings", () => {
      wrapper = createWrapper();

      expect(wrapper.vm.selectedMap).toBe("");
      expect(wrapper.vm.selectedMafia).toBe("");
      expect(wrapper.vm.selectedTime).toBe("");
    });

    it("initializes with values from initialSettings prop", () => {
      wrapper = createWrapper({
        initialSettings: defaultInitialSettings,
      });

      expect(wrapper.vm.selectedMap).toBe("city");
      expect(wrapper.vm.selectedMafia).toBe(2);
      expect(wrapper.vm.selectedTime).toBe("normal");
    });

    it("handles partial initial settings", () => {
      wrapper = createWrapper({
        initialSettings: {
          map: "forest",
          time: "quick",
        },
      });

      expect(wrapper.vm.selectedMap).toBe("forest");
      expect(wrapper.vm.selectedMafia).toBe("");
      expect(wrapper.vm.selectedTime).toBe("quick");
    });
  });

  describe("User Interactions", () => {
    beforeEach(() => {
      wrapper = createWrapper();
    });

    it("updates selectedMap when map selection changes", async () => {
      const mapSelect = wrapper.findAll(".setting-select")[0];

      await mapSelect.setValue("village");

      expect(wrapper.vm.selectedMap).toBe("village");
    });

    it("updates selectedMafia when mafia selection changes", async () => {
      const mafiaSelect = wrapper.findAll(".setting-select")[1];

      await mafiaSelect.setValue(3);

      expect(wrapper.vm.selectedMafia).toBe(3);
    });

    it("updates selectedTime when time selection changes", async () => {
      const timeSelect = wrapper.findAll(".setting-select")[2];

      await timeSelect.setValue("slow");

      expect(wrapper.vm.selectedTime).toBe("slow");
    });

    it("handles string values for mafia selection", async () => {
      const mafiaSelect = wrapper.findAll(".setting-select")[1];

      await mafiaSelect.setValue("1");

      expect(wrapper.vm.selectedMafia).toBe(1);
    });
  });

  describe("Apply Functionality", () => {
    it("emits apply event with correct settings when apply button is clicked", async () => {
      wrapper = createWrapper();

      await wrapper.findAll(".setting-select")[0].setValue("desert");
      await wrapper.findAll(".setting-select")[1].setValue(1);
      await wrapper.findAll(".setting-select")[2].setValue("quick");

      await wrapper.findComponent(BaseButton).trigger("click");

      expect(wrapper.emitted("apply")).toHaveLength(1);
      expect(wrapper.emitted("apply")[0][0]).toEqual({
        map: "desert",
        mafia: 1,
        time: "quick",
      });
    });

    it("emits apply event with partial settings when some fields are empty", async () => {
      wrapper = createWrapper();

      await wrapper.findAll(".setting-select")[0].setValue("city");

      await wrapper.findComponent(BaseButton).trigger("click");

      expect(wrapper.emitted("apply")[0][0]).toEqual({
        map: "city",
        mafia: "",
        time: "",
      });
    });

    it("emits apply event with empty settings when no selections made", async () => {
      wrapper = createWrapper();

      await wrapper.findComponent(BaseButton).trigger("click");

      expect(wrapper.emitted("apply")[0][0]).toEqual({
        map: "",
        mafia: "",
        time: "",
      });
    });
  });

  describe("Data Properties", () => {
    it("has correct mapTypes data", () => {
      wrapper = createWrapper();

      expect(wrapper.vm.mapTypes).toEqual([
        { value: "city", label: "city" },
        { value: "village", label: "village" },
        { value: "forest", label: "forest" },
        { value: "desert", label: "desert" },
      ]);
    });

    it("has correct timeOptions data", () => {
      wrapper = createWrapper();

      expect(wrapper.vm.timeOptions).toEqual([
        { value: "slow", label: "slow" },
        { value: "normal", label: "normal" },
        { value: "quick", label: "quick" },
      ]);
    });
  });

  describe("Edge Cases", () => {
    it("handles empty players array", () => {
      wrapper = createWrapper({ players: [] });

      const mafiaSelect = wrapper.findAll(".setting-select")[1];
      const mafiaOptions = mafiaSelect.findAll("option");

      expect(mafiaOptions).toHaveLength(1);
    });

    it("handles players with duplicate IDs", () => {
      const playersWithDuplicates = [
        { id: 1, name: "Player A" },
        { id: 1, name: "Player B" },
        { id: 2, name: "Player C" },
      ];

      wrapper = createWrapper({ players: playersWithDuplicates });

      const mafiaSelect = wrapper.findAll(".setting-select")[1];
      const mafiaOptions = mafiaSelect.findAll("option");

      expect(mafiaOptions).toHaveLength(4);
    });
  });
});
