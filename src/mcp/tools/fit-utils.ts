export interface FitMessages {
  fileIdMesgs?: Record<string, unknown>[];
  sessionMesgs?: Record<string, unknown>[];
  lapMesgs?: Record<string, unknown>[];
  recordMesgs?: Record<string, unknown>[];
  [key: string]: unknown;
}

export async function decodeFitBuffer(buffer: Buffer): Promise<FitMessages> {
  const { Decoder, Stream } = await import('@garmin/fitsdk');
  const stream = Stream.fromBuffer(buffer);
  const decoder = new Decoder(stream);

  if (!decoder.isFIT()) {
    throw new Error('Not a valid FIT file');
  }

  if (!decoder.checkIntegrity()) {
    throw new Error('FIT file integrity check failed');
  }

  const { messages } = decoder.read();
  return messages as FitMessages;
}
