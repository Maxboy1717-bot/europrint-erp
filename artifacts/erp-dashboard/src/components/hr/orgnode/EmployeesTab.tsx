/**
 * @module EmployeesTab
 * @description React UI component.
 */

import { useLocation } from "wouter";
import { Users, Clock, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { NodeDetail } from "./types";

interface EmployeesTabProps {
  node: NodeDetail;
}

export function EmployeesTab({ node }: EmployeesTabProps) {
  const [, navigate] = useLocation();

  if (node.employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
        <Users className="h-10 w-10" />
        <p>Bu bo'limda xodimlar yo'q</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {(Array.isArray(node.employees) ? node.employees : []).map((emp) => {
        const isActive = !emp.status || emp.status === "active";
        return (
          <Card key={emp.id}
            className="hover:shadow transition-shadow cursor-pointer"
            onClick={() => navigate(`/employees/${emp.id}`)}>
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                {emp.fullName?.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm truncate">{emp.fullName}</p>
                  {emp.status && !isActive && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                      {emp.status === "fired" ? "Ishdan ketgan" :
                       emp.status === "vacation" ? "Ta'tilda" :
                       emp.status}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  {emp.employeeId && (
                    <span className="text-xs text-muted-foreground">#{emp.employeeId}</span>
                  )}
                  {emp.role && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                      {emp.role}
                    </Badge>
                  )}
                  {emp.salary != null && (
                    <span className="text-xs text-[var(--ep-green)] font-medium flex items-center gap-0.5">
                      {Number(emp.salary).toLocaleString("uz-UZ")} so'm
                    </span>
                  )}
                  {emp.yearsOfService != null && emp.yearsOfService > 0 && (
                    <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                      <Clock className="h-2.5 w-2.5" />
                      {emp.yearsOfService} yil staj
                    </span>
                  )}
                </div>
              </div>
              {emp.phone && (
                <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">{emp.phone}</span>
              )}
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
