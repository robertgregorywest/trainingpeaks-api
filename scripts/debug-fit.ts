/**
 * Download activity FIT file via rawfiledata, decompress, and parse laps.
 * Run with: npx tsx scripts/debug-fit.ts
 */
import "dotenv/config";
import { gunzipSync } from "node:zlib";
import { TrainingPeaksClient } from "../src/index.js";
import { Decoder, Stream } from "@garmin/fitsdk";

const client = new TrainingPeaksClient();
const httpClient = (client as any).httpClient;

try {
  const athleteId = await client.getAthleteId();
  const workoutId = 3567536481;

  // 1. Get device file info from /details
  const details = await httpClient.request(
    `/fitness/v6/athletes/${athleteId}/workouts/${workoutId}/details`
  );

  const fileInfos = details.workoutDeviceFileInfos;
  console.log("Device files:", JSON.stringify(fileInfos, null, 2));

  if (!fileInfos || fileInfos.length === 0) {
    console.log("No device files found");
    process.exit(0);
  }

  const fileId = fileInfos[0].fileId;
  const fileName = fileInfos[0].fileName;
  console.log(`\nDownloading fileId=${fileId} (${fileName})`);

  // 2. Download raw file data
  const buf = await httpClient.requestRaw(
    `/fitness/v6/athletes/${athleteId}/workouts/${workoutId}/rawfiledata/${fileId}`
  );
  console.log(`Raw size: ${buf.length} bytes`);

  // 3. Decompress if gzipped
  let fitBuf = buf;
  if (fileName.endsWith(".gz")) {
    fitBuf = gunzipSync(buf);
    console.log(`Decompressed: ${fitBuf.length} bytes`);
  }

  // 4. Parse FIT
  const stream = Stream.fromBuffer(fitBuf);
  const decoder = new Decoder(stream);
  console.log("isFIT:", decoder.isFIT());
  console.log("integrity:", decoder.checkIntegrity());

  const { messages } = decoder.read();
  console.log("Message keys:", Object.keys(messages));
  console.log("lapMesgs count:", messages.lapMesgs?.length ?? 0);

  if (messages.lapMesgs?.length > 0) {
    for (let i = 0; i < messages.lapMesgs.length; i++) {
      const lap = messages.lapMesgs[i];
      console.log(`\nLap ${i + 1}:`, JSON.stringify({
        avgPower: lap.avgPower,
        maxPower: lap.maxPower,
        totalElapsedTime: lap.totalElapsedTime,
        totalDistance: lap.totalDistance,
        avgHeartRate: lap.avgHeartRate,
        maxHeartRate: lap.maxHeartRate,
        avgCadence: lap.avgCadence,
      }));
    }
  }
} finally {
  await client.close();
}
