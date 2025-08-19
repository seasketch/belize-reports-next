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
import { Download } from "@styled-icons/bootstrap/Download";
import project from "../../project/projectClient.js";
import Translator from "./TranslatorAsync.js";
import {
  genGroupLevelTable,
  genAreaSketchTable,
  groupedCollectionReport,
  groupedSketchReport,
} from "../util/ProtectionLevelOverlapReports.js";

/**
 * LittoralForest component
 *
 * @param props - geographyId
 * @returns A react component which displays an overlap report
 */
export const LittoralForest: React.FunctionComponent<{
  geographyId?: string;
  printing: boolean;
}> = (props) => {
  const { t } = useTranslation();
  const [{ isCollection, sketchClassId, childProperties }] =
    useSketchProperties();
  const lockoutArea = String(sketchClassId) === "1555";
  const curGeography = project.getGeographyById(props.geographyId, {
    fallbackGroup: "default-boundary",
  });

  // Metrics
  const metricGroup = project.getMetricGroup("littoralForest", t);
  const precalcMetrics = project.getPrecalcMetrics(
    metricGroup,
    "area",
    curGeography.geographyId,
  );

  // Labels
  const titleLabel = t("Littoral Forests");
  const mapLabel = t("Map");

  return (
    <div style={{ breakInside: "avoid" }}>
      <ResultsCard
        title={titleLabel}
        functionName="littoralForest"
        extraParams={{ geographyIds: [curGeography.geographyId] }}
        useChildCard
      >
        {(data: ReportResult) => {
          return (
            <ReportError>
              <ToolbarCard
                title={t("Littoral Forests")}
                items={
                  <>
                    <LayerToggle
                      label={mapLabel}
                      layerId={metricGroup.layerId}
                      simple
                    />
                    <DataDownload
                      filename="littoral-forest"
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
                      This report summarizes the percentage of littoral forests
                      found in this lockout area.
                    </>
                  ) : (
                    <Trans i18nKey="Littoral Forests Card 1">
                      This report summarizes the amount of littoral forests
                      within this plan, measuring progress to the target of 90%
                      high protection of littoral forests by 2035.
                    </Trans>
                  )}
                </p>

                <Translator>
                  {isCollection
                    ? groupedCollectionReport(
                        data.metrics,
                        precalcMetrics,
                        {
                          ...metricGroup,
                          classes: [
                            {
                              classKey: "C2019",
                              classId: "Littoral",
                              display: "Littoral Forests",
                              datasourceId: "mangroves",
                            },
                          ],
                        },
                        t,
                      )
                    : groupedSketchReport(
                        data.metrics,
                        precalcMetrics,
                        {
                          ...metricGroup,
                          classes: [
                            {
                              classKey: "C2019",
                              classId: "Littoral",
                              display: "Littoral Forests",
                              datasourceId: "mangroves",
                            },
                          ],
                        },
                        t,
                      )}

                  {lockoutArea ? (
                    <></>
                  ) : isCollection ? (
                    groupedCollectionReport(
                      data.metrics,
                      precalcMetrics,
                      metricGroup,
                      t,
                    )
                  ) : (
                    groupedSketchReport(
                      data.metrics,
                      precalcMetrics,
                      metricGroup,
                      t,
                    )
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
                          childProperties || [],
                          props.printing,
                        )}
                      </Collapse>
                    </>
                  )}
                </Translator>

                {!props.printing && (
                  <Collapse title={t("Learn more")}>
                    <Trans i18nKey="Littoral Forests Card - learn more">
                      <p>
                        ℹ️ Overview: Littoral forest was identified comparing
                        data from 1980 and 2019.
                      </p>
                      <p>
                        🎯 Planning Objective: Littoral forest extent in HPZ is
                        increased by 14.5% in 2025. Littoral forest extent in
                        HPZ is increased to 60% in 2030. Littoral forest extent
                        in HPZ is increased to 90% in 2035.
                      </p>
                      <p>
                        🗺️ Source Data: Littoral Forest data from Cherrington &
                        Griffin (2020).
                      </p>
                      <p>
                        📈 Report: Only features within the Belize Ocean Space
                        are counted. The percentage of each feature type within
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
