import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getWorkouts,
  getWorkout,
  getWorkoutDetails,
  searchWorkouts,
  compareIntervals,
} from '../../src/mcp/tools/workouts.js';
import {
  createMockClient,
  mockWorkoutSummary,
  mockWorkoutSummary2,
  mockWorkoutSummary3,
  mockStrengthWorkout,
  mockWorkoutDetail,
  mockWorkoutDetail2,
  mockWorkoutDetailNoLaps,
  type MockClient,
} from '../mocks/client.js';
import type { TrainingPeaksClient } from '../../src/index.js';

describe('workout tools', () => {
  let mockClient: MockClient;

  beforeEach(() => {
    mockClient = createMockClient();
  });

  describe('getWorkouts', () => {
    it('should return workouts as JSON', async () => {
      const result = await getWorkouts(mockClient as unknown as TrainingPeaksClient, {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });
      const parsed = JSON.parse(result);

      expect(parsed).toEqual([mockWorkoutSummary]);
      expect(mockClient.getWorkouts).toHaveBeenCalledWith('2024-01-01', '2024-01-31', {
        includeDeleted: undefined,
      });
    });

    it('should pass includeDeleted option', async () => {
      await getWorkouts(mockClient as unknown as TrainingPeaksClient, {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        includeDeleted: true,
      });

      expect(mockClient.getWorkouts).toHaveBeenCalledWith('2024-01-01', '2024-01-31', {
        includeDeleted: true,
      });
    });
  });

  describe('getWorkout', () => {
    it('should return single workout as JSON', async () => {
      const result = await getWorkout(mockClient as unknown as TrainingPeaksClient, {
        workoutId: 100,
      });
      const parsed = JSON.parse(result);

      expect(parsed).toEqual(mockWorkoutSummary);
      expect(mockClient.getWorkout).toHaveBeenCalledWith(100);
    });
  });

  describe('getWorkoutDetails', () => {
    it('should return workout details as JSON', async () => {
      const result = await getWorkoutDetails(mockClient as unknown as TrainingPeaksClient, {
        workoutId: 100,
      });
      const parsed = JSON.parse(result);

      expect(parsed).toEqual(mockWorkoutDetail);
      expect(mockClient.getWorkoutDetails).toHaveBeenCalledWith(100);
    });
  });

  describe('searchWorkouts', () => {
    beforeEach(() => {
      mockClient.getWorkouts.mockResolvedValue([
        mockWorkoutSummary,
        mockWorkoutSummary2,
        mockWorkoutSummary3,
        mockStrengthWorkout,
      ]);
    });

    it('should filter workouts by title (case-insensitive)', async () => {
      const result = await searchWorkouts(mockClient as unknown as TrainingPeaksClient, {
        title: 'ride',
        days: 90,
      });
      const parsed = JSON.parse(result);

      expect(parsed).toHaveLength(2);
      expect(parsed[0].title).toBe('Morning Ride');
      expect(parsed[1].title).toBe('Evening Ride');
    });

    it('should match partial title substrings', async () => {
      const result = await searchWorkouts(mockClient as unknown as TrainingPeaksClient, {
        title: 'morning',
        days: 90,
      });
      const parsed = JSON.parse(result);

      expect(parsed).toHaveLength(2);
      expect(parsed.map((w: { title: string }) => w.title)).toEqual([
        'Morning Ride',
        'Morning Run',
      ]);
    });

    it('should return empty array when no matches', async () => {
      const result = await searchWorkouts(mockClient as unknown as TrainingPeaksClient, {
        title: 'swimming',
        days: 90,
      });
      const parsed = JSON.parse(result);

      expect(parsed).toHaveLength(0);
    });

    it('should compute date range from days parameter', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-03-01'));

      await searchWorkouts(mockClient as unknown as TrainingPeaksClient, {
        title: 'ride',
        days: 30,
      });

      expect(mockClient.getWorkouts).toHaveBeenCalledWith('2024-01-31', '2024-03-01');

      vi.useRealTimers();
    });

    it('should use default 90 days when days not specified', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-04-01'));

      await searchWorkouts(mockClient as unknown as TrainingPeaksClient, {
        title: 'ride',
        days: 90,
      });

      expect(mockClient.getWorkouts).toHaveBeenCalledWith('2024-01-02', '2024-04-01');

      vi.useRealTimers();
    });
  });

  describe('compareIntervals', () => {
    it('should compare laps across workouts side-by-side', async () => {
      mockClient.getWorkoutDetails
        .mockResolvedValueOnce(mockWorkoutDetail)
        .mockResolvedValueOnce(mockWorkoutDetail2);

      const result = await compareIntervals(mockClient as unknown as TrainingPeaksClient, {
        workoutIds: [100, 102],
        durationTolerance: 2,
      });
      const parsed = JSON.parse(result);

      // mockWorkoutDetail has 1 lap, mockWorkoutDetail2 has 2 laps → max 2 rows
      expect(parsed.laps).toHaveLength(2);
      expect(parsed.laps[0].lapNumber).toBe(1);
      expect(parsed.laps[0].values).toHaveLength(2);
      expect(parsed.laps[0].values[0].avgPower).toBe(200);
      expect(parsed.laps[0].values[1].avgPower).toBe(210);

      // Lap 2: workout 100 has no lap 2, so avgPower is undefined
      expect(parsed.laps[1].values[0].avgPower).toBeUndefined();
      expect(parsed.laps[1].values[1].avgPower).toBe(230);
    });

    it('should filter laps by minPower', async () => {
      mockClient.getWorkoutDetails.mockResolvedValueOnce(mockWorkoutDetail2);

      const result = await compareIntervals(mockClient as unknown as TrainingPeaksClient, {
        workoutIds: [102],
        minPower: 220,
        durationTolerance: 2,
      });
      const parsed = JSON.parse(result);

      // Only lap 2 (avgPower 230) passes the minPower 220 filter
      expect(parsed.laps).toHaveLength(1);
      expect(parsed.laps[0].values[0].avgPower).toBe(230);
    });

    it('should filter laps by targetDuration with tolerance', async () => {
      mockClient.getWorkoutDetails.mockResolvedValueOnce(mockWorkoutDetail2);

      const result = await compareIntervals(mockClient as unknown as TrainingPeaksClient, {
        workoutIds: [102],
        targetDuration: 1801,
        durationTolerance: 5,
      });
      const parsed = JSON.parse(result);

      // Both laps have duration 1800, within ±5 of 1801
      expect(parsed.laps).toHaveLength(2);
    });

    it('should exclude laps outside duration tolerance', async () => {
      mockClient.getWorkoutDetails.mockResolvedValueOnce(mockWorkoutDetail2);

      const result = await compareIntervals(mockClient as unknown as TrainingPeaksClient, {
        workoutIds: [102],
        targetDuration: 1810,
        durationTolerance: 2,
      });
      const parsed = JSON.parse(result);

      // Both laps have duration 1800, outside ±2 of 1810
      expect(parsed.laps).toHaveLength(0);
    });

    it('should compute per-workout summaries', async () => {
      mockClient.getWorkoutDetails.mockResolvedValueOnce(mockWorkoutDetail2);

      const result = await compareIntervals(mockClient as unknown as TrainingPeaksClient, {
        workoutIds: [102],
        durationTolerance: 2,
      });
      const parsed = JSON.parse(result);

      expect(parsed.summaries).toHaveLength(1);
      const summary = parsed.summaries[0];
      expect(summary.workoutId).toBe(102);
      expect(summary.lapCount).toBe(2);
      expect(summary.avgPower).toBe(220); // (210+230)/2
      expect(summary.minPower).toBe(210);
      expect(summary.maxPower).toBe(230);
      expect(summary.powerRange).toBe(20);
      expect(summary.totalDuration).toBe(3600);
    });

    it('should include warning for workouts with no laps', async () => {
      mockClient.getWorkoutDetails.mockResolvedValueOnce(mockWorkoutDetailNoLaps);

      const result = await compareIntervals(mockClient as unknown as TrainingPeaksClient, {
        workoutIds: [103],
        durationTolerance: 2,
      });
      const parsed = JSON.parse(result);

      expect(parsed.warnings).toHaveLength(1);
      expect(parsed.warnings[0]).toContain('Workout 103');
      expect(parsed.warnings[0]).toContain('no laps');
      expect(parsed.summaries[0].lapCount).toBe(0);
      expect(parsed.summaries[0].avgPower).toBeNull();
    });

    it('should handle single workout', async () => {
      mockClient.getWorkoutDetails.mockResolvedValueOnce(mockWorkoutDetail);

      const result = await compareIntervals(mockClient as unknown as TrainingPeaksClient, {
        workoutIds: [100],
        durationTolerance: 2,
      });
      const parsed = JSON.parse(result);

      expect(parsed.laps).toHaveLength(1);
      expect(parsed.summaries).toHaveLength(1);
    });
  });
});
