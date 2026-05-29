import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserCheck, Hash, AlertTriangle, AlertCircle, CheckCircle, Pencil } from "lucide-react";
import { Employee, AbcAnalysis, OrgStructureAssignment, EmploymentContract, Certificate, SalaryHistoryRecord } from "@/pages/employee-profile/profile-types";
import { RoleGate, PII_VIEWER_ROLES } from "@/components/RoleGate";
import { tLabel } from "@/lib/i18n/tLabel";

interface ProfileHeaderProps {
  employee: Employee;
  abcData?: AbcAnalysis;
  orgStructureData?: { primary: OrgStructureAssignment; all: OrgStructureAssignment[] };
  contracts?: EmploymentContract[];
  certificatesData?: Certificate[];
  payrollSummary?: { totalSalary?: number; periodName?: string; [key: string]: unknown };
  salaryHistory?: SalaryHistoryRecord[];
  expiredCerts: Certificate[];
  expiringSoonCerts: Certificate[];
  getInitials: (name: string) => string;
  /** Optional callback to open the edit-profile dialog. */
  onEdit?: () => void;
  /** Optional attendance summary used by the header's quick stats. */
  attendanceStats?: unknown;
  /** Optional raw attendance records passed through for downstream widgets. */
  attendanceData?: unknown;
}

export function ProfileHeader({
  employee,
  abcData,
  orgStructureData,
  contracts,
  certificatesData,
  payrollSummary,
  salaryHistory,
  expiredCerts,
  expiringSoonCerts,
  getInitials,
  onEdit,
}: ProfileHeaderProps) {
  return (
    <Card className="border border-outline-variant shadow-none overflow-hidden">
      <CardContent className="p-0">
        {expiredCerts.length > 0 && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-2.5 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800 font-medium">
              {expiredCerts.length} ta sertifikat muddati o'tgan — darrov yangilash zarur
            </p>
          </div>
        )}
        {!expiredCerts.length && expiringSoonCerts.length > 0 && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800 font-medium">
              {expiringSoonCerts.length} ta sertifikat 30 kun ichida tugaydi
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row">
          <div
            className="relative flex-shrink-0 sm:w-52 flex flex-col items-center justify-center"
            style={{ background: "linear-gradient(160deg, #1e40af 0%, #4f46e5 60%, #7c3aed 100%)" }}
          >
            <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
              <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full border-2 border-white" />
              <div className="absolute top-4 right-4 w-16 h-16 rounded-full border border-white" />
            </div>

            <div className="relative py-6 px-4 flex flex-col items-center gap-3">
              <div className="relative w-36 h-44 rounded-md overflow-hidden border-2 border-white/30 shadow-lg flex-shrink-0">
                {employee.profileImageUrl ? (
                  <img
                    src={employee.profileImageUrl}
                    alt={employee.fullName}
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <div
                    className="w-full h-full flex flex-col items-center justify-center gap-2"
                    style={{ background: "rgba(255,255,255,0.12)" }}
                  >
                    <span className="text-5xl font-black text-white leading-none select-none">
                      {getInitials(employee.fullName)}
                    </span>
                    <span className="text-white/60 text-xs">Europrint</span>
                  </div>
                )}
                <div className="absolute bottom-2 right-2">
                  {employee.status === "active" ? (
                    <span className="flex h-4 w-4 rounded-full bg-green-400 border-2 border-white shadow" />
                  ) : employee.status === "on_leave" ? (
                    <span className="flex h-4 w-4 rounded-full bg-blue-400 border-2 border-white shadow" />
                  ) : (
                    <span className="flex h-4 w-4 rounded-full bg-amber-400 border-2 border-white shadow" />
                  )}
                </div>
              </div>

              {employee.employeeId && (
                <div className="bg-white/15 rounded px-3 py-1 flex items-center gap-1.5">
                  <Hash className="h-3 w-3 text-white/70" />
                  <span className="text-white text-xs font-mono font-semibold tracking-widest">{employee.employeeId}</span>
                </div>
              )}

              {abcData && (
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border-2 border-white/30
                    ${abcData.grade === 'A' ? 'bg-green-400/90 text-white' : abcData.grade === 'B' ? 'bg-blue-300/90 text-white' : 'bg-amber-400/90 text-white'}`}
                >
                  <span className="text-base font-black leading-none">{abcData.grade}</span>
                  <span>{abcData.grade === 'A' ? "Flagman" : abcData.grade === 'B' ? "O'rtacha" : "Rivojlanish"}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex flex-wrap items-start justify-between gap-3 px-6 pt-5 pb-4">
              <div className="min-w-0">
                <h2 className="text-2xl font-bold text-foreground leading-tight tracking-tight">
                  {employee.fullName}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  <span className="font-semibold text-foreground">
                    {orgStructureData?.primary?.positionName || "—"}
                  </span>
                  {orgStructureData?.primary?.departmentName && (
                    <> · <span>{orgStructureData.primary.departmentName}</span></>
                  )}
                  {employee.shift && <> · <span className="text-muted-foreground">{employee.shift}</span></>}
                </p>

                <div className="flex flex-wrap gap-2 mt-2.5">
                  {employee.status === "active" ? (
                    <Badge className="bg-green-100 text-green-800 border-none gap-1">
                      <UserCheck className="h-3 w-3" /> Faol
                    </Badge>
                  ) : employee.status === "on_leave" ? (
                    <Badge className="bg-blue-100 text-blue-800 border-none">{tLabel("employee.status.on_leave", "Ta'tilda")}</Badge>
                  ) : employee.status === "sick" ? (
                    <Badge className="bg-purple-100 text-purple-800 border-none">Kasalxonada</Badge>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-800 border-none">{employee.status}</Badge>
                  )}
                  {contracts && contracts.length > 0 && (
                    <Badge variant="outline" className="text-xs border-outline-variant">
                      {contracts[0].contractType === "indefinite" ? "Doimiy shartnoma"
                        : contracts[0].contractType === "temporary" ? "Vaqtinchalik"
                        : contracts[0].contractType === "probation" ? "Sinov muddati"
                        : contracts[0].contractType}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onEdit}
                    className="gap-1.5 shrink-0"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    {tLabel("employee.edit", "Tahrirlash")}
                  </Button>
                )}
                <div className="text-right" data-testid="profile-header-salary">
                  <RoleGate
                    roles={PII_VIEWER_ROLES}
                    ownerUserId={employee.id}
                    fallback={
                      <>
                        <p className="text-2xl font-black text-muted-foreground leading-none" data-testid="salary-masked">•••••</p>
                        <p className="text-xs text-emerald-400 mt-1">Maxfiy</p>
                      </>
                    }
                  >
                    {payrollSummary?.totalSalary ? (
                      <>
                        <div className="flex items-end gap-1">
                          <span className="text-2xl font-black text-emerald-700 leading-none">
                            {(Math.round(Number(payrollSummary.totalSalary)) / 1000000).toFixed(1)}M
                          </span>
                          <span className="text-sm text-emerald-400 mb-0.5">UZS</span>
                        </div>
                        <p className="text-xs text-emerald-400 mt-1">{payrollSummary.periodName || "So'nggi davr"}</p>
                      </>
                    ) : salaryHistory && salaryHistory.length > 0 ? (
                      <>
                        <div className="flex items-end gap-1">
                          <span className="text-2xl font-black text-emerald-700 leading-none">
                            {(Math.round(Number(salaryHistory[0].newSalary)) / 1000000).toFixed(1)}M
                          </span>
                          <span className="text-sm text-emerald-400 mb-0.5">UZS</span>
                        </div>
                        <p className="text-xs text-emerald-400 mt-1">Maosh tarixi</p>
                      </>
                    ) : (
                      <>
                        <p className="text-2xl font-black text-muted-foreground leading-none">—</p>
                        <p className="text-xs text-emerald-400 mt-1">{tLabel("employee.salary.no_data", "Ma'lumot yo'q")}</p>
                      </>
                    )}
                  </RoleGate>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
