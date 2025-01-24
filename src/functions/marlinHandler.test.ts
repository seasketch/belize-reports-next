/**
 * @vitest-environment node
 */
import Handler from "./marlin.js";
import { describe, test, expect } from "vitest";

const marlin = Handler.func;

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof marlin).toBe("function");
  });
});
