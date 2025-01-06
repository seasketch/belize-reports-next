import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { littoralForest } from "./littoralForest.js";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof littoralForest).toBe("function");
  });
  test("littoralForest - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await littoralForest(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "littoralForest", example.properties.name);
    }
  }, 60_000);
});
