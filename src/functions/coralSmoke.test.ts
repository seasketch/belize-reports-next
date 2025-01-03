import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { coral } from "./coral.js";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof coral).toBe("function");
  });
  test("coral - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await coral(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "coral", example.properties.name);
    }
  }, 60_000);
});
