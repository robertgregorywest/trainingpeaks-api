/**
 * Explore peaks / personal records from TrainingPeaks.
 *
 * Uses the client API which hits /personalrecord/v2/ endpoints.
 *
 * Run with: npm run explore:peaks
 */
import 'dotenv/config';
import { TrainingPeaksClient } from '../src/index.js';
import { dump } from './helpers.js';

const client = new TrainingPeaksClient();

try {
  const athleteId = await client.getAthleteId();
  console.log(`Athlete ID: ${athleteId}\n`);

  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // 1. Get peaks by sport and type
  console.log('=== getPeaks (Bike, power5min) ===');
  const power5m = await client.getPeaks('Bike', 'power5min', { startDate, endDate });
  dump('Bike power5min peaks', power5m);

  console.log('\n=== getPeaks (Bike, power1min) ===');
  const power1m = await client.getPeaks('Bike', 'power1min', { startDate, endDate });
  dump('Bike power1min peaks', power1m);

  console.log('\n=== getPeaks (Bike, power20min) ===');
  const power20m = await client.getPeaks('Bike', 'power20min', { startDate, endDate });
  dump('Bike power20min peaks', power20m);

  // 2. Get workout PRs
  const workouts = await client.getWorkouts(
    new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate
  );

  if (workouts.length > 0) {
    console.log(`\n=== getWorkoutPeaks (workout ${workouts[0].workoutId}: ${workouts[0].title}) ===`);
    const workoutPeaks = await client.getWorkoutPeaks(workouts[0].workoutId);
    dump('Workout PRs', workoutPeaks);
  } else {
    console.log('\nNo workouts found in last 90 days');
  }
} finally {
  await client.close();
}
