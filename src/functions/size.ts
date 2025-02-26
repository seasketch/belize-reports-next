import {
  Sketch,
  Metric,
  Polygon,
  ReportResult,
  SketchCollection,
  toNullSketch,
  rekeyMetrics,
  sortMetrics,
  firstMatchingMetric,
} from "@seasketch/geoprocessing/client-core";
import {
  overlapAreaGroupMetrics,
  overlapArea,
  GeoprocessingHandler,
} from "@seasketch/geoprocessing";
import project from "../../project/projectClient.js";
import { getMpaProtectionLevels } from "../util/getMpaProtectionLevel.js";

const metricGroup = project.getMetricGroup("size");
// Hard code total area of Belize ocean space
const boundaryTotalMetrics: Metric[] = [
  {
    classId: "belize_ocean_space",
    metricId: "size",
    sketchId: null,
    groupId: null,
    geographyId: null,
    value: 33706000000,
  },
];
const totalAreaMetric = firstMatchingMetric(
  boundaryTotalMetrics,
  (m) => m.groupId === null,
);

export async function size(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>,
): Promise<ReportResult> {
  const areaMetrics = (
    await overlapArea(metricGroup.metricId, sketch, totalAreaMetric.value, {
      includePercMetric: false,
    })
  ).map(
    (metric): Metric => ({
      ...metric,
      classId: metricGroup.classes[0].classId,
    }),
  );

  // Generate area metrics grouped by protection level, with area overlap within protection level removed
  // Each sketch gets one group metric for its protection level, while collection generates one for each protection level
  const lockoutArea = String(sketch.properties.sketchClassId) === "1555";
  if (lockoutArea) {
    return {
      metrics: sortMetrics(rekeyMetrics([...areaMetrics])),
      sketch: toNullSketch(sketch),
    };
  }

  const sketchToMpaClass = getMpaProtectionLevels(sketch);
  const metricToLevel = (sketchMetric: Metric) => {
    return sketchToMpaClass[sketchMetric.sketchId!];
  };

  const levelMetrics = await overlapAreaGroupMetrics({
    metricId: metricGroup.metricId,
    groupIds: ["HIGH_PROTECTION", "MEDIUM_PROTECTION"],
    sketch: sketch,
    metricToGroup: metricToLevel,
    metrics: areaMetrics,
    classId: metricGroup.classes[0].classId,
    outerArea: totalAreaMetric.value,
  });

  return {
    metrics: sortMetrics(rekeyMetrics([...areaMetrics, ...levelMetrics])),
    sketch: toNullSketch(sketch),
  };
}

export default new GeoprocessingHandler(size, {
  title: "size",
  description: "Calculate sketch overlap with boundary polygons",
  executionMode: "async",
  timeout: 40,
  requiresProperties: [],
  memory: 4096,
});
