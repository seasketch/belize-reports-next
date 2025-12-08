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
  genGroupLevelTable,
  genAreaSketchTable,
  groupedCollectionReport,
  groupedSketchReport,
} from "../util/ProtectionLevelOverlapReports.js";

/**
 * BenthicHabitatMapping component
 *
 * @param props - geographyId
 * @returns A react component which displays an overlap report
 */
export const BenthicHabitatMapping: React.FunctionComponent<{
  geographyId?: string;
  printing: boolean;
}> = (props) => {
  const { t } = useTranslation();
  const [{ isCollection, childProperties, sketchClassId }] =
    useSketchProperties();
  const lockoutArea = String(sketchClassId) === "1555";
  const curGeography = project.getGeographyById(props.geographyId, {
    fallbackGroup: "default-boundary",
  });

  // Metrics
  const metricGroup = project.getMetricGroup("benthicHabitatMapping", t);
  const precalcMetrics = project.getPrecalcMetrics(
    metricGroup,
    "area",
    curGeography.geographyId,
  );

  // Labels
  const mapLabel = t("Map");
  const titleLabel = t("Benthic Habitat Mapping");
  const layerId = metricGroup.layerId;

  return (
    <div style={{ breakInside: "avoid" }}>
      <ResultsCard
        title={titleLabel}
        functionName="benthicHabitatMapping"
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
                      filename="benthicHabitatMapping"
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
                  {lockoutArea ? (
                    <>
                      This report summarizes the percentage of seagrass and
                      coral found in this lockout area.
                    </>
                  ) : (
                    <Trans i18nKey="Benthic Habitat Mapping Card 1">
                      This planning process has the goal of promoting the growth
                      and survival of seagrass and coral species.
                    </Trans>
                  )}
                </p>

                <Translator>
                  {isCollection
                    ? groupedCollectionReport(
                        data.metrics,
                        precalcMetrics,
                        metricGroup,
                        t,
                      )
                    : groupedSketchReport(
                        data.metrics,
                        precalcMetrics,
                        metricGroup,
                        t,
                      )}

                  {isCollection && (
                    <>
                      <Collapse
                        title={t("Show by Protection Level")}
                        collapsed={!props.printing}
                        key={String(props.printing) + "Protection"}
                      >
                        {genGroupLevelTable(
                          data.metrics,
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
                          data.metrics,
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
                    <Trans i18nKey="Benthic Habitat Mapping Card - learn more">
                      <p>
                        ℹ️ Overview: Data from Belize Benthic Habitat Mapping
                        2025..
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
