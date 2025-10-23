import { mount } from "@vue/test-utils";
import { describe, it, expect } from "vitest";
import BaseButton from "@/components/base/BaseButton.vue";

describe("BaseButton", () => {
  describe("Rendering", () => {
    it("renders button with label from prop", () => {
      const wrapper = mount(BaseButton, {
        props: {
          label: "Test Button",
        },
      });

      expect(wrapper.text()).toBe("Test Button");
      expect(wrapper.find("button").exists()).toBe(true);
    });

    it("renders button with slot content when no label provided", () => {
      const wrapper = mount(BaseButton, {
        slots: {
          default: "Slot Content",
        },
      });

      expect(wrapper.text()).toBe("Slot Content");
    });

    it("prioritizes slot content over label prop", () => {
      const wrapper = mount(BaseButton, {
        props: {
          label: "Prop Label",
        },
        slots: {
          default: "Slot Label",
        },
      });

      expect(wrapper.text()).toBe("Slot Label");
    });

    it("renders empty button when no label or slot provided", () => {
      const wrapper = mount(BaseButton);

      expect(wrapper.text()).toBe("");
      expect(wrapper.find("button").exists()).toBe(true);
    });
  });

  describe("Click Events", () => {
    it("emits click event when button is clicked", async () => {
      const wrapper = mount(BaseButton);

      await wrapper.trigger("click");

      expect(wrapper.emitted("click")).toHaveLength(1);
    });

    it("passes native event object when clicked", async () => {
      const wrapper = mount(BaseButton);

      await wrapper.trigger("click");

      const emittedEvent = wrapper.emitted("click")[0][0];
      expect(emittedEvent).toBeInstanceOf(Event);
    });

    it("emits multiple click events when clicked multiple times", async () => {
      const wrapper = mount(BaseButton);

      await wrapper.trigger("click");
      await wrapper.trigger("click");
      await wrapper.trigger("click");

      expect(wrapper.emitted("click")).toHaveLength(3);
    });
  });

  describe("CSS Classes and Structure", () => {
    it("has correct CSS classes", () => {
      const wrapper = mount(BaseButton);

      const button = wrapper.find("button");
      expect(button.classes()).toContain("base-button");
      expect(button.find(".base-button__content").exists()).toBe(true);
    });

    it("maintains proper DOM structure", () => {
      const wrapper = mount(BaseButton, {
        props: {
          label: "Test",
        },
      });

      const button = wrapper.find("button");
      const contentDiv = button.find(".base-button__content");

      expect(contentDiv.exists()).toBe(true);
      expect(contentDiv.text()).toBe("Test");
    });
  });

  describe("Accessibility", () => {
    it("is a button element for proper semantics", () => {
      const wrapper = mount(BaseButton);

      expect(wrapper.element.tagName).toBe("BUTTON");
    });

    it("has default type attribute", () => {
      const wrapper = mount(BaseButton);

      expect(wrapper.attributes("type")).toBeUndefined();
    });
  });
});
