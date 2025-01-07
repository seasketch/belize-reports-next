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
  genAreaGroupLevelTable,
  genAreaSketchTable,
  groupedCollectionReport,
  groupedSketchReport,
} from "../util/ProtectionLevelOverlapReports.js";

/**
 * Mangroves component
 *
 * @param props - geographyId
 * @returns A react component which displays an overlap report
 */
export const Mangroves: React.FunctionComponent<{
  geographyId?: string;
  printing: boolean;
}> = (props) => {
  const { t } = useTranslation();
  const [{ isCollection, id, childProperties }] = useSketchProperties();
  const curGeography = project.getGeographyById(props.geographyId, {
    fallbackGroup: "default-boundary",
  });

  // Metrics
  const metricGroup = project.getMetricGroup("mangroves", t);
  const precalcMetrics = project.getPrecalcMetrics(
    metricGroup,
    "area",
    curGeography.geographyId,
  );
  console.log(precalcMetrics);

  // Labels
  const titleLabel = t("Mangroves");

  return (
    <div style={{ breakInside: "avoid" }}>
      <ResultsCard
        title={titleLabel}
        functionName="mangroves"
        extraParams={{ geographyIds: [curGeography.geographyId] }}
        useChildCard
      >
        {(data: ReportResult) => (
          <ReportError>
            <ToolbarCard
              title={t("Mangroves")}
              items={
                <DataDownload
                  filename="mangroves"
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
              }
            >
              <p>
                <Trans i18nKey="Mangroves Card 1">
                  This report summarizes the amount of mangroves within this
                  plan, measuring progress to the 30x30 target of 30% mangrove
                  protection.
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
                  <Trans i18nKey="Mangroves Card - learn more">
                    <p>
                      ℹ️ Overview: Mangrove Priority Areas identified under the
                      updated mangrove regulations of 2018. Mangroves were
                      identified comparing data from 1980 and 2019.
                    </p>
                    <p>
                      🎯 Planning Objective: 30% mangroves protected and 4000
                      hectares mangroves restored by 2035.
                    </p>
                    <p>
                      🗺️ Source Data: Mangrove Priority Areas from the mangrove
                      regulations of 2018. Mangrove and Cleared Mangrove data
                      from Cherrington & Griffin (2020).
                    </p>
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
