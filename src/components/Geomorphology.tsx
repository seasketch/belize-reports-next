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
import Translator from "./TranslatorAsync.js";
import {
  genGroupLevelTable,
  genAreaSketchTable,
  groupedCollectionReport,
  groupedSketchReport,
} from "../util/ProtectionLevelOverlapReports.js";
import { Download } from "@styled-icons/bootstrap/Download";

/**
 * Geomorphology component
 *
 * @param props - geographyId
 * @returns A react component which displays an overlap report
 */
export const Geomorphology: React.FunctionComponent<{
  geographyId?: string;
  printing: boolean;
}> = (props) => {
  const { t } = useTranslation();
  const [{ isCollection, id, childProperties }] = useSketchProperties();
  const curGeography = project.getGeographyById(props.geographyId, {
    fallbackGroup: "default-boundary",
  });

  // Metrics
  const metricGroup = project.getMetricGroup("geomorphology", t);
  const precalcMetrics = project.getPrecalcMetrics(
    metricGroup,
    "area",
    curGeography.geographyId,
  );

  return (
    <div style={{ breakInside: "avoid" }}>
      <ResultsCard
        title={t("Geomorphology")}
        functionName="geomorphology"
        useChildCard
      >
        {(data: ReportResult) => {
          return (
            <ReportError>
              <ToolbarCard
                title={t("Geomorphology")}
                items={
                  <DataDownload
                    filename="geomorphology"
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
                  <Trans i18nKey="Geomorphology Card 1">
                    The seafloor has many unique physical geomorphological
                    features, each creating habitats that support different
                    ecological communities. Plans should ensure the
                    representative coverage of each seafloor type. This report
                    summarizes the percentage of each geomorphological feature
                    found in this plan.
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
                          childProperties!,
                          props.printing,
                        )}
                      </Collapse>
                    </>
                  )}
                </Translator>

                {!props.printing && (
                  <Collapse title={t("Learn more")}>
                    <Trans i18nKey="Geomorphology Card - learn more">
                      <p>
                        ℹ️ Overview: Seafloor features were identified based on
                        geomorphology, which classifies features using depth,
                        seabed slope, and other environmental characteristics.
                      </p>
                      <p>
                        In the Seafloor Geomorphic Features dataset, the
                        seafloor is split into shelves (shallowest), slopes, and
                        abysses (deepest). These three features are mutually
                        exclusive. Basins, canyons, escarpments, plateaus,
                        rises, and sills occur within these three features.
                      </p>
                      <p>
                        🎯 Planning Objective: No identified planning objectives
                        for geomorphic features.
                      </p>
                      <p>
                        🗺️ Source Data: Seafloor Geomorphic Features Map.{" "}
                        <a
                          href="https://doi.org/10.1016/j.margeo.2014.01.011"
                          target="_blank"
                        >
                          Harris, P.T., Macmillan-Lawler, M., Rupp, J. and
                          Baker, E.K. 2014. Geomorphology of the oceans. Marine
                          Geology, 352: 4-24.
                        </a>{" "}
                        <a href="https://bluehabitats.org/" target="_blank">
                          https://bluehabitats.org/
                        </a>
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
