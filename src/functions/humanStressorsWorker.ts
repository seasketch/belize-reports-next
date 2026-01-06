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
} from "@seasketch/geoprocessing";
import project from "../../project/projectClient.js";
import {
  Metric,
  MetricGroup,
  rekeyMetrics,
  sortMetrics,
} from "@seasketch/geoprocessing/client-core";
import {
  getMpaProtectionLevels,
  protectionLevels,
} from "../util/getMpaProtectionLevel.js";
import { overlapFeaturesGroupMetrics } from "./coral.js";

export async function humanStressorsWorker(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
  extraParams: {
    metricGroup: MetricGroup;
    classId: string;
  },
): Promise<Metric[]> {
  const lockoutArea = String(sketch.properties.sketchClassId) === "1555";

  const metricGroup = extraParams.metricGroup;
  const curClass = metricGroup.classes.find(
    (c) => c.classId === extraParams.classId,
  )!;

  const featuresByClass: Record<string, Feature<Polygon>[]> = {};

  const ds = project.getMetricGroupDatasource(metricGroup, {
    classId: curClass.classId,
  });
  if (!isVectorDatasource(ds))
    throw new Error(`Expected vector datasource for ${ds.datasourceId}`);
  const url = project.getDatasourceUrl(ds);
  const features = await getFeaturesForSketchBBoxes<Polygon>(sketch, url);
  featuresByClass[curClass.classId] = features;

  const overlapResult = await overlapPolygonArea(
    metricGroup.metricId,
    features,
    sketch,
  );

  const metrics = overlapResult.map(
    (metric): Metric => ({
      ...metric,
      classId: curClass.classId,
    }),
  );

  if (lockoutArea) return sortMetrics(rekeyMetrics(metrics));

  // Calculate group metrics
  const sketchCategoryMap = getMpaProtectionLevels(sketch);
  const metricToGroup = (sketchMetric: Metric) =>
    sketchCategoryMap[sketchMetric.sketchId!];

  const groupMetrics = await overlapFeaturesGroupMetrics({
    metricId: metricGroup.metricId,
    groupIds: protectionLevels,
    sketch: sketch as Sketch<Polygon> | SketchCollection<Polygon>,
    metricToGroup,
    metrics: metrics,
    featuresByClass,
  });

  return sortMetrics(rekeyMetrics([...metrics, ...groupMetrics]));
}

export default new GeoprocessingHandler(humanStressorsWorker, {
  title: "humanStressorsWorker",
  description: "",
  timeout: 500,
  memory: 4096,
  executionMode: "sync",
});
