/**
 * O'zbek STIR (INN) tekshiruvi — 9 raqamli yuridik shaxs identifikatori.
 *
 * W = [7, 1, 3, 7, 1, 3, 7, 1]
 * c = (Σ_{i=1}^{8} d_i × W_i) mod 10
 * Shart: d_9 === c
 */

const STIR_WEIGHTS = [7, 1, 3, 7, 1, 3, 7, 1] as const;
const STIR_LENGTH = 9;

export interface StirValidationResult {
  valid: boolean;
  stir: string;
  checkDigit: number;
  computed: number;
  message: string;
}

export function validateStir(stir: string): StirValidationResult {
  const digits = stir.replace(/\D/g, '');
  if (digits.length !== STIR_LENGTH) {
    return { valid: false, stir, checkDigit: -1, computed: -1, message: 'STIR 9 raqamdan iborat bo\'lishi kerak' };
  }

  const nums = digits.split('').map(Number);
  let sum = 0;
  for (let i = 0; i < STIR_WEIGHTS.length; i++) {
    sum += (nums[i] ?? 0) * (STIR_WEIGHTS[i] ?? 0);
  }
  const computed = sum % 10;
  const checkDigit = nums[8] ?? -1;
  const valid = checkDigit === computed;

  return {
    valid,
    stir: digits,
    checkDigit,
    computed,
    message: valid ? 'STIR to\'g\'ri' : `Nazorat raqami noto'g'ri: kutilgan ${computed}, berilgan ${checkDigit}`,
  };
}
