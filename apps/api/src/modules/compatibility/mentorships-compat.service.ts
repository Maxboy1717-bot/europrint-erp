/**
 * @module mentorships-compat.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 * @deprecated Legacy compatibility shim (see mentorships-compat.controller.ts). Backs the LIVE
 *   `MentorTab.tsx` card-mentor UI (T11-10) via GET/POST/DELETE `/api/mentorships` — user_id-based
 *   card↔mentor derivation (a mentor IS the card's head/employee; see MentorTab.tsx header comment,
 *   Q-40 fabrikatsiya-yo'q rationale for why no `mentors.card_id` column is used here).
 *
 *   FIX 2026-07-04 (found while verifying SB0071): every method here referenced `m.rating` and
 *   `m.is_active`, columns that DO NOT EXIST on the live `mentors` table (id/name/bio/source/
 *   achievements/experience/expertise/user_id/created_at/updated_at/deleted_at/deleted_by/card_id).
 *   Every raw SQL call therefore threw ("column m.rating does not exist"), and because the
 *   controller wraps GET calls in `unwrapOrDefault(..., [])`, the failure was silently swallowed —
 *   `/api/mentorships` GET always returned `[]` regardless of data, so `MentorTab.tsx` (mounted in
 *   OrgNodeDetail/CardDetailDialog) always rendered "no mentors" even when mentor rows existed.
 *   POST/PUT/DELETE surfaced as raw 500s (no unwrapOrDefault on those routes). Fixed by dropping
 *   the phantom columns from every SELECT/INSERT/UPDATE (Q-46 — broken code fully repaired, not
 *   left half-working). `card_id` (added by hr-card-links-2026-07-04.sql) is now surfaced read-only
 *   for future use, but the mentor-registry write paths keep the existing user_id-only contract
 *   (unchanged request/response shape for the one real consumer, MentorTab.tsx).
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';
import { safeCall, Result } from '@common/result';

@Injectable()
export class MentorshipsCompatService {

  async getMentorships(mentorId?: string, status?: string): Promise<Result<Record<string, unknown>[]>>{
    return safeCall(async () => {
    const mentorFilter = mentorId ? sql`AND m.id = ${mentorId}` : sql``;
    const r = await rawSql(sql`
      SELECT m.id, m.user_id, m.bio, m.expertise,
             m.name, m.source, m.experience, m.created_at,
             m.card_id, f.name AS card_name,
             u.username AS mentor_username
      FROM mentors m
      LEFT JOIN users u ON u.id = m.user_id
      LEFT JOIN org_departments f ON f.id = m.card_id
      WHERE m.deleted_at IS NULL ${mentorFilter}
      ORDER BY m.created_at DESC
      LIMIT 100
    `);
    // `status` (active/inactive) is accepted for API back-compat but mentors has no is_active
    // column to filter on — ignored rather than fabricated (Q-40); avoid unused-var lint noise.
    void status;
    return dbRows(r);

    });}

  async createMentorship(body: Record<string, unknown>){
    return safeCall(async () => {
    const { user_id, bio, expertise, name, source, experience } = body;
    if (!name) throw new BadRequestException('name majburiy');
    const r = await rawSql(sql`
      INSERT INTO mentors (user_id, bio, expertise, name, source, experience)
      VALUES (${user_id ?? null}, ${bio ?? null}, ${expertise ?? null},
              ${name ?? null}, ${source ?? null}, ${experience ?? null})
      RETURNING id, name, card_id, created_at
    `);
    const created = dbRows(r)[0];
    return created;

    });}

  async getMentorship(id: string){
    return safeCall(async () => {
    const r = await rawSql(sql`
      SELECT m.id, m.user_id, m.bio, m.expertise,
             m.name, m.experience, m.created_at,
             m.card_id, f.name AS card_name,
             u.username AS mentor_username
      FROM mentors m
      LEFT JOIN users u ON u.id = m.user_id
      LEFT JOIN org_departments f ON f.id = m.card_id
      WHERE m.id = ${id} AND m.deleted_at IS NULL
    `);
    const _found = dbRows(r)[0];
    if (!_found) throw new NotFoundException('Record not found');
    return _found;

    });}

  async updateMentorship(id: string, body: Record<string, unknown>){
    return safeCall(async () => {
    const { bio, expertise, name, experience } = body;
    const r = await rawSql(sql`
      UPDATE mentors
      SET bio = COALESCE(${bio ?? null}, bio),
          expertise = COALESCE(${expertise ?? null}, expertise),
          name = COALESCE(${name ?? null}, name),
          experience = COALESCE(${experience ?? null}, experience),
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, name, card_id, updated_at
    `);
    const _found = dbRows(r)[0];
    if (!_found) throw new NotFoundException('Record not found');
    return _found;

    });}

  async deleteMentorship(id: string){
    return safeCall(async () => {
    await rawSql(sql`UPDATE mentors SET deleted_at = NOW() WHERE id = ${id}`);
    return { ok: true, deleted: true };

    });}

  async getMentors(){
    return safeCall(async () => {
    const r = await rawSql(sql`
      SELECT m.id, m.user_id, m.bio, m.expertise, m.name, m.experience, m.created_at,
             m.card_id, f.name AS card_name,
             u.username AS mentor_username
      FROM mentors m
      LEFT JOIN users u ON u.id = m.user_id
      LEFT JOIN org_departments f ON f.id = m.card_id
      WHERE m.deleted_at IS NULL
      ORDER BY m.created_at DESC
      LIMIT 100
    `);
    return dbRows(r);

    });}

  async getMentor(id: string){
    return safeCall(async () => {
    const r = await rawSql(sql`
      SELECT m.id, m.user_id, m.bio, m.expertise, m.name, m.experience, m.created_at,
             m.card_id, f.name AS card_name,
             u.username AS mentor_username
      FROM mentors m
      LEFT JOIN users u ON u.id = m.user_id
      LEFT JOIN org_departments f ON f.id = m.card_id
      WHERE m.id = ${id} AND m.deleted_at IS NULL
    `);
    const _found = dbRows(r)[0];
    if (!_found) throw new NotFoundException('Record not found');
    return _found;

    });}
}
