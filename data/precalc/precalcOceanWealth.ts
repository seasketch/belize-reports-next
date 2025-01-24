import { bbox, featureCollection } from "@turf/turf";
import {
  loadFgb,
  MultiPolygon,
  Feature,
  Polygon,
  createMetric,
  intersectSum,
} from "@seasketch/geoprocessing";
import fs from "fs-extra";
import projectClient from "../../project/projectClient.js";

async function main() {
  // Initialize an empty array to store results
  const metrics = [];
  const metricGroup = projectClient.getMetricGroup("oceanWealth");

  for (const curClass of metricGroup.classes) {
    try {
      // Load features once
      const features = await loadFgb<Feature<Polygon>>(
        "http://127.0.0.1:8080/" + curClass.datasourceId + ".fgb",
      );

      let sum: number = 0;
      const sumProperty = "Total_Val";

      // Iterate through feature indices and accumulate collection level sum value
      for (const feature of features) {
        if (
          feature.properties &&
          feature.properties[sumProperty] !== undefined
        ) {
          sum += feature.properties[sumProperty];
        } else {
          // Shouldnt happen
          console.error("Feature missing Total_Val", feature);
          sum += 1;
        }
      }

      // Create metric and add it to the array
      const metric = createMetric({
        geographyId: "belize_ocean_space",
        classId: curClass.datasourceId,
        value: sum,
      });
      metrics.push(metric);
    } catch (error) {
      console.error(`Error processing class ${curClass.classId}:`, error);
    }
  }

  // Write the results to a JSON file
  fs.writeJsonSync(`${import.meta.dirname}/precalcOceanWealth.json`, metrics);
}

main();
