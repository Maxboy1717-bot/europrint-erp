import { Injectable, Logger } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { execQuestionnaireQuestionDelete, execQuestionnaireTemplateDelete } from '@common/database/queries-questionnaire';

type Row = Record<string, unknown>;

@Injectable()
export class LmsQuestionnaireRepository {
  private readonly logger = new Logger(LmsQuestionnaireRepository.name);

  async findAllQuestions(): Promise<Result<object[]>> {
    try {
      const rows = await runQuery<Row>(sql`SELECT * FROM questionnaire_questions ORDER BY created_at DESC`);
      return Ok(rows.rows as Row[]);
    } catch { return Ok([]); }
  }

  async saveQuestion(data: Row): Promise<Result<Row>> {
    try {
      const rows = await runQuery<Row>(sql`
        INSERT INTO questionnaire_questions (text, type, options, is_required, created_at)
        VALUES (${String(data.text)}, ${String(data.type ?? 'text')}, ${data.options ? JSON.stringify(data.options) : null}::jsonb, ${Boolean(data.isRequired)}, NOW())
        RETURNING *
      `);
      return Ok((rows.rows[0] ?? data) as Row);
    } catch (error) {
      this.logger.error(`saveQuestion: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async updateQuestion(id: string, data: Row): Promise<Result<Row>> {
    try {
      const rows = await runQuery<Row>(sql`
        UPDATE questionnaire_questions
        SET text = COALESCE(${data.text ? String(data.text) : null}, text),
            type = COALESCE(${data.type ? String(data.type) : null}, type),
            options = COALESCE(${data.options ? JSON.stringify(data.options) : null}::jsonb, options),
            updated_at = NOW()
        WHERE id = ${parseInt(id, 10)} RETURNING *
      `);
      if (!rows.rows.length) return Err('Savol topilmadi');
      return Ok(rows.rows[0] as Row);
    } catch (error) {
      this.logger.error(`updateQuestion: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async deleteQuestion(id: string): Promise<Result<void>> {
    try {
      await execQuestionnaireQuestionDelete(parseInt(id, 10));
      return Ok();
    } catch (error) {
      this.logger.error(`deleteQuestion: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async findAllResponses(questionId?: string): Promise<Result<object[]>> {
    try {
      const rows = questionId
        ? await runQuery<Row>(sql`
            SELECT r.*, q.text AS question_text
            FROM questionnaire_responses r JOIN questionnaire_questions q ON q.id = r.question_id
            WHERE r.question_id = ${parseInt(questionId, 10)} ORDER BY r.created_at DESC
          `)
        : await runQuery<Row>(sql`
            SELECT r.*, q.text AS question_text
            FROM questionnaire_responses r JOIN questionnaire_questions q ON q.id = r.question_id
            ORDER BY r.created_at DESC
          `);
      return Ok(rows.rows as Row[]);
    } catch { return Ok([]); }
  }

  async saveResponse(data: Row, userId: string): Promise<Result<Row>> {
    try {
      const rows = await runQuery<Row>(sql`
        INSERT INTO questionnaire_responses (question_id, employee_id, answer, created_at)
        VALUES (${parseInt(String(data.questionId), 10)}, ${parseInt(userId, 10)}, ${JSON.stringify(data.answer)}, NOW())
        RETURNING *
      `);
      return Ok((rows.rows[0] ?? data) as Row);
    } catch (error) {
      this.logger.error(`saveResponse: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async findResponseById(id: string): Promise<Result<Row>> {
    try {
      const rows = await runQuery<Row>(sql`
        SELECT r.*, q.text AS question_text
        FROM questionnaire_responses r JOIN questionnaire_questions q ON q.id = r.question_id
        WHERE r.id = ${parseInt(id, 10)} LIMIT 1
      `);
      if (!rows.rows.length) return Err('Javob topilmadi');
      return Ok(rows.rows[0] as Row);
    } catch (error) {
      this.logger.error(`findResponseById: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async findAllTemplates(): Promise<Result<object[]>> {
    try {
      const rows = await runQuery<Row>(sql`SELECT * FROM questionnaire_templates ORDER BY created_at DESC`);
      return Ok(rows.rows as Row[]);
    } catch { return Ok([]); }
  }

  async findTemplateById(id: string): Promise<Result<Row>> {
    try {
      const rows = await runQuery<Row>(sql`
        SELECT t.*, COALESCE(json_agg(q.*) FILTER (WHERE q.id IS NOT NULL), '[]') AS questions
        FROM questionnaire_templates t
        LEFT JOIN questionnaire_template_questions tq ON tq.template_id = t.id
        LEFT JOIN questionnaire_questions q ON q.id = tq.question_id
        WHERE t.id = ${parseInt(id, 10)} GROUP BY t.id LIMIT 1
      `);
      if (!rows.rows.length) return Err('Shablon topilmadi');
      return Ok(rows.rows[0] as Row);
    } catch (error) {
      this.logger.error(`findTemplateById: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async saveTemplate(data: Row, userId: string): Promise<Result<Row>> {
    try {
      const rows = await runQuery<Row>(sql`
        INSERT INTO questionnaire_templates (title, description, created_by, created_at)
        VALUES (${String(data.title)}, ${data.description ? String(data.description) : null}, ${parseInt(userId, 10)}, NOW())
        RETURNING *
      `);
      return Ok((rows.rows[0] ?? data) as Row);
    } catch (error) {
      this.logger.error(`saveTemplate: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async updateTemplate(id: string, data: Row): Promise<Result<Row>> {
    try {
      const rows = await runQuery<Row>(sql`
        UPDATE questionnaire_templates
        SET title = COALESCE(${data.title ? String(data.title) : null}, title),
            description = COALESCE(${data.description ? String(data.description) : null}, description),
            updated_at = NOW()
        WHERE id = ${parseInt(id, 10)} RETURNING *
      `);
      if (!rows.rows.length) return Err('Shablon topilmadi');
      return Ok(rows.rows[0] as Row);
    } catch (error) {
      this.logger.error(`updateTemplate: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async deleteTemplate(id: string): Promise<Result<void>> {
    try {
      await execQuestionnaireTemplateDelete(parseInt(id, 10));
      return Ok();
    } catch (error) {
      this.logger.error(`deleteTemplate: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async findQuestionnaireQuestions(templateId?: string): Promise<Result<object[]>> {
    try {
      const rows = templateId
        ? await runQuery<Row>(sql`
            SELECT q.* FROM questionnaire_questions q
            JOIN questionnaire_template_questions tq ON tq.question_id = q.id
            WHERE tq.template_id = ${parseInt(templateId, 10)} ORDER BY q.created_at DESC
          `)
        : await runQuery<Row>(sql`SELECT * FROM questionnaire_questions ORDER BY created_at DESC`);
      return Ok(rows.rows as Row[]);
    } catch { return Ok([]); }
  }

  async saveQuestionnaireQuestion(data: Row): Promise<Result<Row>> {
    try {
      const rows = await runQuery<Row>(sql`
        INSERT INTO questionnaire_questions (text, type, options, is_required, created_at)
        VALUES (${String(data.text)}, ${String(data.type ?? 'text')}, ${data.options ? JSON.stringify(data.options) : null}::jsonb, ${Boolean(data.isRequired)}, NOW())
        RETURNING *
      `);
      return Ok((rows.rows[0] ?? data) as Row);
    } catch (error) {
      this.logger.error(`saveQuestionnaireQuestion: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async deleteQuestionnaireQuestion(id: string): Promise<Result<void>> {
    try {
      await execQuestionnaireQuestionDelete(parseInt(id, 10));
      return Ok();
    } catch (error) {
      this.logger.error(`deleteQuestionnaireQuestion: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }
}
