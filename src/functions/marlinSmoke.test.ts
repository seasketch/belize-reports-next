import { describe, test, expect } from "vitest";
import { marlin } from "./marlin.js";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof marlin).toBe("function");
  });
});
