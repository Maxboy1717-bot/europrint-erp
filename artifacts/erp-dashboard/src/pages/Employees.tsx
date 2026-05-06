import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { useLocation } from "wouter";
import { EmployeeTable, type Employee } from "@/components/EmployeeTable";
import { EmployeeDialog } from "@/components/EmployeeDialog";
import { ImportEmployeesDialog } from "@/components/ImportEmployeesDialog";
import { SearchBar } from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/Pagination";
import { TableSkeleton } from "@/components/ui/loading-skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";

export default function Employees() {
  const { t } = useTranslation('hr');
  const { t: tCommon } = useTranslation('common');
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [employeeDialog, setEmployeeDialog] = useState<{ open: boolean; employee?: Employee }>({ open: false });
  const [importDialog, setImportDialog] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [search, departmentFilter]);

  // Auth tekshiruvi: login bo'lmagan foydalanuvchini login sahifaga yo'naltirish
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  // /api/employees → kengaytirilgan list (backend `EmployeesListExtendedService` qaytaradi).
  // Response: { items: EmployeeRow[], total: number }
  interface EmployeeRow {
    id: string;
    fullName: string;
    employeeId: string;
    telegramChatId: string | null;
    birthDate: string | null;
    hireDate: string | null;
    address: string | null;
    attestationDate: string | null;
    orgDepartmentName: string | null;
    departmentName: string | null;
    orgPositionName: string | null;
    positionName: string | null;
    departmentId: string | null;
    phone: string | null;
    coursesTotal: number | null;
    rating: number | null;
    bonusAmount: number | null;
    status: string;
    failedTests: number | null;
    disciplineCount: number | null;
    profileImageUrl: string | null;
  }
  const { data: employeesResponse, isLoading: employeesLoading, isError: employeesError, refetch: refetchEmployees } =
    useQuery<{ items: EmployeeRow[]; total: number }>({
      queryKey: ["/api/employees"],
      enabled: isAuthenticated === true,  // login bo'lmasa chaqirmaydi (401 oldini olish)
    });
  const allUsers: EmployeeRow[] = Array.isArray(employeesResponse?.items) ? employeesResponse.items : [];

  // Client-side filtering and pagination
  const filteredUsers = (Array.isArray(allUsers) ? allUsers : []).filter(user => {
    if (search) {
      const searchLower = search.toLowerCase();
      if (!user.fullName?.toLowerCase().includes(searchLower) && 
          !user.employeeId?.toLowerCase().includes(searchLower) &&
          !user.phone?.toLowerCase().includes(searchLower)) {
        return false;
      }
    }
    if (departmentFilter !== "all" && user.departmentId !== departmentFilter) {
      return false;
    }
    return true;
  });

  const total = filteredUsers.length;
  const totalPages = Math.ceil(total / pageSize);
  const employees = filteredUsers.slice((page - 1) * pageSize, page * pageSize);
  const pagination = { page, limit: pageSize, total, totalPages };

  const { data: orgDepartments = [] } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ["/api/org-departments"],
    enabled: isAuthenticated === true,
  });

  const transformedEmployees: Employee[] = (Array.isArray(employees) ? employees : []).map(emp => {
    const deptName = emp.orgDepartmentName || emp.departmentName;
    const posName = emp.orgPositionName || emp.positionName;
    const orgStructure = deptName && posName ? `${deptName} → ${posName}` : undefined;
    
    return {
      id: emp.id,
      fullName: emp.fullName || "",
      employeeId: emp.employeeId || "",
      telegramChatId: emp.telegramChatId || "",
      birthDate: emp.birthDate || "",
      hireDate: emp.hireDate || "",
      address: emp.address || "",
      attestationDate: emp.attestationDate || "",
      orgStructure,
      phone: emp.phone || "",
      coursesCompleted: 0,
      coursesTotal: emp.coursesTotal || 0,
      rating: emp.rating || 0,
      bonusAmount: emp.bonusAmount || 0,
      status: (emp.status as "active" | "inactive" | "resigned") || "active",
      failedTests: emp.failedTests || 0,
      disciplineCount: emp.disciplineCount || 0,
      profileImageUrl: emp.profileImageUrl || undefined,
    };
  });

  // Auth yuklanayotganda yoki login bo'lmaganda — bo'sh ekran (redirect ishga tushgancha)
  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex-1 overflow-auto bg-surface p-6 space-y-6">
        <TableSkeleton rows={5} columns={7} />
      </div>
    );
  }

  if (employeesError) {
    return (
      <div className="space-y-6">
        <PageHeader label="Europrint ERP · HR" title={t('employees')} subtitle={t('employeeList')} />
        <ErrorState onRetry={refetchEmployees} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-surface p-6 space-y-6">
      <h1 className="text-4xl font-light tracking-tight text-on-surface">
        Xodimlar <span className="font-bold text-primary">Ro'yxati</span>
      </h1>
      <div className="flex justify-between items-center -mt-4">
        <p className="text-on-surface-variant">
          Kompaniya xodimlari va ularning asosiy ma'lumotlari
        </p>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="bg-surface-container text-on-surface rounded-lg px-4 py-2 text-sm font-medium hover:bg-surface-container-high"
            onClick={() => setImportDialog(true)}
            data-testid="button-import"
          >
            <Upload className="w-4 h-4 mr-2" />
            {tCommon('import')}
          </Button>
          <Button 
            className="bg-gradient-to-br from-primary to-primary-dim text-white rounded-lg px-5 py-2.5 text-sm font-semibold"
            onClick={() => setEmployeeDialog({ open: true })}
            data-testid="button-add-employee"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('addEmployee')}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <SearchBar 
            placeholder={`${t('employees')} ${tCommon('search').toLowerCase()}...`}
            value={search}
            onChange={setSearch}
          />
        </div>
        
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-[250px]" data-testid="select-org-structure-filter">
            <SelectValue placeholder={t('orgChart')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tCommon('all')} {t('orgChart').toLowerCase()}</SelectItem>
            {(Array.isArray(orgDepartments) ? orgDepartments : []).map(dept => (
              <SelectItem key={dept.id} value={dept.id}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {departmentFilter !== "all" && (
          <Badge variant="secondary" className="text-sm">
            {(orgDepartments ?? []).find(d => d.id === departmentFilter)?.name}
          </Badge>
        )}
      </div>

      {employeesLoading ? (
        <TableSkeleton rows={5} columns={7} />
      ) : transformedEmployees.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {tCommon('noData')}
        </div>
      ) : (
        <>
          <EmployeeTable 
            employees={transformedEmployees}
            onEmployeeClick={(emp) => navigate(`/employees/${emp.id}`)}
            onEdit={(emp) => setEmployeeDialog({ open: true, employee: emp })}
          />
          
          {pagination && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              pageSize={pagination.limit}
              totalItems={pagination.total}
              onPageChange={(newPage) => setPage(newPage)}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setPage(1);
              }}
            />
          )}
        </>
      )}

      <EmployeeDialog
        open={employeeDialog.open}
        onOpenChange={(open) => setEmployeeDialog({ open })}
        employee={employeeDialog.employee}
      />

      <ImportEmployeesDialog
        open={importDialog}
        onOpenChange={setImportDialog}
      />
    </div>
  );
}
