import React, { useState } from "react";
import { MarlinChart } from "./MarlinChart.js";
import { CritterData } from "../functions/marlin.js";
import { styled } from "styled-components";
import { useTranslation } from "react-i18next";

const StyledRadioGroup = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  margin-top: 1rem;
`;

const StyledRadioLabel = styled.label`
  font-size: 14px;
  font-family: sans-serif;
  color: #555;
  cursor: pointer;
  margin-right: 1rem;
`;

interface MarlinProps {
  data: CritterData[];
  printing: boolean;
}

export const Marlin: React.FC<MarlinProps> = ({ data, printing }) => {
  const { t } = useTranslation();
  const [variable, setVariable] = useState<"catch" | "biomass" | "ssb">(
    "catch",
  );

  if (printing) {
    return (
      <>
        <MarlinChart data={data} variable={"catch"} />
        <MarlinChart data={data} variable={"biomass"} />
        <MarlinChart data={data} variable={"ssb"} />
      </>
    );
  }

  return (
    <div>
      <StyledRadioGroup>
        <StyledRadioLabel>
          <input
            type="radio"
            name="var"
            value="catch"
            checked={variable === "catch"}
            onChange={() => setVariable("catch")}
          />
          {t("Catch")}
        </StyledRadioLabel>
        <StyledRadioLabel>
          <input
            type="radio"
            name="var"
            value="biomass"
            checked={variable === "biomass"}
            onChange={() => setVariable("biomass")}
          />
          {t("Biomass")}
        </StyledRadioLabel>
        <StyledRadioLabel>
          <input
            type="radio"
            name="var"
            value="ssb"
            checked={variable === "ssb"}
            onChange={() => setVariable("ssb")}
          />
          {t("SSB")}
        </StyledRadioLabel>
      </StyledRadioGroup>

      <MarlinChart data={data} variable={variable} />
    </div>
  );
};
