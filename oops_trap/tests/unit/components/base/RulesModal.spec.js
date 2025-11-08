import { mount } from "@vue/test-utils";
import { describe, it, expect, beforeEach } from "vitest";
import RulesModal from "@/components/base/RulesModal.vue";

describe("RulesModal", () => {
  let wrapper;

  const createWrapper = (props = {}) => {
    return mount(RulesModal, {
      props: {
        initialSection: "common",
        ...props,
      },
    });
  };

  describe("Initial Rendering", () => {
    it("renders all accordion sections", () => {
      wrapper = createWrapper();

      const sections = wrapper.findAll(".accordion-item");
      expect(sections).toHaveLength(4);

      const sectionTitles = wrapper.findAll(".accordion-title");
      expect(sectionTitles[0].text()).toBe("Common Rules");
      expect(sectionTitles[1].text()).toBe("Trapmaker Rules");
      expect(sectionTitles[2].text()).toBe("Runner Rules");
      expect(sectionTitles[3].text()).toBe("Maps & Environment");
    });

    it("sets initial active section from prop", () => {
      wrapper = createWrapper({ initialSection: "trapmaker" });

      expect(wrapper.vm.activeSection).toBe("trapmaker");
      expect(wrapper.find(".accordion-item--active").exists()).toBe(true);
    });

    it("uses default initial section when not provided", () => {
      wrapper = createWrapper({ initialSection: undefined });

      expect(wrapper.vm.activeSection).toBe("common");
    });
  });

  describe("Accordion Functionality", () => {
    beforeEach(() => {
      wrapper = createWrapper();
    });

    it("toggles section open when clicking header", async () => {
      const runnerHeader = wrapper.findAll(".accordion-header")[2];

      await runnerHeader.trigger("click");

      expect(wrapper.vm.activeSection).toBe("runner");
      expect(wrapper.findAll(".accordion-item--active")).toHaveLength(1);
    });

    it("closes section when clicking the same header", async () => {
      const runnerHeader = wrapper.findAll(".accordion-header")[2];
      await runnerHeader.trigger("click");
      expect(wrapper.vm.activeSection).toBe("runner");

      await runnerHeader.trigger("click");

      expect(wrapper.vm.activeSection).toBeNull();
      expect(wrapper.findAll(".accordion-item--active")).toHaveLength(0);
    });

    it("opens new section and closes previous one", async () => {
      expect(wrapper.vm.activeSection).toBe("common");

      const mapsHeader = wrapper.findAll(".accordion-header")[3];
      await mapsHeader.trigger("click");

      expect(wrapper.vm.activeSection).toBe("maps");
      expect(wrapper.findAll(".accordion-item--active")).toHaveLength(1);
    });

    it("updates accordion icons based on active state", async () => {
      const commonHeader = wrapper.findAll(".accordion-header")[0];
      const commonIcon = commonHeader.find(".accordion-icon");

      expect(commonIcon.text()).toBe("−");

      await commonHeader.trigger("click");
      expect(commonIcon.text()).toBe("+");

      const trapmakerHeader = wrapper.findAll(".accordion-header")[1];
      const trapmakerIcon = trapmakerHeader.find(".accordion-icon");

      await trapmakerHeader.trigger("click");
      expect(trapmakerIcon.text()).toBe("−");
      expect(commonIcon.text()).toBe("+");
    });
  });

  describe("Content Display", () => {
    it("shows content only for active section", async () => {
      wrapper = createWrapper();

      const contentSections = wrapper.findAll(".accordion-content");
      expect(contentSections).toHaveLength(1);
      expect(contentSections[0].isVisible()).toBe(true);

      const trapmakerHeader = wrapper.findAll(".accordion-header")[1];
      await trapmakerHeader.trigger("click");

      const updatedContentSections = wrapper.findAll(".accordion-content");
      expect(updatedContentSections).toHaveLength(1);
      expect(updatedContentSections[0].isVisible()).toBe(true);
    });

    it("displays correct content for each section", async () => {
      wrapper = createWrapper();

      const commonContent = wrapper.find(".accordion-content");
      expect(commonContent.text()).toContain("Basic Game Rules");
      expect(commonContent.text()).toContain("2d стилистике"); // исправлено на строчную d
      expect(commonContent.text()).toContain("личный кабинет");

      const trapmakerHeader = wrapper.findAll(".accordion-header")[1];
      await trapmakerHeader.trigger("click");

      const trapmakerContent = wrapper.find(".accordion-content");
      expect(trapmakerContent.text()).toContain("Trapmaker Responsibilities");
      expect(trapmakerContent.text()).toContain("активацию ловушек");

      const runnerHeader = wrapper.findAll(".accordion-header")[2];
      await runnerHeader.trigger("click");

      const runnerContent = wrapper.find(".accordion-content");
      expect(runnerContent.text()).toContain("Runner Objectives");
      expect(runnerContent.text()).toContain("двойной прыжок");

      const mapsHeader = wrapper.findAll(".accordion-header")[3];
      await mapsHeader.trigger("click");

      const mapsContent = wrapper.find(".accordion-content");
      expect(mapsContent.text()).toContain("Map Types");
      expect(mapsContent.text()).toContain("Я вижу свет");
    });
  });

  describe("CSS Classes and Styling", () => {
    it("applies active class to correct section", async () => {
      wrapper = createWrapper();

      const commonSection = wrapper.findAll(".accordion-item")[0];
      expect(commonSection.classes()).toContain("accordion-item--active");

      const runnerHeader = wrapper.findAll(".accordion-header")[2];
      await runnerHeader.trigger("click");

      const runnerSection = wrapper.findAll(".accordion-item")[2];
      expect(runnerSection.classes()).toContain("accordion-item--active");
      expect(commonSection.classes()).not.toContain("accordion-item--active");
    });

    it("has proper structure with headers and content", () => {
      wrapper = createWrapper();

      const items = wrapper.findAll(".accordion-item");
      items.forEach((item) => {
        expect(item.find(".accordion-header").exists()).toBe(true);
        expect(item.find(".accordion-title").exists()).toBe(true);
        expect(item.find(".accordion-icon").exists()).toBe(true);
      });
    });
  });

  describe("Accessibility and UX", () => {
    it("allows only one section to be open at a time", async () => {
      wrapper = createWrapper();

      expect(wrapper.findAll(".accordion-item--active")).toHaveLength(1);

      const trapmakerHeader = wrapper.findAll(".accordion-header")[1];
      await trapmakerHeader.trigger("click");

      expect(wrapper.findAll(".accordion-item--active")).toHaveLength(1);
      expect(wrapper.vm.activeSection).toBe("trapmaker");
    });

    it("handles rapid clicking between sections", async () => {
      wrapper = createWrapper();

      const commonHeader = wrapper.findAll(".accordion-header")[0];
      const trapmakerHeader = wrapper.findAll(".accordion-header")[1];
      const runnerHeader = wrapper.findAll(".accordion-header")[2];

      await commonHeader.trigger("click");
      await trapmakerHeader.trigger("click");
      await runnerHeader.trigger("click");
      await commonHeader.trigger("click");

      expect(wrapper.vm.activeSection).toBe("common");
      expect(wrapper.findAll(".accordion-item--active")).toHaveLength(1);
    });
  });
});
