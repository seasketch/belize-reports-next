import React from "react";
import { BathymetryCard } from "./BathymetryCard.js";
import { Geomorphology } from "./Geomorphology.js";

export const RepresentationPage: React.FunctionComponent<{
  printing: boolean;
}> = (props) => {
  return (
    <>
      <BathymetryCard printing={props.printing} />
      <Geomorphology printing={props.printing} />
    </>
  );
};
