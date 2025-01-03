/** Adds pagination control */
import React from "react";
import {
  Metric,
  Objective,
  MetricGroup,
  keyBy,
  nestMetrics,
  percentWithEdge,
  valueFormatter,
} from "@seasketch/geoprocessing/client-core";
import {
  ClassTableColumnConfig,
  ClassTableStyled,
  Column,
  LayerToggle,
  Table,
  Tooltip,
} from "@seasketch/geoprocessing/client-ui";
import { useTranslation } from "react-i18next";
import { CheckCircleFill, InfoCircleFill } from "@styled-icons/bootstrap";
import { HorizontalStackedBar } from "./HorizontalStackedBar.js";

export interface ClassTableProps {
  /** Table row objects, each expected to have a classId and value. */
  rows: Metric[];
  /** Source for metric class definitions. if group has layerId at top-level, will display one toggle for whole group */
  metricGroup: MetricGroup;
  /** Optional objective for metric */
  objective?: Objective | Objective[];
  /** configuration of one or more columns to display */
  columnConfig: ClassTableColumnConfig[];
  /** Options */
  options?: { pagination: boolean };
}

/**
 * Table displaying class metrics, one class per table row.  Having more than one metric per class may yield unexpected results
 * Returns 0 value in table when faced with a 'missing' metric instead of erroring
 * Handles "class has no value" NaN situation (common when sketch doesn't overlap with a geography) by overwriting with 0 and adding information circle
 */
export const ClassTable: React.FunctionComponent<ClassTableProps> = ({
  rows,
  columnConfig,
  metricGroup,
  objective,
  options,
}) => {
  const { t } = useTranslation();
  const classesByName = keyBy(
    metricGroup.classes,
    (curClass) => curClass.classId,
  );

  // group metrics by class ID, then metric ID, for easy lookup
  const metricsByClassByMetric = nestMetrics(rows, ["classId", "metricId"]);

  // Use sketch ID for each table row, use index to lookup into nested metrics
  const tableRows = Object.keys(metricsByClassByMetric).map((classId) => ({
    classId,
  }));

  type ClassTableColumn = Column<{ classId: string }>;

  const genColumns = (
    colConfigs: ClassTableColumnConfig[],
  ): ClassTableColumn[] => {
    const defaultWidth = 100 / colConfigs.length;

    const defaultClassLabel = t("Class");
    const defaultMapLabel = t("Map");
    const defaultTargetLabel = t("Target");
    const defaultGoalLabel = t("Goal");
    const defaultValueLabel = t("Value");

    // Transform column configs into Columns
    const colz: ClassTableColumn[] = colConfigs.map((colConfig) => {
      const style = {
        width: `${colConfig.width || defaultWidth}%`,
        ...(colConfig.colStyle ? colConfig.colStyle : {}),
      };
      if (colConfig.type === "class") {
        return {
          Header: colConfig.columnLabel || defaultClassLabel,
          accessor: (row) => {
            /* i18next-extract-disable-next-line */
            const transString = t(
              classesByName[row.classId || "missing"]?.display,
            );
            return transString || "missing";
          },
          style,
        };
      } else if (colConfig.type === "metricValue") {
        return {
          Header: colConfig.columnLabel || defaultValueLabel,
          accessor: (row) => {
            if (!colConfig.metricId)
              throw new Error("Missing metricId in column config");
            // Return 0 when faced with a 'missing' metric
            // Return 0 with a Tooltip when faced with a 'NaN' metric value
            const value = (() => {
              if (
                metricsByClassByMetric[row.classId] &&
                metricsByClassByMetric[row.classId][colConfig.metricId]
              ) {
                return metricsByClassByMetric[row.classId][
                  colConfig.metricId
                ][0].value;
              } else {
                return 0;
              }
            })();
            const suffix = (() => {
              if (isNaN(value)) {
                const tooltipText =
                  (classesByName[row.classId || "missing"]?.display ||
                    "This feature class") +
                  " not found in the selected planning area";
                return (
                  <Tooltip
                    text={tooltipText}
                    placement="bottom"
                    offset={{ horizontal: 0, vertical: 5 }}
                  >
                    <InfoCircleFill
                      size={14}
                      style={{
                        color: "#83C6E6",
                      }}
                    />
                  </Tooltip>
                );
              } else {
                return <></>;
              }
            })();

            const formattedValue = (() => {
              const finalValue = isNaN(value) ? 0 : value;
              return colConfig.valueFormatter
                ? valueFormatter(finalValue, colConfig.valueFormatter)
                : finalValue;
            })();

            return (
              <>
                {formattedValue}
                {colConfig.valueLabel ? ` ${colConfig.valueLabel}` : ""}
                {suffix}
              </>
            );
          },
          style,
        };
      } else if (colConfig.type === "metricChart") {
        return {
          Header: colConfig.columnLabel || " ",
          style: { textAlign: "center", ...style },
          accessor: (row, rowIndex) => {
            if (!colConfig.metricId)
              throw new Error("Missing metricId in column config");
            // Return 0 when faced with a 'missing' metric
            const value = (() => {
              if (
                metricsByClassByMetric[row.classId] &&
                metricsByClassByMetric[row.classId][colConfig.metricId]
              ) {
                return metricsByClassByMetric[row.classId][
                  colConfig.metricId
                ][0].value;
              } else {
                return 0;
              }
            })();

            const tooltipText =
              (classesByName[row.classId || "missing"]?.display ||
                "This feature class") +
              " not found in the selected planning area";

            const chartProps = {
              ...(colConfig.chartOptions ? colConfig.chartOptions : {}),
              rows: [
                [
                  [
                    colConfig.valueFormatter === "percent"
                      ? value * 100
                      : value,
                  ],
                ],
              ],
              rowConfigs: [
                {
                  title: (value: number) => (
                    <>
                      {isNaN(value) ? (
                        <Tooltip
                          text={tooltipText}
                          placement="bottom"
                          offset={{ horizontal: 0, vertical: 5 }}
                        >
                          <InfoCircleFill
                            size={14}
                            style={{
                              color: "#83C6E6",
                            }}
                          />
                        </Tooltip>
                      ) : (
                        <></>
                      )}
                      {percentWithEdge(isNaN(value) ? 0 : value / 100)}
                    </>
                  ),
                },
              ],
              max: 100,
            };

            return (
              <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <HorizontalStackedBar
                    blockGroupNames={["foo"]}
                    blockGroupStyles={[{ backgroundColor: "#ACD0DE" }]}
                    showTitle={true}
                    showLegend={false}
                    showTargetLabel={true}
                    targetLabelPosition="bottom"
                    showTotalLabel={false}
                    barHeight={12}
                    {...chartProps}
                  />
                </div>
              </div>
            );
          },
        };
      } else if (colConfig.type === "layerToggle") {
        return {
          Header: colConfig.columnLabel || defaultMapLabel,
          style: { textAlign: "center", ...style },
          accessor: (row, index) => {
            const isSimpleGroup = metricGroup.layerId ? false : true;
            const layerId =
              metricGroup.layerId || classesByName[row.classId!].layerId;
            if (isSimpleGroup && layerId) {
              return (
                <LayerToggle
                  simple
                  size="small"
                  layerId={layerId}
                  style={{
                    marginTop: 0,
                    justifyContent: "center",
                  }}
                />
              );
            } else if (!isSimpleGroup && layerId && index === 0) {
              return (
                <LayerToggle
                  simple
                  size="small"
                  layerId={layerId}
                  style={{ marginTop: 0, justifyContent: "center" }}
                />
              );
            } else {
              return <></>;
            }
          },
        };
      } else {
        throw new Error(
          `Unexpected ClassTableColumnConfig type ${colConfig.type}`,
        );
      }
    });
    return colz;
  };

  const columns = genColumns(columnConfig);

  return (
    <ClassTableStyled>
      <Table
        className="styled"
        columns={columns}
        data={tableRows}
        manualPagination={options && !options.pagination}
      />
    </ClassTableStyled>
  );
};
