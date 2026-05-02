import { ConflictException } from '@nestjs/common';

export class ConcurrencyConflictException extends ConflictException {
  constructor(message = 'Bir vaqtda yangilash konflikti: versiya mos kelmadi') {
    super({ statusCode: 409, error: 'ConcurrencyConflict', message });
  }
}
