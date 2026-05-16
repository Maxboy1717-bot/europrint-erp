/**
 * @module i-iot-camera-events.repo
 * @description Domain repository interface for camera events, safety violations,
 *   and quality defects. Concrete implementation lives at
 *   `infrastructure/repositories/iot-camera-events.repository.ts`.
 * @layer Domain (IoT)
 */

import type { Result } from '@common/result';

type Row = Record<string, unknown>;

export interface IIotCameraEventsRepo {
  listCameraEvents(cameraId?: string, type?: string, lim?: number): Promise<Result<Row[]>>;
  createCameraEvent(
    camera_id: number,
    event_type: string,
    description: string | null,
    severity: string,
    zone_id: number | null,
  ): Promise<Result<Row>>;
  updateCameraEvent(
    id: number,
    status: string | null,
    resolution_note: string | null,
  ): Promise<Result<Row>>;
  listSafetyViolations(cameraId?: string, status?: string, lim?: number): Promise<Result<Row[]>>;
  createSafetyViolation(
    camera_id: number,
    violation_type: string,
    severity: string,
    description: string | null,
    employee_id: number | null,
  ): Promise<Result<Row>>;
  listQualityDefects(cameraId?: string, status?: string): Promise<Result<Row[]>>;
  createQualityDefect(
    camera_id: number,
    defect_type: string,
    severity: string,
    description: string | null,
  ): Promise<Result<Row>>;
  updateQualityDefect(
    id: number,
    status: string | null,
    resolution: string | null,
  ): Promise<Result<Row>>;
}

export const IOT_CAMERA_EVENTS_REPO = Symbol('IOT_CAMERA_EVENTS_REPO');
