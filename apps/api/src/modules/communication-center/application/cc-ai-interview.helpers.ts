/**
 * @module cc-ai-interview.helpers
 * @description Pure helpers extracted from cc-ai-interview.service.ts to keep
 *   the service file <300 lines (Rule 16).
 */

import { BadRequestException } from '@nestjs/common';
import type { AiQuestion } from './cc-ai-interview.types';

/**
 * Validate a user-supplied answer against an AI question definition.
 * Throws BadRequestException with an Uzbek-language message on failure.
 */
export function validateAnswer(cur: AiQuestion, value: unknown): void {
  if (cur.required && (value === null || value === undefined || value === '')) {
    throw new BadRequestException(`"${cur.qUz}" maydon majburiy`);
  }
  if (cur.type === 'number' && value !== null && value !== '' && Number.isNaN(Number(value))) {
    throw new BadRequestException(`"${cur.qUz}" raqam bo'lishi kerak`);
  }
  if (cur.type === 'choice' && cur.choices && cur.choices.length > 0
      && !cur.choices.includes(String(value))) {
    throw new BadRequestException(`Tanlangan qiymat ruxsat etilgan ro'yxatda yo'q`);
  }
}
