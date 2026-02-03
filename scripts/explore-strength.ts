/**
 * Explore strength workout data from TrainingPeaks.
 *
 * Strength workouts are stored in a separate API (api.peakswaresb.com)
 * and include structured exercises with sets, reps, and compliance tracking.
 *
 * Run with: npm run explore:strength
 */
import "dotenv/config";
import { TrainingPeaksClient } from "../src/index.js";
import { createAuthManager } from "../src/auth.js";
import { createHttpClient } from "../src/client.js";
import { dump, shape, keys, lastNDays, saveSnapshot } from "./helpers.js";

const PEAKSWARE_API_BASE = "https://api.peakswaresb.com";

const client = new TrainingPeaksClient();

// Create raw HTTP client for exploring API responses
const username = process.env.TP_USERNAME!;
const password = process.env.TP_PASSWORD!;
const authManager = createAuthManager({ username, password }, true);
const httpClient = createHttpClient(authManager);

try {
  // Get strength workouts from the last 30 days
  const { start, end } = lastNDays(30);
  console.log(`Fetching strength workouts from ${start} to ${end}...\n`);

  const workouts = await client.getStrengthWorkouts(start, end);
  console.log(`Found ${workouts.length} strength workouts\n`);

  if (workouts.length === 0) {
    console.log("No strength workouts found in the date range.");
    console.log("Try extending the date range or checking your calendar.");
  } else {
    // Show the structure of the workout list
    console.log("=== Strength Workout List Structure ===");
    shape(workouts);

    // Show first few workouts
    const preview = workouts.slice(0, 5);
    dump("First 5 Strength Workouts", preview);

    // Explore the first workout in detail
    const firstWorkout = workouts[0];
    console.log(`\n--- Exploring workout: ${firstWorkout.title} ---`);
    console.log(`Workout ID: ${firstWorkout.workoutId}`);
    console.log(`Date: ${firstWorkout.workoutDay}`);
    console.log(`Completed: ${firstWorkout.completedDate || "Not completed"}`);
    console.log(
      `Progress: ${firstWorkout.completedBlocks}/${firstWorkout.totalBlocks} blocks, ${firstWorkout.completedSets}/${firstWorkout.totalSets} sets`
    );
    console.log(`Compliance: ${firstWorkout.compliancePercent}%`);

    // Show available fields
    console.log("\nAvailable fields in strength workout:");
    console.log(keys(firstWorkout));

    // Show exercises breakdown
    if (firstWorkout.exercises.length > 0) {
      console.log(`\n=== Exercises (${firstWorkout.exercises.length}) ===`);
      for (const exercise of firstWorkout.exercises) {
        console.log(
          `  ${exercise.sequenceOrder}. ${exercise.title} - ${exercise.compliancePercent}% compliance`
        );
      }
    }

    // Summarize compliance across all workouts
    console.log("\n=== Compliance Summary ===");
    const completed = workouts.filter((w) => w.completedDate);
    console.log(`  Completed: ${completed.length}/${workouts.length}`);
    if (completed.length > 0) {
      const avgCompliance =
        completed.reduce((sum, w) => sum + w.compliancePercent, 0) /
        completed.length;
      console.log(`  Avg compliance: ${avgCompliance.toFixed(1)}%`);
    }

    // Uncomment to save for later analysis:
    // await saveSnapshot('strength-workouts', workouts);
  }

  // Fetch raw API response for analysis
  console.log("\n=== Raw API Response (for debugging) ===");
  const athleteId = await client.getAthleteId();
  const rawWorkouts = await httpClient.requestWithBase<unknown[]>(
    PEAKSWARE_API_BASE,
    `/rx/activity/v1/workouts/calendar/${athleteId}/${start}/${end}`
  );
  console.log(`Raw API returned ${rawWorkouts.length} workouts`);

  if (rawWorkouts.length > 0) {
    dump("First Raw Strength Workout", rawWorkouts[0]);
    // await saveSnapshot('raw-strength-workout', rawWorkouts[0]);
  }
} finally {
  await client.close();
  await authManager.close();
}
