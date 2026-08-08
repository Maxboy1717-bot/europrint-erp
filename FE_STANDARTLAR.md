# EUROPRINT ERP — FRONTEND STANDARTLARI (To'liq Qo'llanma)

> **Har yangi sahifa yozishdan oldin bu faylni o'qi.**
> BE uchun STANDARTLAR.md qanday bo'lsa — FE uchun shu.
> Copy-paste tayyor shablonlar · EP komponentlar · Xato naqshlari · Tekshiruv ro'yxati.
> Bog'liq: [DIZAYN_QOIDALARI.md](DIZAYN_QOIDALARI.md) · [STANDARTLAR.md](STANDARTLAR.md) §15 FE-1..FE-8.

---

## ❗ BIRINCHI: YANGI SAHIFA YARATISHDAN OLDIN

```bash
# 1. Shu sahifa/yo'l allaqachon bormi?
grep -rn "path.*[nom]\|route.*[nom]" artifacts/erp-dashboard/src/

# 2. Shu API endpoint BE da bormi?
grep -rn "router\.get\|@Get\|@Post" apps/api/src/modules/ | grep "[endpoint]"

# 3. Dizayn token ishlatilganmi?
node scripts/check-design-tokens.mjs  # 0 bo'lishi kerak

# 4. i18n tarjima fayllarda bormi?
grep -rn "[nom]" artifacts/erp-dashboard/src/i18n/locales/uz/
```

---

## § 1. FAYL TUZILMASI

```
artifacts/erp-dashboard/src/
├── pages/
│   └── [modul]/
│       ├── [Modul]Page.tsx          ← asosiy sahifa
│       ├── [Modul]CreateDialog.tsx  ← yaratish modal
│       ├── [Modul]EditDialog.tsx    ← tahrirlash modal
│       └── components/              ← faqat shu sahifada ishlatiladigan
│           ├── [Modul]Table.tsx
│           └── [Modul]Filters.tsx
├── hooks/
│   └── use[Modul].ts                ← useQuery/useMutation wrapperlari
├── api/
│   └── [modul].api.ts              ← API request funksiyalari
├── i18n/locales/
│   ├── uz/[modul].json             ← O'zbek tarjima
│   ├── ru/[modul].json             ← Rus tarjima
│   └── uz-cyr/[modul].json        ← O'zbek kirill
└── types/
    └── [modul].types.ts            ← TypeScript interfeyslari
```

---

## § 2. SAHIFA TUZILMASI (Standart shablon)

```tsx
// pages/hr/employees/HrEmployeesPage.tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EPPageHeader } from '@/components/ep/EPPageHeader';
import { EPSkeletonTable } from '@/components/ep/EPSkeleton';
import { EPErrorState } from '@/components/ep/EPErrorState';
import { EPEmptyState } from '@/components/ep/EPEmptyState';
import { useHrEmployees } from '@/hooks/useHrEmployees';
import { HrEmployeeCreateDialog } from './HrEmployeeCreateDialog';

export function HrEmployeesPage() {
  const { t } = useTranslation('hr');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading, isError } = useHrEmployees({ page, search });

  // ✅ Har 3 holat: loading / error / empty
  if (isLoading) return <div className="space-y-6"><EPSkeletonTable rows={10} /></div>;
  if (isError) return <EPErrorState />;

  const employees = data?.data ?? [];  // ✅ Array.isArray garantiyasi
  const pagination = data?.meta;

  return (
    <div className="space-y-6">  {/* ✅ FAQAT space-y-6 — flex/h-full/p-*/
      <EPPageHeader
        title={t('employees.title')}
        subtitle={t('employees.subtitle', { count: pagination?.total ?? 0 })}
        actions={<HrEmployeeCreateDialog />}
      />

      {employees.length === 0 ? (
        <EPEmptyState
          title={t('employees.empty.title')}
          description={t('employees.empty.description')}
        />
      ) : (
        <HrEmployeeTable
          employees={employees}
          pagination={pagination}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
```

---

## § 3. useQuery PATTERN (ma'lumot olish)

```tsx
// hooks/useHrEmployees.ts
import { useQuery } from '@tanstack/react-query';
import { getEmployees } from '@/api/hr.api';

// ✅ QueryKey konstantasi (invalidation uchun)
export const HR_EMPLOYEES_KEY = ['hr', 'employees'] as const;

interface UseHrEmployeesParams {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: number;
}

export function useHrEmployees(params: UseHrEmployeesParams = {}) {
  return useQuery({
    queryKey: [...HR_EMPLOYEES_KEY, params],
    queryFn: () => getEmployees(params),
    staleTime: 30_000,     // 30 sekunda cache
    placeholderData: (prev) => prev,  // sahifa almashganda flicker yo'q
  });
}

export function useHrEmployee(id: number) {
  return useQuery({
    queryKey: [...HR_EMPLOYEES_KEY, 'detail', id],
    queryFn: () => getEmployeeById(id),
    enabled: !!id,  // id bo'lmaganda so'rov ketmasin
  });
}
```

---

## § 4. useMutation PATTERN (yaratish / yangilash / o'chirish)

```tsx
// hooks/useHrEmployeeMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/useToast';
import { HR_EMPLOYEES_KEY } from './useHrEmployees';
import { createEmployee, updateEmployee, deleteEmployee } from '@/api/hr.api';

export function useCreateEmployee() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      // ✅ QueryKey exact match:
      qc.invalidateQueries({ queryKey: HR_EMPLOYEES_KEY });
      toast({ title: "Xodim qo'shildi", description: "Muvaffaqiyatli saqlandi" });
    },
    // ✅ onError MAJBURIY:
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Xatolik",
        description: error.message ?? "Saqlashda xatolik yuz berdi",
      });
    },
  });
}

export function useUpdateEmployee(id: number) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateEmployeeDto) => updateEmployee(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: HR_EMPLOYEES_KEY });
      qc.invalidateQueries({ queryKey: [...HR_EMPLOYEES_KEY, 'detail', id] });
      toast({ title: "O'zgarishlar saqlandi" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Xatolik", description: error.message });
    },
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: HR_EMPLOYEES_KEY });
      toast({ title: "O'chirildi" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "O'chirishda xatolik", description: error.message });
    },
  });
}
```

---

## § 5. FORMA PATTERN (react-hook-form + Zod)

```tsx
// HrEmployeeCreateDialog.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateEmployee } from '@/hooks/useHrEmployeeMutations';

// ✅ Zod schema — FE validatsiya:
const createEmployeeSchema = z.object({
  first_name: z.string().min(2, "Ismi kamida 2 harf").max(100),
  last_name: z.string().min(2, "Familiyasi kamida 2 harf").max(100),
  org_function_id: z.number().int().positive("Lavozim tanlang"),
  base_salary: z.number().min(0, "Maosh 0 dan katta bo'lishi kerak"),
});
type CreateEmployeeDto = z.infer<typeof createEmployeeSchema>;

export function HrEmployeeCreateDialog() {
  const [open, setOpen] = useState(false);
  const createMutation = useCreateEmployee();

  const form = useForm<CreateEmployeeDto>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: { first_name: '', last_name: '', org_function_id: 0, base_salary: 0 },
  });

  async function onSubmit(values: CreateEmployeeDto) {
    await createMutation.mutateAsync(values);
    setOpen(false);
    form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Xodim qo'shish</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Yangi xodim</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="first_name" render={({ field }) => (
              <FormItem>
                <FormLabel>Ism</FormLabel>
                <FormControl><Input placeholder="Abdulloh" {...field} /></FormControl>
                <FormMessage />  {/* ✅ Zod xato ko'rsatadi */}
              </FormItem>
            )} />
            {/* ... boshqa maydonlar */}
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

---

## § 6. JADVAL / RO'YXAT PATTERN (pagination bilan)

```tsx
// components/HrEmployeeTable.tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EPPagination } from '@/components/ep/EPPagination';

interface Props {
  employees: Employee[];
  pagination?: { page: number; limit: number; total: number; totalPages: number };
  onPageChange: (page: number) => void;
}

export function HrEmployeeTable({ employees, pagination, onPageChange }: Props) {
  // ✅ Array.isArray tekshiruvi:
  const rows = Array.isArray(employees) ? employees : [];

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Xodim</TableHead>
            <TableHead>Lavozim</TableHead>
            <TableHead>Razryad</TableHead>
            <TableHead>Maosh</TableHead>
            <TableHead className="w-[100px]">Amallar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((emp) => (
            <TableRow key={emp.id}>
              <TableCell>{emp.first_name} {emp.last_name}</TableCell>
              <TableCell>{emp.org_function?.name_uz}</TableCell>
              <TableCell>{emp.razryad_level?.name}</TableCell>
              <TableCell>{emp.base_salary?.toLocaleString()} UZS</TableCell>
              <TableCell>
                <EmployeeActions employee={emp} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {pagination && (
        <EPPagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
```

---

## § 7. O'CHIRISH TASDIQLASH PATTERN

```tsx
// ✅ Har delete uchun ConfirmDialog — MAJBURIY
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
         AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
         AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export function EmployeeDeleteButton({ employeeId, employeeName }: Props) {
  const deleteMutation = useDeleteEmployee();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">O'chirish</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>O'chirishni tasdiqlaysizmi?</AlertDialogTitle>
          <AlertDialogDescription>
            <strong>{employeeName}</strong> xodimi o'chiriladi. Bu amalni qaytarib bo'lmaydi.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteMutation.mutate(employeeId)}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMutation.isPending ? "O'chirilmoqda..." : "Ha, o'chirish"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ❌ XATO — tasdiqlashsiz:
// <Button onClick={() => deleteMutation.mutate(id)}>O'chirish</Button>
```

---

## § 8. API REQUEST FUNKSIYALARI

```ts
// api/hr.api.ts
import { apiRequest } from '@/lib/api-request';

// Pagination response formati:
interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

// Standart parametrlar:
interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export async function getEmployees(params: ListParams & { departmentId?: number }) {
  return apiRequest<PaginatedResponse<Employee>>('/hr/employees', { params });
}

export async function getEmployeeById(id: number) {
  return apiRequest<Employee>(`/hr/employees/${id}`);
}

export async function createEmployee(data: CreateEmployeeDto) {
  return apiRequest<Employee>('/hr/employees', { method: 'POST', data });
}

export async function updateEmployee(id: number, data: UpdateEmployeeDto) {
  return apiRequest<Employee>(`/hr/employees/${id}`, { method: 'PATCH', data });
}

export async function deleteEmployee(id: number) {
  return apiRequest<void>(`/hr/employees/${id}`, { method: 'DELETE' });
}
```

---

## § 9. i18n PATTERN

```tsx
// ✅ TO'G'RI i18n foydalanish:
import { useTranslation } from 'react-i18next';

export function HrEmployeesPage() {
  const { t } = useTranslation('hr');  // namespace = modul nomi

  return (
    <div className="space-y-6">
      <h1>{t('employees.title')}</h1>               {/* ✅ tarjima kaliti */}
      <p>{t('employees.count', { count: 42 })}</p>  {/* ✅ interpolatsiya */}
    </div>
  );
}

// ❌ XATO — hardcoded matn:
// <h1>Xodimlar ro'yxati</h1>

// i18n fayl tuzilmasi:
// artifacts/erp-dashboard/src/i18n/locales/uz/hr.json:
// { "employees": { "title": "Xodimlar", "count": "{{count}} ta xodim" } }
```

---

## § 10. EP KOMPONENTLAR TEZKOR REFERENCE

```tsx
// EP komponentlar (hammasi @/components/ep/ da):

// Sahifa sarlavhasi (BARCHA sahifalarda MAJBURIY):
<EPPageHeader
  title="Xodimlar"
  subtitle="42 ta xodim"
  breadcrumbs={[{ label: 'HR', href: '/hr' }, { label: 'Xodimlar' }]}
  actions={<Button>Qo'shish</Button>}
/>

// KPI kartochka:
<EPKpiCard
  title="Umumiy xodimlar"
  value={42}
  trend={{ value: 5, direction: 'up' }}
  icon={<UsersIcon />}
/>

// Karta (card):
<EPCard title="Ma'lumotlar" description="Qo'shimcha ma'lumot">
  <p>Karta tarkibi</p>
</EPCard>

// Holat pill/badge:
<EPStatusPill status="active" />    // yashil
<EPStatusPill status="inactive" />  // kulrang
<EPStatusPill status="pending" />   // sariq

// Skeleton (yuklash):
<EPSkeletonTable rows={5} columns={4} />
<EPSkeletonCard count={3} />
<EPSkeletonList count={8} />

// Xato holati:
<EPErrorState
  title="Ma'lumot yuklanmadi"
  description="Qayta urinib ko'ring"
  retry={() => refetch()}
/>

// Bo'sh holat:
<EPEmptyState
  title="Xodim topilmadi"
  description="Qidiruv mezonlarini o'zgartiring"
/>
```

---

## § 11. TYPESCRIPT QOIDALARI (FE uchun)

```tsx
// ✅ Interfeys (types/hr.types.ts da):
export interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  org_function_id: number;
  org_function?: OrgFunction;
  razryad_level?: RazryadLevel;
  base_salary: number;
  status: 'active' | 'inactive' | 'on_leave';
  created_at: string;
}

// ✅ Optional chaining — non-null assertion (!) emas:
const name = employee?.org_function?.name_uz ?? 'Belgilanmagan';
// ❌ XATO: employee.org_function!.name_uz  → runtime crash

// ✅ Array tekshiruvi:
const list = Array.isArray(data?.data) ? data.data : [];
// ❌ XATO: data.data.map(...)  → undefined da crash

// ✅ Event handler tipi:
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { ... };

// ✅ Komponent props tipi:
interface EmployeeCardProps {
  employee: Employee;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}
```

---

## § 12. RANG VA TOKEN QOIDALARI

```tsx
// ✅ FAQAT CSS o'zgaruvchilari yoki Tailwind semantic:
<div style={{ backgroundColor: 'var(--ep-primary)' }}>         // ✅
<div className="bg-primary text-primary-foreground">           // ✅
<div style={{ color: 'var(--mod-hr)' }}>                      // ✅ modul rang

// ❌ XATO — xom rang:
<div style={{ backgroundColor: '#FF902F' }}>                   // ❌
<div style={{ color: '#8B5CF6' }}>                            // ❌
<div className="text-[#94a3b8]">                              // ❌

// Modul ranglari (var(--mod-*)):
// --mod-fi: #06B6D4  (Finance — ko'k-yashil)
// --mod-hr: #8B5CF6  (HR — binafsha)
// --mod-pp: #F59E0B  (PP — sariq)
// --mod-mes: #EF4444 (MES — qizil)
// --mod-wms: #10B981 (WMS — yashil)
// --mod-qc: #F97316  (QC — to'q sariq)
// --mod-crm: #3B82F6 (CRM — ko'k)

// TEKSHIRUV:
// node scripts/check-design-tokens.mjs  → 0 bo'lishi kerak
```

---

## § 13. SAHIFA ROOT TUZILMASI (AppShell qoidasi)

```tsx
// ✅ TO'G'RI — faqat space-y-6:
return (
  <div className="space-y-6">
    <EPPageHeader ... />
    <FiltersSection />
    <TableSection />
  </div>
);

// ❌ XATO — double padding:
return (
  <div className="flex h-full flex-col overflow-auto p-6">  {/* AppShell allaqachon beradi! */}
    ...
  </div>
);

// ❌ XATO — flex h-full:
return (
  <div className="flex h-full">
    ...
  </div>
);

// AppShellModern.tsx allaqachon beradi: p-4 lg:p-6 + overflowY:auto
// Sahifa root QO'SHIMCHA padding/scroll bermaydi.
```

---

## § 14. ROUTE TUZILMASI

```tsx
// artifacts/erp-dashboard/src/router.tsx yoki routes/hr.routes.tsx

// ✅ Route pattern:
{
  path: '/hr/employees',
  element: <HrEmployeesPage />,
},
{
  path: '/hr/employees/:id',
  element: <HrEmployeeDetailPage />,
},

// ✅ Lazy loading (katta modullar uchun):
const HrEmployeesPage = lazy(() => import('./pages/hr/employees/HrEmployeesPage'));

// Sidebar rout tekshiruvi:
// node scripts/check-sidebar-routes.mjs → 0 bo'lishi kerak
// (sidebar da bor, route da yo'q bo'lsa warning)
```

---

## § 15. PRE-COMMIT FE TEKSHIRUV RO'YXATI

Har yangi sahifa tugagandan keyin:

```bash
# 1. TypeCheck:
npx tsc -p artifacts/erp-dashboard/tsconfig.json --noEmit

# 2. Design tokens:
node scripts/check-design-tokens.mjs  # 0 raw color

# 3. Sidebar routes:
node scripts/check-sidebar-routes.mjs  # 0 broken route

# 4. i18n:
node scripts/i18n-status.mjs  # 0 missing key

# 5. Build:
cd artifacts/erp-dashboard && pnpm build
```

**Manual tekshiruv (browser da):**
```
☐ Loading holati ko'rsatiladi (EPSkeleton)
☐ Error holati ko'rsatiladi (EPErrorState)
☐ Empty holati ko'rsatiladi (EPEmptyState)
☐ Form validatsiya xatolari ko'rsatiladi
☐ Delete tasdiqlash dialog chiqadi
☐ Toast notification (success va error)
☐ Pagination ishlaydi (keyingi sahifa)
☐ EPPageHeader bor va to'g'ri
☐ Responsiv (mobil da ko'rinadi)
☐ i18n (3 til: UZ, RU, UZ-CYR)
```

---

## § 16. UMUMIY XATOLAR (§15 FE bo'limidan)

| Xato | Qoida |
|------|-------|
| `data.map(...)` → `data` undefined crash | `const rows = Array.isArray(data?.data) ? data.data : []` |
| `isLoading` tekshiruvsiz render | `if (isLoading) return <EPSkeletonTable />` |
| `onError` yo'q mutation | `onError: () => toast({ variant: 'destructive', ... })` |
| Delete tasdiqlashsiz | `AlertDialog` majburiy |
| `#FF902F` hardcoded | `var(--ep-primary)` |
| Brand rang ko'k deb taxmin | Brand = `#FF902F` ORANGE — `DIZAYN_QOIDALARI.md §1.1` tekshir |
| `flex h-full p-5 overflow-auto` sahifa root da | `space-y-6` FAQAT |
| EPPageHeader yo'q | Har sahifada majburiy |
| Faqat `<PageName>.tsx` tekshirildi | `Sections/Tabs/Charts/` papkalar ham tekshirilsin |
| Sentry dev da init | `if (import.meta.env.PROD)` tekshiruvi |

---

*Hujjat oxiri · [DIZAYN_QOIDALARI.md](DIZAYN_QOIDALARI.md) · [STANDARTLAR.md](STANDARTLAR.md)*
*EuroPrint ERP · Frontend Standards · Versiya: 2026-06-18*
