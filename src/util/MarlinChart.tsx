import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { CritterData } from "../functions/marlin.js";

interface MarlinChartProps {
  data: CritterData[];
  variable: "catch" | "biomass" | "ssb";
}

export const MarlinChart: React.FC<MarlinChartProps> = ({ data, variable }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    // Create a map of existing MPA baseline
    const existingMap = data.reduce<Record<string, CritterData>>((acc, d) => {
      if (d.scenario !== "Existing MPA") return acc;
      const key = `${d.critter}-${d.year}`;
      acc[key] = d;
      return acc;
    }, {});

    // Create change ratios for each critter
    const ratio = data.map((d) => {
      // Look up the existing MPA row for the same critter + year
      const key = `${d.critter}-${d.year}`;
      const existingRow = existingMap[key];

      if (!existingRow || existingRow.catch === 0) {
        console.error("No existing row for", key);
        return d;
      }

      return {
        ...d,
        catch: d.catch / existingRow.catch,
        biomass:
          existingRow.biomass === 0
            ? d.biomass
            : d.biomass / existingRow.biomass,
        ssb: existingRow.ssb === 0 ? d.ssb : d.ssb / existingRow.ssb,
      };
    });

    const critters = Array.from(new Set(ratio.map((d) => d.critter)));
    // const scenarios = ["No MPAs", "Existing MPAs", "Proposed MPAs"];
    const scenarios = ["Existing MPAs", "Proposed MPAs"];

    // General plot dimensions
    const width = 450;
    const height = 200;
    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    const totalHeight = critters.length * height + margin.top + margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", totalHeight);
    svg.selectAll("*").remove();

    const color = d3
      .scaleOrdinal<string>()
      .domain(scenarios)
      .range(["#92C5DE", "#196185"]);

    // X scale
    const [minYear, maxYear] = d3.extent(ratio, (d) => d.year) as [
      number,
      number,
    ];
    const xScaleGlobal = d3
      .scaleLinear()
      .domain([minYear, maxYear])
      .range([0, width - margin.left - margin.right]);

    // Build charts for each critter
    critters.forEach((critter, i) => {
      const critterData = ratio.filter((d) => d.critter === critter);

      // Y scale
      const [minVal, maxVal] = d3.extent(critterData, (d) => d[variable]) as [
        number,
        number,
      ];
      const yScale = d3
        .scaleLinear()
        .domain([minVal, maxVal])
        .range([height - margin.bottom, margin.top])
        .nice();

      // Create subplot
      const g = svg
        .append("g")
        .attr(
          "transform",
          `translate(${margin.left}, ${i * height + margin.top})`,
        );

      // Title
      g.append("text")
        .attr("x", (width - margin.left - margin.right) / 2)
        .attr("y", margin.top - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .attr("fill", "#666")
        .text(critter.charAt(0).toUpperCase() + critter.slice(1));

      // Horizontal grid lines
      g.append("g")
        .selectAll("line")
        .data(yScale.ticks(5))
        .join("line")
        .attr("x1", 0)
        .attr("x2", width - margin.left - margin.right)
        .attr("y1", yScale)
        .attr("y2", yScale)
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.2);

      // Y axis
      g.append("g")
        .call(
          d3
            .axisLeft(yScale)
            .ticks(5)
            .tickSizeOuter(0)
            .tickFormat((val) => {
              const ratio = val as number;
              const pct = ratio - 1;

              if (Math.abs(pct) < 0.01) {
                // For very small percentages, use two decimal places
                return d3.format(".2%")(pct);
              } else if (Math.abs(pct) < 0.1) {
                // For small percentages, use one decimal place
                return d3.format(".1%")(pct);
              } else {
                // For larger percentages, use no decimal places
                return d3.format(".0%")(pct);
              }
            }),
        )
        .selectAll("text")
        .style("font-size", "12px")
        .attr("fill", "#666");

      // X axis only on bottom subplot
      if (i === critters.length - 1) {
        g.append("g")
          .attr("transform", `translate(0, ${height - margin.bottom})`)
          .call(d3.axisBottom(xScaleGlobal).ticks(6).tickSizeOuter(0))
          .selectAll("text")
          .style("font-size", "12px")
          .attr("fill", "#666");

        g.append("text")
          .attr("text-anchor", "middle")
          .attr("x", (width - margin.left - margin.right) / 2)
          .attr("y", height - 5)
          .style("font-size", "13px")
          .attr("fill", "#666")
          .text("Years");
      }

      // Draw lines for each scenario
      const line = d3
        .line<CritterData>()
        .x((d) => xScaleGlobal(d.year))
        .y((d) => yScale(d[variable]));
      const scenarioGroups = d3.groups(critterData, (d) => d.scenario);
      scenarioGroups.forEach(([scenario, values]) => {
        values.sort((a, b) => d3.ascending(a.year, b.year));
        g.append("path")
          .datum(values)
          .attr("fill", "none")
          .attr("stroke", color(scenario)!)
          .attr("stroke-width", 2)
          .attr("d", line);
      });
    });

    // Y-axis label
    const variableLabels: Record<string, string> = {
      catch: `Change in Catch`,
      biomass: "Change in Biomass",
      ssb: "Change in SSB",
    };
    svg
      .append("text")
      .attr("class", "y-axis-label")
      .attr("text-anchor", "middle")
      .attr("transform", `translate(10, ${totalHeight / 2 - 40}) rotate(-90)`)
      .style("font-size", "13px")
      .attr("fill", "#666")
      .text(variableLabels[variable] || "Change");

    // Legend
    const legendG = svg
      .append("g")
      .attr(
        "transform",
        `translate(${margin.left}, ${
          critters.length * height + margin.top + 10
        })`,
      );
    scenarios.forEach((scenario, i) => {
      const xOffset = i * 200;
      legendG
        .append("rect")
        .attr("x", xOffset)
        .attr("y", 0)
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", color(scenario)!);
      legendG
        .append("text")
        .attr("x", xOffset + 18)
        .attr("y", 10)
        .style("font-size", "13px")
        .style("alignment-baseline", "middle")
        .attr("fill", "#666")
        .text(scenario);
    });
  }, [data, variable]);

  return <svg ref={svgRef} />;
};
