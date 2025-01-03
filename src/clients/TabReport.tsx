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
import { ViabilityPage } from "../components/ViabilityPage.js";
import { KeyHabitatPage } from "../components/KeyHabitatPage.js";
import { Footer } from "../util/Footer.js";
import { Settings } from "../util/Settings.js";
import { SketchProperties } from "@seasketch/geoprocessing";

const BaseReport = () => {
  const { t } = useTranslation();
  const viabilityId = "viability";
  const representationId = "representation";
  const keyHabitatId = "keyHabitats";
  const segments = [
    { id: viabilityId, label: t("Viability") },
    { id: representationId, label: t("Representation") },
    { id: keyHabitatId, label: t("Key Habitat") },
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
      {/* Saving to PDF/Printing */}
      <Printer
        size={18}
        color="#999"
        title="Print/Save to PDF"
        style={{
          float: "right",
          position: "relative",
          margin: "5px",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#666")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#999")}
        onClick={() => {
          setIsPrinting(true);
        }}
      />

      {isPrinting && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Card>
            <div>Printing...</div>
          </Card>
        </div>
      )}

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
        <ReportPage hidden={!isPrinting && tab !== viabilityId}>
          <ViabilityPage printing={isPrinting} />
        </ReportPage>
        {/* <ReportPage hidden={!isPrinting && tab !== representationId}>
          <RepresentationPage printing={isPrinting} />
        </ReportPage> */}
        <ReportPage hidden={!isPrinting && tab !== keyHabitatId}>
          <KeyHabitatPage printing={isPrinting} />
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
