import { z } from 'zod';
import type { TrainingPeaksClient } from '../../index.js';

export const getUserSchema = z.object({});

export const getAthleteIdSchema = z.object({});

export async function getUser(client: TrainingPeaksClient): Promise<string> {
  const user = await client.getUser();
  return JSON.stringify(user, null, 2);
}

export async function getAthleteId(client: TrainingPeaksClient): Promise<string> {
  const athleteId = await client.getAthleteId();
  return JSON.stringify({ athleteId }, null, 2);
}
