/**
 * @module drizzle-lms-misc.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable, Logger } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { execLmsLessonDelete } from '@common/database/queries-remaining';

type Row = Record<string, unknown>;
const exec = async (q: SQL | SQLWrapper): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

@Injectable()
export class LmsMiscRepository {
  private readonly logger = new Logger(LmsMiscRepository.name);

  async findAllMicroModules(): Promise<Result<object[]>> {
    try {
      const rows = await exec(sql`SELECT mm.*, c.title_uz AS course_title FROM micro_modules mm LEFT JOIN courses c ON c.id = mm.course_id WHERE mm.is_active = true ORDER BY mm.sort_order ASC, mm.created_at DESC`);
      return Ok(rows);
    } catch (error) { this.logger.error(`findAllMicroModules: ${(error as Error).message}`); return Err((error as Error).message); }
  }

  async recordMicroModuleView(id: string, userId: string): Promise<Result<Row>> {
    try {
      const r = await exec(sql`INSERT INTO micro_module_views (micro_module_id, employee_id, viewed_at) VALUES (${parseInt(id, 10)}, ${parseInt(userId, 10)}, NOW()) ON CONFLICT (micro_module_id, employee_id) DO UPDATE SET viewed_at = NOW() RETURNING *`);
      return Ok((r[0] ?? { micro_module_id: id, employee_id: userId }) as Row);
    } catch (error) { this.logger.error(`recordMicroModuleView: ${(error as Error).message}`); return Err((error as Error).message); }
  }

  async findLmsKnowledge(query?: string): Promise<Result<object[]>> {
    try {
      const rows = query
        ? await exec(sql`SELECT * FROM lms_knowledge WHERE title ILIKE ${'%' + query + '%'} OR content ILIKE ${'%' + query + '%'} ORDER BY created_at DESC LIMIT 50`)
        : await exec(sql`SELECT * FROM lms_knowledge ORDER BY created_at DESC LIMIT 50`);
      return Ok(rows);
    } catch (error) { this.logger.error(`findLmsKnowledge: ${(error as Error).message}`); return Err((error as Error).message); }
  }

  async saveVideoProgress(data: Row): Promise<Result<Row>> {
    try {
      const r = await exec(sql`INSERT INTO video_progress (employee_id, lesson_id, progress_seconds, total_seconds, completed, updated_at) VALUES (${parseInt(String(data.employeeId ?? data.userId ?? 0), 10)}, ${parseInt(String(data.lessonId ?? 0), 10)}, ${parseInt(String(data.progressSeconds ?? 0), 10)}, ${parseInt(String(data.totalSeconds ?? 0), 10)}, ${Boolean(data.completed)}, NOW()) ON CONFLICT (employee_id, lesson_id) DO UPDATE SET progress_seconds = EXCLUDED.progress_seconds, completed = EXCLUDED.completed, updated_at = NOW() RETURNING *`);
      return Ok((r[0] ?? data) as Row);
    } catch (error) { this.logger.error(`saveVideoProgress: ${(error as Error).message}`); return Err((error as Error).message); }
  }

  async findAchievements(userId?: string): Promise<Result<object[]>> {
    try {
      const rows = userId
        ? await exec(sql`SELECT a.*, ua.earned_at, a.title, a.description, a.badge_url FROM lms_achievements a LEFT JOIN lms_user_achievements ua ON ua.achievement_id = a.id AND ua.employee_id = ${parseInt(userId, 10)} ORDER BY a.created_at DESC`)
        : await exec(sql`SELECT a.*, a.title, a.description, a.badge_url FROM lms_achievements a ORDER BY a.created_at DESC`);
      return Ok(rows);
    } catch (error) { this.logger.error(`findAchievements: ${(error as Error).message}`); return Err((error as Error).message); }
  }

  async findMentors(specialization?: string): Promise<Result<object[]>> {
    try {
      const rows = specialization
        ? await exec(sql`SELECT m.*, COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,'') AS full_name FROM mentors m LEFT JOIN employees e ON e.id = m.user_id WHERE m.is_active = true AND m.specialization = ${specialization} ORDER BY m.rating DESC NULLS LAST`)
        : await exec(sql`SELECT m.*, COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,'') AS full_name FROM mentors m LEFT JOIN employees e ON e.id = m.user_id WHERE m.is_active = true ORDER BY m.rating DESC NULLS LAST`);
      return Ok(rows);
    } catch (error) { this.logger.error(`findMentors: ${(error as Error).message}`); return Err((error as Error).message); }
  }

  async findAllLessons(courseId?: string): Promise<Result<object[]>> {
    try {
      const rows = courseId
        ? await exec(sql`SELECT l.*, c.title_uz AS course_title FROM lessons l LEFT JOIN courses c ON c.id = l.course_id WHERE l.course_id = ${parseInt(courseId, 10)} ORDER BY l.sort_order ASC, l.created_at DESC`)
        : await exec(sql`SELECT l.*, c.title_uz AS course_title FROM lessons l LEFT JOIN courses c ON c.id = l.course_id ORDER BY l.sort_order ASC, l.created_at DESC`);
      return Ok(rows);
    } catch (error) { this.logger.error(`findAllLessons: ${(error as Error).message}`); return Err((error as Error).message); }
  }

  async findLessonById(id: string): Promise<Result<Row>> {
    try {
      const r = await exec(sql`SELECT l.*, c.title_uz AS course_title FROM lessons l LEFT JOIN courses c ON c.id = l.course_id WHERE l.id = ${parseInt(id, 10)} LIMIT 1`);
      if (!r.length) return Err('Dars topilmadi');
      return Ok(r[0] as Row);
    } catch (error) { this.logger.error(`findLessonById: ${(error as Error).message}`); return Err((error as Error).message); }
  }

  async saveLessonRecord(data: Row): Promise<Result<Row>> {
    try {
      const r = await exec(sql`INSERT INTO lessons (title, course_id, content, video_url, duration_minutes, sort_order, is_active, created_at) VALUES (${String(data.title)}, ${data.courseId ? parseInt(String(data.courseId), 10) : null}, ${data.content ? String(data.content) : null}, ${data.videoUrl ? String(data.videoUrl) : null}, ${data.durationMinutes ? parseInt(String(data.durationMinutes), 10) : null}, ${data.sortOrder ? parseInt(String(data.sortOrder), 10) : 0}, true, NOW()) RETURNING *`);
      return Ok((r[0] ?? data) as Row);
    } catch (error) { this.logger.error(`saveLessonRecord: ${(error as Error).message}`); return Err((error as Error).message); }
  }

  async updateLessonRecord(id: string, data: Row): Promise<Result<Row>> {
    try {
      const r = await exec(sql`UPDATE lessons SET title = COALESCE(${data.title ? String(data.title) : null}, title), content = COALESCE(${data.content ? String(data.content) : null}, content), video_url = COALESCE(${data.videoUrl ? String(data.videoUrl) : null}, video_url), updated_at = NOW() WHERE id = ${parseInt(id, 10)} RETURNING *`);
      if (!r.length) return Err('Dars topilmadi');
      return Ok(r[0] as Row);
    } catch (error) { this.logger.error(`updateLessonRecord: ${(error as Error).message}`); return Err((error as Error).message); }
  }

  async deleteLessonRecord(id: string): Promise<Result<void>> {
    try {
      await execLmsLessonDelete(parseInt(id, 10));
      return Ok();
    } catch (error) { this.logger.error(`deleteLessonRecord: ${(error as Error).message}`); return Err((error as Error).message); }
  }

  async findModuleById(id: string): Promise<Result<Row>> {
    try {
      const r = await exec(sql`SELECT m.*, c.title_uz AS course_title FROM lms_modules m LEFT JOIN courses c ON c.id = m.course_id WHERE m.id = ${parseInt(id, 10)} LIMIT 1`);
      if (!r.length) return Err('Modul topilmadi');
      return Ok(r[0] as Row);
    } catch (error) { this.logger.error(`findModuleById: ${(error as Error).message}`); return Err((error as Error).message); }
  }

  async saveModule(data: Row): Promise<Result<Row>> {
    try {
      const r = await exec(sql`INSERT INTO lms_modules (title, course_id, description, sort_order, is_active, created_at) VALUES (${String(data.title)}, ${data.courseId ? parseInt(String(data.courseId), 10) : null}, ${data.description ? String(data.description) : null}, ${data.sortOrder ? parseInt(String(data.sortOrder), 10) : 0}, true, NOW()) RETURNING *`);
      return Ok((r[0] ?? data) as Row);
    } catch (error) { this.logger.error(`saveModule: ${(error as Error).message}`); return Err((error as Error).message); }
  }
}
