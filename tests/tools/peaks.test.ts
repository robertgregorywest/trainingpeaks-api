import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getPeaks,
  getAllPeaks,
  getWorkoutPeaks,
  getPowerPeaks,
  getRunningPeaks,
} from '../../src/mcp/tools/peaks.js';
import {
  createMockClient,
  mockPeaksResponse,
  mockWorkoutPeaks,
  mockPeakData,
  type MockClient,
} from '../mocks/client.js';
import type { TrainingPeaksClient } from '../../src/index.js';

describe('peaks tools', () => {
  let mockClient: MockClient;

  beforeEach(() => {
    mockClient = createMockClient();
  });

  describe('getPeaks', () => {
    it('should return peaks as JSON', async () => {
      const result = await getPeaks(mockClient as unknown as TrainingPeaksClient, {
        sport: 'Bike',
        type: 'power5min',
      });
      const parsed = JSON.parse(result);

      expect(parsed).toEqual(mockPeaksResponse);
      expect(mockClient.getPeaks).toHaveBeenCalledWith('Bike', 'power5min', {
        startDate: undefined,
        endDate: undefined,
        limit: undefined,
      });
    });

    it('should pass optional filters', async () => {
      await getPeaks(mockClient as unknown as TrainingPeaksClient, {
        sport: 'Run',
        type: 'speed5K',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        limit: 10,
      });

      expect(mockClient.getPeaks).toHaveBeenCalledWith('Run', 'speed5K', {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        limit: 10,
      });
    });
  });

  describe('getAllPeaks', () => {
    it('should return all peaks as JSON', async () => {
      const result = await getAllPeaks(mockClient as unknown as TrainingPeaksClient, {
        sport: 'Bike',
      });
      const parsed = JSON.parse(result);

      expect(parsed).toEqual(mockPeaksResponse);
      expect(mockClient.getAllPeaks).toHaveBeenCalledWith('Bike', {
        startDate: undefined,
        endDate: undefined,
        limit: undefined,
      });
    });
  });

  describe('getWorkoutPeaks', () => {
    it('should return workout peaks as JSON', async () => {
      const result = await getWorkoutPeaks(mockClient as unknown as TrainingPeaksClient, {
        workoutId: 100,
      });
      const parsed = JSON.parse(result);

      expect(parsed).toEqual(mockWorkoutPeaks);
      expect(mockClient.getWorkoutPeaks).toHaveBeenCalledWith(100);
    });
  });

  describe('getPowerPeaks', () => {
    it('should return power peaks as JSON', async () => {
      const result = await getPowerPeaks(mockClient as unknown as TrainingPeaksClient, {});
      const parsed = JSON.parse(result);

      expect(parsed).toEqual(mockPeakData);
      expect(mockClient.getPowerPeaks).toHaveBeenCalledWith({
        startDate: undefined,
        endDate: undefined,
        limit: undefined,
      });
    });
  });

  describe('getRunningPeaks', () => {
    it('should return running peaks as JSON', async () => {
      const result = await getRunningPeaks(mockClient as unknown as TrainingPeaksClient, {});
      const parsed = JSON.parse(result);

      expect(parsed).toEqual(mockPeakData);
      expect(mockClient.getRunningPeaks).toHaveBeenCalledWith({
        startDate: undefined,
        endDate: undefined,
        limit: undefined,
      });
    });
  });

  describe('error propagation', () => {
    it('should propagate errors from getPeaks', async () => {
      mockClient.getPeaks.mockRejectedValueOnce(new Error('API error'));
      await expect(
        getPeaks(mockClient as unknown as TrainingPeaksClient, {
          sport: 'Bike',
          type: 'power5min',
        })
      ).rejects.toThrow('API error');
    });

    it('should propagate errors from getWorkoutPeaks', async () => {
      mockClient.getWorkoutPeaks.mockRejectedValueOnce(new Error('Not found'));
      await expect(
        getWorkoutPeaks(mockClient as unknown as TrainingPeaksClient, { workoutId: 999 })
      ).rejects.toThrow('Not found');
    });
  });
});
