import { z } from 'zod';
import { UserRole } from '../../domain/aggregates/user.aggregate';

export const CreateUserSchema = z.object({
  username: z
    .string()
    .min(3, 'Username kamida 3 ta belgidan iborat bo\'lishi kerak')
    .max(50, 'Username 50 tadan ko\'p bo\'lmasa kerak'),
  email: z
    .string()
    .email('Yaroqli email kiriting'),
  password: z
    .string()
    .min(8, 'Parol kamida 8 ta belgidan iborat bo\'lishi kerak')
    .regex(/[A-Z]/, 'Parol kamida 1 ta katta harfni o\'z ichiga olishi kerak')
    .regex(/[a-z]/, 'Parol kamida 1 ta kichik harfni o\'z ichiga olishi kerak')
    .regex(/\d/, 'Parol kamida 1 ta raqamni o\'z ichiga olishi kerak')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Parol kamida 1 ta maxsus belgini o\'z ichiga olishi kerak'),
  role: z.nativeEnum(UserRole).default(UserRole.EMPLOYEE),
  departmentId: z.number().optional(),
  positionId: z.number().optional(),
});

export type CreateUserDto = z.infer<typeof CreateUserSchema>;
