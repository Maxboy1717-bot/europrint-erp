import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Users } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AssignCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseTitle: string;
}

export function AssignCourseDialog({ open, onOpenChange, courseId, courseTitle }: AssignCourseDialogProps) {
  const { toast } = useToast();
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Dialog ochilganda yoki yopilganda state'ni reset qilish
  useEffect(() => {
    if (!open) {
      setDepartmentFilter("all");
      setSelectedUsers([]);
      setStartDate("");
      setEndDate("");
    }
  }, [open]);

  interface EmployeeItem {
    id: string;
    fullName: string;
    employeeId: string;
    orgDepartmentId?: string;
    orgDepartmentName?: string;
    orgPositionName?: string;
  }

  interface OrgDept {
    id: string;
    name: string;
  }

  const { data: usersResponse, isLoading: usersLoading } = useQuery<{ data: EmployeeItem[] } | EmployeeItem[]>({
    queryKey: ["/api/employees"],
  });
  
  const users = Array.isArray(usersResponse) ? usersResponse : (usersResponse?.data || []);

  const { data: orgDepartments = [], isLoading: departmentsLoading } = useQuery<OrgDept[]>({
    queryKey: ["/api/org-departments"],
  });

  const assignMutation = useMutation({
    mutationFn: async (data: { userIds: string[], startDate: string, endDate: string }) => {
      const promises = (data.userIds ?? []).map(userId =>
        apiRequest("POST", "/api/assignments", {
          userId,
          courseId,
          startDate: data.startDate || null,
          endDate: data.endDate || null,
        }).then(res => res.json())
      );
      return Promise.all(promises).catch((err: unknown) => {
        console.error('Kurs tayinlash xatosi:', err);
        return Promise.reject(err);
      });
    },
    onSuccess: () => {
      toast({
        title: "Muvaffaqiyat",
        description: `${selectedUsers.length} ta xodimga kurs tayinlandi`,
      });
      onOpenChange(false);
      // State reset useEffect tomonidan avtomatik amalga oshiriladi
    },
    onError: () => {
      toast({
        title: "Xatolik",
        description: "Kurs tayinlashda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUsers.length === 0) {
      toast({
        title: "Ogohlantirish",
        description: "Kamida bitta xodim tanlang",
        variant: "destructive",
      });
      return;
    }
    assignMutation.mutate({ userIds: selectedUsers, startDate, endDate });
  };

  const filteredUsers = (Array.isArray(users) ? users : []).filter(user => {
    if (departmentFilter === "all") return true;
    return user.orgDepartmentId === departmentFilter;
  });

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? (prev ?? []).filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers((Array.isArray(filteredUsers) ? filteredUsers : []).map(u => u.id));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Kursni tayinlash</DialogTitle>
          <DialogDescription>
            "{courseTitle}" kursini xodimlarga tayinlang
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">📅 Boshlanish sanasi</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                data-testid="input-start-date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">⏰ Tugash sanasi</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                data-testid="input-end-date"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deptFilter">Tashkiliy tuzilma bo'yicha filter</Label>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger data-testid="select-org-structure-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha tashkiliy tuzilma</SelectItem>
                {(Array.isArray(orgDepartments) ? orgDepartments : []).map(dept => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label>
              Xodimlar ({selectedUsers.length} / {filteredUsers.length} tanlangan)
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleAll}
            >
              {selectedUsers.length === filteredUsers.length ? "Bekor qilish" : "Barchasini tanlash"}
            </Button>
          </div>

          <ScrollArea className="h-[300px] border rounded-md p-4">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Xodimlar topilmadi</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(Array.isArray(filteredUsers) ? filteredUsers : []).map((user) => {
                  const orgStructure = user.orgDepartmentName 
                    ? `${user.orgDepartmentName}${user.orgPositionName ? ` → ${user.orgPositionName}` : ''}`
                    : null;
                  return (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-3 rounded-md border hover-elevate cursor-pointer"
                      onClick={(e) => {
                        if ((e.target as HTMLElement).tagName !== 'BUTTON') {
                          toggleUser(user.id);
                        }
                      }}
                      data-testid={`user-${user.id}`}
                    >
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onClick={(e) => e.stopPropagation()}
                        onCheckedChange={() => toggleUser(user.id)}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{user.fullName}</p>
                        <p className="text-sm text-muted-foreground">
                          {user.employeeId} • {orgStructure || "Tayinlanmagan"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={assignMutation.isPending}
            >
              Bekor qilish
            </Button>
            <Button type="submit" disabled={assignMutation.isPending} data-testid="button-submit-assign">
              {assignMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Tayinlash ({selectedUsers.length})
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
