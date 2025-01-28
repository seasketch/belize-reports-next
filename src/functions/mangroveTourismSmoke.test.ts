import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { mangroveTourism } from "./mangroveTourism.js";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof mangroveTourism).toBe("function");
  });
  test("mangroveTourism - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await mangroveTourism(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "mangroveTourism", example.properties.name);
    }
  }, 60_000);
});
