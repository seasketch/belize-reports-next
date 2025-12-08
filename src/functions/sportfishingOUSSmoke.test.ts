import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { sportfishingOUS } from "./sportfishingOUS.js";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof sportfishingOUS).toBe("function");
  });
  test("sportfishingOUS - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await sportfishingOUS(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "sportfishingOUS", example.properties.name);
    }
  }, 600_000);
});
