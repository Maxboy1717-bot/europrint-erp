import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

// z.record to'g'ridan-to'g'ri createZodDto'ga berilganda .shape bo'lmasligi sababli
// "Cannot convert undefined or null to object" xatosi chiqadi.
// Yechim: z.object() ichida wrapping qilamiz — passthrough qo'shimcha keylarni o'tkazadi.
const CompatBodySchema = z.object({}).passthrough();
export class CompatBodyDto extends createZodDto(CompatBodySchema) {}

const BoolBodySchema = z.object({ passed: z.boolean() });
export class BoolBodyDto extends createZodDto(BoolBodySchema) {}

const GenerateBarcodeSchema = z.object({ type: z.string(), entityId: z.string() });
export class GenerateBarcodeDto extends createZodDto(GenerateBarcodeSchema) {}

const ScanBarcodeSchema = z.object({ barcode: z.string(), action: z.string().optional() });
export class ScanBarcodeDto extends createZodDto(ScanBarcodeSchema) {}

const BulkGenerateSchema = z.object({ entityIds: z.array(z.string()), type: z.string() });
export class BulkGenerateBarcodeDto extends createZodDto(BulkGenerateSchema) {}

const PrintLabelSchema = z.object({
  batchId:       z.string().optional(),
  materialCardId: z.number().optional(),
  format:        z.string(),
  copies:        z.number().optional(),
});
export class PrintLabelDto extends createZodDto(PrintLabelSchema) {}

const LabelStatusSchema = z.object({ status: z.string(), notes: z.string().optional() });
export class LabelStatusDto extends createZodDto(LabelStatusSchema) {}

const PrintJobSchema = z.object({
  batchId: z.string(),
  format:  z.string(),
  copies:  z.number().optional(),
});
export class PrintJobDto extends createZodDto(PrintJobSchema) {}

const ImportEmployeesSchema = z.object({ employees: z.array(z.record(z.string(), z.unknown())) });
export class ImportEmployeesDto extends createZodDto(ImportEmployeesSchema) {}

const ProfileImageSchema = z.object({ url: z.string().optional() });
export class ProfileImageDto extends createZodDto(ProfileImageSchema) {}

// z.union([z.string(), z.number()]) Swagger uchun aylanma yaratadi.
// z.coerce.number() esa string va number ham qabul qiladi va number'ga aylantiradi.
//
// `orgDepartmentIds` — yangi multi-assignment yo'li (frontend EmployeeDialog yuboradi):
//   POST /api/employees/:id/assign-org-functions  body: { orgDepartmentIds: [1, 2, 3] }
// `departmentId`/`positionId` — legacy (faqat employees jadvalini yangilash).
const OrgFunctionsSchema = z.object({
  orgDepartmentIds: z.array(z.coerce.number().int().positive()).optional(),
  departmentId: z.coerce.number().int().optional(),
  positionId:   z.coerce.number().int().optional(),
});
export class OrgFunctionsDto extends createZodDto(OrgFunctionsSchema) {}
