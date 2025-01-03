import {
  Sketch,
  Polygon,
  ReportResult,
  SketchCollection,
  toNullSketch,
  rekeyMetrics,
  MultiPolygon,
} from "@seasketch/geoprocessing/client-core";
import {
  GeoprocessingHandler,
  genFeatureCollection,
  getFeaturesForSketchBBoxes,
} from "@seasketch/geoprocessing";
import {
  OusFeature,
  OusFeatureCollection,
  overlapOusDemographic,
} from "../util/overlapOusDemographic.js";
import { sortMetrics } from "@seasketch/geoprocessing/client-core";
import project from "../../project/projectClient.js";

/** Calculate sketch area overlap inside and outside of multiple planning area boundaries */
export async function ousDemographicOverlap(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
): Promise<ReportResult> {
  const url = `${project.dataBucketUrl()}/ous_demographics.fgb`;
  const sh = await getFeaturesForSketchBBoxes(sketch, url);

  const metrics = (
    await overlapOusDemographic(
      genFeatureCollection(sh as OusFeature[]) as OusFeatureCollection,
      sketch,
    )
  ).metrics;

  return {
    metrics: sortMetrics(rekeyMetrics(metrics)),
    sketch: toNullSketch(sketch, true),
  };
}

export default new GeoprocessingHandler(ousDemographicOverlap, {
  title: "ousDemographicOverlap",
  description: "Calculates ous overlap metrics",
  timeout: 900, // seconds
  executionMode: "async",
  // Specify any Sketch Class form attributes that are required
  memory: 10240,
  requiresProperties: [],
});
