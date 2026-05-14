/**
 * @module ai-score.vo
 * @description Value object. Immutable domain primitive with validation in its factory.
 */

import { ValueObject } from '@shared/domain/value-object.base';
import { Result, Ok, Err } from '@common/types/result.type';

export class AIScore extends ValueObject<number> {
  private constructor(value: number) {
    super(value);
  }

  static create(value: number): Result<AIScore> {
    if (value < 0 || value > 100) {
      return Err('AI Score must be between 0 and 100');
    }
    return Ok(new AIScore(Math.round(value)));
  }

  getValue(): number {
    return this._value;
  }

  isHighScore(): boolean {
    return this._value >= 70;
  }

  isMediumScore(): boolean {
    return this._value >= 40 && this._value < 70;
  }

  isLowScore(): boolean {
    return this._value < 40;
  }

  equals(other: AIScore): boolean {
    return this._value === other._value;
  }
}
