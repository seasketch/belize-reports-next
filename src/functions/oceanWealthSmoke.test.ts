import {
  getExamplePolygonSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { oceanWealth } from "./oceanWealth.js";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof oceanWealth).toBe("function");
  });
  test("oceanWealth - tests run against all examples", async () => {
    const examples = await getExamplePolygonSketchAll();
    for (const example of examples) {
      const result = await oceanWealth(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "oceanWealth", example.properties.name);
    }
  }, 60_000);
});
