/**
 * @module uzbek-tin.validator
 * @description Source module. See exports for details.
 */

import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * O'zbek STIR (INN) validator — TZ-55 talabiga ko'ra.
 *
 * Qoidalar:
 *   - 9 ta raqam (faqat raqamlar)
 *   - Kontrol raqam: weight = [7, 1, 3, 7, 1, 3, 7, 1]
 *     sum = Σ(digit[i] * weight[i]) mod 10
 *     sum === digit[8] bo'lishi shart
 *
 * Ishlatish:
 *   class InvoiceDto {
 *     @IsUzbekTin()
 *     supplierTin: string;
 *   }
 */
@ValidatorConstraint({ name: 'isUzbekTin', async: false })
export class IsUzbekTinConstraint implements ValidatorConstraintInterface {
  private readonly WEIGHTS = [7, 1, 3, 7, 1, 3, 7, 1];

  validate(tin: unknown): boolean {
    if (typeof tin !== 'string') return false;
    if (!/^\d{9}$/.test(tin)) return false;

    const digits = tin.split('').map(Number);
    const checkSum = this.WEIGHTS.reduce(
      (sum, w, i) => sum + w * (digits[i] as number),
      0,
    );
    return checkSum % 10 === digits[8];
  }

  defaultMessage(): string {
    return 'STIR (INN) noto\'g\'ri: 9 ta raqam va kontrol summa mos kelmadi';
  }
}

/**
 * @IsUzbekTin() — O'zbekiston STIR/INN validatsiya dekoratoru.
 */
export function IsUzbekTin(options?: ValidationOptions): PropertyDecorator {
  return function (object: object, propertyName: string | symbol): void {
    registerDecorator({
      name: 'isUzbekTin',
      target: object.constructor,
      propertyName: String(propertyName),
      options,
      constraints: [],
      validator: IsUzbekTinConstraint,
    });
  };
}
