import {
  firstMatchingMetric,
  groupBy,
  keyBy,
  Metric,
} from "@seasketch/geoprocessing/client-core";
import { useSketchProperties } from "@seasketch/geoprocessing/client-ui";

/**
 * Aggregates metrics by group
 * @param groupMetrics metrics with assigned groupId (except group total metric) and sketchIds for collection
 * @param totalMetrics totals by class
 * @returns one aggregate object for every groupId present in metrics.  Each object includes:
 * [numSketches] - count of child sketches in the group
 * [classId] - a percValue for each classId present in metrics for group
 * [value] - sum of value across all classIds present in metrics for group
 * [percValue] - given sum value across all classIds, contains ratio of total sum across all class IDs
 */
export const flattenByGroupAllClass = (
  groupMetrics: Metric[],
  totalMetrics: Metric[],
): {
  value: number;
  groupId: string;
  percValue: number;
}[] => {
  // Stratify in order by Group -> Collection -> Class. Then flatten
  const [{ id }] = useSketchProperties();
  const metricsByGroup = groupBy(groupMetrics, (m) => m.groupId || "undefined");

  return Object.keys(metricsByGroup).map((curGroupId) => {
    const collGroupMetrics = metricsByGroup[curGroupId].filter(
      (m) => m.sketchId === id && m.groupId === curGroupId,
    );
    const collGroupMetricsByClass = keyBy(
      collGroupMetrics,
      (m) => m.classId || "undefined",
    );

    const classAgg = Object.keys(collGroupMetricsByClass).reduce(
      (rowsSoFar, curClassId) => {
        const groupClassSketchMetrics = groupMetrics.filter(
          (m) =>
            m.sketchId !== id &&
            m.groupId === curGroupId &&
            m.classId === curClassId,
        );

        const curValue = collGroupMetricsByClass[curClassId]?.value;

        const classTotal = firstMatchingMetric(
          totalMetrics,
          (totalMetric) => totalMetric.classId === curClassId,
        ).value;

        return {
          ...rowsSoFar,
          [curClassId]: curValue / classTotal,
          numSketches: groupClassSketchMetrics.length,
          value: rowsSoFar.value + curValue,
        };
      },
      { value: 0 },
    );

    const groupTotal = firstMatchingMetric(
      totalMetrics,
      (m) => !m.groupId, // null groupId identifies group total metric
    ).value;
    return {
      groupId: curGroupId,
      percValue: classAgg.value / groupTotal,
      ...classAgg,
    };
  });
};
