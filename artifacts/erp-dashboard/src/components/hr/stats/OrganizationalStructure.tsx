/**
 * @module OrganizationalStructure
 * @description React UI component.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
import { Employee, Subordinate } from "./types";
import { useTranslation } from '@/lib/i18n';

interface OrganizationalStructureProps {
  employee: Employee;
  getInitials: (name: string) => string;
  onNavigate: (path: string) => void;
}

export function OrganizationalStructure({ employee, getInitials, onNavigate }: OrganizationalStructureProps) {
  const { t } = useTranslation("common");
  if (!(employee.positionOfficialTitle || employee.positionCkp || employee.managerName || (employee.subordinates && employee.subordinates.length > 0))) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          <CardTitle>{t("tashkiliyTuzilma")}</CardTitle>
        </div>
        <CardDescription>
          {t("lavozimVaBoysunishMalumotlari")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {(employee.positionOfficialTitle || employee.positionCkp) && (
          <div className="space-y-2">
            <div className="text-sm font-medium">{t("lavozimMalumotlari")}</div>
            <div className="space-y-1">
              {employee.positionOfficialTitle && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{t("rasmiyLavozim")}</span>
                  <span className="text-sm font-medium" data-testid="text-position-official">{employee.positionOfficialTitle}</span>
                </div>
              )}
              {employee.positionCkp && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">ЦКП kodi:</span>
                  <Badge variant="secondary" data-testid="badge-position-ckp">{employee.positionCkp}</Badge>
                </div>
              )}
            </div>
          </div>
        )}

        {employee.managerName && (
          <div className="space-y-2">
            <div className="text-sm font-medium">{t("rahbar")}</div>
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12 rounded-md">
                <AvatarImage src={employee.managerProfileImageUrl} alt={employee.managerName} />
                <AvatarFallback>
                  {getInitials(employee.managerName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="text-sm font-medium" data-testid="text-manager-name">{employee.managerName}</div>
                {employee.managerEmployeeId && (
                  <div className="text-xs text-muted-foreground" data-testid="text-manager-employee-id">
                    Tabel raqami: {employee.managerEmployeeId}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {employee.subordinates && employee.subordinates.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">
              Bo'ysinuvchilar ({employee.subordinates.length})
            </div>
            <div className="space-y-2">
              {(Array.isArray(employee.subordinates) ? employee.subordinates : []).map((sub: Subordinate) => (
                <div key={sub.id} className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
                  <Avatar className="w-12 h-12 rounded-md">
                    <AvatarImage src={sub.profileImageUrl} alt={sub.fullName} />
                    <AvatarFallback>
                      {getInitials(sub.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" data-testid={`text-subordinate-name-${sub.id}`}>{sub.fullName}</div>
                    <div className="text-xs text-muted-foreground">
                      {sub.positionName} • {sub.departmentName}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigate(`/employees/${sub.id}`)}
                    data-testid={`button-view-subordinate-${sub.id}`}
                  >
                    {t("view")}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
