import {
  Sketch,
  SketchCollection,
  Polygon,
  MultiPolygon,
  GeoprocessingHandler,
  toSketchArray,
} from "@seasketch/geoprocessing";
import existingMpas from "../../data/marlin/Existing-MPAs.geojson.json" with { type: "json" };
import coordinates from "../../data/marlin/coordinates.json" with { type: "json" };
import {
  featureCollection,
  union,
  point,
  booleanPointInPolygon,
} from "@turf/turf";
import {
  InvocationResponse,
  InvokeCommand,
  LambdaClient,
} from "@aws-sdk/client-lambda";

export interface CritterData {
  year: number;
  critter: string;
  catch: number;
  biomass: number;
  ssb: number;
  scenario: string;
}

export async function marlin(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>,
): Promise<any> {
  const sketchFeatures = featureCollection(toSketchArray(sketch));
  const existingFeatures = featureCollection(
    toSketchArray(
      existingMpas as unknown as SketchCollection<Polygon | MultiPolygon>,
    ),
  );
  const combinedFeatures = featureCollection([
    ...existingFeatures.features,
    ...sketchFeatures.features,
  ]);

  // Create a union which contains all MPAs
  const collection = union(combinedFeatures);
  if (!collection) {
    throw new Error("Failed to create union of MPAs.");
  }

  // Add coordinate IDs used in MARLIN habitat layers to create mpa_locations
  const mpaSpatial = coordinates
    .map((coord) => point([coord.x, coord.y]))
    .map((p) => {
      const isInMpa = booleanPointInPolygon(p, collection);
      return {
        x: xId[p.geometry.coordinates[0].toString()],
        y: yId[p.geometry.coordinates[1].toString()],
        mpa: isInMpa,
      };
    });

  const parameters = {
    mpa_locations_in: mpaSpatial,
  };

  console.log(parameters);

  const metrics =
    process.env.NODE_ENV === "test"
      ? 1
      : parseLambdaResponse(
          await runLambdaWorker(
            "arn:aws:lambda:us-west-1:196230260133:function:run_marlin",
            parameters,
          ),
        );

  return metrics;
}

// Run lambda, using simple invoke which finds the run_marlin function
async function runLambdaWorker(
  functionName: string,
  functionParameters = {},
): Promise<InvocationResponse> {
  const payload = JSON.stringify(functionParameters, null, 2);

  const client = new LambdaClient({ region: "us-west-1" });
  return client.send(
    new InvokeCommand({
      FunctionName: functionName,
      InvocationType: "RequestResponse",
      Payload: payload,
    }),
  );
}

// Bespoke parse lambda which unravels the CritterData array
function parseLambdaResponse(lambdaResult: InvocationResponse): CritterData[] {
  if (lambdaResult.StatusCode !== 200) {
    throw new Error(`Lambda call failed: HTTP ${lambdaResult.StatusCode}`);
  }

  if (!lambdaResult.Payload) {
    throw new Error(`Lambda result parsing failed: Payload is empty`);
  }

  let payloadString: string;
  if (typeof lambdaResult.Payload === "string") {
    payloadString = lambdaResult.Payload;
  } else if (lambdaResult.Payload instanceof Buffer) {
    payloadString = lambdaResult.Payload.toString("utf8");
  } else if (typeof lambdaResult.Payload === "object") {
    const byteArray = Object.values(lambdaResult.Payload) as number[];
    payloadString = Buffer.from(byteArray).toString("utf8");
  } else {
    throw new Error("Unknown Payload format");
  }

  const parsedOuter = JSON.parse(payloadString);

  if (parsedOuter.statusCode !== 200) {
    throw new Error(
      `Lambda inner status is not 200: ${parsedOuter.statusCode}`,
    );
  }

  if (!parsedOuter.body) {
    throw new Error("No 'body' property found in Lambda response");
  }
  const critterData = JSON.parse(parsedOuter.body);

  return critterData;
}

// X id mapping object created in R
export const xId: Record<string, number> = {
  "-88.465": 1,
  "-88.395": 2,
  "-88.325": 3,
  "-88.255": 4,
  "-88.185": 5,
  "-88.115": 6,
  "-88.045": 7,
  "-87.975": 8,
  "-87.905": 9,
  "-87.835": 10,
  "-87.765": 11,
  "-87.695": 12,
  "-87.625": 13,
  "-87.555": 14,
  "-87.485": 15,
  "-87.415": 16,
};

// Y id mapping object created in R
export const yId: Record<string, number> = {
  "18.225": 1,
  "18.155": 2,
  "18.085": 3,
  "18.015": 4,
  "17.945": 5,
  "17.875": 6,
  "17.805": 7,
  "17.735": 8,
  "17.665": 9,
  "17.595": 10,
  "17.525": 11,
  "17.455": 12,
  "17.385": 13,
  "17.315": 14,
  "17.245": 15,
  "17.175": 16,
  "17.105": 17,
  "17.035": 18,
  "16.965": 19,
  "16.895": 20,
  "16.825": 21,
  "16.755": 22,
  "16.685": 23,
  "16.615": 24,
  "16.545": 25,
  "16.475": 26,
  "16.405": 27,
  "16.335": 28,
  "16.265": 29,
  "16.195": 30,
  "16.125": 31,
  "16.055": 32,
};

export default new GeoprocessingHandler(marlin, {
  title: "marlin",
  description: "",
  timeout: 500, // seconds
  memory: 1024, // megabytes
  executionMode: "async",
  requiresProperties: [],
  workers: [],
});
