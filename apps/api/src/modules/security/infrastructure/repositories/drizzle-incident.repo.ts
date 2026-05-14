/**
 * @module drizzle-incident.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { and, eq, desc, ne , sql } from 'drizzle-orm';
import { Result, Err , Ok } from '@common/types/result.type';
import { IIncidentRepo } from '../../domain/repositories/i-incident.repo';
import { SecurityIncident } from '../../domain/aggregates/security-incident.aggregate';
import { db, security_incidents } from '@shared/db';

@Injectable()
export class DrizzleIncidentRepository implements IIncidentRepo {
  private readonly logger = new Logger(DrizzleIncidentRepository.name);

  constructor() {}

  async findById(id: string): Promise<Result<SecurityIncident | null>> {
    return db
      .select()
      .from(security_incidents)
      .where(sql`${security_incidents.id} = ${id}`)
      .execute()
      .then((rows) => {
        if (rows.length === 0) {
          return Ok(null);
        }
        return Ok(this.toDomain(rows[0]));
      })
      .catch((error) => {
        this.logger.error('Error finding incident by id');
        return Err((error as Error).message);
      });
  }

  async findAll(filters: {
    severity?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<Result<{ items: SecurityIncident[]; total: number }>> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    return Promise.all([
      db
        .select()
        .from(security_incidents)
        .where(
          and(
            filters.severity ? sql`${security_incidents.severity} = ${filters.severity}` : undefined,
            filters.status ? sql`${security_incidents.status} = ${filters.status}` : undefined))
        .orderBy(desc(security_incidents.created_at))
        .limit(limit)
        .offset(offset)
        .execute()
        .catch((error) => {
          this.logger.error('Error fetching incidents');
          throw error;
        }),
      db
        .select()
        .from(security_incidents)
        .where(
          and(
            filters.severity ? sql`${security_incidents.severity} = ${filters.severity}` : undefined,
            filters.status ? sql`${security_incidents.status} = ${filters.status}` : undefined))
        .execute()
        .then((rows) => rows.length)
        .catch((error) => {
          this.logger.error('Error counting incidents');
          throw error;
        }),
    ])
      .then(([items, total]) => (Ok({ items: (Array.isArray(items) ? items : []).map((row) => this.toDomain(row)), total })))
      .catch((error) => {
        return Err((error as Error).message);
      });
  }

  async findOpen(): Promise<Result<SecurityIncident[]>> {
    return db
      .select()
      .from(security_incidents)
      .where(ne(security_incidents.status, 'closed'))
      .execute()
      .then((rows) => (Ok((Array.isArray(rows) ? rows : []).map((row) => this.toDomain(row)),)))
      .catch((error) => {
        this.logger.error('Error finding open incidents');
        return Err((error as Error).message);
      });
  }

  async save(incident: SecurityIncident): Promise<Result<SecurityIncident>> {
    return db
      .insert(security_incidents)
      .values({
        id: incident.id,
        title: incident.title,
        description: incident.description,
        severity: incident.severity,
        status: incident.status,
        reporter_id: incident.reporterId,
        assigned_to: incident.assignedTo,
        resolution_notes: incident.resolutionNotes,
        resolved_at: incident.resolvedAt,
        created_at: incident.createdAt,
        updated_at: incident.updatedAt,
      } as never)
      .returning()
      .execute()
      .then((rows) => {
        if (rows.length === 0) {
          return Err('Failed to save incident');
        }
        return Ok(this.toDomain(rows[0]));
      })
      .catch((error) => {
        this.logger.error('Error saving incident');
        return Err((error as Error).message);
      });
  }

  async update(id: string, data: Partial<SecurityIncident>): Promise<Result<SecurityIncident>> {
    const updateData: Record<string, unknown> = {};

    if (data.status) updateData.status = data.status;
    if (data.severity) updateData.severity = data.severity;
    if (data.assignedTo) updateData.assigned_to = data.assignedTo;
    if (data.resolutionNotes) updateData.resolution_notes = data.resolutionNotes;
    if (data.resolvedAt !== undefined) updateData.resolved_at = data.resolvedAt;

    updateData.updated_at = _time.now();

    return db
      .update(security_incidents)
      .set(updateData)
      .where(sql`${security_incidents.id} = ${id}`)
      .returning()
      .execute()
      .then((rows) => {
        if (rows.length === 0) {
          return Err('Incident not found');
        }
        return Ok(this.toDomain(rows[0]));
      })
      .catch((error) => {
        this.logger.error('Error updating incident');
        return Err((error as Error).message);
      });
  }

  private toDomain(row: Record<string, unknown>): SecurityIncident {
    const incident = new SecurityIncident(String(row.title ?? ''), String(row.description ?? ''), String(row.severity));

    incident.id = String(row.id ?? '');
    incident.status = row.status as typeof incident.status;
    incident.reporterId = String(row.reporter_id ?? '');
    incident.assignedTo = String(row.assigned_to ?? '');
    incident.resolutionNotes = String(row.resolution_notes ?? '');
    incident.resolvedAt = row.resolved_at ? new Date(String(row.resolved_at)) : null;
    incident.createdAt = row.created_at ? new Date(String(row.created_at)) : _time.now();
    incident.updatedAt = row.updated_at ? new Date(String(row.updated_at)) : _time.now();

    return incident;
  }
}
