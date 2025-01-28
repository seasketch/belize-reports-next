import React from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  Collapse,
  DataDownload,
  ReportError,
  ResultsCard,
  ToolbarCard,
  useSketchProperties,
} from "@seasketch/geoprocessing/client-ui";
import { ReportResult } from "@seasketch/geoprocessing/client-core";
import project from "../../project/projectClient.js";
import { Download } from "@styled-icons/bootstrap/Download";
import Translator from "./TranslatorAsync.js";
import precalcMetrics from "../../data/precalc/precalcMangroveTourism.json";
import {
  genGroupLevelTable,
  genAreaSketchTable,
  groupedCollectionReport,
  groupedSketchReport,
} from "../util/ProtectionLevelOverlapReports.js";

/**
 * MangroveTourism component
 *
 * @param props - geographyId
 * @returns A react component which displays an overlap report
 */
export const MangroveTourism: React.FunctionComponent<{
  geographyId?: string;
  printing: boolean;
}> = (props) => {
  const { t } = useTranslation();
  const [{ isCollection, id, childProperties }] = useSketchProperties();
  const curGeography = project.getGeographyById(props.geographyId, {
    fallbackGroup: "default-boundary",
  });

  // Metrics
  const metricGroup = project.getMetricGroup("mangroveTourism", t);

  // Labels
  const titleLabel = t("Mangrove Tourism");

  return (
    <div style={{ breakInside: "avoid" }}>
      <ResultsCard
        title={titleLabel}
        functionName="mangroveTourism"
        extraParams={{ geographyIds: [curGeography.geographyId] }}
        useChildCard
      >
        {(data: ReportResult) => (
          <ReportError>
            <ToolbarCard
              title={t("Mangrove Tourism")}
              items={
                <DataDownload
                  filename="MangroveTourism"
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
              }
            >
              <p>
                <Trans i18nKey="MangroveTourism Card 1">
                  This report summarizes the number of mangrove tourism sites
                  within the plan.
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
                      {genGroupLevelTable(
                        data,
                        precalcMetrics,
                        metricGroup,
                        t,
                        props.printing,
                        "count",
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
                        "count",
                      )}
                    </Collapse>
                  </>
                )}
              </Translator>

              {!props.printing && (
                <Collapse title={t("Learn more")}>
                  <Trans i18nKey="MangroveTourism Card - learn more">
                    <p>
                      ℹ️ Overview: This layer represents the number of mangrove
                      tourism sites in the Belize Ocean Space.
                    </p>
                    <p>
                      🗺️ Source Data:{" "}
                      <a
                        href="https://www.sciencedirect.com/science/article/pii/S0308597X18306602"
                        target="_blank"
                      >
                        Spalding and Parrett (2019) Global patterns in mangrove
                        recreation and tourism
                      </a>
                    </p>
                    <p>
                      📈 Report: This report counts the number of mangrove
                      tourism locations within the plan. The percentage of
                      mangrove tourism locations within the plan is cauclated by
                      taking this count and dividing it by the total number of
                      mangrove tourism locations within the Belize Ocean Space.
                      If the plan includes multiple areas that overlap, the
                      overlap is only counted once.
                    </p>
                  </Trans>
                </Collapse>
              )}
            </ToolbarCard>
          </ReportError>
        )}
      </ResultsCard>
    </div>
  );
};
