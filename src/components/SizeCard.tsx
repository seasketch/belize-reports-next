import React from "react";
import {
  ResultsCard,
  ReportError,
  Collapse,
  KeySection,
  HorizontalStackedBar,
  ReportChartFigure,
  useSketchProperties,
  VerticalSpacer,
  ToolbarCard,
  LayerToggle,
  DataDownload,
} from "@seasketch/geoprocessing/client-ui";
import {
  ReportResult,
  Metric,
  firstMatchingMetric,
  percentWithEdge,
  GroupMetricAgg,
  roundLower,
  squareMeterToKilometer,
  OBJECTIVE_NO,
  OBJECTIVE_YES,
  flattenByGroupAllClass,
  isSketchCollection,
} from "@seasketch/geoprocessing/client-core";
import { Trans, useTranslation } from "react-i18next";
import project from "../../project/projectClient.js";
import { Label, WatersBackgroundBelize } from "./WatersBackgroundBelize.js";
import { groupColorMap } from "../util/getMpaProtectionLevel.js";
import {
  CollectionObjectiveStatus,
  collectionMsgs,
  genAreaGroupLevelTable,
  genAreaSketchTable,
} from "../util/ProtectionLevelOverlapReports.js";
import { Download } from "@styled-icons/bootstrap/Download";

// Hard code total area of Belize ocean space
const boundaryTotalMetrics: Metric[] = [
  {
    classId: "belize_ocean_space",
    metricId: "size",
    sketchId: null,
    groupId: null,
    geographyId: null,
    value: 33706000000,
  },
];

/**
 * Top level SizeCard element
 * @returns React.FunctionComponent
 */
export const SizeCard: React.FunctionComponent<{ printing: boolean }> = (
  props,
) => {
  const { t } = useTranslation();
  const [{ isCollection, id, childProperties }] = useSketchProperties();
  const mg = project.getMetricGroup("size", t);
  const objectiveIds = [
    "ocean_space_protected",
    "ocean_space_highly_protected",
  ];

  return (
    <div style={{ breakInside: "avoid" }}>
      <ResultsCard title={t("Size")} functionName="size" useChildCard>
        {(data: ReportResult) => {
          // Get overall area of sketch metric
          const areaMetric = firstMatchingMetric(
            data.metrics,
            (m) => m.sketchId === id && m.groupId === null,
          );

          // Grab overall size precalc metric
          const totalAreaMetric = firstMatchingMetric(
            boundaryTotalMetrics,
            (m) => m.groupId === null,
          );

          // Format area metrics for key section display
          const areaDisplay = roundLower(
            squareMeterToKilometer(areaMetric.value),
          );
          const percDisplay = percentWithEdge(
            areaMetric.value / totalAreaMetric.value,
          );
          const areaUnitDisplay = t("km²");
          const mapLabel = t("Show Map Layer");

          return (
            <ReportError>
              <ToolbarCard
                title={t("Size")}
                items={
                  <DataDownload
                    filename="size"
                    data={data.metrics}
                    formats={["csv", "json"]}
                    placement="left-end"
                    titleElement={
                      <Download
                        size={18}
                        color="#999"
                        style={{ cursor: "pointer" }}
                      />
                    }
                  />
                }
              >
                <VerticalSpacer />
                <Trans i18nKey="SizeCard - Intro">
                  The Belize Ocean Space includes internal waters, territorial
                  seas, and the Exclusive Economic Zone (EEZ) which extends out
                  to 200 nautical miles. This report summarizes this plan's
                  overlap with the total ocean space, measuring progress towards
                  achieving the objective of 30% protection.
                </Trans>
                <VerticalSpacer />
                <KeySection>
                  {t("This plan is")}{" "}
                  <b>
                    {areaDisplay} {areaUnitDisplay}
                  </b>
                  {", "}
                  {t("which is")} <b>{percDisplay}</b> {t("of")}{" "}
                  {t("the 33,706 km² Belize Ocean Space")}.
                </KeySection>

                <LayerToggle label={mapLabel} layerId={mg.layerId} />
                <VerticalSpacer />

                {isCollection
                  ? collectionReport(
                      data,
                      boundaryTotalMetrics,
                      objectiveIds,
                      t,
                    )
                  : sketchReport(data, boundaryTotalMetrics, objectiveIds, t)}

                {isCollection && (
                  <>
                    <Collapse
                      title={t("Show by Protection Level")}
                      collapsed={!props.printing}
                      key={String(props.printing) + "Protection"}
                    >
                      {genAreaGroupLevelTable(
                        data,
                        boundaryTotalMetrics,
                        mg,
                        t,
                      )}
                    </Collapse>
                    <Collapse
                      title={t("Show by MPA")}
                      collapsed={!props.printing}
                      key={String(props.printing) + "MPA"}
                    >
                      {genAreaSketchTable(
                        data,
                        boundaryTotalMetrics,
                        mg,
                        t,
                        childProperties!,
                        props.printing,
                      )}
                    </Collapse>
                  </>
                )}

                {!props.printing && (
                  <Collapse title={t("Learn More")}>{genLearnMore(t)}</Collapse>
                )}
              </ToolbarCard>
            </ReportError>
          );
        }}
      </ResultsCard>
    </div>
  );
};

/**
 * Report protection level for single sketch
 * @param data ReportResult
 * @param t TFunction
 * @returns JSX.Element
 */
const sketchReport = (
  data: ReportResult,
  precalcMetrics: Metric[],
  objectiveIds: string[],
  t: any,
) => {
  // Get total planning area
  const totalArea = firstMatchingMetric(
    precalcMetrics,
    (m) => m.groupId === null,
  ).value;

  // Filter down to metrics which have groupIds
  const levelMetrics = data.metrics.filter(
    (m) => m.groupId === "HIGH_PROTECTION" || m.groupId === "MEDIUM_PROTECTION",
  );

  // Filter down grouped metrics to ones that count for each objective
  const totalsByObjective = objectiveIds.reduce<Record<string, number[]>>(
    (acc, objectiveId) => {
      // Protection levels which count for objective
      const yesAggs = levelMetrics.filter((levelAgg) => {
        const level = levelAgg.groupId;
        return (
          project.getObjectiveById(objectiveId).countsToward[level!] ===
          OBJECTIVE_YES
        );
      });
      // Extract percent value from metric
      const yesValues = yesAggs.map((yesAgg) => yesAgg.value / totalArea);
      return { ...acc, [objectiveId]: yesValues };
    },
    {},
  );

  return <>{genObjectiveReport(objectiveIds, totalsByObjective, t)}</>;
};

/**
 * Report protection level for sketch collection
 * @param data ReportResult
 * @param precalcMetrics Metric[] from precalc.json
 * @param t TFunction
 * @returns JSX.Element
 */
const collectionReport = (
  data: ReportResult,
  precalcMetrics: Metric[],
  objectiveIds: string[],
  t: any,
) => {
  if (!isSketchCollection(data.sketch)) throw new Error("NullSketch");
  const mg = project.getMetricGroup("size", t);

  // Filter down to metrics which have groupIds
  const levelMetrics = data.metrics.filter(
    (m) => m.groupId === "HIGH_PROTECTION" || m.groupId === "MEDIUM_PROTECTION",
  );

  const groupLevelAggs: GroupMetricAgg[] = flattenByGroupAllClass(
    data.sketch,
    levelMetrics,
    precalcMetrics,
  );

  // Filter down grouped metrics to ones that count for each objective
  const totalsByObjective = objectiveIds.reduce<Record<string, number[]>>(
    (acc, objectiveId) => {
      // Protection levels which count for objective
      const yesAggs: GroupMetricAgg[] = groupLevelAggs.filter((levelAgg) => {
        const level = levelAgg.groupId;
        return (
          project.getObjectiveById(objectiveId).countsToward[level] ===
          OBJECTIVE_YES
        );
      });
      // Extract percent value from metric
      const yesValues = yesAggs.map((yesAgg) => yesAgg.percValue);
      return { ...acc, [objectiveId]: yesValues };
    },
    {},
  );

  return <>{genObjectiveReport(objectiveIds, totalsByObjective, t)}</>;
};

/**
 * Generates Show By MPA sketch table
 */
const genObjectiveReport = (
  objectiveIds: string[],
  totalsByObjective: Record<string, number[]>,
  t: any,
) => {
  // Coloring and styling for horizontal bars
  const groupColors = Object.values(groupColorMap);
  const blockGroupNames = [t("High"), t("Medium")];
  const blockGroupStyles = groupColors.map((curBlue) => ({
    backgroundColor: curBlue,
  }));
  const valueFormatter = (value: number) => percentWithEdge(value / 100);

  return (
    <>
      {objectiveIds.map((objectiveId: string) => {
        const objective = project.getObjectiveById(objectiveId);

        // Get total percentage within sketch
        const percSum = totalsByObjective[objectiveId].reduce(
          (sum, value) => sum + value,
          0,
        );

        // Checks if the objective is met
        const isMet =
          percSum >= objective.target ? OBJECTIVE_YES : OBJECTIVE_NO;

        // Create horizontal bar config
        const config = {
          rows: [totalsByObjective[objectiveId].map((value) => [value * 100])],
          rowConfigs: [
            {
              title: "",
            },
          ],
          target: objective.target * 100,
          max: 100,
        };

        const targetLabel = t("Target");

        return (
          <React.Fragment key={objectiveId}>
            <CollectionObjectiveStatus
              objective={objective}
              objectiveMet={isMet}
              t={t}
              renderMsg={
                Object.keys(collectionMsgs).includes(objective.objectiveId)
                  ? collectionMsgs[objective.objectiveId](objective, isMet, t)
                  : collectionMsgs["default"](objective, isMet, t)
              }
            />
            <ReportChartFigure>
              <HorizontalStackedBar
                {...config}
                blockGroupNames={blockGroupNames}
                blockGroupStyles={blockGroupStyles}
                showLegend={true}
                valueFormatter={valueFormatter}
                targetValueFormatter={(value) =>
                  targetLabel + ` - ` + value + `%`
                }
              />
            </ReportChartFigure>
          </React.Fragment>
        );
      })}
    </>
  );
};

/**
 * Generates Learn More for Size Card
 * @returns JSX.Element
 */
const genLearnMore = (t: any) => {
  const landLabel = t("Land");
  const shorelineLabel = t("Shoreline");
  const internalWatersLabel = t("Internal Waters\n(Shoreline - Baseline)");
  const baselineLabel = t("Baseline");
  const territorialSeasLabel = t("Territorial Seas\n(Baseline - 12nm)");
  const eezLabel = t("Exclusive Economic Zone\n(Baseline - 200nm)");

  const labelsFinal: Label[] = [
    { key: "land", labelText: landLabel, x: 20, y: 640 },
    { key: "shoreline", labelText: shorelineLabel, x: 230, y: 530 },
    {
      key: "internalWaters",
      labelText: internalWatersLabel,
      x: 20,
      y: 430,
    },
    {
      key: "baseline",
      labelText: baselineLabel,
      x: 230,
      y: 400,
    },
    {
      key: "territorialSeas",
      labelText: territorialSeasLabel,
      x: 20,
      y: 310,
    },
    {
      key: "eez",
      labelText: eezLabel,
      x: 20,
      y: 170,
    },
  ].map((label) => ({
    // default style
    ...label,
    style: { font: "12pt Helvetica, Arial, sans-serif", whiteSpace: "pre" },
  }));
  return (
    <>
      <div>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 700">
          <WatersBackgroundBelize />

          {labelsFinal.map((label) => (
            <text key={label.key} x={label.x} y={label.y} style={label.style}>
              {label.labelText}
            </text>
          ))}
        </svg>
      </div>
      <Trans i18nKey="Size Card - Learn more">
        <p>
          ℹ️ Overview: The Belize Ocean Space consists of three maritime areas:
        </p>
        <p>
          (1) Internal waters: Any area of waters that are on the landward side
          of the territorial sea baseline.
        </p>
        <p>
          (2) Territorial seas: Comprises those areas of the sea having, as
          their inner limits, the baseline of the territorial sea and, as their
          outer limits, a line measured from that baseline, every point of which
          is 12 nautical miles from the nearest point of that baseline.
        </p>
        <p>
          (3) Exclusive Economic Zone (EEZ): Comprises those areas of the sea
          that are beyond and adjacent to the territorial sea having, as their
          outer limits, a line, measured seaward from the baseline of the
          territorial sea every point of which is 200 nautical miles distant
          from the nearest point of that baseline.
        </p>
        <p>
          High biodiversity protection zones conserve and protect the top
          priority areas for marine and coastal biodiversity. These zones are
          designated for habitats and species that may be rare, endangered,
          unique or with narrow distribution ranges. This zone includes breeding
          or spawning areas, key foraging habitat, fragile or sensitive species
          and habitats, and internationally significant areas. When combined,
          these zones provide habitats and species with long-term protection,
          and are sufficiently large to ensure ecological resilience and climate
          change adaptation. This zone category is not suitable for extraction
          or sea-bed alteration and is considered a no-take zone in common
          vernacular. Examples of high protection status, depending on the
          objectives and allowable human activities, are: Marine Protected Areas
          in the IUCN categories Ia, Ib, II, and III.
        </p>
        <p>
          Medium biodiversity protection and sustainable use zones are proposed
          to conserve areas that are suitable for medium levels of biodiversity
          protection and are also compatible with some sustainable uses. These
          zones include habitats and species that have some tolerance to
          disturbance and human activities. These zones also include regionally
          and nationally significant areas. This zone category is suitable for
          some level of extraction and sea-bed alteration, with appropriate
          management and direction, depending on the objective of each
          designated area. Examples of medium protection status could include:
          Marine Protected Area IUCN categories IV, V, VI, IUCN OECM category,
          and Locally Managed Marine Areas (LMMA).
        </p>
        <p>
          🎯 Planning Objective: 30% protection of Belize Ocean Space. 15%
          protection in HPBZs. 15% protection in MPBZs.
        </p>
        <p>🗺️ Source Data: Belize EEZ</p>
        <p>
          📈 Report: The total area of the plan was calculated, along with the
          total area under high protection and total area under medium
          protection. Overlap was only counted once, and if zones of different
          protection levels overlap, only the highest protection level is
          counted.{" "}
        </p>
      </Trans>
    </>
  );
};
