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
  Geography,
  Metric,
  MetricGroup,
  rekeyMetrics,
  sortMetrics,
} from "@seasketch/geoprocessing/client-core";
import { overlapFeaturesGroupMetrics } from "./coral.js";
import {
  getMpaProtectionLevels,
  protectionLevels,
} from "../util/getMpaProtectionLevel.js";

/**
 * mangrovesWorker: A geoprocessing function that calculates overlap metrics for vector datasources
 * @param sketch - A sketch or collection of sketches
 * @param extraParams
 * @returns Calculated metrics and a null sketch
 */
export async function mangrovesWorker(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
  extraParams: {
    metricGroup: MetricGroup;
    classId: string;
    geography: Geography;
  },
): Promise<Metric[]> {
  const metricGroup = extraParams.metricGroup;
  const curClass = metricGroup.classes.find(
    (c) => c.classId === extraParams.classId,
  )!;
  const curGeography = extraParams.geography;

  const featuresByClass: Record<string, Feature<Polygon>[]> = {};

  const ds = project.getMetricGroupDatasource(metricGroup, {
    classId: curClass.classId,
  });
  if (!isVectorDatasource(ds))
    throw new Error(`Expected vector datasource for ${ds.datasourceId}`);
  const url = project.getDatasourceUrl(ds);

  // Fetch features overlapping with sketch, if not already fetched
  const features = await getFeaturesForSketchBBoxes<Polygon>(sketch, url);

  // Get classKey for current data class
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

  const metrics = overlapResult.map(
    (metric): Metric => ({
      ...metric,
      classId: curClass.classId,
      geographyId: curGeography.geographyId,
    }),
  );

  // Calculate group metrics - from individual sketch metrics
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

export default new GeoprocessingHandler(mangrovesWorker, {
  title: "mangrovesWorker",
  description: "",
  timeout: 500, // seconds
  memory: 4096, // megabytes
  executionMode: "sync",
});
