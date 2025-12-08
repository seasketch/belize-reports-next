import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { benthicHabitatMapping } from "./benthicHabitatMapping.js";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof benthicHabitatMapping).toBe("function");
  });
  test("benthicHabitatMapping - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await benthicHabitatMapping(example);
      expect(result).toBeTruthy();
      writeResultOutput(
        result,
        "benthicHabitatMapping",
        example.properties.name,
      );
    }
  }, 500_000);
});
