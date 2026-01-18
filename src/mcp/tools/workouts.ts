import { z } from 'zod';
import type { TrainingPeaksClient } from '../../index.js';

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
