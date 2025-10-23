import { describe, it, expect } from "vitest";
import { Zaglushka } from "@/temporary-test-functions/zaglushka";

describe("Zaglushka", () => {
  it("should call all 30 functions", () => {
    const z = new Zaglushka();
    for (let i = 1; i <= 40; i++) {
      expect(z[`func${i}`]()).toBe(i);
    }
  });
});
