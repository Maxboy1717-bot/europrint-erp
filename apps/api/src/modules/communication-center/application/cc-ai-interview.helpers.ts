/**
 * @module cc-ai-interview.helpers
 * @description Pure helpers extracted from cc-ai-interview.service.ts to keep
 *   the service file <300 lines (Rule 16).
 */

import { BadRequestException } from '@nestjs/common';
import type { I18nService } from 'nestjs-i18n';
import type { AiQuestion } from './cc-ai-interview.types';

/**
 * Validate a user-supplied answer against an AI question definition.
 * Throws BadRequestException with a localized message on failure.
 */
export async function validateAnswer(cur: AiQuestion, value: unknown, i18n: I18nService): Promise<void> {
  if (cur.required && (value === null || value === undefined || value === '')) {
    throw new BadRequestException(await i18n.t('validation.fieldRequiredNamed', { args: { field: cur.qUz } }));
  }
  if (cur.type === 'number' && value !== null && value !== '' && Number.isNaN(Number(value))) {
    throw new BadRequestException(await i18n.t('validation.fieldMustBeNumber', { args: { field: cur.qUz } }));
  }
  if (cur.type === 'choice' && cur.choices && cur.choices.length > 0
      && !cur.choices.includes(String(value))) {
    throw new BadRequestException(await i18n.t('validation.choiceNotInAllowedList'));
  }
}
