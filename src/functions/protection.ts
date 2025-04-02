import {
  rekeyMetrics,
  sortMetrics,
  toNullSketch,
  Sketch,
  SketchCollection,
  Polygon,
  ReportResult,
  createMetric,
  getSketchFeatures,
  getUserAttribute,
} from "@seasketch/geoprocessing/client-core";
import { GeoprocessingHandler } from "@seasketch/geoprocessing";
import project from "../../project/projectClient.js";
import {
  highProtectionLevels,
  mediumProtectionLevels,
} from "../util/getMpaProtectionLevel.js";

export async function protection(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>,
): Promise<ReportResult> {
  const mg = project.getMetricGroup("protection");
  const sketchFeatures = getSketchFeatures(sketch);

  const protectionLevels = sketchFeatures.reduce<Record<string, number>>(
    (levels, sketch) => {
      if (String(sketch.properties.sketchClassId) === "1555") {
        levels["NO_PROTECTION"] = 1 + (levels["NO_PROTECTION"] || 0);
        return levels;
      }

      const protection_level = getUserAttribute(
        sketch.properties,
        "protection_level",
        "",
      ).toString();

      // If protection_level is set, use it
      if (protection_level !== "") {
        if (protection_level === "high")
          levels["HIGH_PROTECTION"] = 1 + (levels["HIGH_PROTECTION"] || 0);
        else if (protection_level === "medium")
          levels["MEDIUM_PROTECTION"] = 1 + (levels["MEDIUM_PROTECTION"] || 0);
        return levels;
      }

      // Otherwise, use designation if set
      const designation = getUserAttribute(
        sketch.properties,
        "designation",
        "",
      ).toString();

      if (highProtectionLevels.includes(designation))
        levels["HIGH_PROTECTION"] = 1 + (levels["HIGH_PROTECTION"] || 0);
      else if (mediumProtectionLevels.includes(designation))
        levels["MEDIUM_PROTECTION"] = 1 + (levels["MEDIUM_PROTECTION"] || 0);
      else
        levels[sketch.properties.id] = 1 + (levels["MEDIUM_PROTECTION"] || 0);

      return levels;
    },
    {},
  );

  const metrics = Object.keys(protectionLevels).map((level) => {
    return createMetric({
      metricId: mg.metricId,
      groupId: level,
      classId: level,
      value: protectionLevels[level],
    });
  });

  return {
    metrics: sortMetrics(rekeyMetrics(metrics)),
    sketch: toNullSketch(sketch),
  };
}

export default new GeoprocessingHandler(protection, {
  title: "protection",
  description: "returns area metrics for protection levels for sketch",
  timeout: 60, // seconds
  executionMode: "async",
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
  memory: 4096,
});
