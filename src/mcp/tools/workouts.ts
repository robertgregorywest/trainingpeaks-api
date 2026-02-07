import { z } from 'zod';
import type { TrainingPeaksClient } from '../../index.js';
import type { WorkoutDetail, WorkoutLap } from '../../types.js';

export const getWorkoutsSchema = z.object({
  startDate: z.string().describe('Start date in YYYY-MM-DD format'),
  endDate: z.string().describe('End date in YYYY-MM-DD format'),
  includeDeleted: z.boolean().optional().describe('Include deleted workouts'),
});

export const getWorkoutSchema = z.object({
  workoutId: z.number().describe('The workout ID'),
});

export const getWorkoutDetailsSchema = z.object({
  workoutId: z.number().describe('The workout ID'),
});

export async function getWorkouts(
  client: TrainingPeaksClient,
  args: z.infer<typeof getWorkoutsSchema>
): Promise<string> {
  const workouts = await client.getWorkouts(args.startDate, args.endDate, {
    includeDeleted: args.includeDeleted,
  });
  return JSON.stringify(workouts, null, 2);
}

export async function getWorkout(
  client: TrainingPeaksClient,
  args: z.infer<typeof getWorkoutSchema>
): Promise<string> {
  const workout = await client.getWorkout(args.workoutId);
  return JSON.stringify(workout, null, 2);
}

export async function getWorkoutDetails(
  client: TrainingPeaksClient,
  args: z.infer<typeof getWorkoutDetailsSchema>
): Promise<string> {
  const workout = await client.getWorkoutDetails(args.workoutId);
  return JSON.stringify(workout, null, 2);
}

// Search workouts by title

export const searchWorkoutsSchema = z.object({
  title: z.string().describe('Case-insensitive substring to match against workout titles'),
  days: z
    .number()
    .optional()
    .default(90)
    .describe('Number of days back from today to search (default 90)'),
});

export async function searchWorkouts(
  client: TrainingPeaksClient,
  args: z.infer<typeof searchWorkoutsSchema>
): Promise<string> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - args.days);

  const format = (d: Date) => d.toISOString().split('T')[0];
  const workouts = await client.getWorkouts(format(startDate), format(endDate));

  const query = args.title.toLowerCase();
  const matches = workouts.filter((w) => w.title?.toLowerCase().includes(query));

  return JSON.stringify(matches, null, 2);
}

// Compare intervals across workouts

export const compareIntervalsSchema = z.object({
  workoutIds: z.array(z.number()).min(1).describe('Workout IDs to compare'),
  minPower: z.number().optional().describe('Minimum average power filter for laps'),
  targetDuration: z.number().optional().describe('Target lap duration in seconds'),
  durationTolerance: z
    .number()
    .optional()
    .default(2)
    .describe('Duration tolerance in seconds (default ±2)'),
});

interface LapValue {
  workoutId: number;
  title?: string;
  date?: string;
  avgPower?: number;
  maxPower?: number;
  duration?: number;
}

interface LapRow {
  lapNumber: number;
  values: LapValue[];
}

interface WorkoutSummaryResult {
  workoutId: number;
  title?: string;
  date?: string;
  lapCount: number;
  avgPower: number | null;
  minPower: number | null;
  maxPower: number | null;
  powerRange: number | null;
  totalDuration: number;
}

function filterLaps(
  laps: WorkoutLap[],
  args: z.infer<typeof compareIntervalsSchema>
): WorkoutLap[] {
  let filtered = laps;

  if (args.minPower !== undefined) {
    filtered = filtered.filter((l) => (l.averagePower ?? 0) >= args.minPower!);
  }

  if (args.targetDuration !== undefined) {
    const tolerance = args.durationTolerance;
    filtered = filtered.filter((l) => {
      if (l.duration === undefined) return false;
      return Math.abs(l.duration - args.targetDuration!) <= tolerance;
    });
  }

  return filtered;
}

function buildSummary(
  detail: WorkoutDetail,
  laps: WorkoutLap[]
): WorkoutSummaryResult {
  const powers = laps.map((l) => l.averagePower).filter((p): p is number => p !== undefined);
  const avgPower = powers.length > 0 ? Math.round(powers.reduce((a, b) => a + b, 0) / powers.length) : null;
  const minPower = powers.length > 0 ? Math.min(...powers) : null;
  const maxPower = powers.length > 0 ? Math.max(...powers) : null;
  const powerRange = minPower !== null && maxPower !== null ? maxPower - minPower : null;
  const totalDuration = laps.reduce((sum, l) => sum + (l.duration ?? 0), 0);

  return {
    workoutId: detail.workoutId,
    title: detail.title,
    date: detail.completedDate ?? detail.workoutDay,
    lapCount: laps.length,
    avgPower,
    minPower,
    maxPower,
    powerRange,
    totalDuration,
  };
}

export async function compareIntervals(
  client: TrainingPeaksClient,
  args: z.infer<typeof compareIntervalsSchema>
): Promise<string> {
  const details = await Promise.all(
    args.workoutIds.map((id) => client.getWorkoutDetails(id))
  );

  const workoutLaps: { detail: WorkoutDetail; laps: WorkoutLap[] }[] = details.map((detail) => ({
    detail,
    laps: filterLaps(detail.laps ?? [], args),
  }));

  // Align laps side-by-side
  const maxLaps = Math.max(...workoutLaps.map((w) => w.laps.length), 0);
  const laps: LapRow[] = [];

  for (let i = 0; i < maxLaps; i++) {
    const values: LapValue[] = workoutLaps.map((w) => {
      const lap = w.laps[i];
      return {
        workoutId: w.detail.workoutId,
        title: w.detail.title,
        date: w.detail.completedDate ?? w.detail.workoutDay,
        avgPower: lap?.averagePower,
        maxPower: lap?.maxPower,
        duration: lap?.duration,
      };
    });
    laps.push({ lapNumber: i + 1, values });
  }

  const summaries = workoutLaps.map((w) => buildSummary(w.detail, w.laps));

  const warnings: string[] = [];
  for (const w of workoutLaps) {
    if ((w.detail.laps ?? []).length === 0) {
      warnings.push(`Workout ${w.detail.workoutId} (${w.detail.title ?? 'Untitled'}) has no laps`);
    }
  }

  const result: Record<string, unknown> = { laps, summaries };
  if (warnings.length > 0) {
    result.warnings = warnings;
  }

  return JSON.stringify(result, null, 2);
}
