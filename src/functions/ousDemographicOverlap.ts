import {
  Sketch,
  Polygon,
  ReportResult,
  SketchCollection,
  rekeyMetrics,
  MultiPolygon,
  Nullable,
  Feature,
  FeatureCollection,
  Metric,
  GeoprocessingRequestModel,
  DefaultExtraParams,
} from "@seasketch/geoprocessing/client-core";
import {
  GeoprocessingHandler,
  parseLambdaResponse,
  runLambdaWorker,
} from "@seasketch/geoprocessing";
import { sortMetrics } from "@seasketch/geoprocessing/client-core";
import project from "../../project/projectClient.js";
import { InvocationResponse } from "@aws-sdk/client-lambda";
import { ousDemographicOverlapWorker } from "./ousDemographicOverlapWorker.js";

export interface OusFeatureProperties {
  resp_id: number;
  weight: number;
  community?: Nullable<string>;
  sector?: Nullable<string>;
  gear?: Nullable<string>;
  number_of_ppl: string | number;
  [key: string]: any;
}

export type OusFeature = Feature<MultiPolygon | Polygon, OusFeatureProperties>;
export type OusFeatureCollection = FeatureCollection<
  MultiPolygon | Polygon,
  OusFeatureProperties
>;

export interface BaseCountStats {
  respondents: number;
  people: number;
}

export type ClassCountStats = Record<string, BaseCountStats>;

export interface OusStats extends BaseCountStats {
  bySector: ClassCountStats;
  byCommunity: ClassCountStats;
  byGear: ClassCountStats;
}

export type OusReportResult = {
  stats: OusStats;
  metrics: Metric[];
};

/** Calculate sketch area overlap inside and outside of multiple planning area boundaries */
export async function ousDemographicOverlap(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
  extraParams: DefaultExtraParams = {},
  request?: GeoprocessingRequestModel<Polygon | MultiPolygon>,
): Promise<ReportResult> {
  const ranges = [
    { start: 6000, end: 6328 },
    { start: 6329, end: 6536 },
    { start: 6537, end: 6841 },
    { start: 6842, end: 8779 },
    { start: 8780, end: 10500 },
  ];

  // Start workers
  const results: OusReportResult[] = (
    await Promise.all(
      ranges.map((range) => {
        const parameters = {
          start: range.start,
          end: range.end,
          overlapSketch: true,
        };

        return process.env.NODE_ENV === "test"
          ? ousDemographicOverlapWorker(sketch, parameters)
          : runLambdaWorker(
              sketch,
              project.package.name,
              "ousDemographicOverlapWorker",
              project.geoprocessing.region,
              parameters,
              request!,
            );
      }),
    )
  ).reduce<{ stats: OusStats; metrics: Metric[] }[]>((metrics, result) => {
    const parsedResult =
      process.env.NODE_ENV === "test"
        ? (result as { stats: OusStats; metrics: Metric[] })
        : (parseLambdaResponse(result as InvocationResponse) as unknown as {
            stats: OusStats;
            metrics: Metric[];
          });
    metrics.push(parsedResult);
    return metrics;
  }, []);

  // Combine metrics from worker threads
  const firstResult: OusReportResult = JSON.parse(
    JSON.stringify(results.shift()), // pops first result to use as base
  );

  const finalResult = results.reduce((finalResult, result) => {
    // stats

    finalResult.stats.respondents += result.stats.respondents;
    finalResult.stats.people += result.stats.people;

    // stats.bySector
    for (const sector in result.stats.bySector) {
      if (finalResult.stats.bySector[sector]) {
        finalResult.stats.bySector[sector].people +=
          result.stats.bySector[sector].people;
        finalResult.stats.bySector[sector].respondents +=
          result.stats.bySector[sector].respondents;
      } else {
        finalResult.stats.bySector[sector] = {
          people: result.stats.bySector[sector].people,
          respondents: result.stats.bySector[sector].respondents,
        };
      }
    }

    // stats.byCommunity
    for (const community in result.stats.byCommunity) {
      if (finalResult.stats.byCommunity[community]) {
        finalResult.stats.byCommunity[community].people +=
          result.stats.byCommunity[community].people;
        finalResult.stats.byCommunity[community].respondents +=
          result.stats.byCommunity[community].respondents;
      } else {
        finalResult.stats.byCommunity[community] = {
          people: result.stats.byCommunity[community].people,
          respondents: result.stats.byCommunity[community].respondents,
        };
      }
    }

    // stats.byGear
    for (const gear in result.stats.byGear) {
      if (finalResult.stats.byGear[gear]) {
        finalResult.stats.byGear[gear].people +=
          result.stats.byGear[gear].people;
        finalResult.stats.byGear[gear].respondents +=
          result.stats.byGear[gear].respondents;
      } else {
        finalResult.stats.byGear[gear] = {
          people: result.stats.byGear[gear].people,
          respondents: result.stats.byGear[gear].respondents,
        };
      }
    }

    // metrics

    result.metrics.forEach((metric) => {
      const index = finalResult.metrics.findIndex(
        (finalMetric) =>
          finalMetric.metricId === metric.metricId &&
          finalMetric.classId === metric.classId &&
          finalMetric.sketchId === metric.sketchId,
      );
      if (index === -1) {
        finalResult.metrics.push(JSON.parse(JSON.stringify(metric)));
      } else {
        finalResult.metrics[index].value += metric.value;
      }
    });

    return finalResult;
  }, firstResult);

  const metrics = finalResult.metrics;

  return {
    metrics: sortMetrics(rekeyMetrics(metrics)),
  };
}

export default new GeoprocessingHandler(ousDemographicOverlap, {
  title: "ousDemographicOverlap",
  description: "Calculates ous demographic metrics",
  timeout: 900, // seconds
  executionMode: "async",
  // Specify any Sketch Class form attributes that are required
  memory: 1024,
  requiresProperties: [],
  workers: ["ousDemographicOverlapWorker"],
});
