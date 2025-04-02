import React from "react";
import {
  ResultsCard,
  ReportError,
  Collapse,
  Column,
  Table,
  ReportTableStyled,
  PointyCircle,
  RbcsMpaClassPanelProps,
  RbcsIcon,
  GroupPill,
  useSketchProperties,
} from "@seasketch/geoprocessing/client-ui";
import {
  ReportResult,
  Metric,
  SketchProperties,
} from "@seasketch/geoprocessing/client-core";
import { styled } from "styled-components";
import { Trans, useTranslation } from "react-i18next";
import {
  groupDisplayMapPl,
  groupDisplayMapSg,
} from "../util/getMpaProtectionLevel.js";

// Table styling for Show by MPA table
export const SmallReportTableStyled = styled(ReportTableStyled)`
  .styled {
    font-size: 13px;
  }
`;

// Mapping groupIds to colors
const groupColorMap: Record<string, string> = {
  Ia: "#BEE4BE",
  Ib: "#BEE4BE",
  II: "#BEE4BE",
  III: "#BEE4BE",
  HIGH_PROTECTION: "#BEE4BE",
  high: "#BEE4BE",
  IV: "#FFE1A3",
  V: "#FFE1A3",
  VI: "#FFE1A3",
  OECM: "#FFE1A3",
  LMMA: "#FFE1A3",
  MEDIUM_PROTECTION: "#FFE1A3",
  medium: "#FFE1A3",
};

/**
 * Top level Protection report - JSX.Element
 */
export const ProtectionCard: React.FunctionComponent<{ printing: boolean }> = (
  props,
) => {
  const [{ isCollection, childProperties }] = useSketchProperties();
  const { t } = useTranslation();

  return (
    <div style={{ breakInside: "avoid" }}>
      <ResultsCard title={t("Protection Level")} functionName="protection">
        {(data: ReportResult) => {
          return (
            <ReportError>
              {isCollection
                ? sketchCollectionReport(
                    childProperties || [],
                    data.metrics,
                    t,
                    props.printing,
                  )
                : sketchReport(data.metrics, t, props.printing)}
            </ReportError>
          );
        }}
      </ResultsCard>
    </div>
  );
};

/**
 * Report protection level for single sketch
 * @param metrics Metric[] passed from ReportResult
 * @param mg MetricGroup
 * @param t TFunction for translation
 */
const sketchReport = (metrics: Metric[], t: any, printing: boolean = false) => {
  // Should only have only a single metric
  if (metrics.length !== 1)
    throw new Error(
      "In single sketch protection report, and getting !=1 metric",
    );

  return (
    <>
      <div
        style={{
          padding: "10px 10px 10px 0px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <MpaClassPanel
          value={metrics[0].value}
          size={18}
          displayName={t(groupDisplayMapSg[metrics[0].groupId || "none"])}
          displayValue={false}
          group={metrics[0].groupId as string | undefined}
          groupColorMap={groupColorMap}
        />
      </div>

      {!printing && (
        <Collapse title={t("Learn More")}>
          <ProtectionLearnMore t={t} />
        </Collapse>
      )}
    </>
  );
};

/**
 * Report protection level for sketch collection
 * @param sketch NullSketchCollection | NullSketch passed from ReportResult
 * @param metrics Metric[] passed from ReportResult
 * @param mg MetricGroup
 * @param t TFunction for translation
 */
const sketchCollectionReport = (
  childProperties: SketchProperties[],
  metrics: Metric[],
  t: any,
  printing: boolean = false,
) => {
  const columns: Column<Metric>[] = [
    {
      Header: " ",
      accessor: (row) => (
        <MpaClassPanel
          value={row.value}
          size={18}
          displayName={t(groupDisplayMapPl[row.groupId || "none"])}
          group={row.groupId as string | undefined}
          groupColorMap={groupColorMap}
        />
      ),
    },
  ];

  return (
    <>
      <Table className="styled" columns={columns} data={metrics} />

      <Collapse
        title={t("Show by MPA")}
        collapsed={!printing}
        key={String(printing)}
      >
        {genMpaSketchTable(childProperties, t, printing)}
      </Collapse>

      {!printing && (
        <Collapse title={t("Learn More")}>
          <ProtectionLearnMore t={t} />
        </Collapse>
      )}
    </>
  );
};

/**
 * Show by MPA sketch table for sketch collection
 */
const genMpaSketchTable = (
  childProperties: SketchProperties[],
  t: any,
  printing?: boolean,
) => {
  const columns: Column<SketchProperties>[] = [
    {
      Header: t("MPA"),
      accessor: (row) => row.name,
    },
    {
      Header: t("Protection Level"),
      accessor: (row) => {
        const props = childProperties.find((sk) => sk.id === row.id);

        const group: string = (() => {
          if (props?.designation && props?.designation !== "") {
            return props?.designation.toString();
          } else if (
            props?.designation_medium &&
            props?.designation_medium !== ""
          ) {
            return props?.designation_medium.toString();
          } else if (props?.protection_level) {
            return props?.protection_level.toString();
          } else {
            return "";
          }
        })();

        return (
          <GroupPill groupColorMap={groupColorMap} group={group}>
            {t(groupDisplayMapSg[group])}
          </GroupPill>
        );
      },
    },
  ];

  return (
    <SmallReportTableStyled>
      <Table
        className="styled"
        columns={columns}
        data={childProperties.sort((a, b) => a.name.localeCompare(b.name))}
        manualPagination={printing}
      />
    </SmallReportTableStyled>
  );
};

/**
 * Interface for Learn More function component
 */
interface LearnMoreProps {
  t: any;
}

/** Protection level learn more */
export const ProtectionLearnMore: React.FunctionComponent<LearnMoreProps> = ({
  t,
}) => {
  return (
    <>
      <Trans i18nKey="Protection Card - Learn more">
        <p>
          ℹ️ Overview: This planning process uses the IUCN framework of
          protection level:
        </p>
        <p>
          IUCN Ia Strict nature reserve: Strictly protected for biodiversity and
          also possibly geological/ geomorphological features, where human
          visitation, use and impacts are controlled and limited to ensure
          protection of the conservation values
        </p>
        <p>
          IUCN Ib Wilderness area: Usually large unmodified or spghtly modified
          areas, retaining their natural character and influence, without
          permanent or significant human habitation, protected and managed to
          preserve their natural condition
        </p>
        <p>
          IUCN II National park: Large natural or near-natural areas protecting
          large-scale ecological processes with characteristic species and
          ecosystems, which also have environmentally and culturally compatible
          spiritual, scientific, educational, recreational and visitor
          opportunities
        </p>
        <p>
          IUCN III Natural monument or feature: Areas set aside to protect a
          specific natural monument, which can be a landform, sea mount, marine
          cavern, geological feature such as a cave, or a pving feature such as
          an ancient grove
        </p>
        <p>
          IUCN IV Habitat/species management area: Areas to protect particular
          species or habitats, where management reflects this priority. Many
          will need regular, active interventions to meet the needs of
          particular species or habitats, but this is not a requirement of the
          category
        </p>
        <p>
          IUCN V Protected landscape or seascape: Where the interaction of
          people and nature over time has produced a distinct character with
          significant ecological, biological, cultural and scenic value: and
          where safeguarding the integrity of this interaction is vital to
          protecting and sustaining the area and its associated nature
          conservation and other values
        </p>
        <p>
          IUCN VI Protected areas with sustainable use of natural resources:
          Areas which conserve ecosystems, together with associated cultural
          values and traditional natural resource management systems. Generally
          large, mainly in a natural condition, with a proportion under
          sustainable natural resource management and where low-level
          non-industrial natural resource use compatible with nature
          conservation is seen as one of the main aims
        </p>
        <p>
          IUCN Other Effective area-based Conservation Measures (OECM): A
          geographically defined area other than a Protected Area, which is
          governed and managed in ways that achieve positive and sustained
          long-term outcomes for the in situ conservation of biodiversity, with
          associated ecosystem functions and services and where apppcable,
          cultural, spiritual, socioeconomic, and other locally relevant values
          (CBD, 2018).
        </p>
        <p>Locally Managed Marine Areas (LMMA)</p>
        <p>
          IUCN Ia, Ib, II, and III are considered High Biodiversity Protection
          Zones (HBPZs). IUCN IV, V, VI, OECM, and LMMAs are considered Medium
          Biodiversity Protection Zones (MBPZs).
        </p>
        <p>🎯 Planning Objective: None</p>
        <p>🗺️ Source Data: None</p>
        <p>
          📈 Report: Simply counts number of zones in each protection level.
        </p>
      </Trans>
    </>
  );
};

/**
 * Sketch collection status panel for MPA classification
 */
const MpaClassPanel: React.FunctionComponent<RbcsMpaClassPanelProps> = ({
  value,
  displayName,
  size,
  displayValue = true,
  group,
  groupColorMap,
}) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
      }}
    >
      <div style={{ paddingRight: 10 }}>
        {group && groupColorMap ? (
          <PointyCircle size={size} color={groupColorMap[group]}>
            {displayValue ? value : null}
          </PointyCircle>
        ) : (
          <RbcsIcon value={value} size={size} displayValue={displayValue} />
        )}
      </div>
      <div style={{ fontSize: 18 }}>{displayName}</div>
    </div>
  );
};
