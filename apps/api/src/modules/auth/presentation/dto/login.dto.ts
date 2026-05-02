import { MAX_NAME_LENGTH } from '@common/constants/app.constants';
import { z } from 'zod';

export const LoginSchema = z.object({
  username: z
    .string()
    .min(1, 'Username kiritilishi shart')
    .max(50, 'Username 50 tadan ko\'p bo\'lmasa kerak'),
  password: z
    .string()
    .min(1, 'Parol kiritilishi shart')
    .max(MAX_NAME_LENGTH, 'Parol juda uzun'),
});

export type LoginDto = z.infer<typeof LoginSchema>;
