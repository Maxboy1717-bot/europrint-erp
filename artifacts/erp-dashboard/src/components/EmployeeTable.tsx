import { useState } from "react";
import { Link } from "wouter";
import { formatDate } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreVertical, UserCheck, UserX, Trash2, Building2, Pencil } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export interface Employee {
  id: string;
  fullName: string;
  employeeId: string;
  telegramChatId?: string;
  birthDate?: string;
  hireDate?: string;
  address?: string;
  attestationDate?: string;
  orgStructure?: string;
  phone?: string;
  coursesCompleted: number;
  coursesTotal: number;
  rating?: number;
  bonusAmount?: number;
  status: "active" | "inactive" | "resigned";
  failedTests?: number;
  disciplineCount?: number;
  profileImageUrl?: string;
}

interface EmployeeTableProps {
  employees: Employee[];
  onEmployeeClick?: (employee: Employee) => void;
  onEdit?: (employee: Employee) => void;
}

export function EmployeeTable({ employees, onEmployeeClick, onEdit }: EmployeeTableProps) {
  const { toast } = useToast();
  const [confirmDeleteEmployee, setConfirmDeleteEmployee] = useState<{ id: string; name: string } | null>(null);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      // Backend: PATCH /api/employees/:id/status
      return await apiRequest("PATCH", `/api/employees/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Muvaffaqiyat",
        description: "Xodim holati yangilandi",
      });
    },
    onError: () => {
      toast({
        title: "Xato",
        description: "Xodim holatini yangilashda xatolik",
        variant: "destructive",
      });
    },
  });


  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Backend: DELETE /api/employees/:id (employees-compat.controller.ts)
      return await apiRequest("DELETE", `/api/employees/${id}`);
    },
    onSuccess: () => {
      // Frontend Employees.tsx ishlatadigan key
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      // Eski legacy key'lar (boshqa joylarda hali ishlatilishi mumkin)
      queryClient.invalidateQueries({ queryKey: ["/api/hr/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Muvaffaqiyat",
        description: "Xodim o'chirildi",
      });
    },
    onError: () => {
      toast({
        title: "Xato",
        description: "Xodimni o'chirishda xatolik",
        variant: "destructive",
      });
    },
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return { className: "bg-green-100 text-green-800", label: "Ishlamoqda" };
      case "resigned":
        return { className: "bg-amber-100 text-amber-800", label: "Ishdan ketgan" };
      case "inactive":
        return { className: "bg-surface-container text-on-surface-variant", label: "Nofaol" };
      default:
        return { className: "bg-surface-container text-on-surface-variant", label: status };
    }
  };


  return (
    <>
      <div className="rounded-lg border border-outline-variant overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Xodim</TableHead>
              <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Telegram ID</TableHead>
              <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Tabel raqami</TableHead>
              <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Ish staji</TableHead>
              <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Tashkiliy tuzilma</TableHead>
              <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Attestatsiya</TableHead>
              <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Reyting</TableHead>
              <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Yiqilgan testlar</TableHead>
              <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Bonus</TableHead>
              <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6">Holat</TableHead>
              <TableHead className="bg-surface-container text-xs font-semibold uppercase tracking-wider text-on-surface-variant py-3 px-6 w-12"></TableHead>
            </TableRow>
          </TableHeader>
        <TableBody>
          {(Array.isArray(employees) ? employees : []).map((employee) => (
            <TableRow 
              key={employee.id}
              className="hover:bg-surface-container-low transition-colors cursor-pointer"
              onClick={() => onEmployeeClick?.(employee)}
              data-testid={`row-employee-${employee.id}`}
            >
              <TableCell className="px-6">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 rounded-full bg-primary-container border border-outline-variant">
                    {employee.profileImageUrl && (
                      <AvatarImage src={employee.profileImageUrl} alt={employee.fullName} />
                    )}
                    <AvatarFallback className="text-sm font-semibold text-on-primary-container">
                      {getInitials(employee.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-on-surface">{employee.fullName}</span>
                </div>
              </TableCell>
              <TableCell className="px-6 text-on-surface-variant">
                {employee.telegramChatId || "—"}
              </TableCell>
              <TableCell className="px-6 text-on-surface">
                {employee.employeeId}
              </TableCell>
              <TableCell className="px-6 text-on-surface-variant">
                  {employee.hireDate ? (() => {
                    const hireDate = new Date(employee.hireDate);
                    const now = new Date();
                    const diffTime = Math.abs(now.getTime() - hireDate.getTime());
                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                    const years = Math.floor(diffDays / 365);
                    const months = Math.floor((diffDays % 365) / 30);
                    
                    if (years > 0 && months > 0) return `${years} yil ${months} oy`;
                    if (years > 0) return `${years} yil`;
                    if (months > 0) return `${months} oy`;
                    return `${diffDays} kun`;
                  })() : "—"}
              </TableCell>
              <TableCell className="px-6">
                {employee.orgStructure ? (
                  <Link 
                    href="/org-structure/hierarchy" 
                    className="hover:underline text-primary font-medium"
                    onClick={(e) => e.stopPropagation()}
                    data-testid={`link-org-structure-${employee.id}`}
                  >
                    {employee.orgStructure}
                  </Link>
                ) : (
                  <span className="text-red-600 text-xs flex items-center gap-1 font-medium">
                    <Building2 className="w-3 h-3" />
                    Tayinlanmagan
                  </span>
                )}
              </TableCell>
              <TableCell className="px-6 text-on-surface-variant">
                {formatDate(employee.attestationDate)}
              </TableCell>
              <TableCell className="px-6 text-on-surface">
                <div className="flex items-center gap-2">
                  {employee.rating !== undefined && employee.rating > 0 ? (
                    <>
                      <span className="font-bold text-primary">{employee.rating.toFixed(1)}</span>
                      <div className="flex">
                        {([1, 2, 3, 4, 5]).map((star) => (
                          <span
                            key={star}
                            className={`text-sm ${
                              star <= Math.round(employee.rating!) ? "text-primary" : "text-surface-container-high"
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <span className="text-on-surface-variant">—</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="px-6 text-on-surface">
                {employee.failedTests !== undefined && employee.failedTests > 0 ? (
                  <Badge variant="destructive" className="bg-red-100 text-red-800 rounded-full px-2.5 py-0.5 text-xs font-semibold" data-testid={`badge-failed-tests-${employee.id}`}>
                    {employee.failedTests}
                  </Badge>
                ) : (
                  <span className="text-on-surface-variant">—</span>
                )}
              </TableCell>
              <TableCell className="px-6 text-on-surface">
                {employee.bonusAmount !== undefined && employee.bonusAmount > 0 ? (
                  <Badge className="bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                    +{employee.bonusAmount.toLocaleString()}
                  </Badge>
                ) : (
                  <span className="text-on-surface-variant">—</span>
                )}
              </TableCell>
              <TableCell className="px-6">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(employee.status).className}`}>
                  {getStatusBadge(employee.status).label}
                </span>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => e.stopPropagation()}
                      data-testid={`button-actions-${employee.id}`}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuLabel>Harakatlar</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {onEdit && (
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(employee);
                        }}
                        data-testid={`action-edit-${employee.id}`}
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        Tahrirlash
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = "/org-structure/hierarchy";
                      }}
                      data-testid={`action-org-structure-${employee.id}`}
                    >
                      <Building2 className="w-4 h-4 mr-2" />
                      Tashkiliy tuzilmaga o'tish
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {employee.status !== "active" && (
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          updateStatusMutation.mutate({ id: employee.id, status: "active" });
                        }}
                        data-testid={`action-set-active-${employee.id}`}
                      >
                        <UserCheck className="w-4 h-4 mr-2" />
                        Ishlamoqda
                      </DropdownMenuItem>
                    )}
                    {employee.status !== "resigned" && (
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          updateStatusMutation.mutate({ id: employee.id, status: "resigned" });
                        }}
                        data-testid={`action-set-resigned-${employee.id}`}
                      >
                        <UserX className="w-4 h-4 mr-2" />
                        Ishdan ketgan
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteEmployee({ id: employee.id, name: employee.fullName });
                      }}
                      className="text-destructive"
                      data-testid={`action-delete-${employee.id}`}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      O'chirish
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>

    <ConfirmDialog
      open={confirmDeleteEmployee !== null}
      onOpenChange={(open) => { if (!open) setConfirmDeleteEmployee(null); }}
      title="Xodimni o'chirish"
      description={`Haqiqatan ham ${confirmDeleteEmployee?.name ?? ''} ni o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.`}
      confirmText="O'chirish"
      cancelText="Bekor qilish"
      variant="destructive"
      onConfirm={() => { if (confirmDeleteEmployee) deleteMutation.mutate(confirmDeleteEmployee.id); }}
    />
    </>
  );
}
