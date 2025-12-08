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
 * SportfishingOUS component
 *
 * @param props - geographyId
 * @returns A react component which displays an overlap report
 */
export const SportfishingOUS: React.FunctionComponent<{
  geographyId?: string;
  printing: boolean;
}> = (props) => {
  const { t } = useTranslation();
  const [{ isCollection, childProperties }] = useSketchProperties();
  const curGeography = project.getGeographyById(props.geographyId, {
    fallbackGroup: "default-boundary",
  });

  // Metrics
  const metricGroup = project.getMetricGroup("sportfishingOUS", t);
  const precalcMetrics = project
    .getPrecalcMetrics(metricGroup, "sum", curGeography.geographyId)
    .map((m) => ({ ...m, groupId: null }));

  // Labels
  const titleLabel = t("Sport Fishing");

  return (
    <div style={{ breakInside: "avoid" }}>
      <ResultsCard
        title={titleLabel}
        functionName="sportfishingOUS"
        useChildCard
      >
        {(data: ReportResult) => {
          return (
            <ReportError>
              <ToolbarCard
                title={t("Sport Fishing")}
                items={
                  <DataDownload
                    filename="sportfishingOUS"
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
                  <Trans i18nKey="Sportfishing OUS 1">
                    This report summarizes the results of the Belize Sports
                    Fishing Survey. The survey focused on identifying the
                    fishing pressure distribution around San Pedro.
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
                        {genPercGroupLevelTable(
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
                        {genSketchTable(
                          data.metrics,
                          metricGroup,
                          precalcMetrics,
                          childProperties!,
                          t,
                          props.printing,
                        )}
                      </Collapse>
                    </>
                  )}
                </Translator>

                {!props.printing && (
                  <Collapse title={t("Learn more")}>
                    <Trans i18nKey="Sportfishing OUS - learn more">
                      <p>
                        ℹ️ Overview: This report summarizes the results of the
                        Belize Sports Fishing Survey. The survey focused on
                        identifying the fishing pressure distribution of lat and
                        reef fishing around San Pedro, this includes areas
                        within and outside of the marine protected areas (Hol
                        Chan Marine Reserve and Bacalar Chico Marine Reserve).
                      </p>
                      <p>
                        Individuals identified areas of importance for both
                        ecological and fishing use and value. This results are
                        aggregated into heatmaps.
                      </p>
                      <p>
                        Ecological value: Areas of importance for pre-spawning
                        aggregation sites, spawning sites, migratory routes/
                        corridors, nursery grounds and other important
                        information on the environment.
                        <br />
                        Reef fishing: Reef fishing refers to any fishing in
                        coastal waters inside the barrier reef system or around
                        reef structures.
                        <br />
                        Offshore fishing: Deep water fishing refers to any
                        fishing outside the barrier reef.
                        <br />
                        Flats fishing: Flats fishing refers to any fishing done
                        with a fly rod, in shallow coastal waters, tidal flats,
                        lagoons and rivers.
                      </p>
                      <p>
                        🗺️ Methods:
                        <a
                          href="https://seasketch.github.io/python-sap-map/index.html"
                          target="_blank"
                        >
                          Spatial Access Priority Mapping Overview
                        </a>
                      </p>
                      <p>
                        📈 Report: Percentages are calculated by summing the
                        areas of value within the MPAs in this plan, and
                        dividing it by all ocean use value.
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
