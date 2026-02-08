import { gunzipSync } from 'node:zlib';
import type { HttpClient } from '../client.js';
import type { UserApi } from './user.js';

interface DeviceFileInfo {
  fileId: string;
  fileName: string;
}

interface WorkoutDetailsResponse {
  workoutDeviceFileInfos?: DeviceFileInfo[];
}

export class FilesApi {
  private client: HttpClient;
  private userApi: UserApi;

  constructor(client: HttpClient, userApi: UserApi) {
    this.client = client;
    this.userApi = userApi;
  }

  async downloadActivityFile(workoutId: number): Promise<Buffer | null> {
    const athleteId = await this.userApi.getAthleteId();
    const detailsEndpoint = `/fitness/v6/athletes/${athleteId}/workouts/${workoutId}/details`;
    const details = await this.client.request<WorkoutDetailsResponse>(detailsEndpoint);

    const fileInfo = details.workoutDeviceFileInfos?.[0];
    if (!fileInfo) {
      return null;
    }

    const rawEndpoint = `/fitness/v6/athletes/${athleteId}/workouts/${workoutId}/rawfiledata/${fileInfo.fileId}`;
    const buffer = await this.client.requestRaw(rawEndpoint);

    if (fileInfo.fileName.endsWith('.gz')) {
      return Buffer.from(gunzipSync(buffer));
    }

    return buffer;
  }

  async downloadAttachment(workoutId: number, attachmentId: number): Promise<Buffer> {
    const athleteId = await this.userApi.getAthleteId();
    const endpoint = `/fitness/v6/athletes/${athleteId}/workouts/${workoutId}/attachments/${attachmentId}/raw`;
    return this.client.requestRaw(endpoint);
  }
}

export function createFilesApi(client: HttpClient, userApi: UserApi): FilesApi {
  return new FilesApi(client, userApi);
}
