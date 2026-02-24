import {
  Sketch,
  SketchCollection,
  Polygon,
  MultiPolygon,
  GeoprocessingHandler,
  Feature,
  isVectorDatasource,
  getFeaturesForSketchBBoxes,
  overlapPolygonArea,
  overlapFeaturesGroupMetrics,
} from "@seasketch/geoprocessing";
import project from "../../project/projectClient.js";
import {
  Metric,
  ReportResult,
  rekeyMetrics,
  sortMetrics,
} from "@seasketch/geoprocessing/client-core";
import {
  getMpaProtectionLevels,
  protectionLevels,
} from "../util/getMpaProtectionLevel.js";

export async function habitatRisk(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
): Promise<ReportResult> {
  const lockoutArea = String(sketch.properties.sketchClassId) === "1555";

  let allMetrics: Metric[] = [];
  let allGroupMetrics: Metric[] = [];

  const featuresByClass: Record<string, Feature<Polygon>[]> = {};

  // Calculate overlap metrics for each class in metric group
  const metricGroupCoral = project.getMetricGroup("habitatRiskCoral");
  const metricGroupMangrove = project.getMetricGroup("habitatRiskMangrove");
  const metricGroupSeagrass = project.getMetricGroup("habitatRiskSeagrass");

  for (const metricGroup of [
    metricGroupCoral,
    metricGroupMangrove,
    metricGroupSeagrass,
  ]) {
    const metrics = (
      await Promise.all(
        metricGroup.classes.map(async (curClass) => {
          const ds = project.getMetricGroupDatasource(metricGroup, {
            classId: curClass.classId,
          });
          if (!isVectorDatasource(ds))
            throw new Error(
              `Expected vector datasource for ${ds.datasourceId}`,
            );
          const url = project.getDatasourceUrl(ds);

          const features = await getFeaturesForSketchBBoxes<Polygon>(
            sketch,
            url,
          );
          const classKey = project.getMetricGroupClassKey(metricGroup, {
            classId: curClass.classId,
          });
          let finalFeatures: Feature<Polygon>[] = [];
          if (classKey === undefined)
            // Use all features
            finalFeatures = features;
          else {
            // Filter to features that are a member of this class
            finalFeatures = features.filter(
              (feat) =>
                feat.geometry &&
                feat.properties &&
                feat.properties[classKey] === curClass.classId,
            );
          }

          featuresByClass[curClass.classId] = finalFeatures;

          // Calculate overlap metrics
          const overlapResult = await overlapPolygonArea(
            metricGroup.metricId,
            finalFeatures,
            sketch,
          );

          return overlapResult.map(
            (metric): Metric => ({
              ...metric,
              classId: curClass.classId,
            }),
          );
        }),
      )
    ).flat();

    allMetrics.push(...metrics);

    if (!lockoutArea) {
      // Calculate group metrics - from individual sketch metrics
      const sketchCategoryMap = getMpaProtectionLevels(sketch);
      const metricToGroup = (sketchMetric: Metric) =>
        sketchCategoryMap[sketchMetric.sketchId!];

      const groupMetrics = await overlapFeaturesGroupMetrics({
        metricId: metricGroup.metricId,
        groupIds: protectionLevels,
        sketch: sketch as Sketch<Polygon> | SketchCollection<Polygon>,
        metricToGroup,
        metrics,
        featuresByClass,
      });
      allGroupMetrics.push(...groupMetrics);
    }
  }

  if (lockoutArea)
    return {
      metrics: sortMetrics(rekeyMetrics(allMetrics)),
    };

  return {
    metrics: sortMetrics(rekeyMetrics([...allMetrics, ...allGroupMetrics])),
  };
}

export default new GeoprocessingHandler(habitatRisk, {
  title: "habitatRisk",
  description: "",
  timeout: 500, // seconds
  memory: 1024, // megabytes
  executionMode: "async",
});
