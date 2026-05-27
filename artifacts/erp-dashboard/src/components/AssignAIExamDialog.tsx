/**
 * @module AssignAIExamDialog
 * @description React UI component.
 */

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Users } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

import { EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
interface AssignAIExamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignAIExamDialog({ open, onOpenChange }: AssignAIExamDialogProps) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  interface EmployeeItem {
    id: string;
    fullName: string;
    employeeId: string;
    positionId?: string;
    orgDepartmentId?: string;
    orgDepartmentName?: string;
    orgPositionName?: string;
  }

  interface OrgDept {
    id: string;
    name: string;
  }

  const { data: usersResponse, isLoading: usersLoading } = useQuery<{ data: EmployeeItem[] } | EmployeeItem[]>({
    queryKey: ["/api/hr/employees"],
  });

  const users = Array.isArray(usersResponse) ? usersResponse : (usersResponse?.data || []);

  const { data: orgDepartments = [], isLoading: departmentsLoading } = useQuery<OrgDept[]>({
    queryKey: ["/api/org-departments"],
  });

  const assignMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      const promises = (Array.isArray(userIds) ? userIds : []).map(userId => {
        const user = (Array.isArray(users) ? users : []).find(u => u.id === userId);
        if (!user || !user.positionId) {
          throw new Error(`User ${userId} does not have a position`);
        }
        return apiRequest("POST", "/api/ai-exam/assign", {
          userId,
          positionId: user.positionId,
        });
      });
      return Promise.all(promises).catch((err: unknown) => {
        console.error('AI imtixon tayinlash xatosi:', err);
        return Promise.reject(err);
      });
    },
    onSuccess: () => {
      toast({
        title: "Muvaffaqiyat",
        description: `${selectedUsers.length} ta xodimga AI imtixon tayinlandi`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ai-exam/attempts"] });
      onOpenChange(false);
      setSelectedUsers([]);
      setDepartmentFilter("all");
    },
    onError: (error: Error) => {
      toast({
        title: "Xatolik",
        description: error.message || "AI imtixon tayinlashda xatolik yuz berdi",
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
    assignMutation.mutate(selectedUsers);
  };

  const filteredUsers = (Array.isArray(users) ? users : []).filter(user => {
    if (departmentFilter === "all") return true;
    return user.orgDepartmentId === departmentFilter;
  });

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? (Array.isArray(prev) ? prev : []).filter(id => id !== userId)
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
      <DialogContent className="max-w-2xl max-h-[90vh] p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("aiImtixonTayinlash")}</DialogTitle>
          <DialogDescription>
            {t("xodimlargaAiTomonidanYaratilgan35")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
          <Label htmlFor="deptFilter">{t("tashkiliyTuzilmaBoyichaFilter")}</Label>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger data-testid="select-org-structure-filter" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("barchaTashkiliyTuzilma")}</SelectItem>
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
              <Users className="inline h-4 w-4 mr-1" />
              Xodimlar ({selectedUsers.length} / {filteredUsers.length} tanlangan)
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleAll}
              data-testid="button-toggle-all"
            >
              {selectedUsers.length === filteredUsers.length ? "Tozalash" : "Barchasini tanlash"}
            </Button>
          </div>

          <ScrollArea className="h-64 border border-border rounded-md p-4">
            {usersLoading || departmentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <EPLoader size={24} />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-[13px] text-muted-foreground">
                {t("xodimlarTopilmadi")}
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
                      className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50"
                      data-testid={`user-item-${user.id}`}
                    >
                      <Checkbox
                        id={`user-${user.id}`}
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={() => toggleUser(user.id)}
                        data-testid={`checkbox-${user.id}`}
                      />
                      <label
                        htmlFor={`user-${user.id}`}
                        className="flex-1 cursor-pointer text-sm"
                      >
                        <div className="font-medium">{user.fullName}</div>
                        <div className="text-xs text-muted-foreground">
                          {user.employeeId} • {orgStructure || "Tayinlanmagan"}
                        </div>
                      </label>
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
              {t("cancel")}
            </Button>
            <Button 
              type="submit" 
              disabled={assignMutation.isPending || selectedUsers.length === 0}
              data-testid="button-submit"
            >
              {assignMutation.isPending && <EPLoader className="w-4 h-4 mr-2" />}
              {assignMutation.isPending ? "Tayinlanmoqda..." : "Tayinlash"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
