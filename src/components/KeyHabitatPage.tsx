import React from "react";
// import { Mangroves } from "./Mangroves";
// import { Seagrass } from "./Seagrass";
import { Coral } from "./Coral.js";
// import { LittoralForests } from "./LittoralForests";

export const KeyHabitatPage: React.FunctionComponent<{ printing: boolean }> = (
  props,
) => {
  return (
    <>
      <Coral printing={props.printing} />
      {/* <Mangroves printing={props.printing} />
      <LittoralForests printing={props.printing} />
      <Seagrass printing={props.printing} /> */}
    </>
  );
};
