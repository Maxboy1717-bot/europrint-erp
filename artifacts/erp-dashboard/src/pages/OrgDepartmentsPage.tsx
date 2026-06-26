/**
 * @module OrgDepartmentsPage
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ModulePage } from "@/components/ui/module-page";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Plus, Search, Users, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { EPErrorState, EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

interface Department {
  id: string;
  name: string;
  code?: string;
  parentId?: string | null;
  employeeCount?: number;
  isActive?: boolean;
  head?: string;
}

export default function OrgDepartmentsPage() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");

  const { data: departments = [], isLoading, isError, error, refetch } = useQuery<Department[]>({
    queryKey: ["/api/core/departments"],
    select: (data) => (Array.isArray(data) ? data : (data as { data?: Department[] })?.data ?? []),
  });

  const createMutation = useMutation({
    mutationFn: async ({ name, code }: { name: string; code: string }) => {
      return await apiRequest("POST", "/api/core/departments", { name, code });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/core/departments"] });
      toast({ title: t("bolimYaratildi") });
      setShowCreate(false);
      setNewName("");
      setNewCode("");
    },
    onError: () => {
      toast({ title: t("xatolikTitle"), description: t("bolimYaratishdaXatolik"), variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/core/departments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/core/departments"] });
      toast({ title: t("bolimOchirildi") });
      setDeleteId(null);
    },
    onError: () => {
      toast({ title: t("xatolikTitle"), description: t("bolimniOchirishdaXatolik"), variant: "destructive" });
    },
  });

  if (isError) return <EPErrorState onRetry={refetch}  error={error} />;

  const filtered = departments.filter(d =>
    d.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.code?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <ModulePage
      module="hr"
      title={t("tashkiliyBolimlar")}
      icon={<Building2 className="h-5 w-5" />}
      actions={
        <Button onClick={() => setShowCreate(true)} data-testid="button-create-department">
          <Plus className="h-4 w-4 mr-2" />
          {t("bolimQoshish")}
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("bolimQidirish")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-departments"
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {([1, 2, 3, 4, 5, 6]).map(i => (
              <Card key={`k-${i}`}>
                <CardContent className="p-4">
                  <Skeleton className="h-5 w-32 mb-2 rounded-lg" />
                  <Skeleton className="h-4 w-20 rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {search ? t("qidiruvNatijasiTopilmadi") : t("bolimlarMavjudEmas")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(dept => (
              <Card
                key={dept.id}
                className="hover:shadow-md transition-shadow"
                data-testid={`card-department-${dept.id}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{dept.name}</CardTitle>
                    <div className="flex items-center gap-1">
                      {dept.isActive !== false ? (
                        <EPStatusPill tone="neutral" className="text-xs">{t("active")}</EPStatusPill>
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">{t("inactive")}</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteId(dept.id)}
                        data-testid={`button-delete-department-${dept.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  {dept.code && (
                    <p className="text-xs text-muted-foreground font-mono">{dept.code}</p>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  {dept.employeeCount !== undefined && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      <span>{t("xodimSoni", { count: dept.employeeCount })}</span>
                    </div>
                  )}
                  {dept.head && (
                    <p className="text-xs text-muted-foreground mt-1">{t("rahbarLabel", { name: dept.head })}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">{t("yangiBolim")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="dept-name">{t("nomi")}</Label>
              <Input
                id="dept-name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder={t("bolimNomi")}
                data-testid="input-department-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dept-code">{t("kodi")}</Label>
              <Input
                id="dept-code"
                value={newCode}
                onChange={e => setNewCode(e.target.value)}
                placeholder={t("bolim001")}
                data-testid="input-department-code"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>{t("Bekor")}</Button>
            <Button
              onClick={() => {
                if (!newName.trim()) return;
                createMutation.mutate({ name: newName.trim(), code: newCode.trim() });
              }}
              disabled={!newName.trim() || createMutation.isPending}
              data-testid="button-confirm-create-department"
            >
              {createMutation.isPending ? t("saqlanmoqda") : t("saqlash")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent data-testid="dialog-confirm-delete-department">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("ochirishniTasdiqlash")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("haqiqatanHamBuBolimniOchirmoqchimisiz")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Bekor")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deleteId) deleteMutation.mutate(deleteId); }}
              data-testid="button-confirm-delete-department"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ModulePage>
  );
}
