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
  sketch: Sketch | SketchCollection | NullSketchCollection | NullSketch,
): Record<string, string> {
  const sketchFeatures = getSketchFeatures(sketch);
  const protectionLevels = sketchFeatures.reduce<Record<string, string>>(
    (levels, sketch) => {
      // New sketches use protection_level attribute
      const protection_level = getUserAttribute(
        sketch.properties,
        "protection_level",
        "",
      ).toString();

      // If protection_level is set, use it
      if (protection_level !== "") {
        if (protection_level === "high")
          levels[sketch.properties.id] = "HIGH_PROTECTION";
        else if (protection_level === "medium")
          levels[sketch.properties.id] = "MEDIUM_PROTECTION";
        else {
          throw new Error(`Invalid protection level ${protection_level}`);
        }
        return levels;
      }

      // Otherwise, use designation if set
      const designation = getUserAttribute(
        sketch.properties,
        "designation",
        "",
      ).toString();

      if (highProtectionLevels.includes(designation))
        levels[sketch.properties.id] = "HIGH_PROTECTION";
      else if (mediumProtectionLevels.includes(designation))
        levels[sketch.properties.id] = "MEDIUM_PROTECTION";
      else levels[sketch.properties.id] = "MEDIUM_PROTECTION";

      return levels;
    },
    {},
  );

  return protectionLevels;
}
