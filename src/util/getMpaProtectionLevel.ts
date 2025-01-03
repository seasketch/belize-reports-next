import {
  Sketch,
  SketchCollection,
  NullSketchCollection,
  NullSketch,
  getSketchFeatures,
  getUserAttribute,
} from "@seasketch/geoprocessing/client-core";

// Designation of protection levels
export const protectionLevels = ["HIGH_PROTECTION", "MEDIUM_PROTECTION"];
export const protectionLevelsDisplay = ["High", "Medium"];

// Display values for groups (plural)
export const groupDisplayMapPl: Record<string, string> = {
  HIGH_PROTECTION: "High Protection Biodiversity Zone(s)",
  MEDIUM_PROTECTION: "Medium Protection Biodiversity Zone(s)",
  Ia: "IUCN Ia. Strict Nature Reserve(s)",
  Ib: "IUCN Ib. Wilderness Area(s)",
  II: "IUCN II. National Park(s)",
  III: "IUCN III. Natural Monument(s) or Feature(s)",
  IV: "IUCN IV. Habitat/Species Management Area(s)",
  V: "IUCN V. Protected Landscape(s) or Seascape(s)",
  VI: "IUCN VI. Protected Area(s) with Sustainable Use",
  OECM: "IUCN Other Effective area-based Conservation Measures (OECM)",
  LMMA: "Locally Managed Marine Area(s) (LMMA)",
};

// Display values for groups (singular)
export const groupDisplayMapSg: Record<string, string> = {
  HIGH_PROTECTION: "High Protection Biodiversity Zone",
  MEDIUM_PROTECTION: "Medium Protection Biodiversity Zone",
  Ia: "IUCN Ia. Strict Nature Reserve",
  Ib: "IUCN Ib. Wilderness Area",
  II: "IUCN II. National Park",
  III: "IUCN III. Natural Monument or Feature",
  IV: "IUCN IV. Habitat/Species Management Area",
  V: "IUCN V. Protected Landscape or Seascape",
  VI: "IUCN VI. Protected Area with Sustainable Use",
  OECM: "IUCN Other Effective area-based Conservation Measures (OECM)",
  LMMA: "Locally Managed Marine Area (LMMA)",
};

// Mapping groupIds to colors
export const groupColorMap: Record<string, string> = {
  HIGH_PROTECTION: "#BEE4BE",
  MEDIUM_PROTECTION: "#FFE1A3",
};

// Designations of high and medium protection levels
export const highProtectionLevels = [
  "Ia",
  "Ib",
  "II",
  "III",
  "HIGH_PROTECTION",
];
export const mediumProtectionLevels = [
  "IV",
  "V",
  "VI",
  "OECM",
  "LMMA",
  "MEDIUM_PROTECTION",
];

/**
 * Gets MPA Protection levels for all MPAs in a sketch collection from user attributes
 * @param sketch User-created Sketch | SketchCollection
 * @returns <string, string> mapping of sketchId to protection level
 */
export function getMpaProtectionLevels(
  sketch: Sketch | SketchCollection | NullSketchCollection | NullSketch
): Record<string, string> {
  const sketchFeatures = getSketchFeatures(sketch);
  const protectionLevels = sketchFeatures.reduce<Record<string, string>>(
    (levels, sketch) => {
      const designation = getUserAttribute(
        sketch.properties,
        "designation",
        ""
      ).toString();

      if (highProtectionLevels.includes(designation))
        levels[sketch.properties.id] = "HIGH_PROTECTION";
      else if (mediumProtectionLevels.includes(designation))
        levels[sketch.properties.id] = "MEDIUM_PROTECTION";
      else levels[sketch.properties.id] = "MEDIUM_PROTECTION";

      return levels;
    },
    {}
  );

  return protectionLevels;
}
