/**
 * DocumentsTabDialogs — Self-contained UploadDialog and AddDocDialog
 * for DocumentsTab.  Each manages its own form/upload state.
 */
import { useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Upload, Plus, File, Image, FileText, FileType2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeaders, apiRequest } from "@/lib/queryClient";
import { useTranslation } from '@/lib/i18n';
import {
  addDocFormSchema, type AddDocFormValues,
  FILE_CATEGORIES, EMP_DOC_CATEGORIES, formatBytes,
} from "./DocumentsTabTypes";

// ─── Local FileIcon (used by UploadDialog) ────────────────────────────────────

function FileIcon({ mimeType }: { mimeType?: string }) {
  if (!mimeType)                                      return <File className="h-4 w-4 text-muted-foreground" />;
  if (mimeType.startsWith("image/"))                 return <Image className="h-4 w-4 text-blue-400" />;
  if (mimeType === "application/pdf")                return <FileText className="h-4 w-4 text-red-400" />;
  if (mimeType.includes("word"))                     return <FileType2 className="h-4 w-4 text-[var(--ep-blue)]" />;
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
                                                      return <FileType2 className="h-4 w-4 text-[var(--ep-green)]" />;
  return <File className="h-4 w-4 text-muted-foreground" />;
}

// ─── UploadDialog ─────────────────────────────────────────────────────────────

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
}

export function UploadDialog({ open, onOpenChange, employeeId }: UploadDialogProps) {
  const { t } = useTranslation("common");
  const { toast }              = useToast();
  const qc                     = useQueryClient();
  const fileInputRef           = useRef<HTMLInputElement>(null);
  const [uploadCategory, setUploadCategory]       = useState("personal");
  const [uploadDescription, setUploadDescription] = useState("");
  const [selectedFile, setSelectedFile]           = useState<File | null>(null);
  const [uploading, setUploading]                 = useState(false);

  function handleClose() {
    onOpenChange(false);
    setSelectedFile(null);
    setUploadDescription("");
  }

  async function handleUpload() {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("category", uploadCategory);
      if (uploadDescription) formData.append("description", uploadDescription);

      await apiRequest('POST', `/api/employees/${employeeId}/files`);
      await qc.invalidateQueries({ queryKey: ["/api/employees", employeeId, "files"] });
      toast({ title: "Fayl muvaffaqiyatli yuklandi" });
      handleClose();
    } catch (err: unknown) {
      toast({ title: "Xatolik", description: err instanceof Error ? err.message : "Yuklash xatoligi", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" /> {t("faylYuklash")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* File picker */}
          <div className="space-y-1">
          <Label>{t("fayl1")}</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                selectedFile ? "border-primary/50 bg-primary/5" : "border-muted-foreground/25 hover:border-primary/30"
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              {selectedFile ? (
                <div className="flex flex-col items-center gap-1">
                  <FileIcon mimeType={selectedFile.type} />
                  <p className="text-sm font-medium mt-1">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(selectedFile.size)}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Upload className="h-8 w-8 opacity-40" />
                  <p className="text-sm">{t("faylTanlashUchunBosing")}</p>
                  <p className="text-xs opacity-60">{t("pdfWordExcelRasmMax")}</p>
                </div>
              )}
              <input
                ref={fileInputRef} type="file" className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.gif,.txt"
                onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
                data-testid="input-file"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1">
          <Label>{t("toifa1")}</Label>
            <Select value={uploadCategory} onValueChange={setUploadCategory}>
              <SelectTrigger data-testid="select-category" className="h-9">
                <SelectValue placeholder={t("toifaniTanlang")} />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FILE_CATEGORIES).map(([key, cfg]) => {
                  const Icon = cfg.icon;
                  return (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${cfg.color}`} />{cfg.label}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-1">
          <Label>{t("izohIxtiyoriy")}</Label>
            <Input
              placeholder={t("hujjatHaqidaQisqachaMalumot")}
              value={uploadDescription}
              onChange={e => setUploadDescription(e.target.value)}
              data-testid="input-description"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>{t("cancel")}</Button>
          <Button onClick={handleUpload} disabled={!selectedFile || uploading} className="gap-2" data-testid="button-confirm-upload">
            {uploading
              ? <><Clock className="h-4 w-4 animate-spin" /> {t("Yuklanmoqda...")}</>
              : <><Upload className="h-4 w-4" /> {t("upload")}</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── AddDocDialog ─────────────────────────────────────────────────────────────

interface AddDocDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
}

export function AddDocDialog({ open, onOpenChange, employeeId }: AddDocDialogProps) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const qc        = useQueryClient();
  const [savingDoc, setSavingDoc] = useState(false);

  const addDocForm = useForm<AddDocFormValues>({
    resolver: zodResolver(addDocFormSchema),
    defaultValues: { category: "personal", title: "", fileName: "", fileUrl: "", notes: "" },
  });

  function handleClose() {
    onOpenChange(false);
    addDocForm.reset({ category: "personal", title: "", fileName: "", fileUrl: "", notes: "" });
  }

  async function handleAddDoc(values: AddDocFormValues) {
    setSavingDoc(true);
    try {
      // Auth via httpOnly cookie; apiRequest handles credentials and Content-Type.
      await apiRequest('POST', `/api/hr/employees/${employeeId}/documents`, {
          category:  values.category,
          title:     values.title.trim(),
      });
      await qc.invalidateQueries({ queryKey: ["/api/hr/employees", employeeId, "documents"] });
      toast({ title: "Hujjat muvaffaqiyatli qo'shildi" });
      handleClose();
    } catch (err: unknown) {
      toast({ title: "Xatolik", description: err instanceof Error ? err.message : "Saqlashda xatolik", variant: "destructive" });
    } finally {
      setSavingDoc(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={open => { if (!open) handleClose(); else onOpenChange(true); }}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" /> {t("hujjatQoshish")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={addDocForm.handleSubmit(handleAddDoc)} className="space-y-4 py-2">
          <div className="space-y-1">
          <Label>{t("kategoriya")}</Label>
            <Controller control={addDocForm.control} name="category" render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger data-testid="select-doc-category" className="h-9"><SelectValue placeholder={t("kategoriyaniTanlang")} /></SelectTrigger>
                <SelectContent>
                  {Object.entries(EMP_DOC_CATEGORIES).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    return (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${cfg.color}`} />{cfg.label}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )} />
          </div>

          <div className="space-y-1">
          <Label>{t("sarlavha")}</Label>
            <Input {...addDocForm.register("title")} placeholder={t("masalanPasportNusxasi")} data-testid="input-doc-title" />
            {addDocForm.formState.errors.title && (
              <p className="text-sm text-destructive">{addDocForm.formState.errors.title.message}</p>
            )}
          </div>

          <div className="space-y-1">
          <Label>{t("faylNomiIxtiyoriy")}</Label>
            <Input {...addDocForm.register("fileName")} placeholder={t("masalanPassportPdf")} data-testid="input-doc-filename" />
          </div>

          <div className="space-y-1">
          <Label>{t("faylUrlIxtiyoriy")}</Label>
            <Input {...addDocForm.register("fileUrl")} placeholder={t("masalanUploadsEmp123PassportPdf")} data-testid="input-doc-fileurl" />
          </div>

          <div className="space-y-1">
          <Label>{t("izohIxtiyoriy2")}</Label>
            <Textarea {...addDocForm.register("notes")} placeholder={t("hujjatHaqidaQoshimchaMalumot")} rows={3} data-testid="input-doc-notes" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>{t("cancel")}</Button>
            <Button type="submit" disabled={savingDoc} className="gap-2" data-testid="button-confirm-add-doc">
              {savingDoc
                ? <><Clock className="h-4 w-4 animate-spin" /> {t("saqlanmoqda")}</>
                : <><Plus className="h-4 w-4" /> {t("Saqlash")}</>}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
