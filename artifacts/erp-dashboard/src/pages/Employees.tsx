/**
 * @module Employees
 * @description Xodimlar ro'yxati sahifasi (HR moduli, eng ko'p ochiladigan sahifa).
 *
 *   Migrated to the EuroPrint design system:
 *     - <EPPageHeader>: breadcrumb + 20px page title + subtitle + actions
 *       (replaces the old "Xodimlar Ro'yxati" split-typography heading and
 *       the forbidden gradient on the primary button)
 *     - 4-tile <EPKpiCard> row (Jami / Faol / Yangi bu oy / Ta'tilda)
 *       with animated count-up + HR-purple module hue
 *     - <EPSkeletonKpiRow> + <EPSkeletonTable> for the loading branch
 *     - <EPEmptyState> with an encouraging CTA for "no employees yet"
 *     - <EPErrorState> with retry button for fetch failures
 *     - ep-fade-up entrance on KPI tiles + filter row
 */

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { EmployeeTable, type Employee } from "@/components/EmployeeTable";
import { EmployeeDialog } from "@/components/EmployeeDialog";
import { ImportEmployeesDialog } from "@/components/ImportEmployeesDialog";
import { SearchBar } from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/Pagination";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Plus, Upload, Users, UserCheck, UserPlus, UserX,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import {
  EPPageHeader, EPKpiCard, EPStatusPill,
  EPEmptyState, EPErrorState, EPSkeletonKpiRow, EPSkeletonTable,
} from "@/components/ep";

interface EmployeeRow {
  id: string;
  fullName: string;
  employeeId: string;
  telegramChatId: string | null;
  birthDate: string | null;
  hireDate: string | null;
  address: string | null;
  attestationDate: string | null;
  /** org_departments.id — used as filter key */
  orgDepartmentId: string | null;
  orgDepartmentName: string | null;
  orgPositionName: string | null;
  phone: string | null;
  coursesTotal: number | null;
  rating: number | null;
  bonusAmount: number | null;
  status: string;
  failedTests: number | null;
  disciplineCount: number | null;
  profileImageUrl: string | null;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export default function Employees() {
  const { t } = useTranslation("hr");
  const { t: tCommon } = useTranslation('common');
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [employeeDialog, setEmployeeDialog] = useState<{
    open: boolean;
    employee?: Employee;
  }>({ open: false });
  const [importDialog, setImportDialog] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [search, departmentFilter]);

  // Auth tekshiruvi
  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/login");
  }, [authLoading, isAuthenticated, navigate]);

  // P1.6.4: send search + departmentId params to BE for server-side filtering
  const searchParam  = search.trim();
  const deptParam    = departmentFilter !== "all" ? departmentFilter : undefined;
  const {
    data: employeesResponse,
    isLoading: employeesLoading,
    isError, error: employeesError,
    refetch: refetchEmployees,
  } = useQuery<{ items: EmployeeRow[]; total: number }>({
    queryKey: ["/api/hr/employees", { search: searchParam, departmentId: deptParam, page, limit: pageSize }],
    queryFn: () => {
      const params = new URLSearchParams();
      if (searchParam)  params.set("search",       searchParam);
      if (deptParam)    params.set("departmentId",  deptParam);
      params.set("page",  String(page));
      params.set("limit", String(pageSize));
      return fetch(`/api/hr/employees?${params.toString()}`, {
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }).then((r) => r.json());
    },
    enabled: isAuthenticated === true,
  });

  const allUsers: EmployeeRow[] = Array.isArray(employeesResponse?.items)
    ? employeesResponse.items
    : [];

  const { data: orgDepartments = [] } = useQuery<
    Array<{ id: string; name: string }>
  >({
    queryKey: ["/api/org-departments"],
    enabled: isAuthenticated === true,
  });

  // ─── Stats (KPI row) ────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const active = allUsers.filter((u) => u.status === "active").length;
    const now = Date.now();
    const newThisMonth = allUsers.filter(
      (u) => u.hireDate && now - new Date(u.hireDate).getTime() < THIRTY_DAYS_MS,
    ).length;
    const inactive = allUsers.filter((u) => u.status !== "active").length;
    return { total: allUsers.length, active, newThisMonth, inactive };
  }, [allUsers]);

  // P1.6.4: BE handles filtering — no client-side filter needed
  const total = employeesResponse?.total ?? allUsers.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const employees = allUsers;

  const transformedEmployees: Employee[] = (Array.isArray(employees) ? employees : []).map(
    (emp) => {
      const deptName = emp.orgDepartmentName;
      const posName = emp.orgPositionName;
      const orgStructure = deptName && posName ? `${deptName} → ${posName}` : deptName || undefined;
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
    },
  );

  // ─── Auth-loading branch ───────────────────────────────────────────────
  if (authLoading || !isAuthenticated) {
    return (
      <div className="p-5 lg:p-6 space-y-5">
        <EPSkeletonKpiRow count={4} />
        <EPSkeletonTable rows={6} cols={7} />
      </div>
    );
  }

  // ─── Active department label (for the filter chip) ─────────────────────
  const activeDeptName =
    departmentFilter === "all"
      ? null
      : (Array.isArray(orgDepartments) ? orgDepartments : []).find(
          (d) => d.id === departmentFilter,
        )?.name;

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <EPPageHeader
        breadcrumb={<>{tCommon("dashboard")} · HR · <b className="text-primary font-semibold">{t("employees")}</b></>}
        title={t("employees")}
        subtitle={t("employeesSubtitle")}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => setImportDialog(true)}
              data-testid="button-import"
              className="gap-1.5"
            >
              <Upload className="h-4 w-4" />
              {tCommon("import")}
            </Button>
            <Button
              onClick={() => setEmployeeDialog({ open: true })}
              data-testid="button-add-employee"
              className="ep-btn-primary-shimmer gap-1.5"
            >
              <Plus className="h-4 w-4" />
              {t("addEmployee")}
            </Button>
          </>
        }
      />

      {/* ── KPI row ─────────────────────────────────────────────────────── */}
      {employeesLoading ? (
        <EPSkeletonKpiRow count={4} />
      ) : !employeesError && (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <EPKpiCard
            label={t("kpi.totalEmployees")}
            value={stats.total}
            icon={Users}
            iconBg="hr"
            enterDelayMs={0}
          />
          <EPKpiCard
            label={t("departments.active")}
            value={stats.active}
            icon={UserCheck}
            iconBg="var(--ep-green)"
            enterDelayMs={60}
          />
          <EPKpiCard
            label={t("kpi.newThisMonth")}
            value={stats.newThisMonth}
            icon={UserPlus}
            iconBg="primary"
            enterDelayMs={120}
          />
          <EPKpiCard
            label={t("departments.inactive")}
            value={stats.inactive}
            icon={UserX}
            iconBg="var(--ep-muted)"
            enterDelayMs={180}
          />
        </div>
      )}

      {/* ── Error branch ────────────────────────────────────────────────── */}
      {employeesError ? (
        <EPErrorState onRetry={refetchEmployees} />
      ) : (
        <>
          {/* ── Filters ─────────────────────────────────────────────────── */}
          <div
            className="ep-fade-up flex items-center gap-3 flex-wrap"
            style={{ animationDelay: "240ms" }}
          >
            <div className="flex-1 min-w-[200px] max-w-md">
              <SearchBar
                placeholder={`${t("employees")} ${tCommon("search").toLowerCase()}...`}
                value={search}
                onChange={setSearch}
              />
            </div>

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full sm:w-[250px] h-9" data-testid="select-org-structure-filter">
                <SelectValue placeholder={t("orgChart")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {tCommon("all")} {t("orgChart").toLowerCase()}
                </SelectItem>
                {(Array.isArray(orgDepartments) ? orgDepartments : []).map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {activeDeptName && (
              <EPStatusPill tone="info" hideDot>
                {activeDeptName}
              </EPStatusPill>
            )}

            <span className="ep-caption ml-auto">
              {t("kpi.totalEmployeesCount", { n: total.toLocaleString() })}
            </span>
          </div>

          {/* ── Table / states ──────────────────────────────────────────── */}
          {employeesLoading ? (
            <EPSkeletonTable rows={8} cols={7} />
          ) : transformedEmployees.length === 0 ? (
            <EPEmptyState
              icon={Users}
              title={search || departmentFilter !== "all" ? t("departments.emptySearchTitle") : t("emptyEmployeesTitle")}
              description={
                search || departmentFilter !== "all"
                  ? t("emptyEmployeesSearchDesc")
                  : t("emptyEmployeesDesc")
              }
              action={
                !search && departmentFilter === "all" && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setImportDialog(true)}
                      className="gap-1.5"
                    >
                      <Upload className="h-4 w-4" />
                      {t("excelImport")}
                    </Button>
                    <Button
                      onClick={() => setEmployeeDialog({ open: true })}
                      className="ep-btn-primary-shimmer gap-1.5"
                    >
                      <Plus className="h-4 w-4" />
                      {t("addEmployee")}
                    </Button>
                  </div>
                )
              }
            />
          ) : (
            <div className="flex flex-col gap-3 min-h-0 flex-1">
              <EmployeeTable
                employees={transformedEmployees}
                onEmployeeClick={(emp) => navigate(`/employees/${emp.id}`)}
                onEdit={(emp) => setEmployeeDialog({ open: true, employee: emp })}
              />

              <Pagination
                currentPage={page}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={total}
                onPageChange={(newPage) => setPage(newPage)}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setPage(1);
                }}
              />
            </div>
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
