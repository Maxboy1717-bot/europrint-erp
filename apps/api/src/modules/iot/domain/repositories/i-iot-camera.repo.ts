/**
 * @module i-iot-camera.repo
 * @description Domain repository interface for IoT cameras / zones CRUD.
 *   Concrete implementation lives at
 *   `infrastructure/repositories/iot-camera.repository.ts`.
 * @layer Domain (IoT)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

export interface IIotCameraRepo {
  listCameras(status?: string, zone?: string): Promise<Result<Row[]>>;
  getCamera(id: number): Promise<Result<Row[]>>;
  createCamera(
    name: string,
    location: string | null,
    ip_address: string | null,
    rtsp_url: string | null,
    zone_id: number | null,
    type: string,
  ): Promise<Result<Row>>;
  updateCamera(
    id: number,
    name: string | null,
    location: string | null,
    ip_address: string | null,
    rtsp_url: string | null,
    status: string | null,
    zone_id: number | null,
  ): Promise<Result<Row>>;
  deleteCamera(id: number): Promise<Result<void>>;
  getCameraZones(cameraId: number): Promise<Result<Row[]>>;
  createCameraZone(
    name: string,
    camera_id: number,
    coordinates: unknown,
    zone_type: string,
  ): Promise<Result<Row>>;
}

export const IOT_CAMERA_REPO = Symbol('IOT_CAMERA_REPO');
