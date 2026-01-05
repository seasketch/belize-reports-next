import {
  Sketch,
  SketchCollection,
  Polygon,
  toSketchArray,
  isSketchCollection,
} from "@seasketch/geoprocessing/client-core";
import {
  GeoprocessingHandler,
  toRasterProjection,
} from "@seasketch/geoprocessing";
import { loadCog } from "@seasketch/geoprocessing/dataproviders";
import project from "../../project/projectClient.js";

// @ts-ignore
import geoblaze from "geoblaze";

export interface BathymetryResults {
  min: number | null;
  max: number | null;
  mean?: number | null;
  units: string;
  sketchName?: string;
  isCollection?: boolean;
}

// Clamp depth to be <= 0
const clamp = (v: number | null) => (v === null || v > 0 ? 0 : v);
const emptyResult = (name: string): BathymetryResults => ({
  min: null,
  max: null,
  mean: null,
  units: "meters",
  sketchName: name,
});

export async function bathymetry(
  sketch: Sketch<Polygon> | SketchCollection<Polygon>,
): Promise<BathymetryResults[]> {
  const mg = project.getMetricGroup("bathymetry");
  const ds = project.getInternalRasterDatasourceById(
    mg.classes[0].datasourceId!,
  );
  const url = project.getDatasourceUrl(ds);
  const raster = await loadCog(url);

  const sketchStats = await Promise.all(
    toSketchArray(sketch).map(async (curSketch) => {
      const finalFeat = toRasterProjection(raster, curSketch);

      if (!finalFeat.geometry.coordinates.length)
        return emptyResult(finalFeat.properties.name);

      try {
        const [stats] = await geoblaze.stats(raster, finalFeat, {
          calcMax: true,
          calcMean: true,
          calcMin: true,
        });
        return {
          min: clamp(stats.min),
          max: clamp(stats.max),
          mean: clamp(stats.mean),
          units: "meters",
          sketchName: finalFeat.properties.name,
        };
      } catch (err) {
        if (err === "No Values were found in the given geometry")
          return emptyResult(finalFeat.properties.name);
        throw err;
      }
    }),
  );

  if (!isSketchCollection(sketch)) return sketchStats;

  const values = sketchStats.map((s) => s.min).filter((v) => v !== null);
  return [
    ...sketchStats,
    {
      min: clamp(Math.min(...values)),
      max: clamp(
        Math.max(...sketchStats.map((s) => s.max).filter((v) => v !== null)),
      ),
      units: "meters",
      sketchName: sketch.properties.name,
      isCollection: true,
    },
  ];
}

export default new GeoprocessingHandler(bathymetry, {
  title: "bathymetry",
  description: "calculates bathymetry within given sketch",
  timeout: 60, // seconds
  executionMode: "async",
  requiresProperties: [],
  memory: 8192,
});
