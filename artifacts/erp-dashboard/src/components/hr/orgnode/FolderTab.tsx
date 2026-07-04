/**
 * @module FolderTab
 * @description React UI component.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { FolderOpen, Plus, FileText, Video, ClipboardList, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FolderItem } from "./types";

import { useTranslation } from '@/lib/i18n';
import { EPLoader } from "@/components/ep";
interface FolderTabProps {
  nodeId: string | number;
}

export function FolderTab({nodeId }: FolderTabProps) {
  const { t } = useTranslation('common');
  const { toast } = useToast();
  const [addFolderOpen, setAddFolderOpen] = useState(false);
  const [folderForm, setFolderForm] = useState({
    itemType: "document" as "document" | "video" | "test",
    title: "",
    url: "",
    description: "",
  });

  const { data: folderItems = [], isLoading: folderLoading, refetch: refetchFolder } = useQuery<FolderItem[]>({
    queryKey: [`/api/org-structure/nodes/${nodeId}/folder`],
    enabled: !!nodeId,
  });

  const addFolderItemMutation = useMutation({
    mutationFn: (dto: typeof folderForm) => apiRequest("POST", `/api/org-structure/nodes/${nodeId}/folder`, dto),
    onSuccess: () => {
      toast({ title: "Element qo'shildi" });
      setAddFolderOpen(false);
      setFolderForm({ itemType: "document", title: "", url: "", description: "" });
      refetchFolder();
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  const removeFolderItemMutation = useMutation({
    mutationFn: (itemId: number) => apiRequest("DELETE", `/api/org-structure/nodes/${nodeId}/folder/${itemId}`),
    onSuccess: () => {
      toast({ title: "O'chirildi" });
      refetchFolder();
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  if (folderLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <EPLoader size={32} tone="muted" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-primary" />
            {t("lavozimPapkasi")}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("buLavozimgaBiriktirilganHujjatlarVideolar")}
          </p>
        </div>
        <Button size="sm" onClick={() => setAddFolderOpen(true)} data-testid="button-add-folder-item">
          <Plus className="h-3.5 w-3.5 mr-1" />{t("add")}
        </Button>
      </div>

      {folderItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-muted-foreground">
          <div className="rounded-full bg-muted p-4">
            <FolderOpen className="h-8 w-8" />
          </div>
          <div className="text-center">
            <p className="font-medium text-foreground">{t("papkaBosh")}</p>
            <p className="text-sm mt-1">{t("buLavozimUchunHujjatVideo")}</p>
          </div>
          <Button size="sm" onClick={() => setAddFolderOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />{t("birinchiElementniQoshish")}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {(["document", "video", "test"] as const).map((type) => {
            const items = (folderItems as FolderItem[]).filter((i) => i.itemType === type);
            if (items.length === 0) return null;
            const typeConfig = {
              document: { icon: <FileText className="h-4 w-4" />, label: "Hujjatlar", color: "var(--ep-blue)" },
              video: { icon: <Video className="h-4 w-4" />, label: "Videolar", color: "var(--mod-org)" },
              test: { icon: <ClipboardList className="h-4 w-4" />, label: "Testlar", color: "var(--ep-green)" },
            }[type];
            return (
              <div key={type}>
                <div className="flex items-center gap-2 mb-2">
                  <div style={{ color: typeConfig.color }}>{typeConfig.icon}</div>
                  <span className="text-sm font-medium" style={{ color: typeConfig.color }}>{typeConfig.label}</span>
                  <Badge variant="secondary" className="text-xs">{items.length}</Badge>
                </div>
                <div className="space-y-2">
                  {(Array.isArray(items) ? items : []).map((item) => (
                    <Card key={item.id} data-testid={`folder-item-${item.id}`}>
                      <CardContent className="py-3 px-4 flex items-center gap-3">
                        <div
                          className="rounded-lg p-2 shrink-0"
                          style={{ background: `${typeConfig.color}18` }}
                        >
                          <div style={{ color: typeConfig.color }}>{typeConfig.icon}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.title}</p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                          )}
                          {item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-[var(--ep-blue)] hover:underline truncate block"
                            >
                              {item.url}
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-muted-foreground hidden sm:block">
                            {new Date(item.createdAt).toLocaleDateString("uz-UZ")}
                          </span>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                disabled={removeFolderItemMutation.isPending}
                                data-testid={`button-remove-folder-item-${item.id}`}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t("ochirishniTasdiqlang")}</AlertDialogTitle>
                                <AlertDialogDescription>{t("ushbuElementPapkadanOlibTashlanadi")}</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => removeFolderItemMutation.mutate(item.id)}>{t("delete")}</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={addFolderOpen} onOpenChange={setAddFolderOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-primary" />
              {t("papkagaElementQoshish")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>{t("tur")}</Label>
              <Select
                value={folderForm.itemType}
                onValueChange={(v) => setFolderForm((f) => ({ ...f, itemType: v as "document" | "video" | "test" }))}
              >
                <SelectTrigger data-testid="select-folder-item-type" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="document">
                    <span className="flex items-center gap-2"><FileText className="h-3.5 w-3.5" />{t("hujjat")}</span>
                  </SelectItem>
                  <SelectItem value="video">
                    <span className="flex items-center gap-2"><Video className="h-3.5 w-3.5" />{t('video')}</span>
                  </SelectItem>
                  <SelectItem value="test">
                    <span className="flex items-center gap-2"><ClipboardList className="h-3.5 w-3.5" />{t("testLmsKurs")}</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("nomi")}</Label>
              <Input
                value={folderForm.title}
                onChange={(e) => setFolderForm((f) => ({ ...f, title: e.target.value }))}
                placeholder={t("masalanTexnikaXavfsizligiBoyichaYoriqnoma")}
                data-testid="input-folder-item-title"
              />
            </div>
            <div>
              <Label>{t("urlHavola")}</Label>
              <Input
                value={folderForm.url}
                onChange={(e) => setFolderForm((f) => ({ ...f, url: e.target.value }))}
                placeholder="https://..."
                data-testid="input-folder-item-url"
              />
            </div>
            <div>
              <Label>{t("progress.description")}</Label>
              <Input
                value={folderForm.description}
                onChange={(e) => setFolderForm((f) => ({ ...f, description: e.target.value }))}
                placeholder={t("qisqachaTavsif")}
                data-testid="input-folder-item-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddFolderOpen(false)}>{t("Bekor")}</Button>
            <Button
              onClick={() => addFolderItemMutation.mutate(folderForm)}
              disabled={!folderForm.title || addFolderItemMutation.isPending}
              data-testid="button-save-folder-item"
            >
              {addFolderItemMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
