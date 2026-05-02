/**
 * Luhn algoritmi — UzCard/Humo karta raqami tekshiruvi.
 *
 * Har pozitsiya uchun (o'ngdan, 0-indexed):
 *   juft pozitsiya:  d
 *   toq pozitsiya:   2×d agar < 10, aks holda 2×d - 9
 *
 * Tekshiruv: Σ ≡ 0 (mod 10)
 */

export interface LuhnValidationResult {
  valid: boolean;
  cardNumber: string;
  message: string;
}

export function validateLuhn(cardNumber: string): LuhnValidationResult {
  const digits = cardNumber.replace(/\D/g, '');

  if (digits.length < 16 || digits.length > 19) {
    return {
      valid: false,
      cardNumber: digits,
      message: 'Karta raqami 16–19 raqamdan iborat bo\'lishi kerak',
    };
  }

  const nums = digits.split('').map(Number).reverse();
  let sum = 0;
  for (let i = 0; i < nums.length; i++) {
    let d = nums[i] ?? 0;
    if (i % 2 !== 0) {
      d *= 2;
      if (d >= 10) d -= 9;
    }
    sum += d;
  }

  const valid = sum % 10 === 0;
  return {
    valid,
    cardNumber: digits,
    message: valid ? 'Karta raqami to\'g\'ri' : 'Noto\'g\'ri karta raqami (Luhn tekshiruvi muvaffaqiyatsiz)',
  };
}
