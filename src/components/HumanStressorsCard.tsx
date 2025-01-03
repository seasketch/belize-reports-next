import React from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  Collapse,
  DataDownload,
  ReportError,
  ResultsCard,
  SketchClassTable,
  ToolbarCard,
  useSketchProperties,
} from "@seasketch/geoprocessing/client-ui";
import {
  Metric,
  MetricGroup,
  ReportResult,
  SketchProperties,
  flattenBySketchAllClass,
  metricsWithSketchId,
  toPercentMetric,
} from "@seasketch/geoprocessing/client-core";
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
  const [{ isCollection, id, childProperties }] = useSketchProperties();
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
  const titleLabel = t("Human Use");

  return (
    <ResultsCard
      title={titleLabel}
      functionName="humanStressors"
      extraParams={{ geographyIds: [curGeography.geographyId] }}
      useChildCard
    >
      {(data: ReportResult) => {
        const percMetricIdName = `${metricGroup.metricId}Perc`;

        const valueMetrics = metricsWithSketchId(
          data.metrics.filter((m) => m.metricId === metricGroup.metricId),
          [id],
        );
        const percentMetrics = toPercentMetric(valueMetrics, precalcMetrics, {
          metricIdOverride: percMetricIdName,
        });
        const metrics = [...valueMetrics, ...percentMetrics];

        const objectives = (() => {
          const objectives = project.getMetricGroupObjectives(metricGroup, t);
          if (objectives.length) {
            return objectives;
          } else {
            return;
          }
        })();

        return (
          <ReportError>
            <ToolbarCard
              title={t("Human Use")}
              items={
                <DataDownload
                  filename="human-use"
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
                <Trans i18nKey="Human Stressors Card 1">
                  This report summarizes the amount of human use sectors that
                  overlap with this plan. Plans should consider the potential
                  impact to sectors if access or activities are restricted.
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
                  <Trans i18nKey="Human Stressors Card - learn more">
                    <p>
                      ℹ️ Overview: Plans should consider how these areas of
                      human use and human stress should be navigated in the
                      ocean plan.
                    </p>
                    <p>
                      🎯 Planning Objective: No specific planning objectives for
                      human use areas.
                    </p>
                    <p>🗺️ Source Data: 2020</p>
                    <p>
                      📈 Report: The total area of the plan was calculated,
                      along with the total area under high protection and total
                      area under medium protection. Overlap was only counted
                      once, and if zones of different protection levels overlap,
                      only the highest protection level is counted.
                    </p>
                  </Trans>
                </Collapse>
              )}
            </ToolbarCard>
          </ReportError>
        );
      }}
    </ResultsCard>
  );
};

const genSketchTable = (
  data: ReportResult,
  metricGroup: MetricGroup,
  precalcMetrics: Metric[],
  childProperties: SketchProperties[],
) => {
  const childSketchIds = childProperties
    ? childProperties.map((skp) => skp.id)
    : [];
  // Build agg metric objects for each child sketch in collection with percValue for each class
  const childSketchMetrics = toPercentMetric(
    metricsWithSketchId(
      data.metrics.filter((m) => m.metricId === metricGroup.metricId),
      childSketchIds,
    ),
    precalcMetrics,
  );
  const sketchRows = flattenBySketchAllClass(
    childSketchMetrics,
    metricGroup.classes,
    childProperties,
  );
  return (
    <SketchClassTable rows={sketchRows} metricGroup={metricGroup} formatPerc />
  );
};
