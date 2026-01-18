import { describe, it, expect, beforeEach } from 'vitest';
import { getUser, getAthleteId } from '../../src/mcp/tools/user.js';
import { createMockClient, mockUser, type MockClient } from '../mocks/client.js';
import type { TrainingPeaksClient } from '../../src/index.js';

describe('user tools', () => {
  let mockClient: MockClient;

  beforeEach(() => {
    mockClient = createMockClient();
  });

  describe('getUser', () => {
    it('should return user data as JSON', async () => {
      const result = await getUser(mockClient as unknown as TrainingPeaksClient);
      const parsed = JSON.parse(result);

      expect(parsed).toEqual(mockUser);
      expect(mockClient.getUser).toHaveBeenCalledOnce();
    });
  });

  describe('getAthleteId', () => {
    it('should return athlete ID as JSON', async () => {
      const result = await getAthleteId(mockClient as unknown as TrainingPeaksClient);
      const parsed = JSON.parse(result);

      expect(parsed).toEqual({ athleteId: 12345 });
      expect(mockClient.getAthleteId).toHaveBeenCalledOnce();
    });
  });
});
