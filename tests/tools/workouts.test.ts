import { describe, it, expect, beforeEach } from 'vitest';
import { getWorkouts, getWorkout, getWorkoutDetails } from '../../src/mcp/tools/workouts.js';
import {
  createMockClient,
  mockWorkoutSummary,
  mockWorkoutDetail,
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
});
