/* Edits made to support layer toggles, target passing, and multiple objectives */

import {
  BlockGroup,
  HorizontalStackedBarRow,
  LayerToggle,
} from "@seasketch/geoprocessing/client-ui";
import React from "react";
import { styled } from "styled-components";
// CHANGE: Import CheckCircleFill
import { CheckCircleFill } from "@styled-icons/bootstrap";

// DID NOT CHANGE - was not exported from library
const defaults = {
  barHeight: 30,
  titleWidth: 35,
};

// CHANGE target from number to (number | undefined)[]
export interface StyledHorizontalStackedBarProps {
  rowTotals: number[];
  blockGroupColors: (string | undefined)[];
  showTitle: boolean;
  target?: number | (number | undefined)[];
  barHeight?: number;
  titleWidth?: number;
  targetLabelPosition?: "top" | "bottom";
  targetLabelStyle?: "normal" | "tight";
}

// CHANGE - added 0.25em padding-rop to .row
// CHANGE - added .layer-toggle styling
const StyledHorizontalStackedBar = styled.div<StyledHorizontalStackedBarProps>`
  h3,
  h6 {
    margin: 0;
    line-height: 1em;
  }
  h3 {
    margin-bottom: 1em;
  }
  h6 {
    font-size: 0.8em;
    padding: 0 0.5em 0.5em 0;
    width: 20%;
    text-align: right;
    color: #666;
  }
  figure {
    margin: 2em auto 2em auto;
    max-width: 1100px;
    position: relative;
  }
  .graphic {
    padding-left: 10px;
  }
  .row {
    display: flex;
    align-items: center;
    padding-top: 0.25em;
  }

  .title {
    font-size: 0.9em;
    width: ${(props) =>
      props.titleWidth ? props.titleWidth : defaults.titleWidth}%;
    padding-right: 5px;
    text-align: right;
    color: #666;
    display: flex;
    align-items: center;
    justify-content: right;
  }

  @keyframes expand {
    from {
      width: 0%;
    }
    to {
      width: ${(props) =>
        props.showTitle
          ? props.titleWidth
            ? props.titleWidth
            : defaults.titleWidth
          : 92}%;
    }
  }
  @media screen and (min-width: 768px) {
    @keyframes expand {
      from {
        width: 0%;
      }
      to {
        width: ${(props) =>
          props.showTitle
            ? props.titleWidth
              ? props.titleWidth
              : defaults.titleWidth
            : 92}%;
      }
    }
  }
  .chart {
    position: relative;
    overflow: visible;
    width: 0%;
    animation: expand 1.5s ease forwards;
  }

  .row + .row .chart {
    animation-delay: 0.2s;
  }
  .row + .row + .row .chart {
    animation-delay: 0.4s;
  }
  .block.yes {
    outline: 1px solid #999;
  }
  .block {
    display: flex;
    align-items: center;
    justify-content: center;
    height: ${(props) => props.barHeight || defaults.barHeight}px;
    color: #333;
    font-size: 0.75em;
    float: left;
    background-color: #999;
    position: relative;
    overflow: hidden;
    opacity: 1;
    transition:
      opacity,
      0.3s ease;
    cursor: pointer;
  }

  .block:hover {
    opacity: 0.65;
  }

  .x-axis {
    text-align: center;
    padding: 1em 0 0.5em;
  }

  .legend {
    margin: 0 auto;
    padding: 0;
    font-size: 0.9em;
  }
  .legend li {
    display: inline-block;
    padding: 0.25em 0.8em;
    line-height: 1em;
  }
  .legend li:before {
    content: "";
    margin-right: 0.5em;
    display: inline-block;
    width: 8px;
    height: 8px;
    background-color: #334d5c;
  }

  .zero-marker {
    position: absolute;
    left: -1.5px;
    height: ${(props) => (props.barHeight || defaults.barHeight) * 1.5}px;
    width: 1.5px;
    background-color: #aaa;
    top: -${(props) => (props.barHeight || defaults.barHeight) * 0.25}px;
  }

  .layer-toggle {
    margin-left: auto;
  }

  ${(props) =>
    props.rowTotals.map(
      (total, index) =>
        `
        .row-${index} .total-label {
          position: absolute;
          left: ${total + 0.75}%;
          width: 100px;
          font-size: 0.9em;
          text-shadow: 0 0 2px #FFF, 0 0 2px #FFF, 0 0 2px #FFF, 0 0 2px #FFF, 0 0 2px #FFF, 0 0 2px #FFF, 0 0 2px #FFF, 0 0 2px #FFF;
          font-weight: bold;
          color: #666;
          height: ${props.barHeight || defaults.barHeight}px;
          display: flex;
          align-items: center;
        }
    `,
    )}

  // CHANGE: Adds handling for multi-objective report
  ${(props) =>
    props.target &&
    (Array.isArray(props.target)
      ? props.target.map((target) =>
          target
            ? `
          .marker-label {
            position: absolute;
            ${props.targetLabelPosition || "top"}: ${
              props.targetLabelStyle === "normal" ? "-15" : "-12"
            }px;
            left: ${target ? target : 0}%;
            width: 100px;
            text-align: left;
            font-size: 0.7em;
            color: #999;
          }
        
          .marker {
            position: absolute;
            left: ${target}%;
            height: ${(props.barHeight || defaults.barHeight) + 4}px;
            width: 3px;
            background-color: #000;
            opacity: 0.35;
            top: -2px;
            border-radius: 2px;
          }
      `
            : "",
        )
      : `
    .marker-label {
      position: absolute;
      ${props.targetLabelPosition || "top"}: ${
        props.targetLabelStyle === "normal" ? "-15" : "-12"
      }px;
      left: ${props.target ? props.target : 0}%;
      width: 100px;
      text-align: left;
      font-size: 0.7em;
      color: #999;
    }
  
    .marker {
      position: absolute;
      left: ${props.target}%;
      height: ${(props.barHeight || defaults.barHeight) + 4}px;
      width: 3px;
      background-color: #000;
      opacity: 0.35;
      top: -2px;
      border-radius: 2px;
    }
`)}

  ${(props) =>
    props.blockGroupColors.map(
      (blockGroupColor, index) =>
        `
      .legend li:nth-of-type(${index + 1}):before {
        background-color: ${blockGroupColor};
      }
    `,
    )}

  @media screen and (min-width: 768px) {
    h6 {
      padding: 0 0.5em 0.5em 0;
      width: 6em;
      float: left;
    }
    .block {
      font-size: 1em;
    }
    .legend {
      width: 100%;
    }
  }
`;

// CHANGE: Add layerId
export type RowConfig = {
  title: string | ((value: number) => string | JSX.Element);
  layerId?: string;
};

// CHANGE: Add showLayerToggles option
// CHANGE: target is now (number | undefined)[] instead of number
// CHANGE: showTargetPass option for check mark
export interface HorizontalStackedBarProps {
  /** row data */
  rows: HorizontalStackedBarRow[];
  /** row config */
  rowConfigs: RowConfig[];
  /** height of row bar in pixels */
  /** Maximum value for each row */
  max: number;
  blockGroupNames: string[];
  /** Style for each block group */
  blockGroupStyles?: React.CSSProperties[];
  barHeight?: number;
  titleWidth?: number;
  target?: number | (number | undefined)[];
  showTargetLabel?: boolean;
  showTitle?: boolean;
  showLegend?: boolean;
  showTotalLabel?: boolean;
  showLayerToggles?: boolean;
  showTargetPass?: boolean;
  targetLabelPosition?: "top" | "bottom";
  targetLabelStyle?: "normal" | "tight";
  valueFormatter?: (value: number) => string | JSX.Element;
  targetValueFormatter?: (value: number) => string | JSX.Element;
  targetReachedColor?: string;
}

/**
 * Horizontal stacked bar chart component
 * CHANGE: Add showLayerToggles = false default. Add layer toggles
 * CHANGE: Add small check mark when target reached with showTargetPass option
 */
export const HorizontalStackedBar: React.FunctionComponent<
  HorizontalStackedBarProps
> = ({
  rows,
  rowConfigs,
  max = 100,
  barHeight,
  titleWidth,
  showLegend = true,
  showTitle = true,
  showTotalLabel = true,
  showTargetLabel = true,
  showLayerToggles = false,
  showTargetPass = false,
  targetLabelPosition = "top",
  targetLabelStyle = "normal",
  target,
  blockGroupNames,
  valueFormatter,
  targetValueFormatter,
  targetReachedColor,
  ...rest
}) => {
  const numBlockGroups = rows[0].length;
  const blockGroupStyles =
    rest.blockGroupStyles && rest.blockGroupStyles.length >= numBlockGroups
      ? rest.blockGroupStyles
      : [
          { backgroundColor: "blue" },
          { backgroundColor: "green" },
          { backgroundColor: "gray" },
        ];
  const rowTotals = rows.reduce<number[]>((rowSumsSoFar, row) => {
    return [...rowSumsSoFar, sumRow(row)];
  }, []);

  const rowRems = rowTotals.map((rowTotal) => {
    const rem = max - rowTotal;
    if (rem < -0.001)
      console.warn(
        `Row sum of ${rowTotal} is greater than max: ${max}. Check your input data`,
      );
  });

  return (
    <StyledHorizontalStackedBar
      rowTotals={rowTotals}
      target={target}
      barHeight={barHeight}
      showTitle={showTitle}
      titleWidth={titleWidth}
      blockGroupColors={blockGroupStyles
        .map((style) => style.backgroundColor)
        .slice(0, numBlockGroups)}
      targetLabelPosition={targetLabelPosition}
      targetLabelStyle={targetLabelStyle}
    >
      <>
        <div className="graphic">
          {rows.map((row, rowNumber) => {
            const titleProp = rowConfigs[rowNumber].title;
            const titleValue = (() => {
              if (typeof titleProp === "function") {
                return titleProp;
              } else {
                return () => titleProp;
              }
            })();

            const layerId = rowConfigs[rowNumber].layerId;
            const curTarget = (() => {
              if (Array.isArray(target)) {
                // Multi-objective
                return target[rowNumber];
              } else {
                // Single objective or no objective
                return target;
              }
            })();
            const targetReached =
              curTarget && rowTotals[rowNumber] >= curTarget;

            return (
              <div key={`row-${rowNumber}`} className={`row row-${rowNumber}`}>
                {showTitle && (
                  <div className="title">
                    {showTargetPass && targetReached && (
                      <CheckCircleFill
                        size={15}
                        style={{ color: "#78c679", paddingRight: 5 }}
                      />
                    )}
                    {titleValue(rowTotals[rowNumber])}
                  </div>
                )}
                <div className="chart">
                  {row.map((blockGroup, blockGroupNumber) =>
                    blockGroup.map((blockValue, blockNumber) => (
                      <span
                        key={`${blockGroupNumber}${blockNumber}`}
                        title={`${
                          valueFormatter
                            ? valueFormatter(blockValue)
                            : blockValue
                        }`}
                        style={{
                          width: `${blockValue}%`,
                          ...blockGroupStyles[blockGroupNumber],
                          ...(targetReached && targetReachedColor
                            ? {
                                backgroundColor: targetReachedColor,
                              }
                            : {}),
                        }}
                        className={`block-group-${blockGroupNumber} block-${blockNumber} block`}
                      ></span>
                    )),
                  )}
                  <div className="zero-marker" />
                  {curTarget && (
                    <>
                      <div className="marker" />
                      {showTargetLabel && rowNumber === 0 && (
                        <div className="marker-label">
                          {targetValueFormatter
                            ? targetValueFormatter(curTarget)
                            : "Target"}
                        </div>
                      )}
                    </>
                  )}
                  {showTotalLabel && (
                    <div className="total-label">
                      {valueFormatter
                        ? valueFormatter(rowTotals[rowNumber])
                        : rowTotals[rowNumber]}
                    </div>
                  )}
                </div>
                {showLayerToggles && layerId && (
                  <div className="layer-toggle">
                    <LayerToggle simple layerId={layerId} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {showLegend && (
          <div className="x-axis">
            <ul className="legend">
              {blockGroupNames
                .slice(0, numBlockGroups)
                .map((blockGroupName, blockGroupNameIndex) => (
                  <li key={blockGroupNameIndex}>{blockGroupName}</li>
                ))}
            </ul>
          </div>
        )}
      </>
    </StyledHorizontalStackedBar>
  );
};

/** Sum row values */
// DID NOT CHANGE - was not exported from library
const sumRow = (row: HorizontalStackedBarRow): number =>
  row.reduce(
    (rowSumSoFar, blockGroup) => rowSumSoFar + sumBlockGroup(blockGroup),
    0,
  );

/** Sum block group values */
// DID NOT CHANGE - was not exported from library
const sumBlockGroup = (group: BlockGroup): number =>
  group.reduce((groupSumSoFar, blockValue) => groupSumSoFar + blockValue, 0);
