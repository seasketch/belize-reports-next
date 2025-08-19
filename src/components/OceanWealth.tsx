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
import precalcMetrics from "../../data/precalc/precalcOceanWealth.json" with { type: "json" };
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
  const [{ isCollection, childProperties }] = useSketchProperties();
  const curGeography = project.getGeographyById(props.geographyId, {
    fallbackGroup: "default-boundary",
  });

  // Metrics
  const metricGroup = project.getMetricGroup("oceanWealth", t);

  // Labels
  const titleLabel = t("Ocean Wealth");

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
              title={titleLabel}
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
                  value within this plan.
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
                        props.printing,
                        "dollar",
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
                        "dollar",
                      )}
                    </Collapse>
                  </>
                )}
              </Translator>

              {!props.printing && (
                <Collapse title={t("Learn more")}>
                  <Trans i18nKey="OceanWealth Card - learn more">
                    <p>
                      ℹ️ Overview: Dollar value was attributed to each tract of
                      reef to the tourism sector. On-reef value includes
                      activities such as scuba and snorking. Reef-adjacent value
                      includes benefits such as protected beach and fresh
                      seafood. These values are summed to get the total reef
                      value.
                    </p>
                    <p>
                      🗺️ Source Data:{" "}
                      <a
                        href="https://www.sciencedirect.com/science/article/pii/S0308597X17300635"
                        target="_blank"
                      >
                        Spalding et al. (2017) Mapping the global value and
                        distribution of coral reef tourism
                      </a>
                    </p>
                    <p>
                      📈 Report: Only features within the Belize Ocean Space are
                      counted. The percentage of each feature type within this
                      plan is calculated by finding the overlap of each feature
                      type with the plan, summing its value, then dividing it by
                      the total value of each feature type found within the
                      Belize Ocean Space. If the plan includes multiple areas
                      that overlap, the overlap is only counted once.
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
