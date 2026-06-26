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
      // video_progress has no employee_id column (canonical = user_id -> 42703) and no unique index on
      // (user_id, lesson_id) for ON CONFLICT (42P10). Upsert manually: UPDATE the existing (user,lesson)
      // row, else INSERT — no DDL needed.
      const uid = parseInt(String(data.employeeId ?? data.userId ?? 0), 10);
      const lid = parseInt(String(data.lessonId ?? 0), 10);
      const ps = parseInt(String(data.progressSeconds ?? 0), 10);
      const ts = parseInt(String(data.totalSeconds ?? 0), 10);
      const done = Boolean(data.completed);
      // Real video_progress cols: "current_time" (reserved word), duration, completed, last_watched_at
      // (no progress_seconds/total_seconds/updated_at). Map progress->current_time, total->duration.
      const upd = await exec(sql`UPDATE video_progress SET "current_time" = ${ps}, duration = ${ts}, completed = ${done}, last_watched_at = NOW() WHERE user_id = ${uid} AND lesson_id = ${lid} RETURNING *`);
      if (Array.isArray(upd) && upd.length > 0) return Ok(upd[0] as Row);
      const r = await exec(sql`INSERT INTO video_progress (user_id, lesson_id, "current_time", duration, completed, last_watched_at) VALUES (${uid}, ${lid}, ${ps}, ${ts}, ${done}, NOW()) RETURNING *`);
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
      // lms_modules is a VIEW over `modules` whose NOT NULL col is "order" (reserved word) — the insert
      // wrote only sort_order and omitted "order" -> 23502. Supply both with the same value.
      const so = data.sortOrder ? parseInt(String(data.sortOrder), 10) : 0;
      const r = await exec(sql`INSERT INTO lms_modules (title, course_id, description, sort_order, "order", created_at) VALUES (${String(data.title)}, ${data.courseId ? parseInt(String(data.courseId), 10) : null}, ${data.description ? String(data.description) : null}, ${so}, ${so}, NOW()) RETURNING *`);
      return Ok((r[0] ?? data) as Row);
    } catch (error) { this.logger.error(`saveModule: ${(error as Error).message}`); return Err((error as Error).message); }
  }

  // Video progress for the current user (video_progress.user_id is INTEGER — matches the auth id).
  // NOTE: the writer saveVideoProgress targets employee_id/progress_seconds which DON'T exist on this
  // table (a separate broken-writer drift); this read uses the real user_id/current_time columns.
  async findVideoProgress(userId: string): Promise<Result<object[]>> {
    try {
      const rows = await exec(sql`SELECT * FROM video_progress WHERE user_id = ${parseInt(userId, 10)} ORDER BY last_watched_at DESC NULLS LAST, id DESC`);
      return Ok(rows);
    } catch (error) { this.logger.error(`findVideoProgress: ${(error as Error).message}`); return Err((error as Error).message); }
  }

  // All enrollment progress (course completion %) for GET /progress.
  async findAllProgress(): Promise<Result<object[]>> {
    try {
      const rows = await exec(sql`SELECT e.*, c.title_uz AS course_title FROM lms_enrollments e LEFT JOIN courses c ON c.id = e.course_id ORDER BY e.updated_at DESC NULLS LAST, e.id DESC LIMIT 200`);
      return Ok(rows);
    } catch (error) { this.logger.error(`findAllProgress: ${(error as Error).message}`); return Err((error as Error).message); }
  }

  // One user's enrollment progress for GET /progress/user/:id. Filter by employee_id (integer);
  // lms_enrollments.user_id is UUID (not the integer auth id), so it is intentionally NOT used here.
  async findProgressByUser(userId: string): Promise<Result<object[]>> {
    try {
      const uid = parseInt(userId, 10);
      const rows = await exec(sql`SELECT e.*, c.title_uz AS course_title FROM lms_enrollments e LEFT JOIN courses c ON c.id = e.course_id WHERE e.employee_id = ${uid} ORDER BY e.updated_at DESC NULLS LAST, e.id DESC`);
      return Ok(rows);
    } catch (error) { this.logger.error(`findProgressByUser: ${(error as Error).message}`); return Err((error as Error).message); }
  }

  // All LMS modules (optional course filter) for GET /modules — mirrors findModuleById's lms_modules JOIN.
  async findAllModules(courseId?: string): Promise<Result<object[]>> {
    try {
      const rows = courseId
        ? await exec(sql`SELECT m.*, c.title_uz AS course_title FROM lms_modules m LEFT JOIN courses c ON c.id = m.course_id WHERE m.course_id = ${parseInt(courseId, 10)} ORDER BY m.sort_order ASC, m.created_at DESC`)
        : await exec(sql`SELECT m.*, c.title_uz AS course_title FROM lms_modules m LEFT JOIN courses c ON c.id = m.course_id ORDER BY m.sort_order ASC, m.created_at DESC`);
      return Ok(rows);
    } catch (error) { this.logger.error(`findAllModules: ${(error as Error).message}`); return Err((error as Error).message); }
  }

  // ─── Card Mentors (lms_card_mentors) — EP-ORG-116 karta-markazli mentor ───────────
  // KARTAga mentor biriktirish (onboarding). card_id -> org_departments, mentor_user_id -> users.

  // Bitta kartaning faol mentorlari (yoki hammasi). JOIN org_departments (karta nomi) + users (mentor ismi).
  async findCardMentors(cardId?: string): Promise<Result<object[]>> {
    try {
      const rows = cardId
        ? await exec(sql`SELECT cm.*, od.name AS card_title, u.full_name AS mentor_name, c.title_uz AS course_title FROM lms_card_mentors cm LEFT JOIN org_departments od ON od.id = cm.card_id LEFT JOIN users u ON u.id = cm.mentor_user_id LEFT JOIN courses c ON c.id = cm.course_id WHERE cm.card_id = ${parseInt(cardId, 10)} ORDER BY cm.is_active DESC, cm.assigned_at DESC`)
        : await exec(sql`SELECT cm.*, od.name AS card_title, u.full_name AS mentor_name, c.title_uz AS course_title FROM lms_card_mentors cm LEFT JOIN org_departments od ON od.id = cm.card_id LEFT JOIN users u ON u.id = cm.mentor_user_id LEFT JOIN courses c ON c.id = cm.course_id WHERE cm.is_active = true ORDER BY cm.assigned_at DESC LIMIT 200`);
      return Ok(rows);
    } catch (error) { this.logger.error(`findCardMentors: ${(error as Error).message}`); return Err((error as Error).message); }
  }

  async findCardMentorById(id: string): Promise<Result<Row>> {
    try {
      const r = await exec(sql`SELECT cm.*, od.name AS card_title, u.full_name AS mentor_name, c.title_uz AS course_title FROM lms_card_mentors cm LEFT JOIN org_departments od ON od.id = cm.card_id LEFT JOIN users u ON u.id = cm.mentor_user_id LEFT JOIN courses c ON c.id = cm.course_id WHERE cm.id = ${parseInt(id, 10)} LIMIT 1`);
      if (!r.length) return Err('Mentor biriktiruvi topilmadi');
      return Ok(r[0] as Row);
    } catch (error) { this.logger.error(`findCardMentorById: ${(error as Error).message}`); return Err((error as Error).message); }
  }

  // Mentor biriktirish (assign). Faol dublikat bo'lsa qaytariladi (uq idx 23505 ushlanadi).
  async assignCardMentor(data: {
    cardId: number; mentorUserId: number; courseId?: number | null; notes?: string | null; assignedBy?: number | null;
  }): Promise<Result<Row>> {
    try {
      const r = await exec(sql`
        INSERT INTO lms_card_mentors (card_id, mentor_user_id, course_id, notes, assigned_by, is_active, assigned_at, created_at, updated_at)
        VALUES (${data.cardId}, ${data.mentorUserId}, ${data.courseId ?? null}, ${data.notes ?? null}, ${data.assignedBy ?? null}, true, NOW(), NOW(), NOW())
        RETURNING *`);
      return Ok((r[0] ?? {}) as Row);
    } catch (error) {
      const msg = (error as Error).message;
      if (/uq_lms_card_mentor_active|duplicate key/.test(msg)) return Err('Bu karta uchun mentor allaqachon biriktirilgan');
      this.logger.error(`assignCardMentor: ${msg}`); return Err(msg);
    }
  }

  async updateCardMentor(id: string, data: { courseId?: number | null; notes?: string | null }): Promise<Result<Row>> {
    try {
      const r = await exec(sql`
        UPDATE lms_card_mentors
        SET course_id = COALESCE(${data.courseId ?? null}, course_id),
            notes     = COALESCE(${data.notes ?? null}, notes),
            updated_at = NOW()
        WHERE id = ${parseInt(id, 10)} AND is_active = true
        RETURNING *`);
      if (!r.length) return Err('Faol mentor biriktiruvi topilmadi');
      return Ok(r[0] as Row);
    } catch (error) { this.logger.error(`updateCardMentor: ${(error as Error).message}`); return Err((error as Error).message); }
  }

  // Revoke (soft): is_active=false + revoked_at — uq idx faqat is_active=true ni qamrab oladi, qayta-biriktirish mumkin.
  async revokeCardMentor(id: string): Promise<Result<Row>> {
    try {
      const r = await exec(sql`UPDATE lms_card_mentors SET is_active = false, revoked_at = NOW(), updated_at = NOW() WHERE id = ${parseInt(id, 10)} AND is_active = true RETURNING *`);
      if (!r.length) return Err('Faol mentor biriktiruvi topilmadi');
      return Ok(r[0] as Row);
    } catch (error) { this.logger.error(`revokeCardMentor: ${(error as Error).message}`); return Err((error as Error).message); }
  }
}
