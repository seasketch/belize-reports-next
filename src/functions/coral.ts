import {
  Sketch,
  SketchCollection,
  Polygon,
  MultiPolygon,
  GeoprocessingHandler,
  getFirstFromParam,
  DefaultExtraParams,
  Feature,
  isVectorDatasource,
  getFeaturesForSketchBBoxes,
  overlapPolygonArea,
  overlapGroupMetrics,
  Georaster,
  Metric,
  ReportResult,
  isPolygonFeatureArray,
  rekeyMetrics,
  sortMetrics,
  toNullSketch,
} from "@seasketch/geoprocessing";
import project from "../../project/projectClient.js";
import {
  getMpaProtectionLevels,
  protectionLevels,
} from "../util/getMpaProtectionLevel.js";

/**
 * coral: A geoprocessing function that calculates overlap metrics for vector datasources
 * @param sketch - A sketch or collection of sketches
 * @param extraParams
 * @returns Calculated metrics and a null sketch
 */
export async function coral(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
  extraParams: DefaultExtraParams = {},
): Promise<ReportResult> {
  const lockoutArea = String(sketch.properties.sketchClassId) === "1555";

  // Check for client-provided geography, fallback to first geography assigned as default-boundary in metrics.json
  const geographyId = getFirstFromParam("geographyIds", extraParams);
  const curGeography = project.getGeographyById(geographyId, {
    fallbackGroup: "default-boundary",
  });

  const featuresByDatasource: Record<string, Feature<Polygon>[]> = {};
  const featuresByClass: Record<string, Feature<Polygon>[]> = {};

  // Calculate overlap metrics for each class in metric group
  const metricGroup = project.getMetricGroup("coral");
  const metrics = (
    await Promise.all(
      metricGroup.classes.map(async (curClass) => {
        const ds = project.getMetricGroupDatasource(metricGroup, {
          classId: curClass.classId,
        });
        if (!isVectorDatasource(ds))
          throw new Error(`Expected vector datasource for ${ds.datasourceId}`);
        const url = project.getDatasourceUrl(ds);

        // Fetch features overlapping with sketch, if not already fetched
        const features =
          featuresByDatasource[ds.datasourceId] ||
          (await getFeaturesForSketchBBoxes(sketch, url));

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

        featuresByClass[ds.datasourceId] = finalFeatures;

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
            geographyId: curGeography.geographyId,
          }),
        );
      }),
    )
  ).flat();

  if (lockoutArea)
    return {
      metrics: sortMetrics(rekeyMetrics(metrics)),
      sketch: toNullSketch(sketch),
    };

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

  return {
    metrics: sortMetrics(rekeyMetrics([...metrics, ...groupMetrics])),
  };
}

export async function overlapFeaturesGroupMetrics(options: {
  /** Caller-provided metric ID */
  metricId: string;
  /** Group identifiers - will generate group metric for each, even if result in zero value, so pre-filter if want to limit */
  groupIds: string[];
  /** Sketch - single or collection */
  sketch: Sketch<Polygon> | SketchCollection<Polygon>;
  /** Function that given sketch metric and group name, returns true if sketch is in the group, otherwise false */
  metricToGroup: (sketchMetric: Metric) => string;
  /** The metrics to group */
  metrics: Metric[];
  /** features to overlap, keyed by class ID, use empty array if overlapArea operation */
  featuresByClass: Record<string, Feature<Polygon>[]>;
  /** only generate metrics for groups that sketches match to, rather than all */
  onlyPresentGroups?: boolean;
}): Promise<Metric[]> {
  return overlapGroupMetrics({
    ...options,
    operation: async (
      metricId: string,
      features: Feature<Polygon>[] | Georaster,
      sc: SketchCollection<Polygon>,
    ) => {
      if (!isPolygonFeatureArray(features))
        console.log(`Expected feature array`);

      const overallGroupMetrics = await overlapPolygonArea(
        metricId,
        features as Feature<Polygon>[],
        sc,
        {
          includeChildMetrics: false,
        },
      );
      return overallGroupMetrics[0].value;
    },
  });
}

export default new GeoprocessingHandler(coral, {
  title: "coral",
  description: "coral overlap",
  timeout: 500, // seconds
  memory: 4096, // megabytes
  executionMode: "async",
});
