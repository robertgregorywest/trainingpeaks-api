import { z } from 'zod';
import type { TrainingPeaksClient } from '../../index.js';
import { decodeFitBuffer } from './fit-utils.js';

export const getBestPowerSchema = z.object({
  workoutId: z.number().describe('The workout ID'),
  durations: z
    .array(z.number())
    .describe('Target durations in seconds to compute best power for'),
});

export function computeBestPower(
  powerStream: number[],
  durationSeconds: number
): { bestPower: number; startIndex: number } | null {
  if (durationSeconds > powerStream.length) {
    return null;
  }

  let windowSum = 0;
  for (let i = 0; i < durationSeconds; i++) {
    windowSum += (powerStream[i] ?? 0);
  }

  let bestSum = windowSum;
  let bestStart = 0;

  for (let i = durationSeconds; i < powerStream.length; i++) {
    windowSum += (powerStream[i] ?? 0) - (powerStream[i - durationSeconds] ?? 0);
    if (windowSum > bestSum) {
      bestSum = windowSum;
      bestStart = i - durationSeconds + 1;
    }
  }

  return {
    bestPower: Math.round(bestSum / durationSeconds),
    startIndex: bestStart,
  };
}

export async function getBestPower(
  client: TrainingPeaksClient,
  args: z.infer<typeof getBestPowerSchema>
): Promise<string> {
  const workout = await client.getWorkout(args.workoutId);
  const buffer = await client.downloadActivityFile(args.workoutId);

  if (!buffer) {
    throw new Error(`No activity file available for workout ${args.workoutId}`);
  }

  const messages = await decodeFitBuffer(buffer);
  const recordMesgs = messages.recordMesgs;

  if (!recordMesgs || recordMesgs.length === 0) {
    throw new Error('No record data found in FIT file');
  }

  const powerStream: number[] = recordMesgs.map(
    (r: Record<string, unknown>) => (typeof r.power === 'number' ? r.power : 0)
  );

  const hasPower = powerStream.some((p) => p > 0);
  if (!hasPower) {
    throw new Error('No power data found in workout records');
  }

  const sortedDurations = [...args.durations].sort((a, b) => a - b);

  const results = sortedDurations.map((duration) => {
    const result = computeBestPower(powerStream, duration);
    if (!result) {
      return {
        durationSeconds: duration,
        bestPowerWatts: null,
        error: 'Duration exceeds recording length',
      };
    }
    return {
      durationSeconds: duration,
      bestPowerWatts: result.bestPower,
      startOffsetSeconds: result.startIndex,
    };
  });

  return JSON.stringify(
    {
      workoutId: args.workoutId,
      workoutDate: workout.workoutDay,
      workoutTitle: workout.title,
      totalRecords: powerStream.length,
      results,
    },
    null,
    2
  );
}
