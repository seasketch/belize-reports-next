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
import {
  genGroupLevelTable,
  genAreaSketchTable,
  groupedCollectionReport,
  groupedSketchReport,
} from "../util/ProtectionLevelOverlapReports.js";

/**
 * HumanStressorsCard component
 *
 * @param props - geographyId
 * @returns A react component which displays an overlap report
 */
export const HumanStressorsCard: React.FunctionComponent<{
  geographyId?: string;
  printing: boolean;
}> = (props) => {
  const { t } = useTranslation();
  const [{ isCollection, childProperties }] = useSketchProperties();
  const curGeography = project.getGeographyById(props.geographyId, {
    fallbackGroup: "default-boundary",
  });

  // Metrics
  const metricGroup = project.getMetricGroup("humanStressors", t);
  const precalcMetrics = project.getPrecalcMetrics(
    metricGroup,
    "area",
    curGeography.geographyId,
  );

  // Labels
  const titleLabel = t("Areas of Human Impact");

  return (
    <div style={{ breakInside: "avoid" }}>
      <ResultsCard
        title={titleLabel}
        functionName="humanStressors"
        extraParams={{ geographyIds: [curGeography.geographyId] }}
        useChildCard
      >
        {(data: ReportResult) => {
          return (
            <ReportError>
              <ToolbarCard
                title={t("Areas of Human Impact")}
                items={
                  <DataDownload
                    filename="human-use"
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
                  <Trans i18nKey="Human Stressors Card 1">
                    This report summarizes the areas of human impact that
                    overlap with this plan.
                  </Trans>
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
                          childProperties || [],
                          props.printing,
                        )}
                      </Collapse>
                    </>
                  )}
                </Translator>

                {!props.printing && (
                  <Collapse title={t("Learn more")}>
                    <Trans i18nKey="Human Stressors Card - learn more">
                      <p>
                        ℹ️ Overview: Plans should consider how these areas of
                        human stressors should be navigated in the ocean plan.
                      </p>
                      <p>
                        🗺️ Source Data: Areas of human stressors collected in
                        2020.
                      </p>
                      <p>
                        📈 Report: The total sum of areas of human impact within
                        plan was calculated, along with the total area under
                        high protection and total area under medium protection.
                        Overlap was only counted once, and if zones of different
                        protection levels overlap, only the highest protection
                        level is counted.
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
