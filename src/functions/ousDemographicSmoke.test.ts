import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { ousDemographicOverlap } from "./ousDemographicOverlap.js";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof ousDemographicOverlap).toBe("function");
  });
  test("ousDemographicOverlap - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await ousDemographicOverlap(example);
      expect(result).toBeTruthy();
      writeResultOutput(
        result,
        "ousDemographicOverlap",
        example.properties.name,
      );
    }
  }, 500_000);
});
