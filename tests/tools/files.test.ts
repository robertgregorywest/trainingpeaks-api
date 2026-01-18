import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { downloadFitFile, downloadAttachment } from '../../src/mcp/tools/files.js';
import { createMockClient, mockFitBuffer, type MockClient } from '../mocks/client.js';
import type { TrainingPeaksClient } from '../../src/index.js';

describe('file tools', () => {
  let mockClient: MockClient;
  let tempDir: string;

  beforeEach(() => {
    mockClient = createMockClient();
    tempDir = os.tmpdir();
  });

  afterEach(async () => {
    // Clean up any created files
    try {
      await fs.unlink(path.join(tempDir, 'workout_100.fit'));
    } catch {
      // Ignore if file doesn't exist
    }
    try {
      await fs.unlink(path.join(tempDir, 'attachment_100_1'));
    } catch {
      // Ignore if file doesn't exist
    }
  });

  describe('downloadFitFile', () => {
    it('should download and save FIT file', async () => {
      const result = await downloadFitFile(mockClient as unknown as TrainingPeaksClient, {
        workoutId: 100,
      });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.filePath).toContain('workout_100.fit');
      expect(parsed.size).toBe(mockFitBuffer.length);
      expect(mockClient.downloadFitFile).toHaveBeenCalledWith(100);

      // Verify file was created
      const fileContent = await fs.readFile(parsed.filePath);
      expect(fileContent).toEqual(mockFitBuffer);
    });
  });

  describe('downloadAttachment', () => {
    it('should download and save attachment', async () => {
      const result = await downloadAttachment(mockClient as unknown as TrainingPeaksClient, {
        workoutId: 100,
        attachmentId: 1,
      });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.filePath).toContain('attachment_100_1');
      expect(parsed.size).toBe(mockFitBuffer.length);
      expect(mockClient.downloadAttachment).toHaveBeenCalledWith(100, 1);

      // Verify file was created
      const fileContent = await fs.readFile(parsed.filePath);
      expect(fileContent).toEqual(mockFitBuffer);
    });
  });
});
