import { db } from '@shared/db';
import { questionnaire_questions, questionnaire_templates } from '@shared/db';
import { eq } from 'drizzle-orm';

export async function execQuestionnaireQuestionDelete(id: number): Promise<void> {
  await db.delete(questionnaire_questions).where(eq(questionnaire_questions.id, id));
}

export async function execQuestionnaireTemplateDelete(id: number): Promise<void> {
  await db.delete(questionnaire_templates).where(eq(questionnaire_templates.id, id));
}
