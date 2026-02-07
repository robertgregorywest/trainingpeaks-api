import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { TrainingPeaksClient } from '../index.js';
import { logResponse, logError } from './logger.js';

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
  searchWorkoutsSchema,
  compareIntervalsSchema,
  getWorkouts,
  getWorkout,
  getWorkoutDetails,
  searchWorkouts,
  compareIntervals,
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

type ToolResult = { content: Array<{ type: 'text'; text: string }> };

// Wrapper to add logging to tool handlers
function withLogging<T>(
  toolName: string,
  handler: (args: T) => Promise<string>
): (args: T) => Promise<ToolResult> {
  return async (args: T): Promise<ToolResult> => {
    const start = Date.now();
    try {
      const content = await handler(args);
      logResponse(toolName, content, Date.now() - start);
      return { content: [{ type: 'text', text: content }] };
    } catch (error) {
      logError(toolName, error as Error, Date.now() - start);
      throw error;
    }
  };
}

export function createMcpServer(client: TrainingPeaksClient): McpServer {
  const server = new McpServer({
    name: 'trainingpeaks-mcp',
    version: '0.1.0',
  });

  // User tools
  server.tool(
    'get_user',
    'Get the current user profile including athlete ID',
    getUserSchema.shape,
    withLogging('get_user', () => getUser(client))
  );

  server.tool(
    'get_athlete_id',
    'Get just the athlete ID for the current user',
    getAthleteIdSchema.shape,
    withLogging('get_athlete_id', () => getAthleteId(client))
  );

  // Workout tools
  server.tool(
    'get_workouts',
    'Get a list of workouts within a date range',
    getWorkoutsSchema.shape,
    withLogging('get_workouts', (args) => getWorkouts(client, args))
  );

  server.tool(
    'get_workout',
    'Get a single workout summary by ID',
    getWorkoutSchema.shape,
    withLogging('get_workout', (args) => getWorkout(client, args))
  );

  server.tool(
    'get_workout_details',
    'Get detailed workout data including metrics, intervals, laps, and zones',
    getWorkoutDetailsSchema.shape,
    withLogging('get_workout_details', (args) => getWorkoutDetails(client, args))
  );

  server.tool(
    'search_workouts',
    'Search for workouts by title (case-insensitive substring match) within a number of days',
    searchWorkoutsSchema.shape,
    withLogging('search_workouts', (args) => searchWorkouts(client, args))
  );

  server.tool(
    'compare_intervals',
    'Compare laps/intervals side-by-side across multiple workouts with optional power and duration filters',
    compareIntervalsSchema.shape,
    withLogging('compare_intervals', (args) => compareIntervals(client, args))
  );

  // File tools
  server.tool(
    'download_fit_file',
    'Download the FIT file for a workout. Returns the file path where it was saved.',
    downloadFitFileSchema.shape,
    withLogging('download_fit_file', (args) => downloadFitFile(client, args))
  );

  server.tool(
    'download_attachment',
    'Download a workout attachment. Returns the file path where it was saved.',
    downloadAttachmentSchema.shape,
    withLogging('download_attachment', (args) => downloadAttachment(client, args))
  );

  server.tool(
    'parse_fit_file',
    'Parse a FIT file and extract structured data (sessions, laps, records)',
    parseFitFileSchema.shape,
    withLogging('parse_fit_file', (args) => parseFitFile(args))
  );

  // Fitness tools
  server.tool(
    'get_fitness_data',
    'Get fitness metrics (CTL, ATL, TSB) for a date range',
    getFitnessDataSchema.shape,
    withLogging('get_fitness_data', (args) => getFitnessData(client, args))
  );

  server.tool(
    'get_current_fitness',
    'Get current fitness metrics (CTL, ATL, TSB) for today',
    getCurrentFitnessSchema.shape,
    withLogging('get_current_fitness', () => getCurrentFitness(client))
  );

  // Peaks tools
  server.tool(
    'get_peaks',
    'Get peaks/personal records for a specific sport and type',
    getPeaksSchema.shape,
    withLogging('get_peaks', (args) => getPeaks(client, args))
  );

  server.tool(
    'get_all_peaks',
    'Get all peaks/personal records for a sport',
    getAllPeaksSchema.shape,
    withLogging('get_all_peaks', (args) => getAllPeaks(client, args))
  );

  server.tool(
    'get_workout_peaks',
    'Get peaks/PRs achieved in a specific workout',
    getWorkoutPeaksSchema.shape,
    withLogging('get_workout_peaks', (args) => getWorkoutPeaks(client, args))
  );

  server.tool(
    'get_power_peaks',
    'Get cycling power peaks (convenience method for bike power PRs)',
    getPowerPeaksSchema.shape,
    withLogging('get_power_peaks', (args) => getPowerPeaks(client, args))
  );

  server.tool(
    'get_running_peaks',
    'Get running pace peaks (convenience method for running PRs)',
    getRunningPeaksSchema.shape,
    withLogging('get_running_peaks', (args) => getRunningPeaks(client, args))
  );

  return server;
}
