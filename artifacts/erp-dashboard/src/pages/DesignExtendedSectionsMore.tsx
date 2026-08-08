/**
 * @module DesignExtendedSectionsMore
 * @description Additional tab sections for DesignExtended: Templates, Tools, Costing, Library.
 */

import { useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Trash2, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { EPLoader } from "@/components/ep";
import type { DesignTool, DesignTemplate, CostRow } from "./DesignExtendedTypes";
import { toolStatusMap } from "./DesignExtendedTypes";
import { useTranslation } from '@/lib/i18n';

// ─── Templates Tab ────────────────────────────────────────────────────────────

interface TemplatesTabProps {
  templates: DesignTemplate[];
}

export function TemplatesTab({ templates }: TemplatesTabProps) {
  const { t } = useTranslation("common");
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{t("tayyorQoliplar")}</CardTitle></CardHeader>
      <CardContent>
        {templates.length === 0 ? (
          <div className="text-center py-12 text-[13px] text-muted-foreground">{t("shablonlarMavjudEmas")}</div>
        ) : (
          <div className="ep-table-scroll"><Table>
            <TableHeader><TableRow>
              <TableHead>{t("shablonRaqami")}</TableHead>
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("toifa")}</TableHead>
              <TableHead>{t("brend")}</TableHead>
              <TableHead className="text-right">{t("Ishlatilgan")}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {(Array.isArray(templates) ? templates : []).map((t) => (
                <TableRow key={t.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-mono text-sm text-muted-foreground">{t.templateNumber || "—"}</TableCell>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>{t.category ? <Badge variant="outline">{t.category}</Badge> : "—"}</TableCell>
                  <TableCell className="text-sm">{t.brandName || "—"}</TableCell>
                  <TableCell className="text-right text-sm">{t.usageCount ?? 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Tools Tab ────────────────────────────────────────────────────────────────

interface ToolsTabProps {
  tools: DesignTool[];
}

export function ToolsTab({ tools }: ToolsTabProps) {
  const { t } = useTranslation("common");
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{t("bosmaAsboblarInventari")}</CardTitle></CardHeader>
      <CardContent>
        {tools.length === 0 ? (
          <div className="text-center py-12 text-[13px] text-muted-foreground">{t("uskunalarRoyxatiBosh")}</div>
        ) : (
          <div className="ep-table-scroll"><Table>
            <TableHeader><TableRow>
              <TableHead>{t("asbobNomi")}</TableHead>
              <TableHead>{t("tur")}</TableHead>
              <TableHead>{t("status28")}</TableHead>
              <TableHead>{t("songgiTo")}</TableHead>
              <TableHead>{t("keyingiTo")}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {(Array.isArray(tools) ? tools : []).map((t) => {
                const statusLabel = t.status ? (toolStatusMap[t.status] || t.status) : "—";
                const isOverdue = t.status === "overdue";
                return (
                  <TableRow key={t.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium">{t.equipmentName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.maintenanceType}</TableCell>
                    <TableCell>
                      <Badge variant={t.status === "completed" ? "default" : t.status === "overdue" ? "destructive" : "secondary"}>
                        {statusLabel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{t.lastMaintenanceDate || "—"}</TableCell>
                    <TableCell className="text-sm">
                      <span className={isOverdue ? "text-[var(--ep-red)]" : ""}>{t.nextMaintenanceDate || "—"}</span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table></div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Costing Tab ──────────────────────────────────────────────────────────────

interface CostingTabProps {
  costData: CostRow[];
  totalCost: number;
}

export function CostingTab({ costData, totalCost }: CostingTabProps) {
  const { t } = useTranslation("common");
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{t("dizaynXarajatKalkulyatori")}</CardTitle></CardHeader>
      <CardContent>
        <div className="ep-table-scroll"><Table>
          <TableHeader><TableRow>
            <TableHead>{t("komponent")}</TableHead>
            <TableHead className="text-right">{t("birlikNarxi")}</TableHead>
            <TableHead className="text-right">{t("total")}</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {(Array.isArray(costData) ? costData : []).map((c, i) => (
              <TableRow key={`k-${i}`} className="hover:bg-muted/40 transition-colors">
                <TableCell>{c.component}</TableCell>
                <TableCell className="text-right text-muted-foreground text-sm">{c.rate.toLocaleString()} so'm</TableCell>
                <TableCell className="text-right font-medium">{c.total.toLocaleString()} so'm</TableCell>
              </TableRow>
            ))}
            <TableRow className="border-t-2 hover:bg-muted/40 transition-colors">
              <TableCell colSpan={2} className="font-bold">{t("jamiDizaynTannarxi")}</TableCell>
              <TableCell className="text-right font-bold text-primary">{totalCost.toLocaleString()} so'm</TableCell>
            </TableRow>
          </TableBody>
        </Table></div>
        <p className="text-xs text-muted-foreground mt-3">
          {t("narxlarTaxminiyHaqiqiyNarxBuyurtma")}
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Library Tab ──────────────────────────────────────────────────────────────

interface LibraryItem {
  id: number;
  name: string;
  type: string;
  fileUrl: string | null;
  thumbnailUrl: string | null;
  tags: string | null;
  status: string;
  createdAt: string;
}

interface LibraryListResponse {
  data: LibraryItem[];
  pagination: { total: number; page: number; limit: number };
}

const LIBRARY_TYPE_OPTIONS = [
  { value: "image", label: "Rasm" },
  { value: "logo", label: "Logotip" },
  { value: "font", label: "Shrift" },
  { value: "template", label: "Shablon" },
  { value: "color", label: "Rang palitrasi" },
  { value: "other", label: "Boshqa" },
];

const LIBRARY_QUERY_KEY = ["/api/design/library"];

const emptyLibraryForm = { name: "", type: "image", fileUrl: "", tags: "" };

export function LibraryTab() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyLibraryForm);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data, isLoading } = useQuery<LibraryListResponse>({ queryKey: LIBRARY_QUERY_KEY });
  const items = Array.isArray(data?.data) ? data.data : [];

  const createMutation = useMutation({
    mutationFn: (dto: typeof form) => apiRequest("POST", "/api/design/library", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LIBRARY_QUERY_KEY });
      toast({ title: t("assetQoshildi", "Asset qo'shildi") });
      setCreateOpen(false);
      setForm(emptyLibraryForm);
    },
    onError: () => toast({ title: t("xatolik", "Xatolik"), variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/design/library/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LIBRARY_QUERY_KEY });
      toast({ title: t("ochirildi", "O'chirildi") });
      setDeleteId(null);
    },
    onError: () => toast({ title: t("xatolik", "Xatolik"), variant: "destructive" }),
  });

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // xuddi shu faylni qayta tanlasa ham onChange yana ishga tushsin
    if (!file) return;
    setUploading(true);
    try {
      const safeName = file.name.replace(/[^\w.\-]+/g, "_");
      const key = `design-library/${Date.now()}-${safeName}`;
      const fd = new FormData();
      fd.append("file", file, file.name);
      await apiRequest("PUT", `/api/storage/upload?key=${encodeURIComponent(key)}&mime=${encodeURIComponent(file.type || "application/octet-stream")}`, fd);
      setForm((f) => ({ ...f, fileUrl: `/api/storage/${key}`, name: f.name || file.name }));
      toast({ title: t("faylYuklandi", "Fayl yuklandi"), description: file.name });
    } catch {
      toast({ title: t("faylYuklashdaXatolik", "Fayl yuklashda xatolik"), variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <CardTitle className="text-base">{t("dizaynAssetKutubxonasi")}</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)} data-testid="button-add-library-asset">
            {t("yangiAssetQoshish")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <EPLoader size={32} tone="muted" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-[13px] text-muted-foreground">
            {t("brendKutubxonasiFayllariMavjudEmas")}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((item) => (
              <Card key={item.id} data-testid={`library-item-${item.id}`}>
                <CardContent className="p-3 flex gap-3">
                  {item.thumbnailUrl || item.fileUrl ? (
                    <img
                      src={item.thumbnailUrl || item.fileUrl || ""}
                      alt={item.name}
                      className="h-14 w-14 rounded object-cover shrink-0 border"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded bg-muted shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <Badge variant="outline" className="text-xs mt-1">{item.type}</Badge>
                    {item.fileUrl && (
                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-xs text-[var(--ep-blue)] hover:underline truncate mt-1"
                      >
                        {t("koRish", "Ko'rish")}
                      </a>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                    disabled={deleteMutation.isPending}
                    onClick={() => setDeleteId(item.id)}
                    data-testid={`button-delete-library-item-${item.id}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      {/* Yangi asset qo'shish */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle>{t("yangiAssetQoshish")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>{t("nomi")}</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder={t("masalanKompaniyaLogotipi", "Masalan: Kompaniya logotipi")}
                data-testid="input-library-item-name"
              />
            </div>
            <div>
              <Label>{t("toifa")}</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger className="h-9" data-testid="select-library-item-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LIBRARY_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("fayl", "Fayl")}</Label>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelected}
                data-testid="input-library-item-file"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full justify-start text-muted-foreground"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading
                  ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  : <Upload className="mr-2 h-3.5 w-3.5" />}
                {uploading ? t("yuklanmoqda", "Yuklanmoqda...") : t("kompyuterdanFaylTanlash", "Kompyuterdan fayl tanlash...")}
              </Button>
            </div>
            <div>
              <Label>{t("urlHavola")} {t("yokiTashqiHavola", "(yoki tashqi havola)")}</Label>
              <Input
                value={form.fileUrl}
                onChange={(e) => setForm((f) => ({ ...f, fileUrl: e.target.value }))}
                placeholder={t("yokiYuqoridanFaylYuklang", "https://... yoki yuqoridan fayl yuklang")}
                data-testid="input-library-item-url"
              />
            </div>
            <div>
              <Label>{t("teglar", "Teglar")}</Label>
              <Input
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                placeholder={t("vergulBilanAjrating", "vergul, bilan, ajrating")}
                data-testid="input-library-item-tags"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>{t("Bekor")}</Button>
            <Button
              onClick={() => createMutation.mutate(form)}
              disabled={!form.name.trim() || createMutation.isPending}
              data-testid="button-save-library-item"
            >
              {createMutation.isPending ? t("saqlanmoqda", "Saqlanmoqda...") : t("saqlash", "Saqlash")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* O'chirishni tasdiqlash — Qoida 14 */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("ochirishniTasdiqlang")}</AlertDialogTitle>
            <AlertDialogDescription>{t("buAmalniQaytaribBolmaydiMalumot")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deleteId !== null) deleteMutation.mutate(deleteId); }}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete-library-item"
            >
              {deleteMutation.isPending ? t("ochirilmoqda") : t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
