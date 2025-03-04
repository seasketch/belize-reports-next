import {
  Sketch,
  Feature,
  Polygon,
  SketchCollection,
  Metric,
  Point,
  isSketchCollection,
  groupBy,
  toSketchArray,
  keyBy,
  clip,
  MultiPolygon,
  genSampleSketchCollection,
  createMetric,
  isPointFeature,
} from "@seasketch/geoprocessing";
import { overlapPoint } from "./overlapPoint.js";
import cloneDeep from "lodash";
import { featureCollection, flatten } from "@turf/turf";

type OverlapGroupOperation = (
  metricId: string,
  features: Feature<Polygon>[] | Feature<Point>[],
  sc: SketchCollection<Polygon>,
) => Promise<number>;

export function isPointFeatureArray(
  featureArray: any,
): featureArray is Feature<Point>[] {
  return (
    Array.isArray(featureArray) &&
    featureArray.reduce<boolean>((last, feat) => {
      return last && isPointFeature(feat);
    }, true)
  );
}

/**
 * Generate overlap group metrics using overlapFeatures operation
 */
export async function overlapPointGroupMetrics(options: {
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
  featuresByClass: Record<string, Feature<Point>[]>;
  /** only generate metrics for groups that sketches match to, rather than all */
  onlyPresentGroups?: boolean;
}): Promise<Metric[]> {
  return overlapGroupMetrics({
    ...options,
    operation: async (
      metricId: string,
      features: Feature<Point>[] | Feature<Polygon>[],
      sc: SketchCollection<Polygon>,
    ) => {
      if (!isPointFeatureArray(features))
        throw new Error(`Expected point feature array`);
      const overallGroupMetrics = await overlapPoint(metricId, features, sc, {
        includeChildMetrics: false,
      });
      return overallGroupMetrics[0].value;
    },
  });
}

/**
 * Given area overlap metrics stratified by class and sketch, returns new metrics also stratified by group
 * Assumes a sketch is member of only one group, determined by caller-provided metricToGroup
 * For each group+class, calculates area of overlap between sketches in group and featuresByClass (with overlap between group sketches removed first)
 * Types of metrics returned:
 *  sketch metrics: copy of caller-provided sketch metrics with addition of group ID
 *  overall metric for each group+class: takes sketches in group, subtracts overlap between them and overlap with higher group sketches, and runs operation
 * If a group has no sketches in it, then no group metrics will be included for that group, and group+class metric will be 0
 */
export async function overlapGroupMetrics(options: {
  /** Caller-provided metric ID */
  metricId: string;
  /** Group identifiers */
  groupIds: string[];
  /** Sketch - single or collection */
  sketch: Sketch<Polygon> | SketchCollection<Polygon>;
  /** Function that given sketch metric returns the group ID */
  metricToGroup: (sketchMetric: Metric) => string;
  /** The metrics to group */
  metrics: Metric[];
  /** features to overlap, keyed by class ID, use empty array if overlapArea operation */
  featuresByClass:
    | Record<string, Feature<Polygon>[]>
    | Record<string, Feature<Point>[]>;
  /** overlap operation, defaults to overlapFeatures */
  operation: OverlapGroupOperation;
  /** only generate metrics for groups that sketches match to, rather than all groupIds */
  onlyPresentGroups?: boolean;
}): Promise<Metric[]> {
  const {
    metricId,
    groupIds,
    sketch,
    metricToGroup,
    metrics,
    featuresByClass,
    operation,
    onlyPresentGroups = false,
  } = options;
  const classes = Object.keys(featuresByClass);

  // Filter to individual sketch metrics and clone as base for group metrics
  const sketchMetrics: Metric[] = isSketchCollection(sketch)
    ? cloneDeep(metrics)
        .filter((sm) => sm.sketchId !== sketch.properties.id)
        .value()
    : cloneDeep(metrics)
        .filter((sm) => sm.sketchId === sketch.properties.id)
        .value();

  // Lookup and add group
  let groupSketchMetrics: Metric[] = sketchMetrics.map((m) => ({
    ...m,
    groupId: metricToGroup(m),
  }));

  // For each group
  const groupMetricsPromises = groupIds.reduce<Promise<Metric[]>[]>(
    (groupMetricsPromisesSoFar, curGroup) => {
      // For each class
      const groupMetricsPromise = classes.reduce<Promise<Metric[]>[]>(
        (classMetricsPromisesSoFar, curClass) => {
          // async iife to wrap in new promise
          const curClassMetricsPromise = (async () => {
            // Filter to cur class metrics
            const curGroupSketchMetrics = groupSketchMetrics.filter(
              (sm) => sm.classId === curClass && sm.metricId === metricId,
            );

            // Optionally, skip this group if not present in metrics
            const curClassGroupIds = onlyPresentGroups
              ? Object.keys(groupBy(curGroupSketchMetrics, (m) => m.groupId!))
              : groupIds;
            if (onlyPresentGroups && !curClassGroupIds.includes(curGroup)) {
              return [];
            }

            const classGroupMetrics = await getClassGroupMetrics({
              sketch,
              groupSketchMetrics: curGroupSketchMetrics,
              groups: groupIds,
              groupId: curGroup,
              metricId,
              features: featuresByClass[curClass],
              operation,
            });

            return classGroupMetrics.map(
              (metric): Metric => ({
                ...metric,
                classId: curClass,
              }),
            );
          })();

          return [...classMetricsPromisesSoFar, curClassMetricsPromise];
        },
        [],
      );
      return [...groupMetricsPromisesSoFar, ...groupMetricsPromise];
    },
    [],
  );

  // Await and unroll result
  const groupMetrics = (await Promise.all(groupMetricsPromises)).reduce(
    (metricsSoFar, curMetrics) => [...metricsSoFar, ...curMetrics],
    [],
  );

  return groupMetrics;
}

/**
 * Given groupId, returns area of overlap between features and sketches in the group
 * Assumes that groupSketchMetrics and features are pre-filtered to a single class
 */
const getClassGroupMetrics = async (options: {
  sketch: Sketch<Polygon> | SketchCollection<Polygon>;
  groupSketchMetrics: Metric[];
  groups: string[];
  groupId: string;
  metricId: string;
  features: Feature<Polygon>[] | Feature<Point>[];
  operation: OverlapGroupOperation;
}): Promise<Metric[]> => {
  const {
    sketch,
    groupSketchMetrics,
    groups,
    groupId,
    metricId,
    features,
    operation,
  } = options;
  const sketches = toSketchArray(sketch);
  const sketchMap = keyBy(sketches, (item) => item.properties.id);

  // Filter to group.  May result in empty list
  const curGroupSketchMetrics: Metric[] = groupSketchMetrics.filter(
    (m) => m.groupId === groupId,
  );
  const results: Metric[] = curGroupSketchMetrics;

  // If collection account for overlap
  if (isSketchCollection(sketch)) {
    // Get IDs of all sketches (non-collection) with current group and collection, from metrics
    const curGroupSketches = curGroupSketchMetrics
      .filter((gm) => gm.groupId === groupId)
      .map((gm) => sketchMap[gm.sketchId!]) // sketchMap will be undefined for collection metrics
      .filter((gm) => !!gm); // so remove undefined

    // Get sketch metrics from higher groups (lower index value) and convert to sketches
    const higherGroupSketchMetrics = groups.reduce<Metric[]>(
      (otherSoFar, otherGroupName) => {
        // Append if lower index than current group
        const groupIndex = groups.findIndex((grp) => grp === groupId);
        const otherIndex = groups.findIndex(
          (findGroupName) => otherGroupName === findGroupName,
        );

        const otherGroupMetrics = groupSketchMetrics.filter(
          (gm) => gm.groupId === otherGroupName,
        );
        return otherIndex < groupIndex
          ? otherSoFar.concat(otherGroupMetrics)
          : otherSoFar;
      },
      [],
    );
    const higherGroupSketches = Object.values(
      keyBy(higherGroupSketchMetrics, (m) => m.sketchId!),
    ).map((ogm) => sketchMap[ogm.sketchId!]);

    let groupValue: number = 0;
    if (curGroupSketches.length > 1 || higherGroupSketches.length > 0) {
      groupValue = await getReducedGroupAreaOverlap({
        metricId,
        groupSketches: curGroupSketches,
        higherGroupSketches: higherGroupSketches,
        features,
        operation,
      });
    } else {
      groupValue = curGroupSketchMetrics.reduce(
        (sumSoFar, sm) => sm.value + sumSoFar,
        0,
      );
    }

    results.push(
      createMetric({
        groupId: groupId,
        metricId: metricId,
        sketchId: sketch.properties.id,
        value: groupValue,
        extra: {
          sketchName: sketch.properties.name,
          isCollection: true,
        },
      }),
    );
  }

  // If no single sketch metrics for group, add a zero for group
  if (curGroupSketchMetrics.length === 0) {
    results.push(
      createMetric({
        groupId: groupId,
        metricId: metricId,
        sketchId: sketch.properties.id,
        value: 0,
        extra: {
          sketchName: sketch.properties.name,
        },
      }),
    );
  }

  return results;
};

/**
 * Calculates area of overlap between groupSketches and features
 * Removes overlap with higherGroupSketches first
 * If either sketch array is empty it will do the right thing
 */
const getReducedGroupAreaOverlap = async (options: {
  /** metric identifier */
  metricId: string;
  /** sketches in group. */
  groupSketches: Sketch<Polygon>[];
  /** sketches in other groups that take precedence and overlap must be removed.  */
  higherGroupSketches: Sketch<Polygon>[];
  /** polygon features to overlap with */
  features: Feature<Polygon>[] | Feature<Point>[];
  operation: OverlapGroupOperation;
}) => {
  const { metricId, groupSketches, higherGroupSketches, features, operation } =
    options;
  // Given current group sketches, subtract area of sketches in higher groups
  const otherOverlap = groupSketches
    .map((groupSketch) =>
      clip(
        featureCollection([groupSketch, ...higherGroupSketches]),
        "difference",
      ),
    )
    .reduce<
      Feature<Polygon | MultiPolygon>[]
    >((rem, diff) => (diff ? rem.concat(diff) : rem), []);
  const otherRemSketches = genSampleSketchCollection(
    featureCollection<Polygon>(
      flatten(featureCollection(otherOverlap)).features,
    ),
  ).features;

  const finalFC = featureCollection(
    higherGroupSketches.length > 0 ? otherRemSketches : groupSketches,
  );
  const finalSC = genSampleSketchCollection(finalFC);

  // Calc just the one overall metric for this group+class
  if (finalSC.features.length === 0) return 0;
  const overallValue = await operation(metricId, features, finalSC);
  return overallValue;
};
