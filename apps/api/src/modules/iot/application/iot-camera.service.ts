import { Injectable } from '@nestjs/common';
import { safeCall, Result, AppError } from '@common/result';
import { IotCameraRepository } from './iot-camera.repository';

@Injectable()
export class IotCameraService {
  constructor(private readonly repo: IotCameraRepository) {}

  async listCameras(status?: string, zone?: string): Promise<Result<object, AppError>> {
    return this.repo.listCameras(status, zone);
  }

  async getCamera(id: number) {
    return this.repo.getCamera(id);
  }

  async createCamera(name: string, location: string | null, ip_address: string | null, rtsp_url: string | null, zone_id: number | null, type: string) {
    return this.repo.createCamera(name, location, ip_address, rtsp_url, zone_id, type);
  }

  async updateCamera(id: number, name: string | null, location: string | null, ip_address: string | null, rtsp_url: string | null, status: string | null, zone_id: number | null) {
    return this.repo.updateCamera(id, name, location, ip_address, rtsp_url, status, zone_id);
  }

  async deleteCamera(id: number) {
    return this.repo.deleteCamera(id);
  }

  async getCameraZones(cameraId: number) {
    return this.repo.getCameraZones(cameraId);
  }

  async createCameraZone(name: string, camera_id: number, coordinates: unknown, zone_type: string) {
    return this.repo.createCameraZone(name, camera_id, coordinates, zone_type);
  }
}
