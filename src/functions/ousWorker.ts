import {
  Sketch,
  SketchCollection,
  Polygon,
  MultiPolygon,
  GeoprocessingHandler,
  rasterMetrics,
  isRasterDatasource,
  loadCog,
  overlapRasterGroupMetrics,
} from "@seasketch/geoprocessing";
import project from "../../project/projectClient.js";
import {
  Geography,
  Georaster,
  Metric,
  MetricGroup,
  rekeyMetrics,
  sortMetrics,
} from "@seasketch/geoprocessing/client-core";
import {
  getMpaProtectionLevels,
  protectionLevels,
} from "../util/getMpaProtectionLevel.js";

/**
 * ousWorker: A geoprocessing function that calculates overlap metrics for raster datasources
 * @param sketch - A sketch or collection of sketches
 * @param extraParams
 * @returns Calculated metrics and a null sketch
 */
export async function ousWorker(
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

  const featuresByClass: Record<string, Georaster> = {};

  const ds = project.getMetricGroupDatasource(metricGroup, {
    classId: curClass.classId,
  });

  if (!isRasterDatasource(ds))
    throw new Error(`Expected raster datasource for ${ds.datasourceId}`);

  const url = project.getDatasourceUrl(ds);

  // Load raster metadata
  const raster = await loadCog(url);
  featuresByClass[curClass.classId] = raster;

  // Run raster analysis
  const overlapResult = await rasterMetrics(raster, {
    metricId: metricGroup.metricId,
    feature: sketch,
    ...(ds.measurementType === "quantitative" && { stats: ["sum"] }),
    ...(ds.measurementType === "categorical" && {
      categorical: true,
      categoryMetricValues: [curClass.classId],
    }),
  });

  const metrics = overlapResult.map(
    (metrics): Metric => ({
      ...metrics,
      classId: curClass.classId,
      geographyId: curGeography.geographyId,
      groupId: null,
    }),
  );

  // Calculate group metrics - from individual sketch metrics
  const sketchCategoryMap = getMpaProtectionLevels(sketch);
  const metricToGroup = (sketchMetric: Metric) =>
    sketchCategoryMap[sketchMetric.sketchId!];

  const groupMetrics = await overlapRasterGroupMetrics({
    metricId: metricGroup.metricId,
    groupIds: protectionLevels,
    sketch: sketch as Sketch<Polygon> | SketchCollection<Polygon>,
    metricToGroup,
    metrics: metrics,
    featuresByClass,
  });

  return sortMetrics(rekeyMetrics([...metrics, ...groupMetrics]));
}

export default new GeoprocessingHandler(ousWorker, {
  title: "ousWorker",
  description: "",
  timeout: 500, // seconds
  memory: 4096, // megabytes
  executionMode: "sync",
});
