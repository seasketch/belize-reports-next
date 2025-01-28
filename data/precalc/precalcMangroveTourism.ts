import {
  loadFgb,
  Feature,
  createMetric,
  Point,
} from "@seasketch/geoprocessing";
import fs from "fs-extra";
import projectClient from "../../project/projectClient.js";

async function main() {
  // Initialize an empty array to store results
  const metrics = [];
  const metricGroup = projectClient.getMetricGroup("mangroveTourism");

  for (const curClass of metricGroup.classes) {
    try {
      const features = await loadFgb<Feature<Point>>(
        "http://127.0.0.1:8080/" + curClass.datasourceId + ".fgb",
      );

      const count = features.length;

      // Create metric and add it to the array
      const metric = createMetric({
        geographyId: "belize_ocean_space",
        classId: curClass.datasourceId,
        value: count,
      });
      metrics.push(metric);
    } catch (error) {
      console.error(`Error processing class ${curClass.classId}:`, error);
    }
  }

  // Write the results to a JSON file
  fs.writeJsonSync(
    `${import.meta.dirname}/precalcMangroveTourism.json`,
    metrics,
  );
}

main();
