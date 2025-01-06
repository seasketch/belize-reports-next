import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { seagrass } from "./seagrass.js";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof seagrass).toBe("function");
  });
  test("seagrass - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await seagrass(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "seagrass", example.properties.name);
    }
  }, 120_000);
});
