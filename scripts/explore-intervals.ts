/**
 * Explore the compare_intervals tool functionality with FIT file lap data.
 *
 * Run with: npx tsx scripts/explore-intervals.ts
 */
import "dotenv/config";
import { TrainingPeaksClient } from "../src/index.js";
import { compareIntervals } from "../src/mcp/tools/workouts.js";
import { dump } from "./helpers.js";

const client = new TrainingPeaksClient();

try {
  const workoutIds = [3535283732]; // Threshold intervals
  console.log(`=== compareIntervals for workouts: ${workoutIds.join(", ")} ===\n`);

  const result = await compareIntervals(client, {
    workoutIds,
    durationTolerance: 2,
  });

  dump("Result", JSON.parse(result));
} finally {
  await client.close();
}
