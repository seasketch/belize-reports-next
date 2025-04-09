import fs from "fs-extra";
import {
  ReportResultBase,
  rekeyMetrics,
  DataClass,
  sortMetrics,
} from "@seasketch/geoprocessing/client-core";
import { MetricGroup } from "@seasketch/geoprocessing/client-core";
import { ousDemographicOverlapWorker } from "../../src/functions/ousDemographicOverlapWorker.js";

const filename = "ous_demographics.fgb";

const DEST_PATH = "ousDemographicPrecalcTotals.json";

async function main() {
  //Use dummy sketch properties for precalc
  const overlapResult = await ousDemographicOverlapWorker(
    {},
    {
      overlapSketch: false,
      start: 0,
      end: 11000,
    },
  );

  const result: ReportResultBase = {
    metrics: sortMetrics(rekeyMetrics(overlapResult.metrics)),
  };

  fs.writeFile(DEST_PATH, JSON.stringify(result, null, 2), (err) =>
    err
      ? console.error("Error", err)
      : console.info(`Successfully wrote ${DEST_PATH}`),
  );

  // New for Azores: moves the below code from config into precalc so full metrics are created
  const ousOverallClasses: DataClass[] = [
    {
      classId: "ousPeopleCount_all",
      display: "Total",
      datasourceId: filename,
      layerId: "",
    },
  ];

  const ousOverallDemographicDataGroup = {
    classes: ousOverallClasses,
  };
  const ousOverallDemographicOverlap: MetricGroup = {
    metricId: "ousOverallDemographicOverlap",
    type: "countOverlap",
    ...ousOverallDemographicDataGroup,
  };

  console.log(JSON.stringify(ousOverallDemographicOverlap));

  const ousSectorClasses: DataClass[] = Object.keys(
    overlapResult.stats.bySector,
  ).map(nameToClass);

  const ousSectorDemographicDataGroup = {
    classes: ousSectorClasses,
  };
  const ousSectorDemographicOverlap: MetricGroup = {
    metricId: "ousSectorDemographicOverlap",
    type: "countOverlap",
    ...ousSectorDemographicDataGroup,
  };

  console.log(JSON.stringify(ousSectorDemographicOverlap));

  const ousCommunityClasses: DataClass[] = Object.keys(
    overlapResult.stats.byCommunity,
  )
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({
      classId: name,
      display: name,
      datasourceId: filename,
      layerId: "",
    }))
    .concat({
      classId: "unknown-community",
      display: "Unknown",
      datasourceId: filename,
      layerId: "",
    });
  const ousCommunityDemographicDataGroup = {
    classes: ousCommunityClasses,
  };
  const ousCommunityDemographicOverlap: MetricGroup = {
    metricId: "ousCommunityDemographicOverlap",
    type: "countOverlap",
    ...ousCommunityDemographicDataGroup,
  };

  console.log(JSON.stringify(ousCommunityDemographicOverlap));

  const ousGearClasses: DataClass[] = Object.keys(overlapResult.stats.byGear)
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({
      classId: name,
      display: name[0].toUpperCase() + name.substring(1),
      datasourceId: filename,
      layerId: "",
    }));

  const ousGearDemographicDataGroup = {
    classes: ousGearClasses,
  };
  const ousGearDemographicOverlap: MetricGroup = {
    metricId: "ousGearDemographicOverlap",
    type: "countOverlap",
    ...ousGearDemographicDataGroup,
  };

  console.log(JSON.stringify(ousGearDemographicOverlap));
}

main();

function nameToClass(name: string): DataClass {
  return {
    classId: name,
    display: name,
    datasourceId: filename,
    layerId: "",
  };
}
