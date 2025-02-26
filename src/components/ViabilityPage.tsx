import React from "react";
import { SizeCard } from "./SizeCard.js";
import {
  SketchAttributesCard,
  useSketchProperties,
} from "@seasketch/geoprocessing/client-ui";
import { ProtectionCard } from "./ProtectionCard.js";
import { HumanStressorsCard } from "./HumanStressorsCard.js";
import { OusCard } from "./OusCard.js";
import { OusDemographics } from "./OusDemographic.js";
import { OceanWealth } from "./OceanWealth.js";
import { MangroveTourism } from "./MangroveTourism.js";

export const ViabilityPage: React.FunctionComponent<{ printing: boolean }> = (
  props,
) => {
  const [{ sketchClassId }] = useSketchProperties();
  const lockoutArea = String(sketchClassId) === "1555";
  return (
    <>
      {!lockoutArea && <ProtectionCard printing={props.printing} />}
      <SizeCard printing={props.printing} />
      <HumanStressorsCard printing={props.printing} />
      <OceanWealth printing={props.printing} />
      <MangroveTourism printing={props.printing} />
      <OusCard printing={props.printing} />
      <OusDemographics printing={props.printing} />
      {!props.printing && <SketchAttributesCard autoHide />}
    </>
  );
};
