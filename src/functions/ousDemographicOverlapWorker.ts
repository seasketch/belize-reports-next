import { featureCollection, intersect } from "@turf/turf";
import {
  Sketch,
  SketchCollection,
  Polygon,
  MultiPolygon,
  GeoprocessingHandler,
  clip,
  Metric,
  createMetric,
  toSketchArray,
  getFeaturesForSketchBBoxes,
  genFeatureCollection,
  loadFgb,
} from "@seasketch/geoprocessing";
import {
  ClassCountStats,
  OusFeature,
  OusFeatureCollection,
  OusStats,
} from "./ousDemographicOverlap.js";
import projectClient from "../../project/projectClient.js";

/**
  Calculates demographics of ocean use within a sketch. This function is specific to the 
  OUS Demographics Survey conducted in Belize. Each shape in 'shapes' contains the
  following information:
  - Respondent ID - unique, anonymous Id used to identify a respondent
  - Number of people - one respondent can represent different numbers of people for different sectors. 
    One respondent is tied to a specific number of people represented (i.e. respondent 1 = 5 people for all shapes).
    The number of people represented is then brooken down into communities (5 people, 3 from community A, 2 from community B)
  - Sector - one respondent can draw shapes for multiple sectors
  - Gear - one or more per shape (list where each element separated by comma), 
  answered by respondent per shape, particular for fisheries
 */
export async function ousDemographicOverlapWorker(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
  extraParams: {
    start: number;
    end: number;
    overlapSketch: boolean;
  },
): Promise<{ stats: OusStats; metrics: Metric[] }> {
  const { overlapSketch } = extraParams;

  // Combine into multipolygon
  const combinedSketch = overlapSketch
    ? clip(featureCollection(toSketchArray(sketch)), "union")
    : null;

  const url = `${projectClient.dataBucketUrl()}ous_demographics.fgb`;
  const rawShapes = (
    overlapSketch
      ? ((await getFeaturesForSketchBBoxes(sketch, url)) as OusFeature[])
      : ((await loadFgb(url)) as OusFeature[])
  )
    .sort((a, b) => a.properties.resp_id - b.properties.resp_id)
    .filter(
      (s) =>
        s.properties.resp_id >= extraParams.start &&
        s.properties.resp_id <= extraParams.end,
    );
  const shapes = genFeatureCollection(rawShapes) as OusFeatureCollection;

  // Track counting of respondent stats, only need to count once
  const respondentProcessed: Record<string, Record<string, boolean>> = {};

  // Region names
  const regions = ["belize_", "corozal_", "stann_creek_", "toledo_"];

  const countStats = shapes.features.reduce<OusStats>(
    (statsSoFar, shape) => {
      if (
        !shape.properties ||
        !shape.properties.resp_id ||
        !shape.properties.number_of_ppl
      ) {
        console.log(`Shape missing key properties ${JSON.stringify(shape)}`);
        return statsSoFar;
      }

      // Proceed with count if shape is overlapping with sketch
      if (overlapSketch) {
        let isOverlapping: boolean;
        try {
          isOverlapping = !!intersect(
            featureCollection([shape, combinedSketch!]),
          );
          if (!isOverlapping) return statsSoFar;
        } catch {
          console.log(JSON.stringify(shape), JSON.stringify(combinedSketch));
          throw new Error("Error in intersect");
        }
      }

      // Extract properties
      const resp_id = shape.properties.resp_id;
      const respPeople = parsePeopleCount(shape.properties["number_of_ppl"]);
      const respCommunities = parseCommunities(
        shape.properties.community ?? undefined,
      );
      const curSector = shape.properties.sector || "unknown-sector";
      const curGears = parseGears(shape.properties.gear ?? undefined);

      // Mutates
      let newStats: OusStats = { ...statsSoFar };

      // If new respondent
      if (!respondentProcessed[resp_id]) {
        newStats.respondents++;
        newStats.people += respPeople;

        respCommunities.forEach((curCommunity) => {
          const communityName = formatCommunityName(curCommunity, regions);
          const communityCount = parsePeopleCount(
            shape.properties[communityName],
          );

          // Remove region name for classId
          let classId = communityName;
          regions.forEach((regions) => {
            if (communityName.startsWith(regions))
              classId = communityName.replace(regions, "");
          });

          newStats.byCommunity[classId] = {
            respondents: (newStats.byCommunity[classId]?.respondents || 0) + 1,
            people:
              (newStats.byCommunity[classId]?.people || 0) + communityCount,
          };
        });

        respondentProcessed[resp_id] = {};
      }

      curGears.forEach((curGear) => {
        if (!respondentProcessed[resp_id][curGear]) {
          newStats.byGear[curGear] = {
            respondents: (newStats.byGear[curGear]?.respondents || 0) + 1,
            people: (newStats.byGear[curGear]?.people || 0) + respPeople,
          };
          respondentProcessed[resp_id][curGear] = true;
        }
      });

      if (!respondentProcessed[resp_id][curSector]) {
        newStats.bySector[curSector] = {
          respondents: (newStats.bySector[curSector]?.respondents || 0) + 1,
          people: (newStats.bySector[curSector]?.people || 0) + respPeople,
        };
        respondentProcessed[resp_id][curSector] = true;
      }

      return newStats;
    },
    {
      respondents: 0,
      people: 0,
      bySector: {},
      byCommunity: {},
      byGear: {},
    },
  );

  const overallMetrics = [
    createMetric({
      metricId: "ousPeopleCount",
      classId: "ousPeopleCount_all",
      value: countStats.people,
      sketchId: overlapSketch ? sketch.properties.id : null,
    }),
    createMetric({
      metricId: "ousRespondentCount",
      classId: "ousRespondentCount_all",
      value: countStats.respondents,
      sketchId: overlapSketch ? sketch.properties.id : null,
    }),
  ];

  const sectorMetrics = genOusClassMetrics(
    countStats.bySector,
    sketch,
    overlapSketch,
  );
  const communityMetrics = genOusClassMetrics(
    countStats.byCommunity,
    sketch,
    overlapSketch,
  );
  const gearMetrics = genOusClassMetrics(
    countStats.byGear,
    sketch,
    overlapSketch,
  );

  return {
    stats: countStats,
    metrics: [
      ...overallMetrics,
      ...sectorMetrics,
      ...communityMetrics,
      ...gearMetrics,
    ],
  };
}

function parsePeopleCount(value: any): number {
  if (value !== null && value !== undefined) {
    if (typeof value === "string") return parseFloat(value);
    return value;
  }
  return 1;
}

function parseCommunities(value: string | undefined): string[] {
  return value ? value.split(/\s*,\s*/) : ["unknown-community"];
}

function parseGears(value: string | undefined): string[] {
  return value ? value.split(/\s*,\s*/) : ["unknown-gear"];
}

function formatCommunityName(community: string, regions: string[]): string {
  const name = community.toLowerCase().replace(/[-\s.'’]+/g, "_");
  return name;
}

/** Generate metrics from OUS class stats */
function genOusClassMetrics<G extends Polygon | MultiPolygon>(
  classStats: ClassCountStats,
  /** optionally calculate stats for OUS shapes that overlap with sketch  */
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
  overlapSketch: boolean,
): Metric[] {
  return Object.keys(classStats)
    .map((curClass) => [
      createMetric({
        metricId: "ousPeopleCount",
        classId: curClass,
        value: classStats[curClass].people,
        ...(overlapSketch ? { sketchId: sketch.properties.id } : {}),
      }),
      createMetric({
        metricId: "ousRespondentCount",
        classId: curClass,
        value: classStats[curClass].respondents,
        ...(overlapSketch ? { sketchId: sketch.properties.id } : {}),
      }),
    ])
    .reduce<Metric[]>((soFar, classMetrics) => soFar.concat(classMetrics), []);
}

export default new GeoprocessingHandler(ousDemographicOverlapWorker, {
  title: "ousDemographicOverlapWorker",
  description: "",
  timeout: 500, // seconds
  memory: 4096, // megabytes
  executionMode: "sync",
});
