import {
  OusFeatureCollection,
  ClassCountStats,
  OusStats,
} from "./overlapOusDemographic.js";
import { featureCollection, intersect } from "@turf/turf";
import {
  createMetric,
  Polygon,
  Metric,
  MultiPolygon,
  Sketch,
  SketchCollection,
  toSketchArray,
} from "@seasketch/geoprocessing/client-core";
import { clip } from "@seasketch/geoprocessing";

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
export async function overlapOusDemographicWorker(
  /** ous shape polygons */
  shapes: OusFeatureCollection,
  /** optionally calculate stats for OUS shapes that overlap with sketch  */
  sketch?:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
) {
  // Combine into multipolygon
  const combinedSketch = (() => {
    if (sketch) {
      const sketches = toSketchArray(
        sketch as Sketch<Polygon> | SketchCollection<Polygon>,
      );
      const sketchColl = featureCollection(sketches);
      return sketch ? clip(sketchColl, "union") : null;
    } else {
      return null;
    }
  })();

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
      let isOverlapping: boolean;
      try {
        isOverlapping = combinedSketch
          ? !!intersect(featureCollection([shape, combinedSketch]))
          : false;
        if (sketch && !isOverlapping) return statsSoFar;
      } catch {
        console.log(JSON.stringify(shape), JSON.stringify(combinedSketch));
        throw new Error("Error in intersect");
      }

      // Extract properties
      const resp_id = shape.properties.resp_id;
      const respPeople = (() => {
        const peopleVal = shape.properties["number_of_ppl"];
        if (peopleVal !== null && peopleVal !== undefined) {
          if (typeof peopleVal === "string") return parseFloat(peopleVal);
          else return peopleVal;
        } else return 1;
      })();
      const respCommunities = shape.properties.community
        ? shape.properties.community.split(/\s*,\s*/)
        : ["unknown-community"];
      const curSector = shape.properties.sector
        ? shape.properties.sector
        : "unknown-sector";
      const curGears = shape.properties.gear
        ? shape.properties.gear.split(/\s*,\s*/)
        : ["unknown-gear"];

      // Mutates
      let newStats: OusStats = { ...statsSoFar };

      // If new respondent
      if (!respondentProcessed[resp_id]) {
        // Add respondent to total respondents
        newStats.respondents = newStats.respondents + 1;
        newStats.people = newStats.people + respPeople;

        // Add new respondent to community counts
        respCommunities.forEach((curCommunity) => {
          const communityName: string = curCommunity
            .toLowerCase()
            .replace(/[-\s.'’]+/g, "_");
          const communityCount = (() => {
            const peopleVal = shape.properties[communityName];
            if (peopleVal !== null && peopleVal !== undefined) {
              if (typeof peopleVal === "string") return parseFloat(peopleVal);
              else return peopleVal;
            } else return 1;
          })();

          // Remove region name to get community name
          let classId = communityName;
          regions.forEach((regions) => {
            if (communityName.startsWith(regions))
              classId = communityName.replace(regions, "");
          });

          newStats.byCommunity[classId] = {
            respondents: newStats.byCommunity[classId]
              ? newStats.byCommunity[classId].respondents + 1
              : 1,
            people: newStats.byCommunity[classId]
              ? newStats.byCommunity[classId].people + communityCount
              : communityCount,
          };
        });

        respondentProcessed[resp_id] = {};
      }

      // Once per respondent and gear type counts
      curGears.forEach((curGear) => {
        if (!respondentProcessed[resp_id][curGear]) {
          newStats.byGear[curGear] = {
            respondents: newStats.byGear[curGear]
              ? newStats.byGear[curGear].respondents + 1
              : 1,
            people: newStats.byGear[curGear]
              ? newStats.byGear[curGear].people + respPeople
              : respPeople,
          };
          respondentProcessed[resp_id][curGear] = true;
        }
      });

      // Once per respondent and sector counts
      if (!respondentProcessed[resp_id][curSector]) {
        newStats.bySector[curSector] = {
          respondents: newStats.bySector[curSector]
            ? newStats.bySector[curSector].respondents + 1
            : 1,
          people: newStats.bySector[curSector]
            ? newStats.bySector[curSector].people + respPeople
            : respPeople,
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

  // calculate sketch % overlap - divide sketch counts by total counts
  const overallMetrics = [
    createMetric({
      metricId: "ousPeopleCount",
      classId: "ousPeopleCount_all",
      value: countStats.people,
      ...(sketch ? { sketchId: sketch.properties.id } : {}),
    }),
    createMetric({
      metricId: "ousRespondentCount",
      classId: "ousRespondentCount_all",
      value: countStats.respondents,
      ...(sketch ? { sketchId: sketch.properties.id } : {}),
    }),
  ];

  const sectorMetrics = genOusClassMetrics(countStats.bySector, sketch);
  const communityMetrics = genOusClassMetrics(countStats.byCommunity, sketch);
  const gearMetrics = genOusClassMetrics(countStats.byGear, sketch);

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

/** Generate metrics from OUS class stats */
function genOusClassMetrics<G extends Polygon | MultiPolygon>(
  classStats: ClassCountStats,
  /** optionally calculate stats for OUS shapes that overlap with sketch  */
  sketch?:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
): Metric[] {
  return Object.keys(classStats)
    .map((curClass) => [
      createMetric({
        metricId: "ousPeopleCount",
        classId: curClass,
        value: classStats[curClass].people,
        ...(sketch ? { sketchId: sketch.properties.id } : {}),
      }),
      createMetric({
        metricId: "ousRespondentCount",
        classId: curClass,
        value: classStats[curClass].respondents,
        ...(sketch ? { sketchId: sketch.properties.id } : {}),
      }),
    ])
    .reduce<Metric[]>((soFar, classMetrics) => soFar.concat(classMetrics), []);
}
