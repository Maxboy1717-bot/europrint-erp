import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";
import { Employee } from "./types";

interface EmployeeHeaderProps {
  employee: Employee;
  getInitials: (name: string) => string;
  getStatusBadge: (status: string) => { label: string; variant: string };
}

export function EmployeeHeader({ employee, getInitials, getStatusBadge }: EmployeeHeaderProps) {
  return (
    <>
      <Card className="bg-surface-container-lowest rounded-lg border border-outline-variant overflow-hidden shadow-none">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="flex-shrink-0">
              <Avatar className="rounded-lg bg-primary-container border border-outline-variant" style={{ width: '120px', height: '120px' }}>
                <AvatarImage src={employee.profileImageUrl} alt={employee.fullName} className="object-cover" />
                <AvatarFallback className="text-4xl font-bold text-on-primary-container">
                  {getInitials(employee.fullName)}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl font-bold text-on-surface">{employee.fullName}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-on-surface-variant font-medium">
                  {employee.departmentName} • {employee.positionName}
                </p>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${employee.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-surface-container text-on-surface-variant'}`}>
                  {getStatusBadge(employee.status).label}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-3">
                {employee.rating > 0 && (
                  <div className="flex items-center gap-1 bg-surface-container rounded-full px-2 py-1">
                    <Star className="w-4 h-4 fill-primary text-primary" />
                    <span className="text-sm font-bold text-on-surface">{employee.rating.toFixed(1)}</span>
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
      <Card className="bg-surface-container-lowest rounded-lg border border-outline-variant overflow-hidden shadow-none">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Tabel raqami</div>
              <div className="font-medium" data-testid="text-employee-id">{employee.employeeId}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Telefon</div>
              <div className="font-medium" data-testid="text-phone">{employee.phone || "—"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Tug'ilgan kun</div>
              <div className="font-medium" data-testid="text-birthdate">{employee.birthDate || "—"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Manzil</div>
              <div className="font-medium" data-testid="text-address">{employee.address || "—"}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
