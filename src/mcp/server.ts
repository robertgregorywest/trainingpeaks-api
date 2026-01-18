import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { TrainingPeaksClient } from '../index.js';

import {
  getUserSchema,
  getAthleteIdSchema,
  getUser,
  getAthleteId,
} from './tools/user.js';

import {
  getWorkoutsSchema,
  getWorkoutSchema,
  getWorkoutDetailsSchema,
  getWorkouts,
  getWorkout,
  getWorkoutDetails,
} from './tools/workouts.js';

import {
  downloadFitFileSchema,
  downloadAttachmentSchema,
  parseFitFileSchema,
  downloadFitFile,
  downloadAttachment,
  parseFitFile,
} from './tools/files.js';

import {
  getFitnessDataSchema,
  getCurrentFitnessSchema,
  getFitnessData,
  getCurrentFitness,
} from './tools/fitness.js';

import {
  getPeaksSchema,
  getAllPeaksSchema,
  getWorkoutPeaksSchema,
  getPowerPeaksSchema,
  getRunningPeaksSchema,
  getPeaks,
  getAllPeaks,
  getWorkoutPeaks,
  getPowerPeaks,
  getRunningPeaks,
} from './tools/peaks.js';

export function createMcpServer(client: TrainingPeaksClient): McpServer {
  const server = new McpServer({
    name: 'trainingpeaks-mcp',
    version: '0.1.0',
  });

  // User tools
  server.tool('get_user', 'Get the current user profile including athlete ID', getUserSchema.shape, async () => {
    const content = await getUser(client);
    return { content: [{ type: 'text', text: content }] };
  });

  server.tool('get_athlete_id', 'Get just the athlete ID for the current user', getAthleteIdSchema.shape, async () => {
    const content = await getAthleteId(client);
    return { content: [{ type: 'text', text: content }] };
  });

  // Workout tools
  server.tool(
    'get_workouts',
    'Get a list of workouts within a date range',
    getWorkoutsSchema.shape,
    async (args) => {
      const content = await getWorkouts(client, args);
      return { content: [{ type: 'text', text: content }] };
    }
  );

  server.tool(
    'get_workout',
    'Get a single workout summary by ID',
    getWorkoutSchema.shape,
    async (args) => {
      const content = await getWorkout(client, args);
      return { content: [{ type: 'text', text: content }] };
    }
  );

  server.tool(
    'get_workout_details',
    'Get detailed workout data including metrics, intervals, laps, and zones',
    getWorkoutDetailsSchema.shape,
    async (args) => {
      const content = await getWorkoutDetails(client, args);
      return { content: [{ type: 'text', text: content }] };
    }
  );

  // File tools
  server.tool(
    'download_fit_file',
    'Download the FIT file for a workout. Returns the file path where it was saved.',
    downloadFitFileSchema.shape,
    async (args) => {
      const content = await downloadFitFile(client, args);
      return { content: [{ type: 'text', text: content }] };
    }
  );

  server.tool(
    'download_attachment',
    'Download a workout attachment. Returns the file path where it was saved.',
    downloadAttachmentSchema.shape,
    async (args) => {
      const content = await downloadAttachment(client, args);
      return { content: [{ type: 'text', text: content }] };
    }
  );

  server.tool(
    'parse_fit_file',
    'Parse a FIT file and extract structured data (sessions, laps, records)',
    parseFitFileSchema.shape,
    async (args) => {
      const content = await parseFitFile(args);
      return { content: [{ type: 'text', text: content }] };
    }
  );

  // Fitness tools
  server.tool(
    'get_fitness_data',
    'Get fitness metrics (CTL, ATL, TSB) for a date range',
    getFitnessDataSchema.shape,
    async (args) => {
      const content = await getFitnessData(client, args);
      return { content: [{ type: 'text', text: content }] };
    }
  );

  server.tool(
    'get_current_fitness',
    'Get current fitness metrics (CTL, ATL, TSB) for today',
    getCurrentFitnessSchema.shape,
    async () => {
      const content = await getCurrentFitness(client);
      return { content: [{ type: 'text', text: content }] };
    }
  );

  // Peaks tools
  server.tool(
    'get_peaks',
    'Get peaks/personal records for a specific sport and type',
    getPeaksSchema.shape,
    async (args) => {
      const content = await getPeaks(client, args);
      return { content: [{ type: 'text', text: content }] };
    }
  );

  server.tool(
    'get_all_peaks',
    'Get all peaks/personal records for a sport',
    getAllPeaksSchema.shape,
    async (args) => {
      const content = await getAllPeaks(client, args);
      return { content: [{ type: 'text', text: content }] };
    }
  );

  server.tool(
    'get_workout_peaks',
    'Get peaks/PRs achieved in a specific workout',
    getWorkoutPeaksSchema.shape,
    async (args) => {
      const content = await getWorkoutPeaks(client, args);
      return { content: [{ type: 'text', text: content }] };
    }
  );

  server.tool(
    'get_power_peaks',
    'Get cycling power peaks (convenience method for bike power PRs)',
    getPowerPeaksSchema.shape,
    async (args) => {
      const content = await getPowerPeaks(client, args);
      return { content: [{ type: 'text', text: content }] };
    }
  );

  server.tool(
    'get_running_peaks',
    'Get running pace peaks (convenience method for running PRs)',
    getRunningPeaksSchema.shape,
    async (args) => {
      const content = await getRunningPeaks(client, args);
      return { content: [{ type: 'text', text: content }] };
    }
  );

  return server;
}
