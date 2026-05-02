import { Ok, Err, Result, safeCall } from '@common/result';
import { Injectable } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { execIotCameraDelete } from '@common/database/queries-remaining';

type Row = Record<string, unknown>;
const exec = (q: Parameters<typeof db.execute>[0]): Promise<Result<Row[]>> => safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);

@Injectable()
export class IotCameraRepository {
  async listCameras(status?: string, zone?: string): Promise<Result<Row[]>>  {
  try {  
      return status && zone
        ? exec(sql`SELECT c.*, cz.name AS zone_name FROM cameras c LEFT JOIN camera_zones cz ON cz.id = c.zone_id WHERE c.status = ${status} AND cz.name ILIKE ${'%' + zone + '%'} ORDER BY c.name ASC`)
        : status
        ? exec(sql`SELECT c.*, cz.name AS zone_name FROM cameras c LEFT JOIN camera_zones cz ON cz.id = c.zone_id WHERE c.status = ${status} ORDER BY c.name ASC`)
        : zone
        ? exec(sql`SELECT c.*, cz.name AS zone_name FROM cameras c LEFT JOIN camera_zones cz ON cz.id = c.zone_id WHERE cz.name ILIKE ${'%' + zone + '%'} ORDER BY c.name ASC`)
        : exec(sql`SELECT c.*, cz.name AS zone_name FROM cameras c LEFT JOIN camera_zones cz ON cz.id = c.zone_id ORDER BY c.name ASC`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getCamera(id: number): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT c.*, cz.name AS zone_name FROM cameras c LEFT JOIN camera_zones cz ON cz.id = c.zone_id WHERE c.id = ${id}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async createCamera(name: string, location: string | null, ip_address: string | null, rtsp_url: string | null, zone_id: number | null, type: string): Promise<Result<Row>>  {
  try {  
      const r = await exec(sql`INSERT INTO cameras (name, location, ip_address, rtsp_url, zone_id, type, status) VALUES (${name}, ${location}, ${ip_address}, ${rtsp_url}, ${zone_id}, ${type}, 'active') RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async updateCamera(id: number, name: string | null, location: string | null, ip_address: string | null, rtsp_url: string | null, status: string | null, zone_id: number | null): Promise<Result<Row>>  {
  try {  
      const r = await exec(sql`UPDATE cameras SET name = COALESCE(${name}, name), location = COALESCE(${location}, location), ip_address = COALESCE(${ip_address}, ip_address), rtsp_url = COALESCE(${rtsp_url}, rtsp_url), status = COALESCE(${status}, status), zone_id = COALESCE(${zone_id}::int, zone_id), updated_at = NOW() WHERE id = ${id} RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async deleteCamera(id: number): Promise<Result<void>>  {
  try {  
      await execIotCameraDelete(id);  return Ok();  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getCameraZones(cameraId: number): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT * FROM camera_zones WHERE camera_id = ${cameraId} ORDER BY name`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async createCameraZone(name: string, camera_id: number, coordinates: unknown, zone_type: string): Promise<Result<Row>>  {
  try {  
      const r = await exec(sql`INSERT INTO camera_zones (name, camera_id, coordinates, zone_type) VALUES (${name}, ${camera_id}, ${JSON.stringify(coordinates ?? {})}::jsonb, ${zone_type ?? 'monitoring'}) RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }
}
