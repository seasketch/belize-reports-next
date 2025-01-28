import React from "react";
import { useTranslation } from "react-i18next";
import {
  Collapse,
  InfoStatus,
  ResultsCard,
} from "@seasketch/geoprocessing/client-ui";
import { CritterData } from "../functions/marlin.js";
import existingMPAs from "../../data/marlin/existingMPAs.json";
import { Marlin } from "../util/Marlin.js";

/**
 * Presents a simple card that displays output from the bioeconomic model MARLIN
 */
export const MarlinCard: React.FunctionComponent<{
  printing: boolean;
}> = (props) => {
  const { t } = useTranslation();
  const titleTrans = t("Bioeconomics");
  return (
    <div style={{ breakInside: "avoid" }}>
      <ResultsCard title={titleTrans} functionName="marlin">
        {(sketch: CritterData[]) => {
          // Remove pre-MPA years
          const data = [...existingMPAs, ...sketch]
            .map((entry) => ({
              ...entry,
              year: entry.year - 3,
            }))
            .filter((d) => d.year >= 0);

          return (
            <>
              <InfoStatus
                msg={
                  <>
                    This report runs the marine fisheries and fauna model{" "}
                    <b>marlin</b> described in{" "}
                    <a
                      href="https://onlinelibrary.wiley.com/doi/10.1111/faf.12804"
                      target="_blank"
                    >
                      Ovando et al. (2023)
                    </a>
                    . Results are estimates.
                  </>
                }
              />
              <Marlin data={data} printing={props.printing} />
              {!props.printing && (
                <Collapse title="Learn More">
                  <p>
                    ℹ️ Overview:{" "}
                    <a
                      href="https://github.com/DanOvando/marlin"
                      target="_blank"
                    >
                      marlin
                    </a>
                    , described in{" "}
                    <a
                      href="https://onlinelibrary.wiley.com/doi/10.1111/faf.12804"
                      target="_blank"
                    >
                      Ovando et al. (2023)
                    </a>
                    , is a package for efficiently running simulations of marine
                    fauna and fisheries. marlin "helps communities predict and
                    potentially manage trade-offs among conservation, fisheries
                    yields and distributional outcomes of management policies
                    affected by spatial bio-economic dynamics." The model was{" "}
                    <a
                      href="https://github.com/danielfvi/Belize-MPA-design/tree/main"
                      target="_blank"
                    >
                      tuned to the Belize fishery
                    </a>{" "}
                    by partners at WWF, specifically to evaluate the impacts of
                    MPAs on lobster and snapper fisheries.
                  </p>

                  <p>
                    📈 Report: Models the catch, biomass, and spawning stock
                    biomass (SSB) of lobster and snapper over 50 years with the
                    addition of the proposed MPAs. At each timestep, we
                    calculate percent difference between the catch, biomass, and
                    SSB of the proposed MPA scenario to the "baseline" of
                    current existing MPAs.
                  </p>
                </Collapse>
              )}
            </>
          );
        }}
      </ResultsCard>
    </div>
  );
};
