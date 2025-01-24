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
import precalcMetrics from "../../data/precalc/precalcOceanWealth.json";
import {
  genGroupLevelTable,
  genAreaSketchTable,
  groupedCollectionReport,
  groupedSketchReport,
} from "../util/ProtectionLevelOverlapReports.js";

/**
 * OceanWealth component
 *
 * @param props - geographyId
 * @returns A react component which displays an overlap report
 */
export const OceanWealth: React.FunctionComponent<{
  geographyId?: string;
  printing: boolean;
}> = (props) => {
  const { t } = useTranslation();
  const [{ isCollection, id, childProperties }] = useSketchProperties();
  const curGeography = project.getGeographyById(props.geographyId, {
    fallbackGroup: "default-boundary",
  });

  // Metrics
  const metricGroup = project.getMetricGroup("oceanWealth", t);

  // Labels
  const titleLabel = t("OceanWealth");

  return (
    <div style={{ breakInside: "avoid" }}>
      <ResultsCard
        title={titleLabel}
        functionName="oceanWealth"
        extraParams={{ geographyIds: [curGeography.geographyId] }}
        useChildCard
      >
        {(data: ReportResult) => (
          <ReportError>
            <ToolbarCard
              title={t("Ocean Wealth")}
              items={
                <DataDownload
                  filename="OceanWealth"
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
                <Trans i18nKey="OceanWealth Card 1">
                  This report summarizes the amount of on-reef and reef-adjacent
                  wealth within this plan.
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
                        true,
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
                        true,
                      )}
                    </Collapse>
                  </>
                )}
              </Translator>

              {!props.printing && (
                <Collapse title={t("Learn more")}>
                  <Trans i18nKey="OceanWealth Card - learn more">
                    <p>ℹ️ Overview:</p>
                    <p>🎯 Planning Objective:</p>
                    <p>🗺️ Source Data:</p>
                    <p>
                      📈 Report: Only features within the Belize Ocean Space are
                      counted. The percentage of each feature type within this
                      plan is calculated by finding the overlap of each feature
                      type with the plan, summing its area, then dividing it by
                      the total area of each feature type found within the
                      selected nearshore planning area. If the plan includes
                      multiple areas that overlap, the overlap is only counted
                      once.
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
