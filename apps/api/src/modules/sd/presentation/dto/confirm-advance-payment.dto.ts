import { z } from 'zod';

export const ConfirmAdvancePaymentDtoSchema = z.object({
  amount:         z.coerce.number().nonnegative({ message: 'amount manfiy bo\'lmasligi kerak' }),
  idempotencyKey: z.string().min(1, { message: 'idempotencyKey majburiy' }),
});
export type ConfirmAdvancePaymentDto = z.infer<typeof ConfirmAdvancePaymentDtoSchema>;
