import React from "react";
import {
  ResultsCard,
  KeySection,
  Collapse,
  ToolbarCard,
  LayerToggle,
  DataDownload,
  VerticalSpacer,
  ReportTableStyled,
  useSketchProperties,
  Table,
  Column,
} from "@seasketch/geoprocessing/client-ui";
import { BathymetryResults } from "../functions/bathymetry.js";
import { Trans, useTranslation } from "react-i18next";
import project from "../../project/projectClient.js";
import { Download } from "@styled-icons/bootstrap";
import { styled } from "styled-components";
import { roundDecimal } from "@seasketch/geoprocessing/client-core";
import * as d3 from "d3";

const formatDepth = (val: number | null) =>
  val ? `${roundDecimal(val, 0)}m` : `0m`;

export const BathymetryCard: React.FunctionComponent<{ printing: boolean }> = (
  props,
) => {
  const { t } = useTranslation();
  const [{ isCollection }] = useSketchProperties();
  const mg = project.getMetricGroup("bathymetry", t);
  const mapLabel = t("Map");

  return (
    <div style={{ breakInside: "avoid" }}>
      <ResultsCard title={t("Depth")} functionName="bathymetry" useChildCard>
        {(bathyResults: BathymetryResults[]) => {
          const overallStats = isCollection
            ? bathyResults.find((s) => s.isCollection)
            : bathyResults[0];
          if (!overallStats) throw new Error("Bathymetry calculation failed");

          return (
            <ToolbarCard
              title={t("Depth")}
              items={
                <>
                  <LayerToggle label={mapLabel} layerId={mg.layerId} simple />
                  <DataDownload
                    filename="depth"
                    data={[bathyResults]}
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
                </>
              }
            >
              <VerticalSpacer />
              {!isCollection && (
                <KeySection
                  style={{ display: "flex", justifyContent: "space-around" }}
                >
                  <span>
                    {t("Min")}: <b>{formatDepth(overallStats.max)}</b>
                  </span>
                  {overallStats.mean && (
                    <span>
                      {t("Avg")}: <b>{formatDepth(overallStats.mean)}</b>
                    </span>
                  )}
                  <span>
                    {t("Max")}: <b>{formatDepth(overallStats.min)}</b>
                  </span>
                </KeySection>
              )}

              {isCollection && <DepthChart bathyResults={bathyResults} />}

              {isCollection && (
                <Collapse
                  title={t("Show by MPA")}
                  key={props.printing + "Bathy MPA"}
                  collapsed={!props.printing}
                >
                  {genBathymetryTable(bathyResults, props.printing)}
                </Collapse>
              )}

              {!props.printing && (
                <Collapse title={t("Learn More")}>
                  <Trans i18nKey="Bathymetry Card - Learn more">
                    <p>
                      ℹ️ Overview: Ocean depth is useful in determining where
                      fish and other marine life feed, live, and breed. Plans
                      should consider protecting a wide range of water depths.
                    </p>
                    <p>
                      🗺️ Source Data:{" "}
                      <a href="https://download.gebco.net/" target="_blank">
                        GEBCO
                      </a>
                    </p>
                    <p>
                      📈 Report: Calculates the minimum, average, and maximum
                      ocean depth within the plan. Also calculates the number of
                      BPZs across depths and presents a histogram (bin size: 50
                      meters).
                    </p>
                  </Trans>
                </Collapse>
              )}
            </ToolbarCard>
          );
        }}
      </ResultsCard>
    </div>
  );
};

export const BathyTableStyled = styled(ReportTableStyled)<{
  printing: boolean;
}>`
  & {
    width: 100%;
    overflow-x: ${(props) => (props.printing ? "visible" : "scroll")};
    font-size: 12px;
  }

  & th:first-child,
  & td:first-child {
    min-width: 140px;
    position: sticky;
    left: 0;
    text-align: left;
    background: #efefef;
  }

  th,
  tr,
  td {
    text-align: center;
  }

  td:not(:first-child),
  th {
    white-space: nowrap;
  }
`;

export const genBathymetryTable = (
  data: BathymetryResults[],
  printing: boolean,
) => {
  const sketchMetrics = data.filter((s) => !s.isCollection);

  const columns: Column<BathymetryResults>[] = [
    {
      Header: "MPA",
      accessor: (row) => row.sketchName,
    },
    {
      Header: "Min",
      accessor: (row) => formatDepth(row.max),
    },
    {
      Header: "Mean",
      accessor: (row) => formatDepth(row.mean!),
    },
    {
      Header: "Max",
      accessor: (row) => formatDepth(row.min),
    },
  ];

  return (
    <BathyTableStyled printing={printing}>
      <Table columns={columns} data={sketchMetrics} />
    </BathyTableStyled>
  );
};

const StyledRect = styled.rect`
  transform-box: fill-box;
  transform-origin: center bottom;
  animation: growUp 1.5s ease forwards;

  @keyframes growUp {
    from {
      transform: scaleY(0);
    }
    to {
      transform: scaleY(1);
    }
  }
`;

const DepthChart: React.FC<{ bathyResults: BathymetryResults[] }> = ({
  bathyResults,
}) => {
  const width = 450;
  const height = 200;
  const margin = { top: 20, right: 20, bottom: 50, left: 40 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const [{ isCollection }] = useSketchProperties();
  const sketchDepths = bathyResults.filter((d) => !d.isCollection);

  const collection = bathyResults.find((d) => d.isCollection);
  const minDepth = isCollection ? collection!.max : bathyResults[0].max;
  const maxDepth = isCollection ? collection!.min : bathyResults[0].min;

  const binSize = 50;
  const depthMin = 0;
  const depthMax = -4500;
  const binEdges = d3.range(depthMin, depthMax - 1, -binSize);

  const histogramBins = binEdges.slice(0, -1).map((start, i) => {
    const end = binEdges[i + 1];
    const [bMin, bMax] = [Math.min(start, end), Math.max(start, end)];

    const count = sketchDepths.reduce((acc, d) => {
      if (d.min === null || d.max === null) return acc;
      const [dMin, dMax] = [Math.min(d.min, d.max), Math.max(d.min, d.max)];
      return dMin <= bMax && dMax >= bMin ? acc + 1 : acc;
    }, 0);

    return { binStart: start, binEnd: end, count };
  });

  const maxCount = d3.max(histogramBins, (d) => d.count) ?? 0;

  const xScale = d3
    .scaleLinear()
    .domain([depthMin, depthMax])
    .range([0, innerWidth]);
  const yScale = d3
    .scaleLinear()
    .domain([0, maxCount])
    .range([innerHeight, 0])
    .nice();
  const fillOpacityScale = d3
    .scaleLinear()
    .domain([depthMin, depthMax])
    .range([0.3, 1]);

  return (
    <svg width={width} height={height}>
      <g transform={`translate(${margin.left},${margin.top})`}>
        {/* Bars */}
        {histogramBins.map(({ binStart, binEnd, count }) => {
          const x1 = xScale(binStart);
          const x2 = xScale(binEnd);
          const barWidth = Math.abs(x2 - x1);
          const barHeight = innerHeight - yScale(count);
          const fillOpacity = fillOpacityScale(Math.min(binStart, binEnd));

          return (
            <StyledRect
              key={`${binStart}-${binEnd}`}
              x={Math.min(x1, x2)}
              y={yScale(count)}
              width={barWidth}
              height={barHeight}
              fill="steelblue"
              fillOpacity={fillOpacity}
            />
          );
        })}

        {/* Min/Max lines */}
        {[
          { val: minDepth, label: `Min: ${minDepth}m`, anchor: "start" },
          { val: maxDepth, label: `Max: ${maxDepth}m`, anchor: "end" },
        ].map(({ val, label, anchor }) => {
          if (val === null) return null;
          return (
            <g key={val}>
              <line
                x1={xScale(val)}
                x2={xScale(val)}
                y1={-15}
                y2={innerHeight}
                stroke="grey"
                strokeWidth={1}
                strokeDasharray="2,2"
              />
              <text
                x={xScale(val) + (anchor === "start" ? 2 : -2)}
                y={-4}
                textAnchor={anchor as any}
                fontSize={12}
                fill="grey"
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* X-axis */}
        <line
          x1={0}
          y1={innerHeight}
          x2={innerWidth}
          y2={innerHeight}
          stroke="#767676"
        />
        {xScale.ticks(6).map((tick) => (
          <g key={tick} transform={`translate(${xScale(tick)},${innerHeight})`}>
            <line y2="6" stroke="#767676" />
            <text y="20" textAnchor="middle" fontSize={12} fill="#767676">
              {tick} m
            </text>
          </g>
        ))}

        {/* Y-axis */}
        <line x1={0} y1={0} x2={0} y2={innerHeight} stroke="#767676" />
        {yScale.ticks(Math.min(5, maxCount)).map((tick) => (
          <g key={tick} transform={`translate(0,${yScale(tick)})`}>
            <line x2="-6" stroke="#767676" />
            <text
              x="-10"
              dy="0.32em"
              textAnchor="end"
              fontSize={12}
              fill="#767676"
            >
              {tick}
            </text>
          </g>
        ))}

        {/* Labels */}
        <text
          x={innerWidth / 2}
          y={innerHeight + 40}
          fontSize={12}
          textAnchor="middle"
          fill="#767676"
        >
          Depth (meters)
        </text>
        <text
          transform="rotate(-90)"
          x={-innerHeight / 2}
          y={-30}
          fontSize={12}
          textAnchor="middle"
          fill="#767676"
        >
          # of BPZs
        </text>
      </g>
    </svg>
  );
};
