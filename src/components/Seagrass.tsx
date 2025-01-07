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
import Translator from "./TranslatorAsync.js";
import { Download } from "@styled-icons/bootstrap/Download";
import {
  genAreaGroupLevelTable,
  genAreaSketchTable,
  groupedCollectionReport,
  groupedSketchReport,
} from "../util/ProtectionLevelOverlapReports.js";

/**
 * Seagrass component
 *
 * @param props - geographyId
 * @returns A react component which displays an overlap report
 */
export const Seagrass: React.FunctionComponent<{
  geographyId?: string;
  printing: boolean;
}> = (props) => {
  const { t } = useTranslation();
  const [{ isCollection, id, childProperties }] = useSketchProperties();
  const curGeography = project.getGeographyById(props.geographyId, {
    fallbackGroup: "default-boundary",
  });

  // Metrics
  const metricGroup = project.getMetricGroup("seagrass", t);
  const precalcMetrics = project.getPrecalcMetrics(
    metricGroup,
    "area",
    curGeography.geographyId,
  );

  // Labels
  const titleLabel = t("Seagrass");
  const mapLabel = t("Map");

  return (
    <div style={{ breakInside: "avoid" }}>
      <ResultsCard
        title={titleLabel}
        functionName="seagrass"
        extraParams={{ geographyIds: [curGeography.geographyId] }}
        useChildCard
      >
        {(data: ReportResult) => {
          return (
            <ReportError>
              <ToolbarCard
                title={t("Seagrass")}
                items={
                  <>
                    <LayerToggle
                      label={mapLabel}
                      layerId={metricGroup.layerId}
                      simple
                    />
                    <DataDownload
                      filename="seagrass"
                      data={data.metrics}
                      formats={["csv", "json"]}
                      placement="left-start"
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
                  <Trans i18nKey="Seagrass Card 1">
                    Seagrass beds are a key marine ecosystem, providing food and
                    shelter for many marine organisms. This report shows the
                    total seagrass area protected by this plan.
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
                          childProperties || [],
                          props.printing,
                        )}
                      </Collapse>
                    </>
                  )}
                </Translator>

                {!props.printing && (
                  <Collapse title={t("Learn more")}>
                    <Trans i18nKey="Seagrass Card - learn more">
                      <p>
                        🎯 Planning Objective: No specific planning objective
                        for seagrass.
                      </p>
                      <p>🗺️ Source Data:</p>
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
