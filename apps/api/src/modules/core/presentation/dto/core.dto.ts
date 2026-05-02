import { z } from 'zod';

export const CreateDepartmentDtoSchema = z.object({
  name: z.string().min(2, 'Nomi kamida 2 ta belgi bo\'lishi kerak'),
  code: z.string().min(2).max(10).regex(/^[A-Z]+$/, 'Kod faqat bosh harflardan iborat bo\'lishi kerak'),
  headId: z.string().uuid().optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
  description: z.string().optional().nullable(),
});

export type CreateDepartmentDto = z.infer<typeof CreateDepartmentDtoSchema>;

export const UpdateDepartmentDtoSchema = z.object({
  name: z.string().min(2).optional(),
  code: z.string().min(2).max(10).regex(/^[A-Z]+$/, 'Kod faqat bosh harflardan iborat bo\'lishi kerak').optional(),
  headId: z.string().uuid().optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export type UpdateDepartmentDto = z.infer<typeof UpdateDepartmentDtoSchema>;

export const CreatePositionDtoSchema = z.object({
  title: z.string().min(2, 'Nomi kamida 2 ta belgi bo\'lishi kerak'),
  code: z.string().min(2).max(10).regex(/^[A-Z]+$/, 'Kod faqat bosh harflardan iborat bo\'lishi kerak'),
  departmentId: z.string().uuid('Departament ID UUID bo\'lishi kerak'),
  level: z.number().int().min(1).max(10, 'Daraja 1-10 orasida bo\'lishi kerak'),
  minSalary: z.number().nonnegative('Minimal maoshi 0 yoki undan katta bo\'lishi kerak'),
  maxSalary: z.number().nonnegative('Maksimal maoshi 0 yoki undan katta bo\'lishi kerak'),
});

export type CreatePositionDto = z.infer<typeof CreatePositionDtoSchema>;

export const UpdatePositionDtoSchema = z.object({
  title: z.string().min(2).optional(),
  code: z.string().min(2).max(10).regex(/^[A-Z]+$/, 'Kod faqat bosh harflardan iborat bo\'lishi kerak').optional(),
  departmentId: z.string().uuid().optional(),
  level: z.number().int().min(1).max(10).optional(),
  minSalary: z.number().nonnegative().optional(),
  maxSalary: z.number().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

export type UpdatePositionDto = z.infer<typeof UpdatePositionDtoSchema>;

export const PanelLayoutSchema = z.object({
  widgetId: z.string().min(1),
  widgetType: z.enum(['chart', 'table', 'kpi', 'calendar', 'map']),
  position: z.object({
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
  }),
  config: z.record(z.unknown()),
});

export type PanelLayoutDto = z.infer<typeof PanelLayoutSchema>;

export const SavePanelDtoSchema = z.object({
  name: z.string().optional(),
  layout: z.array(PanelLayoutSchema),
});

export type SavePanelDto = z.infer<typeof SavePanelDtoSchema>;
