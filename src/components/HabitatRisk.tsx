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

export const HabitatRisk: React.FunctionComponent<{
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
  const metricGroupCoral = project.getMetricGroup("habitatRiskCoral", t);
  const metricGroupMangrove = project.getMetricGroup("habitatRiskMangrove", t);
  const metricGroupSeagrass = project.getMetricGroup("habitatRiskSeagrass", t);
  const precalcMetricsCoral = project.getPrecalcMetrics(
    metricGroupCoral,
    "area",
    curGeography.geographyId,
  );
  const precalcMetricsMangrove = project.getPrecalcMetrics(
    metricGroupMangrove,
    "area",
    curGeography.geographyId,
  );
  const precalcMetricsSeagrass = project.getPrecalcMetrics(
    metricGroupSeagrass,
    "area",
    curGeography.geographyId,
  );

  // Labels
  const titleLabel = t("Habitat Risk Assessment");

  return (
    <div style={{ breakInside: "avoid" }}>
      <ResultsCard
        title={titleLabel}
        functionName="habitatRisk"
        extraParams={{ geographyIds: [curGeography.geographyId] }}
        useChildCard
      >
        {(data: ReportResult) => (
          <ReportError>
            <ToolbarCard
              title={titleLabel}
              items={
                <DataDownload
                  filename="habitatRisk"
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
                {lockoutArea ? (
                  <>
                    This report summarizes the percentage of at-risk habitats
                    found in this lockout area.
                  </>
                ) : (
                  <Trans i18nKey="habitatRisk Card 1">
                    This report summarizes the percentage of at-risk habitats
                    within this plan.
                  </Trans>
                )}
              </p>

              <Translator>
                <div
                  style={{
                    textAlign: "center",
                    fontSize: "1em",
                    marginBottom: "-20px",
                    color: "#777",
                  }}
                >
                  Coral
                </div>
                {isCollection
                  ? groupedCollectionReport(
                      data.metrics.filter(
                        (metric) =>
                          metric.metricId === metricGroupCoral.metricId,
                      ),
                      precalcMetricsCoral,
                      metricGroupCoral,
                      t,
                    )
                  : groupedSketchReport(
                      data.metrics.filter(
                        (metric) =>
                          metric.metricId === metricGroupCoral.metricId,
                      ),
                      precalcMetricsCoral,
                      metricGroupCoral,
                      t,
                    )}
                <div
                  style={{
                    textAlign: "center",
                    fontSize: "1em",
                    marginBottom: "-20px",
                    color: "#777",
                  }}
                >
                  Mangrove
                </div>
                {isCollection
                  ? groupedCollectionReport(
                      data.metrics.filter(
                        (metric) =>
                          metric.metricId === metricGroupMangrove.metricId,
                      ),
                      precalcMetricsMangrove,
                      metricGroupMangrove,
                      t,
                    )
                  : groupedSketchReport(
                      data.metrics.filter(
                        (metric) =>
                          metric.metricId === metricGroupMangrove.metricId,
                      ),
                      precalcMetricsMangrove,
                      metricGroupMangrove,
                      t,
                    )}

                <div
                  style={{
                    textAlign: "center",
                    fontSize: "1em",
                    marginBottom: "-20px",
                    color: "#777",
                  }}
                >
                  Seagrass
                </div>
                {isCollection
                  ? groupedCollectionReport(
                      data.metrics.filter(
                        (metric) =>
                          metric.metricId === metricGroupSeagrass.metricId,
                      ),
                      precalcMetricsSeagrass,
                      metricGroupSeagrass,
                      t,
                    )
                  : groupedSketchReport(
                      data.metrics.filter(
                        (metric) =>
                          metric.metricId === metricGroupSeagrass.metricId,
                      ),
                      precalcMetricsSeagrass,
                      metricGroupSeagrass,
                      t,
                    )}

                {isCollection && (
                  <>
                    <Collapse
                      title={t("Show by Protection Level")}
                      collapsed={!props.printing}
                      key={String(props.printing) + "Protection"}
                    >
                      <div
                        style={{
                          textAlign: "center",
                          fontSize: "0.9em",
                          color: "#777",
                        }}
                      >
                        Coral
                      </div>
                      {genGroupLevelTable(
                        data.metrics.filter(
                          (metric) =>
                            metric.metricId === metricGroupCoral.metricId,
                        ),
                        precalcMetricsCoral,
                        metricGroupCoral,
                        t,
                      )}
                      <div
                        style={{
                          textAlign: "center",
                          fontSize: "0.9em",
                          color: "#777",
                        }}
                      >
                        Mangrove
                      </div>
                      {genGroupLevelTable(
                        data.metrics.filter(
                          (metric) =>
                            metric.metricId === metricGroupMangrove.metricId,
                        ),
                        precalcMetricsMangrove,
                        metricGroupMangrove,
                        t,
                      )}
                      <div
                        style={{
                          textAlign: "center",
                          fontSize: "0.9em",
                          color: "#777",
                        }}
                      >
                        Seagrass
                      </div>
                      {genGroupLevelTable(
                        data.metrics.filter(
                          (metric) =>
                            metric.metricId === metricGroupSeagrass.metricId,
                        ),
                        precalcMetricsSeagrass,
                        metricGroupSeagrass,
                        t,
                      )}
                    </Collapse>
                    <Collapse
                      title={t("Show by MPA")}
                      collapsed={!props.printing}
                      key={String(props.printing) + "MPA"}
                    >
                      <div
                        style={{
                          textAlign: "center",
                          fontSize: "1em",
                          color: "#777",
                        }}
                      >
                        Coral
                      </div>
                      {genAreaSketchTable(
                        data.metrics.filter(
                          (metric) =>
                            metric.metricId === metricGroupCoral.metricId,
                        ),
                        precalcMetricsCoral,
                        metricGroupCoral,
                        t,
                        childProperties || [],
                        props.printing,
                      )}
                      <div
                        style={{
                          textAlign: "center",
                          fontSize: "1em",
                          color: "#777",
                        }}
                      >
                        Mangrove
                      </div>
                      {genAreaSketchTable(
                        data.metrics.filter(
                          (metric) =>
                            metric.metricId === metricGroupMangrove.metricId,
                        ),
                        precalcMetricsMangrove,
                        metricGroupMangrove,
                        t,
                        childProperties || [],
                        props.printing,
                      )}
                      <div
                        style={{
                          textAlign: "center",
                          fontSize: "1em",
                          color: "#777",
                        }}
                      >
                        Seagrass
                      </div>
                      {genAreaSketchTable(
                        data.metrics.filter(
                          (metric) =>
                            metric.metricId === metricGroupSeagrass.metricId,
                        ),
                        precalcMetricsSeagrass,
                        metricGroupSeagrass,
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
                  <Trans i18nKey="habitatRisk Card - learn more">
                    <p>
                      ℹ️ Overview: The Habitat Risk Assessment (HRA) InVEST tool
                      has been used to evaluate the cumulative risk posed to
                      coastal and marine habitats by anthropogenic stressors.
                      Building upon the ecosystem-based assessment presented in
                      Belize's ICZM 2016 Plan and Interim ICZM Plan 2020-2025,
                      potential threats to coral reef, seagrass, and mangrove
                      ecosystems are analysed with data updated to 2025 (current
                      scenario). These ecosystems serve as primary habitats for
                      numerous ecologically and economically important species
                      while also providing a range of benefits to people. The
                      model incorporates nine human activities and environmental
                      stressors that may affect the habitats of interest as
                      outlined below: The human stressors used for this
                      assessment are (I) Agriculture Runoff, (II)
                      Aquaculture,(III) Coastal Development, (IV) Dredging, (V)
                      Fishing, (VI) Recreation, (VII) Marine Transportation
                      (VIII) Flooding and (XI) Oil Exploration. The habitats
                      used for this assessment were mangroves, seagrass, and
                      corals. The following model shows the Habitat risk
                      assessment for Coral in Belize.
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
