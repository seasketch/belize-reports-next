import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { humanStressors } from "./humanStressors.js";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof humanStressors).toBe("function");
  });
  test("humanStressors - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await humanStressors(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "humanStressors", example.properties.name);
    }
  }, 60_000);
});
