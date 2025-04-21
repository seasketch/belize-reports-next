import {
  Sketch,
  SketchCollection,
  Polygon,
  toSketchArray,
  getCogFilename,
  MultiPolygon,
  isSketchCollection,
} from "@seasketch/geoprocessing/client-core";
import {
  GeoprocessingHandler,
  toRasterProjection,
} from "@seasketch/geoprocessing";
import { loadCog } from "@seasketch/geoprocessing/dataproviders";
import { min, max } from "simple-statistics";
import project from "../../project/projectClient.js";

// @ts-ignore
import geoblaze, { Georaster } from "geoblaze";
export interface BathymetryResults {
  min: number;
  max: number;
  mean?: number;
  units: string;
  sketchName?: string;
  isCollection?: boolean;
}

export async function bathymetry(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>,
): Promise<BathymetryResults[]> {
  const mg = project.getMetricGroup("bathymetry");
  if (!mg.classes[0].datasourceId)
    throw new Error(`Expected datasourceId for ${mg.classes[0]}`);
  const url = `${project.dataBucketUrl()}${getCogFilename(
    project.getInternalRasterDatasourceById(mg.classes[0].datasourceId),
  )}`;
  const raster = await loadCog(url);
  const stats = await bathyStats(sketch, raster);
  if (!stats)
    throw new Error(`No stats returned for ${sketch.properties.name}`);
  return stats;
}

/**
 * Core raster analysis - given raster, counts number of cells with value that are within Feature polygons
 */
export async function bathyStats(
  /** Polygons to filter for */
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
  /** bathymetry raster to search */
  raster: Georaster,
): Promise<BathymetryResults[]> {
  const sketchArray = toSketchArray(sketch);

  const sketchStats: BathymetryResults[] = await Promise.all(
    sketchArray.map(async (curSketch) => {
      const finalFeat = toRasterProjection(raster, curSketch);
      // If empty sketch (for whatever reason, geography clipping etc)
      if (!finalFeat.geometry.coordinates.length)
        return {
          min: null,
          mean: null,
          max: null,
          units: "meters",
          sketchName: finalFeat.properties.name,
        };
      try {
        const stats = (
          await geoblaze.stats(raster, finalFeat, {
            calcMax: true,
            calcMean: true,
            calcMin: true,
          })
        )[0];
        return {
          min: stats.min > 0 ? 0 : stats.min,
          max: stats.max > 0 ? 0 : stats.max,
          mean: stats.mean > 0 ? 0 : stats.mean,
          units: "meters",
          sketchName: finalFeat.properties.name,
        };
      } catch (err) {
        if (err === "No Values were found in the given geometry") {
          return {
            min: null,
            mean: null,
            max: null,
            units: "meters",
            sketchName: finalFeat.properties.name,
          };
        } else {
          throw err;
        }
      }
    }),
  );

  if (isSketchCollection(sketch)) {
    const minVal = min(sketchStats.map((s) => s.min).filter(notNull));
    const maxVal = max(sketchStats.map((s) => s.max).filter(notNull));

    // Restrict values to be <= 0
    return sketchStats.concat([
      {
        min: minVal > 0 ? 0 : minVal,
        max: maxVal > 0 ? 0 : maxVal,
        units: "meters",
        sketchName: sketch.properties.name,
        isCollection: true,
      },
    ]);
  } else return sketchStats;
}

function notNull(value: number): value is number {
  return value !== null && value !== undefined;
}

export default new GeoprocessingHandler(bathymetry, {
  title: "bathymetry",
  description: "calculates bathymetry within given sketch",
  timeout: 60, // seconds
  executionMode: "async",
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
  memory: 8192,
});
