import React from "react";
import { Coral } from "./Coral.js";
import { Mangroves } from "./Mangroves.js";
import { LittoralForest } from "./LittoralForest.js";
import { Seagrass } from "./Seagrass.js";

export const KeyHabitatPage: React.FunctionComponent<{ printing: boolean }> = (
  props,
) => {
  return (
    <>
      <Coral printing={props.printing} />
      <Mangroves printing={props.printing} />
      <LittoralForest printing={props.printing} />
      <Seagrass printing={props.printing} />
    </>
  );
};
