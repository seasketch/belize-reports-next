import React from "react";
import { SizeCard } from "./SizeCard.js";
import { SketchAttributesCard } from "@seasketch/geoprocessing/client-ui";
import { ProtectionCard } from "./ProtectionCard.js";
import { HumanStressorsCard } from "./HumanStressorsCard.js";
import { OusCard } from "./OusCard.js";
import { OusDemographics } from "./OusDemographic.js";

export const ViabilityPage: React.FunctionComponent<{ printing: boolean }> = (
  props,
) => {
  return (
    <>
      <ProtectionCard printing={props.printing} />
      <SizeCard printing={props.printing} />
      <HumanStressorsCard printing={props.printing} />
      <OusCard printing={props.printing} />
      <OusDemographics printing={props.printing} />
      {!props.printing && <SketchAttributesCard autoHide />}
    </>
  );
};
