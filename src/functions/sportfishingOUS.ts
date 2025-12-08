import {
  GeoprocessingHandler,
  getFirstFromParam,
  DefaultExtraParams,
  loadCog,
  rasterMetrics,
  overlapRasterGroupMetrics,
} from "@seasketch/geoprocessing";
import project from "../../project/projectClient.js";
import {
  Sketch,
  SketchCollection,
  Polygon,
  MultiPolygon,
  Georaster,
  Metric,
  ReportResult,
  isRasterDatasource,
  rekeyMetrics,
  sortMetrics,
} from "@seasketch/geoprocessing/client-core";
import {
  getMpaProtectionLevels,
  protectionLevels,
} from "../util/getMpaProtectionLevel.js";

/**
 * sportfishingOUS: A geoprocessing function that calculates overlap metrics
 * @param sketch - A sketch or collection of sketches
 */
export async function sportfishingOUS(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
  extraParams: DefaultExtraParams = {},
): Promise<ReportResult> {
  const metricGroup = project.getMetricGroup("sportfishingOUS");
  const geographyId = getFirstFromParam("geographyIds", extraParams);
  const curGeography = project.getGeographyById(geographyId, {
    fallbackGroup: "default-boundary",
  });

  const lockoutArea = String(sketch.properties.sketchClassId) === "1555";

  const featuresByClass: Record<string, Georaster> = {};

  const metrics = (
    await Promise.all(
      metricGroup.classes.map(async (curClass) => {
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
          stats: ["sum"],
        });

        const metrics = overlapResult.map(
          (metrics): Metric => ({
            ...metrics,
            classId: curClass.classId,
            geographyId: curGeography.geographyId,
            groupId: null,
          }),
        );
        return metrics;
      }),
    )
  ).flat();

  if (lockoutArea) return { metrics: sortMetrics(rekeyMetrics(metrics)) };

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

  // Return a report result with metrics and a null sketch
  return {
    metrics: sortMetrics(rekeyMetrics([...metrics, ...groupMetrics])),
  };
}

export default new GeoprocessingHandler(sportfishingOUS, {
  title: "sportfishingOUS",
  description: "",
  timeout: 500, // seconds
  memory: 1024, // megabytes
  executionMode: "async",
  requiresProperties: [],
});
