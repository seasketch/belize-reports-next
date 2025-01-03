import fs from "fs-extra";
import { OusFeatureProperties } from "../../src/util/overlapOusDemographic.js";
import {
  FeatureCollection,
  Polygon,
} from "@seasketch/geoprocessing/client-core";

// Assumes already done:
// join spatial and tabular data
// remove extraneous fields or those uniquely identifying people

const shapeFc = fs.readJSONSync(
  "../src/Data_Products/data-package/ous_demographics.geojson",
) as FeatureCollection<Polygon, OusFeatureProperties>;

// sort by respondent_id (string)
const sortedShapes = shapeFc.features.sort(
  (a, b) => a.properties.resp_id - b.properties.resp_id,
);
fs.writeFileSync(
  "../src/Data_Products/data-package/ous_demographics_sorted.geojson",
  JSON.stringify({ ...shapeFc, features: sortedShapes }),
);
