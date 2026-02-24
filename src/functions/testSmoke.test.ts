import {
  getExamplePolygonSketchAll,
  writeResultOutput,
  polygonSmokeTest,
  getExampleFeatures,
} from "@seasketch/geoprocessing/scripts/testing";
import { describe, test, expect } from "vitest";
import { bathymetry } from "./bathymetry.js";
import { benthicHabitatMapping } from "./benthicHabitatMapping.js";
import handler, { clipToOceanEez } from "./clipToOceanEez.js";
import { coral } from "./coral.js";
import { geomorphology } from "./geomorphology.js";
import { humanStressors } from "./humanStressors.js";
import { littoralForest } from "./littoralForest.js";
import { mangroves } from "./mangroves.js";
import { mangroveTourism } from "./mangroveTourism.js";
import { oceanWealth } from "./oceanWealth.js";
import { ousDemographicOverlap } from "./ousDemographicOverlap.js";
import { ous } from "./ous.js";
import { protection } from "./protection.js";
import { seagrass } from "./seagrass.js";
import { size } from "./size.js";
import { sportfishingOUS } from "./sportfishingOUS.js";
import { habitatRisk } from "./habitatRisk.js";

// Create standard smoke tests
function createSmokeTest(
  functionName: string,
  functionToTest: Function,
  timeout: number = 60_000,
) {
  describe(functionName, () => {
    test("handler function is present", () => {
      expect(typeof functionToTest).toBe("function");
    });

    test(
      `${functionName} - tests run against all examples`,
      async () => {
        const examples = await getExamplePolygonSketchAll();
        for (const example of examples) {
          const result = await functionToTest(example);
          expect(result).toBeTruthy();
          writeResultOutput(result, functionName, example.properties.name);
        }
      },
      timeout,
    );
  });
}

const tests = [
  { name: "bathymetry", func: bathymetry },
  { name: "coral", func: coral, timeout: 120_000 },
  { name: "geomorphology", func: geomorphology },
  { name: "humanStressors", func: humanStressors },
  { name: "littoralForest", func: littoralForest },
  { name: "mangroves", func: mangroves },
  { name: "mangroveTourism", func: mangroveTourism },
  { name: "oceanWealth", func: oceanWealth },
  {
    name: "ousDemographicOverlap",
    func: ousDemographicOverlap,
    timeout: 500000,
  },
  { name: "ous", func: ous },
  { name: "protection", func: protection },
  { name: "size", func: size },
  { name: "seagrass", func: seagrass },
  { name: "sportfishingOUS", func: sportfishingOUS },
  { name: "habitatRisk", func: habitatRisk },
];

tests.forEach(({ name, func }) => {
  createSmokeTest(name, func);
});

// clipToOceanEez
describe("clipToOceanEez", () => {
  test("clipToOceanEez", async () => {
    const examples = await getExampleFeatures();
    polygonSmokeTest(clipToOceanEez, handler.options.title, examples, {
      timeout: 60_000,
      debug: false,
    });
  }, 60_000);
});
