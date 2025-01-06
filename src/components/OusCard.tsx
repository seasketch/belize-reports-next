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
  genPercGroupLevelTable,
  genSketchTable,
  groupedCollectionReport,
  groupedSketchReport,
} from "../util/ProtectionLevelOverlapReports.js";

/**
 * OusCard component
 *
 * @param props - geographyId
 * @returns A react component which displays an overlap report
 */
export const OusCard: React.FunctionComponent<{
  geographyId?: string;
  printing: boolean;
}> = (props) => {
  const { t } = useTranslation();
  const [{ isCollection, id, childProperties }] = useSketchProperties();
  const curGeography = project.getGeographyById(props.geographyId, {
    fallbackGroup: "default-boundary",
  });

  // Metrics
  const metricGroup = project.getMetricGroup("ous", t);
  const precalcMetrics = project.getPrecalcMetrics(
    metricGroup,
    "sum",
    curGeography.geographyId,
  );

  // Labels
  const titleLabel = t("Ocean Use");

  return (
    <div style={{ breakInside: "avoid" }}>
      <ResultsCard
        title={titleLabel}
        functionName="ous"
        extraParams={{ geographyIds: [curGeography.geographyId] }}
        useChildCard
      >
        {(data: ReportResult) => {
          return (
            <ReportError>
              <ToolbarCard
                title={t("Ocean Use")}
                items={
                  <DataDownload
                    filename="ocean-use"
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
                  <Trans i18nKey="Ocean Use Card 1">
                    This report summarizes the percentage of ocean use value
                    that overlaps with this plan, as reported in the Belize
                    Ocean Use Survey. Plans should consider the potential impact
                    to sectors if access or activities are restricted.
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
                        {genPercGroupLevelTable(
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
                        {genSketchTable(
                          data,
                          metricGroup,
                          precalcMetrics,
                          childProperties!,
                          props.printing,
                        )}
                      </Collapse>
                    </>
                  )}
                </Translator>

                {!props.printing && (
                  <Collapse title={t("Learn more")}>
                    <Trans i18nKey="Ocean Use Card - learn more">
                      <p>
                        ℹ️ Overview: To capture the value each sector places on
                        different areas of the nearshore, an Ocean Use Survey
                        was conducted. Individuals identified the sectors they
                        participate in, and were asked to draw the areas they
                        use relative to that sector and assign a value of
                        importance. Individual responses were then combined to
                        produce aggregate heatmaps by sector. This allows the
                        value of areas to be quantified, summed, and compared to
                        one another as more or less valuable.
                      </p>
                      <p>
                        Value is then used as a proxy for measuring the
                        potential economic loss to sectors caused by the
                        creation of protected areas. This report can be used to
                        minimize the potential impact of a plan on a sector, as
                        well as identify and reduce conflict between
                        conservation objectives and sector activities. The
                        higher the proportion of value within the plan, the
                        greater the potential impact to the fishery if access or
                        activities are restricted.
                      </p>
                      <p>
                        Note, the resulting heatmaps are only representative of
                        the individuals that were surveyed.
                      </p>
                      <p>
                        🎯 Planning Objective: No specific objective/target for
                        limiting the potential impact of ocean use activities.
                      </p>
                      <p>🗺️ Methods:</p>
                      <ul>
                        <li>
                          <a
                            href="https://seasketch.github.io/python-sap-map/index.html"
                            target="_blank"
                          >
                            Spatial Access Priority Mapping Overview
                          </a>
                        </li>
                      </ul>
                      <p>
                        📈 Report: Percentages are calculated by summing the
                        areas of value within the MPAs in this plan, and
                        dividing it by all ocean use value. If the plan includes
                        multiple areas that overlap, the overlap is only counted
                        once.
                      </p>
                      <p>
                        This report shows the percentage of ocean use value that
                        is contained by the proposed plan.
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
