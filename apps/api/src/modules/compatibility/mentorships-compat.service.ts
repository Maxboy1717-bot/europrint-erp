import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { db,
  rawSql} from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';
import { safeCall, Result } from '@common/result';

@Injectable()
export class MentorshipsCompatService {

  async getMentorships(mentorId?: string, status?: string): Promise<Result<Record<string, unknown>[]>>{
    return safeCall(async () => {
    const mentorFilter = mentorId ? sql`AND m.id = ${mentorId}` : sql``;
    const activeFilter = status === 'active'
      ? sql`AND m.is_active = true`
      : status === 'inactive' ? sql`AND m.is_active = false` : sql``;
    const r = await rawSql(sql`
      SELECT m.id, m.user_id, m.bio, m.expertise, m.rating,
             m.is_active, m.name, m.source, m.experience, m.created_at,
             u.username AS mentor_username
      FROM mentors m
      LEFT JOIN users u ON u.id = m.user_id
      WHERE m.deleted_at IS NULL ${mentorFilter} ${activeFilter}
      ORDER BY m.rating DESC, m.created_at DESC
      LIMIT 100
    `);
    return dbRows(r);
  
    });}

  async createMentorship(body: Record<string, unknown>){
    return safeCall(async () => {
    const { user_id, bio, expertise, name, source, experience } = body;
    if (!name) throw new BadRequestException('name majburiy');
    const r = await rawSql(sql`
      INSERT INTO mentors (user_id, bio, expertise, name, source, experience, is_active)
      VALUES (${user_id ?? null}, ${bio ?? null}, ${expertise ?? null},
              ${name ?? null}, ${source ?? null}, ${experience ?? null}, true)
      RETURNING id, name, is_active, created_at
    `);
    const created = dbRows(r)[0];
    return created;
  
    });}

  async getMentorship(id: string){
    return safeCall(async () => {
    const r = await rawSql(sql`
      SELECT m.id, m.user_id, m.bio, m.expertise, m.rating,
             m.is_active, m.name, m.experience, m.created_at,
             u.username AS mentor_username
      FROM mentors m
      LEFT JOIN users u ON u.id = m.user_id
      WHERE m.id = ${id} AND m.deleted_at IS NULL
    `);
    const _found = dbRows(r)[0];
    if (!_found) throw new NotFoundException('Record not found');
    return _found;
  
    });}

  async updateMentorship(id: string, body: Record<string, unknown>){
    return safeCall(async () => {
    const { bio, expertise, name, is_active, experience } = body;
    const r = await rawSql(sql`
      UPDATE mentors
      SET bio = COALESCE(${bio ?? null}, bio),
          expertise = COALESCE(${expertise ?? null}, expertise),
          name = COALESCE(${name ?? null}, name),
          is_active = COALESCE(${is_active ?? null}, is_active),
          experience = COALESCE(${experience ?? null}, experience),
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, name, is_active, updated_at
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
      SELECT m.id, m.user_id, m.bio, m.expertise, m.rating,
             m.is_active, m.name, m.experience, m.created_at,
             u.username AS mentor_username
      FROM mentors m
      LEFT JOIN users u ON u.id = m.user_id
      WHERE m.deleted_at IS NULL AND m.is_active = true
      ORDER BY m.rating DESC, m.created_at DESC
      LIMIT 100
    `);
    return dbRows(r);
  
    });}

  async getMentor(id: string){
    return safeCall(async () => {
    const r = await rawSql(sql`
      SELECT m.id, m.user_id, m.bio, m.expertise, m.rating,
             m.is_active, m.name, m.experience, m.created_at,
             u.username AS mentor_username
      FROM mentors m
      LEFT JOIN users u ON u.id = m.user_id
      WHERE m.id = ${id} AND m.deleted_at IS NULL
    `);
    const _found = dbRows(r)[0];
    if (!_found) throw new NotFoundException('Record not found');
    return _found;
  
    });}
}
