/**
 * @module EmployeeFilesPage
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ModulePage } from "@/components/ui/module-page";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderOpen, Plus, Search, FileText, Trash2, Download, ExternalLink } from "lucide-react";
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { EPErrorState, EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

interface EmployeeFile {
  id: string;
  file_name?: string;
  fileName?: string;
  file_type?: string;
  fileType?: string;
  file_url?: string;
  fileUrl?: string;
  employee_id?: string;
  employeeId?: string;
  employee_name?: string;
  employeeName?: string;
  created_at?: string;
  createdAt?: string;
}

const FILE_TYPES = ["passport", "diploma", "contract", "certificate", "medical", "other"] as const;
const FILE_TYPE_LABELS: Record<string, string> = {
  passport:    "Pasport",
  diploma:     "Diplom",
  contract:    "Shartnoma",
  certificate: "Sertifikat",
  medical:     "Tibbiy hujjat",
  other:       "Boshqa",
};

export default function EmployeeFilesPage() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ file_name: "", file_type: "other", file_url: "" });

  const { data: rawData, isLoading, isError, error, refetch } = useQuery<EmployeeFile[] | { data?: EmployeeFile[]; files?: EmployeeFile[] }>({
    queryKey: ["/api/employee-files"],
  });

  const files: EmployeeFile[] = Array.isArray(rawData)
    ? rawData
    : (rawData as { data?: EmployeeFile[] })?.data
      ?? (rawData as { files?: EmployeeFile[] })?.files
      ?? [];

  const createMutation = useMutation({
    mutationFn: async (dto: typeof form) => {
      return await apiRequest("POST", "/api/employee-files", dto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee-files"] });
      toast({ title: "Fayl qo'shildi" });
      setShowCreate(false);
      setForm({ file_name: "", file_type: "other", file_url: "" });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Fayl qo'shishda xatolik", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/employee-files/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee-files"] });
      toast({ title: "Fayl o'chirildi" });
      setDeleteId(null);
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Faylni o'chirishda xatolik", variant: "destructive" });
    },
  });

  if (isError) return <EPErrorState onRetry={refetch}  error={error} />;

  const filtered = files.filter(f => {
    const name = f.file_name ?? f.fileName ?? "";
    const emp  = f.employee_name ?? f.employeeName ?? "";
    return name.toLowerCase().includes(search.toLowerCase()) || emp.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <ModulePage
      module="hr"
      title={t("xodimFayllari1")}
      icon={<FolderOpen className="h-5 w-5" />}
      actions={
        <Button onClick={() => setShowCreate(true)} data-testid="button-add-file">
          <Plus className="h-4 w-4 mr-2" />
          {t("faylQoshish")}
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("faylQidirish")}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-files"
          />
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {([1, 2, 3]).map(i => (
              <Card key={`k-${i}`}>
                <CardContent className="p-4 flex gap-3 items-center">
                  <Skeleton className="h-9 w-9 rounded rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-40 rounded-lg" />
                    <Skeleton className="h-3 w-24 rounded-lg" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {search ? "Qidiruv natijasi topilmadi" : "Fayllar mavjud emas"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map(f => {
              const name    = f.file_name ?? f.fileName ?? "—";
              const type    = f.file_type ?? f.fileType ?? "other";
              const url     = f.file_url  ?? f.fileUrl;
              const empName = f.employee_name ?? f.employeeName;
              return (
                <Card key={f.id} className="hover:shadow-md transition-shadow" data-testid={`card-file-${f.id}`}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-9 w-9 rounded bg-muted flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{name}</p>
                      {empName && (
                        <p className="text-xs text-muted-foreground truncate">{empName}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <EPStatusPill tone="neutral" className="text-xs">
                        {FILE_TYPE_LABELS[type] ?? type}
                      </EPStatusPill>
                      {url && (
                        <a href={url} target="_blank" rel="noreferrer">
                          <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-open-file-${f.id}`}>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </a>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteId(f.id)}
                        data-testid={`button-delete-file-${f.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">{t("faylQoshish")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>{t("faylNomi1")}</Label>
              <Input
                value={form.file_name}
                onChange={e => setForm(f => ({ ...f, file_name: e.target.value }))}
                placeholder={t("passportPdf")}
                data-testid="input-file-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("faylTuri")}</Label>
              <Select value={form.file_type} onValueChange={v => setForm(f => ({ ...f, file_type: v }))}>
                <SelectTrigger data-testid="select-file-type" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FILE_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{FILE_TYPE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("faylUrl1")}</Label>
              <Input
                value={form.file_url}
                onChange={e => setForm(f => ({ ...f, file_url: e.target.value }))}
                placeholder="https://..."
                data-testid="input-file-url"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>{t("Bekor")}</Button>
            <Button
              onClick={() => { if (form.file_name.trim()) createMutation.mutate(form); }}
              disabled={!form.file_name.trim() || createMutation.isPending}
              data-testid="button-confirm-add-file"
            >
              {createMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent data-testid="dialog-confirm-delete-file">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("ochirishniTasdiqlash")}</AlertDialogTitle>
            <AlertDialogDescription>{t("haqiqatanHamBuFaylniOchirmoqchimisiz")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Bekor")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deleteId) deleteMutation.mutate(deleteId); }}
              data-testid="button-confirm-delete-file"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ModulePage>
  );
}
