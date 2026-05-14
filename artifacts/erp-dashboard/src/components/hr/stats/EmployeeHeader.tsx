/**
 * @module EmployeeHeader
 * @description React UI component.
 */

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";
import { Employee } from "./types";
import { useTranslation } from '@/lib/i18n';

interface EmployeeHeaderProps {
  employee: Employee;
  getInitials: (name: string) => string;
  getStatusBadge: (status: string) => { label: string; variant: string };
}

export function EmployeeHeader({ employee, getInitials, getStatusBadge }: EmployeeHeaderProps) {
  const { t } = useTranslation("common");
  return (
    <>
      <Card className="bg-card rounded-lg border border-border overflow-hidden shadow-none">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="flex-shrink-0">
              <Avatar className="rounded-lg bg-primary/10 border border-border" style={{ width: '120px', height: '120px' }}>
                <AvatarImage src={employee.profileImageUrl} alt={employee.fullName} className="object-cover" />
                <AvatarFallback className="text-4xl font-bold text-primary">
                  {getInitials(employee.fullName)}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1">
              <CardTitle className="text-[14px] font-semibold font-bold text-foreground">{employee.fullName}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-muted-foreground font-medium">
                  {employee.departmentName} • {employee.positionName}
                </p>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${employee.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-muted/60 text-muted-foreground'}`}>
                  {getStatusBadge(employee.status).label}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-3">
                {employee.rating > 0 && (
                  <div className="flex items-center gap-1 bg-muted/60 rounded-full px-2 py-1">
                    <Star className="w-4 h-4 fill-primary text-primary" />
                    <span className="text-sm font-bold text-foreground">{employee.rating.toFixed(1)}</span>
                  </div>
                )}
                {employee.failedTests > 0 && (
                  <span className="bg-red-100 text-red-800 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                    {employee.failedTests} ta yiqilgan test
                  </span>
                )}
                {employee.bonusAmount > 0 && (
                  <span className="bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                    +{employee.bonusAmount.toLocaleString()} so'm
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-card rounded-lg border border-border overflow-hidden shadow-none">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">{t("tabelRaqami")}</div>
              <div className="font-medium" data-testid="text-employee-id">{employee.employeeId}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{t("phone")}</div>
              <div className="font-medium" data-testid="text-phone">{employee.phone || "—"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{t("tugilganKun")}</div>
              <div className="font-medium" data-testid="text-birthdate">{employee.birthDate || "—"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{t("address")}</div>
              <div className="font-medium" data-testid="text-address">{employee.address || "—"}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
