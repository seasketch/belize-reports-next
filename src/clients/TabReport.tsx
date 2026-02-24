import React, { useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { useTranslation } from "react-i18next";
import {
  SegmentControl,
  ReportPage,
  SketchAttributesCard,
  useSketchProperties,
  Card,
} from "@seasketch/geoprocessing/client-ui";
import Translator from "../components/TranslatorAsync.js";
import { Printer } from "@styled-icons/bootstrap";
import { Footer } from "../util/Footer.js";
import { Settings } from "../util/Settings.js";
import { SketchProperties } from "@seasketch/geoprocessing";
import { ProtectionCard } from "../components/ProtectionCard.js";
import { SizeCard } from "../components/SizeCard.js";
import { HumanStressorsCard } from "../components/HumanStressorsCard.js";
import { OceanWealth } from "../components/OceanWealth.js";
import { MangroveTourism } from "../components/MangroveTourism.js";
import { OusCard } from "../components/OusCard.js";
import { OusDemographics } from "../components/OusDemographic.js";
import { BathymetryCard } from "../components/BathymetryCard.js";
import { Geomorphology } from "../components/Geomorphology.js";
import { Coral } from "../components/Coral.js";
import { Mangroves } from "../components/Mangroves.js";
import { LittoralForest } from "../components/LittoralForest.js";
import { Seagrass } from "../components/Seagrass.js";
import { MarlinCard } from "../components/MarlinCard.js";
import { SportfishingOUS } from "../components/SportfishingOUS.js";
import { HabitatRisk } from "../components/HabitatRisk.js";

const BaseReport = () => {
  const { t } = useTranslation();
  const [{ sketchClassId }] = useSketchProperties();
  const lockoutArea = String(sketchClassId) === "1555";

  const viabilityId = "viability";
  const representationId = "representation";
  const keyHabitatId = "keyHabitats";
  const bioeconomicId = "bioeconomics";
  const segments = [
    { id: viabilityId, label: t("Viability") },
    { id: representationId, label: t("Representation") },
    { id: keyHabitatId, label: t("Key Habitat") },
    ...(lockoutArea ? [] : [{ id: bioeconomicId, label: t("Bioeconomics") }]),
  ];

  const [tab, setTab] = useState<string>(viabilityId);

  // Printing
  const printRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [attributes] = useSketchProperties();
  const originalAnimationDurations: string[] = [
    ...document.querySelectorAll(".chart, .animated-scatter"),
  ].map((el) => (el as HTMLElement).style.animationDuration);

  useEffect(() => {
    // Remove animations for printing
    if (isPrinting) {
      [...document.querySelectorAll(".chart, .animated-scatter")].forEach(
        (el) => ((el as HTMLElement).style.animationDuration = "0s"),
      );
      handlePrint();
    }

    return () => {
      [...document.querySelectorAll(".chart, .animated-scatter")].forEach(
        (el, index) =>
          ((el as HTMLElement).style.animationDuration =
            originalAnimationDurations[index]),
      );
    };
  }, [isPrinting]);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: attributes.name,
    onBeforeGetContent: () => {},
    onAfterPrint: () => setIsPrinting(false),
  });

  return (
    <>
      {/* Print/Save to PDF button */}
      <Printer
        size={18}
        color="#999"
        title="Print/Save to PDF"
        style={{
          float: "right",
          margin: "5px",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#666")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#999")}
        onClick={() => setIsPrinting(true)}
      />

      {/* Printing loading screen */}
      {isPrinting && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Card>Printing...</Card>
        </div>
      )}

      {/* Tab selector */}
      <div style={{ marginTop: 5 }}>
        <SegmentControl
          value={tab}
          onClick={(segment) => setTab(segment)}
          segments={segments}
        />
      </div>

      <div
        ref={printRef}
        style={{ backgroundColor: isPrinting ? "#FFF" : "inherit" }}
      >
        <style>{getPageMargins()}</style>
        {isPrinting && <SketchAttributes {...attributes} />}

        {/* VIABILITY */}
        <ReportPage hidden={!isPrinting && tab !== viabilityId}>
          {!lockoutArea && <ProtectionCard printing={isPrinting} />}
          <SizeCard printing={isPrinting} />
          <HumanStressorsCard printing={isPrinting} />
          <OceanWealth printing={isPrinting} />
          <MangroveTourism printing={isPrinting} />
          <HabitatRisk printing={isPrinting} />
          <OusCard printing={isPrinting} />
          <OusDemographics printing={isPrinting} />
          <SportfishingOUS printing={isPrinting} />
          {!isPrinting && <SketchAttributesCard autoHide />}
        </ReportPage>

        {/* REPRESENTATION */}
        <ReportPage hidden={!isPrinting && tab !== representationId}>
          <BathymetryCard printing={isPrinting} />
          <Geomorphology printing={isPrinting} />
        </ReportPage>

        {/* KEY HABITAT */}
        <ReportPage hidden={!isPrinting && tab !== keyHabitatId}>
          <Coral printing={isPrinting} />
          <Mangroves printing={isPrinting} />
          <LittoralForest printing={isPrinting} />
          <Seagrass printing={isPrinting} />
        </ReportPage>

        {/* BIOECONOMICS */}
        <ReportPage hidden={!isPrinting && tab !== bioeconomicId}>
          <MarlinCard printing={isPrinting} />
        </ReportPage>
      </div>

      <Footer>
        <Settings />
      </Footer>
    </>
  );
};

const getPageMargins = () => {
  return `@page { margin: .1mm !important; }`;
};

/**
 * Sketch attributes for printing
 */
const SketchAttributes: React.FunctionComponent<SketchProperties> = (
  attributes,
) => {
  const { t } = useTranslation();
  return (
    <Card>
      <h1 style={{ fontWeight: "normal", color: "#777" }}>{attributes.name}</h1>
      <p>
        {t("Sketch ID")}: {attributes.id}
      </p>
      <p>
        {t("Sketch created")}: {new Date(attributes.createdAt).toLocaleString()}
      </p>
      <p>
        {t("Sketch last updated")}:{" "}
        {new Date(attributes.updatedAt).toLocaleString()}
      </p>
      <p>
        {t("Document created")}: {new Date().toLocaleString()}
      </p>
      <SketchAttributesCard />
    </Card>
  );
};

// Named export loaded by storybook
export const TabReport = () => {
  return (
    <Translator>
      <BaseReport />
    </Translator>
  );
};

// Default export lazy-loaded by production ReportApp
export default TabReport;
