import React from "react";
import Translator from "../components/TranslatorAsync.js";
import { SketchAttributesCard } from "@seasketch/geoprocessing/client-ui";
import { SizeCard } from "../components/SizeCard.js";

// Named export loaded by storybook
export const SimpleReport = () => {
  return (
    <Translator>
      <SizeCard printing={false} />
      <SketchAttributesCard autoHide />
    </Translator>
  );
};

// Default export lazy-loaded by top-level ReportApp
export default SimpleReport;
