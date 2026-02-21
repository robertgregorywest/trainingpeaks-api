import { describe, it, expect, beforeEach, vi } from 'vitest';
import { computeBestPower, getBestPower } from '../../src/mcp/tools/power.js';
import { createMockClient, mockWorkoutSummary, type MockClient } from '../mocks/client.js';
import type { TrainingPeaksClient } from '../../src/index.js';

const mockRead = vi.fn();
const mockIsFIT = vi.fn();

// Mock @garmin/fitsdk
vi.mock('@garmin/fitsdk', () => ({
  Decoder: vi.fn().mockImplementation(() => ({
    isFIT: mockIsFIT,
    read: mockRead,
  })),
  Stream: {
    fromBuffer: vi.fn().mockReturnValue({}),
  },
}));

describe('power tools', () => {
  describe('computeBestPower', () => {
    it('should find the best average power and start index', () => {
      const powerStream = [100, 100, 100, 200, 300, 400, 300, 200, 100, 100];
      const result = computeBestPower(powerStream, 3);

      // Best 3s window: [300, 400, 300] starting at index 4 → avg 333
      expect(result).toEqual({ bestPower: 333, startIndex: 4 });
    });

    it('should return null when duration exceeds array length', () => {
      const powerStream = [100, 200, 300];
      const result = computeBestPower(powerStream, 5);

      expect(result).toBeNull();
    });

    it('should return 0 for all-zero power stream', () => {
      const powerStream = [0, 0, 0, 0, 0];
      const result = computeBestPower(powerStream, 3);

      expect(result).toEqual({ bestPower: 0, startIndex: 0 });
    });

    it('should handle single-element duration', () => {
      const powerStream = [100, 200, 300, 150];
      const result = computeBestPower(powerStream, 1);

      expect(result).toEqual({ bestPower: 300, startIndex: 2 });
    });

    it('should handle duration equal to array length', () => {
      const powerStream = [100, 200, 300];
      const result = computeBestPower(powerStream, 3);

      expect(result).toEqual({ bestPower: 200, startIndex: 0 });
    });
  });

  describe('getBestPower', () => {
    let mockClient: MockClient;

    beforeEach(() => {
      mockClient = createMockClient();
      mockIsFIT.mockReturnValue(true);
    });

    function setupFitMock(recordMesgs: Record<string, unknown>[] | undefined) {
      mockRead.mockReturnValue({ messages: { recordMesgs } });
    }

    it('should return best power results', async () => {
      const records = Array.from({ length: 60 }, (_, i) => ({
        power: i < 30 ? 200 : 300,
      }));
      setupFitMock(records);

      const result = await getBestPower(mockClient as unknown as TrainingPeaksClient, {
        workoutId: 100,
        durations: [10, 30],
      });
      const parsed = JSON.parse(result);

      expect(parsed.workoutId).toBe(100);
      expect(parsed.workoutDate).toBe(mockWorkoutSummary.workoutDay);
      expect(parsed.workoutTitle).toBe(mockWorkoutSummary.title);
      expect(parsed.totalRecords).toBe(60);
      expect(parsed.results).toHaveLength(2);
      expect(parsed.results[0].durationSeconds).toBe(10);
      expect(parsed.results[0].bestPowerWatts).toBe(300);
      expect(parsed.results[1].durationSeconds).toBe(30);
    });

    it('should handle duration exceeding recording length', async () => {
      const records = Array.from({ length: 10 }, () => ({ power: 200 }));
      setupFitMock(records);

      const result = await getBestPower(mockClient as unknown as TrainingPeaksClient, {
        workoutId: 100,
        durations: [20],
      });
      const parsed = JSON.parse(result);

      expect(parsed.results[0]).toEqual({
        durationSeconds: 20,
        bestPowerWatts: null,
        error: 'Duration exceeds recording length',
      });
    });

    it('should throw when no activity file is available', async () => {
      mockClient.downloadActivityFile.mockResolvedValue(null);

      await expect(
        getBestPower(mockClient as unknown as TrainingPeaksClient, {
          workoutId: 100,
          durations: [10],
        })
      ).rejects.toThrow('No activity file available for workout 100');
    });

    it('should throw when no power data in records', async () => {
      const records = Array.from({ length: 10 }, () => ({ heartRate: 140 }));
      setupFitMock(records);

      await expect(
        getBestPower(mockClient as unknown as TrainingPeaksClient, {
          workoutId: 100,
          durations: [5],
        })
      ).rejects.toThrow('No power data found in workout records');
    });

    it('should throw when no record messages in FIT file', async () => {
      setupFitMock(undefined);

      await expect(
        getBestPower(mockClient as unknown as TrainingPeaksClient, {
          workoutId: 100,
          durations: [5],
        })
      ).rejects.toThrow('No record data found in FIT file');
    });

    it('should sort results by duration ascending', async () => {
      const records = Array.from({ length: 60 }, () => ({ power: 250 }));
      setupFitMock(records);

      const result = await getBestPower(mockClient as unknown as TrainingPeaksClient, {
        workoutId: 100,
        durations: [30, 5, 15],
      });
      const parsed = JSON.parse(result);

      expect(parsed.results.map((r: { durationSeconds: number }) => r.durationSeconds)).toEqual([
        5, 15, 30,
      ]);
    });
  });
});
