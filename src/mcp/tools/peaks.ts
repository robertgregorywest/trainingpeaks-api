import { z } from 'zod';
import type { TrainingPeaksClient } from '../../index.js';
import type { PeakSport, PeakType } from '../../types.js';

const peakSportEnum = z.enum(['Bike', 'Run']);
const peakTypeEnum = z.enum([
  'power5sec',
  'power10sec',
  'power20sec',
  'power30sec',
  'power1min',
  'power2min',
  'power5min',
  'power10min',
  'power20min',
  'power30min',
  'power60min',
  'power90min',
  'speed400m',
  'speed800m',
  'speed1K',
  'speed1mi',
  'speed2K',
  'speed5K',
  'speed10K',
  'speed15K',
  'speed20K',
  'speedHM',
  'speed25K',
  'speed30K',
  'speedM',
  'speed50K',
]);

export const getPeaksSchema = z.object({
  sport: peakSportEnum.describe('Sport type: Bike or Run'),
  type: peakTypeEnum.describe('Peak type (e.g., power5min, speed5K)'),
  startDate: z.string().optional().describe('Start date filter (YYYY-MM-DD)'),
  endDate: z.string().optional().describe('End date filter (YYYY-MM-DD)'),
  limit: z.number().optional().describe('Maximum number of results'),
});

export const getAllPeaksSchema = z.object({
  sport: peakSportEnum.describe('Sport type: Bike or Run'),
  startDate: z.string().optional().describe('Start date filter (YYYY-MM-DD)'),
  endDate: z.string().optional().describe('End date filter (YYYY-MM-DD)'),
  limit: z.number().optional().describe('Maximum number of results'),
});

export const getWorkoutPeaksSchema = z.object({
  workoutId: z.number().describe('The workout ID'),
});

export const getPowerPeaksSchema = z.object({
  startDate: z.string().optional().describe('Start date filter (YYYY-MM-DD)'),
  endDate: z.string().optional().describe('End date filter (YYYY-MM-DD)'),
  limit: z.number().optional().describe('Maximum number of results'),
});

export const getRunningPeaksSchema = z.object({
  startDate: z.string().optional().describe('Start date filter (YYYY-MM-DD)'),
  endDate: z.string().optional().describe('End date filter (YYYY-MM-DD)'),
  limit: z.number().optional().describe('Maximum number of results'),
});

export async function getPeaks(
  client: TrainingPeaksClient,
  args: z.infer<typeof getPeaksSchema>
): Promise<string> {
  const peaks = await client.getPeaks(args.sport as PeakSport, args.type as PeakType, {
    startDate: args.startDate,
    endDate: args.endDate,
    limit: args.limit,
  });
  return JSON.stringify(peaks, null, 2);
}

export async function getAllPeaks(
  client: TrainingPeaksClient,
  args: z.infer<typeof getAllPeaksSchema>
): Promise<string> {
  const peaks = await client.getAllPeaks(args.sport as PeakSport, {
    startDate: args.startDate,
    endDate: args.endDate,
    limit: args.limit,
  });
  return JSON.stringify(peaks, null, 2);
}

export async function getWorkoutPeaks(
  client: TrainingPeaksClient,
  args: z.infer<typeof getWorkoutPeaksSchema>
): Promise<string> {
  const peaks = await client.getWorkoutPeaks(args.workoutId);
  return JSON.stringify(peaks, null, 2);
}

export async function getPowerPeaks(
  client: TrainingPeaksClient,
  args: z.infer<typeof getPowerPeaksSchema>
): Promise<string> {
  const peaks = await client.getPowerPeaks({
    startDate: args.startDate,
    endDate: args.endDate,
    limit: args.limit,
  });
  return JSON.stringify(peaks, null, 2);
}

export async function getRunningPeaks(
  client: TrainingPeaksClient,
  args: z.infer<typeof getRunningPeaksSchema>
): Promise<string> {
  const peaks = await client.getRunningPeaks({
    startDate: args.startDate,
    endDate: args.endDate,
    limit: args.limit,
  });
  return JSON.stringify(peaks, null, 2);
}
