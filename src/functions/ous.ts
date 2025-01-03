import {
  Sketch,
  SketchCollection,
  Polygon,
  MultiPolygon,
  GeoprocessingHandler,
  getFirstFromParam,
  DefaultExtraParams,
  rasterMetrics,
  isRasterDatasource,
  loadCog,
  overlapRasterGroupMetrics,
} from "@seasketch/geoprocessing";
import project from "../../project/projectClient.js";
import {
  Georaster,
  Metric,
  ReportResult,
  rekeyMetrics,
  sortMetrics,
  toNullSketch,
} from "@seasketch/geoprocessing/client-core";
import { clipToGeography } from "../util/clipToGeography.js";
import {
  getMpaProtectionLevels,
  protectionLevels,
} from "../util/getMpaProtectionLevel.js";

/**
 * ous: A geoprocessing function that calculates overlap metrics for raster datasources
 * @param sketch - A sketch or collection of sketches
 * @param extraParams
 * @returns Calculated metrics and a null sketch
 */
export async function ous(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
  extraParams: DefaultExtraParams = {},
): Promise<ReportResult> {
  // Check for client-provided geography, fallback to first geography assigned as default-boundary in metrics.json
  const geographyId = getFirstFromParam("geographyIds", extraParams);
  const curGeography = project.getGeographyById(geographyId, {
    fallbackGroup: "default-boundary",
  });
  // Clip portion of sketch outside geography features
  const clippedSketch = await clipToGeography(sketch, curGeography);

  const featuresByClass: Record<string, Georaster> = {};

  // Calculate overlap metrics for each class in metric group
  const metricGroup = project.getMetricGroup("ous");
  const metrics: Metric[] = (
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
          feature: clippedSketch,
          ...(ds.measurementType === "quantitative" && { stats: ["sum"] }),
          ...(ds.measurementType === "categorical" && {
            categorical: true,
            categoryMetricValues: [curClass.classId],
          }),
        });

        return overlapResult.map(
          (metrics): Metric => ({
            ...metrics,
            classId: curClass.classId,
            geographyId: curGeography.geographyId,
            groupId: null,
          }),
        );
      }),
    )
  ).flat();

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

  return {
    metrics: sortMetrics(rekeyMetrics([...metrics, ...groupMetrics])),
    sketch: toNullSketch(sketch, true),
  };
}

export default new GeoprocessingHandler(ous, {
  title: "ous",
  description: "",
  timeout: 500, // seconds
  memory: 1024, // megabytes
  executionMode: "async",
});
