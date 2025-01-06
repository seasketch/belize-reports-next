import { defineGpStories } from "@seasketch/geoprocessing/storybook";

// Register to generate stories for each example sketch and its gp function smoke test output
export const storyConfig = defineGpStories({
  componentName: "Geomorphology",
  /** Relative path to React component from this config file */
  componentPath: "./Geomorphology.tsx",
  title: "Project/Components/Geomorphology",
});
