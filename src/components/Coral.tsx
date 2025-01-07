import React from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  Collapse,
  DataDownload,
  LayerToggle,
  ReportError,
  ResultsCard,
  ToolbarCard,
  useSketchProperties,
} from "@seasketch/geoprocessing/client-ui";
import { ReportResult } from "@seasketch/geoprocessing/client-core";
import project from "../../project/projectClient.js";
import { Download } from "@styled-icons/bootstrap/Download";
import Translator from "./TranslatorAsync.js";
import {
  genAreaGroupLevelTable,
  genAreaSketchTable,
  groupedCollectionReport,
  groupedSketchReport,
} from "../util/ProtectionLevelOverlapReports.js";

/**
 * Coral component
 *
 * @param props - geographyId
 * @returns A react component which displays an overlap report
 */
export const Coral: React.FunctionComponent<{
  geographyId?: string;
  printing: boolean;
}> = (props) => {
  const { t } = useTranslation();
  const [{ isCollection, id, childProperties }] = useSketchProperties();
  const curGeography = project.getGeographyById(props.geographyId, {
    fallbackGroup: "default-boundary",
  });

  // Metrics
  const metricGroup = project.getMetricGroup("coral", t);
  const precalcMetrics = project.getPrecalcMetrics(
    metricGroup,
    "area",
    curGeography.geographyId,
  );

  // Labels
  const mapLabel = t("Map");
  const titleLabel = t("Coral Reef");
  const layerId = metricGroup.layerId;

  return (
    <div style={{ breakInside: "avoid" }}>
      <ResultsCard
        title={titleLabel}
        functionName="coral"
        extraParams={{ geographyIds: [curGeography.geographyId] }}
        useChildCard
      >
        {(data: ReportResult) => {
          return (
            <ReportError>
              <ToolbarCard
                title={titleLabel}
                items={
                  <>
                    <LayerToggle label={mapLabel} layerId={layerId} simple />
                    <DataDownload
                      filename="coral"
                      data={data.metrics}
                      formats={["csv", "json"]}
                      titleElement={
                        <Download
                          size={18}
                          color="#999"
                          style={{ cursor: "pointer" }}
                        />
                      }
                    />
                  </>
                }
              >
                <p>
                  <Trans i18nKey="Coral Card 1">
                    This planning process has the goal of promoting the growth
                    and survival of coral species. This report shows progress
                    towards the objective of 20% of coral reefs highly
                    protected.
                  </Trans>
                </p>

                <Translator>
                  {isCollection
                    ? groupedCollectionReport(
                        data,
                        precalcMetrics,
                        metricGroup,
                        t,
                      )
                    : groupedSketchReport(data, precalcMetrics, metricGroup, t)}

                  {isCollection && (
                    <>
                      <Collapse
                        title={t("Show by Protection Level")}
                        collapsed={!props.printing}
                        key={String(props.printing) + "Protection"}
                      >
                        {genAreaGroupLevelTable(
                          data,
                          precalcMetrics,
                          metricGroup,
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
                          precalcMetrics,
                          metricGroup,
                          t,
                          childProperties!,
                          props.printing,
                        )}
                      </Collapse>
                    </>
                  )}
                </Translator>

                {!props.printing && (
                  <Collapse title={t("Learn more")}>
                    <Trans i18nKey="Coral Card - learn more">
                      <p>
                        ℹ️ Overview: Coral reef restoration is the intentional
                        and active process of assisting the recovery and
                        regeneration of coral reefs that have been damaged or
                        degraded. It involves various techniques and
                        interventions aimed at promoting the growth and survival
                        of coral species, enhancing reef structure, and
                        restoring ecosystem functionality. 7% of Belizean coral
                        reefs are currently within HBPZs.
                      </p>
                      <p>🎯 Planning Objective: 20% of coral reefs in HBPZs</p>
                      <p>
                        🗺️ Source Data: Coral cover for 2021 from the Smart
                        Coasts project, derived from the GEOBON project from
                        CZMAI.
                      </p>
                      <p>
                        📈 Report: The percentage of each feature type within
                        this plan is calculated by finding the overlap of each
                        feature type with the plan, summing its area, then
                        dividing it by the total area of each feature type found
                        within the selected nearshore planning area. If the plan
                        includes multiple areas that overlap, the overlap is
                        only counted once.
                      </p>
                    </Trans>
                  </Collapse>
                )}
              </ToolbarCard>
            </ReportError>
          );
        }}
      </ResultsCard>
    </div>
  );
};
