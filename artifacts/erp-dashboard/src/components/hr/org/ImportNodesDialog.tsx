/**
 * @module ImportNodesDialog
 * @description VISION-3340 #26 — bulk-import KARTA/bo'lim nodes from an uploaded .xlsx file
 *   (client-side parsed via SheetJS `@e965/xlsx`, already a workspace dependency — see
 *   lib/export-utils.ts for the export-side precedent) → POST /api/org-structure/nodes/import
 *   (org-structure.controller.ts `importNodes`, per-row partial-commit). Renders the backend's
 *   `{ imported, failed, total, created, errors[] }` result in an inline summary panel.
 *   This is the "bulk import" half of the org-structure template feature; see
 *   ApplyCardTemplateDialog.tsx (karta detail view) for the "apply a single card template" half.
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";

/**
 * Columns recognised from the uploaded sheet's header row (first row = header, SheetJS
 * `sheet_to_json` default). Mirrors the OrgNodeSchema `.strict()` allow-list on the backend
 * (org-structure.controller.ts) — kept to a curated subset of the most common bulk-create
 * fields. Any other column in the sheet is silently dropped (never forwarded): `.strict()`
 * would 400 the WHOLE batch on a single stray/unknown column otherwise.
 */
export const IMPORT_NODE_COLUMNS = [
  "name", "nameRu", "nodeType", "parentId", "code",
  "tskp", "tskpRu", "description", "otdeleniyeNo",
] as const;
type ImportNodeColumn = typeof IMPORT_NODE_COLUMNS[number];
const NUMERIC_COLUMNS = new Set<ImportNodeColumn>(["parentId", "otdeleniyeNo"]);

/** Mirrors ImportNodesSchema's `rows: z.array(OrgNodeSchema).max(1000)` (org-structure.controller.ts). */
export const MAX_IMPORT_ROWS = 1000;

/**
 * Pure row-mapper — exported for unit testing without loading the xlsx parser. Drops any
 * column not in the allow-list, coerces numeric columns, trims strings, and skips rows
 * whose (required) `name` ends up empty.
 */
export function mapImportRow(raw: Record<string, unknown>): Record<string, unknown> | null {
  const out: Record<string, unknown> = {};
  for (const col of IMPORT_NODE_COLUMNS) {
    const v = raw[col];
    if (v === null || v === undefined || v === "") continue;
    if (NUMERIC_COLUMNS.has(col)) {
      const n = Number(v);
      if (Number.isFinite(n)) out[col] = n;
    } else {
      out[col] = String(v).trim();
    }
  }
  return typeof out.name === "string" && out.name.length > 0 ? out : null;
}

/** Pure rows-builder — filters + caps parsed sheet rows to the backend's contract. */
export function buildImportRows(rawRows: unknown): { rows: Record<string, unknown>[]; truncated: boolean } {
  const list = Array.isArray(rawRows) ? rawRows : [];
  const mapped = list
    .map((r) => (r && typeof r === "object" ? mapImportRow(r as Record<string, unknown>) : null))
    .filter((r): r is Record<string, unknown> => r !== null);
  const truncated = mapped.length > MAX_IMPORT_ROWS;
  return { rows: truncated ? mapped.slice(0, MAX_IMPORT_ROWS) : mapped, truncated };
}

interface ImportNodeError { row: number; field?: string; message: string }
interface ImportNodeCreated { row: number; id: number; name: string }
interface ImportResult {
  imported: number;
  failed: number;
  total: number;
  created: ImportNodeCreated[];
  errors: ImportNodeError[];
}

interface ImportNodesDialogProps {
  open: boolean;
  onClose: () => void;
  /** Called once after a successful (even if partially-failed) import so the caller can
   *  invalidate its own hierarchy/stats queries. */
  onSuccess: () => void;
}

export function ImportNodesDialog({ open, onClose, onSuccess }: ImportNodesDialogProps) {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async (xlsxFile: File): Promise<ImportResult> => {
      const XLSX = await import("@e965/xlsx");
      const buf = await xlsxFile.arrayBuffer();
      const workbook = XLSX.read(buf, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = sheetName ? workbook.Sheets[sheetName] : undefined;
      const rawRows = sheet ? XLSX.utils.sheet_to_json(sheet, { defval: null }) : [];
      const { rows, truncated } = buildImportRows(rawRows);
      if (rows.length === 0) {
        throw new Error(t("importFaylBoshYokiNomYoq", "Faylda \"name\" ustuni to'ldirilgan hech qanday qator topilmadi"));
      }
      if (truncated) {
        toast({ title: t("importChegaraGaYetdi", `Fayl ${MAX_IMPORT_ROWS} qatordan katta — faqat birinchi ${MAX_IMPORT_ROWS} qator yuborildi`) });
      }
      return apiRequest<ImportResult>("POST", "/api/org-structure/nodes/import", { rows });
    },
    onSuccess: (data) => {
      setResult(data);
      onSuccess();
      if (data.failed === 0) {
        toast({
          title: t("importMuvaffaqiyatli", "Import muvaffaqiyatli"),
          description: `${data.imported}/${data.total}`,
        });
        setFile(null);
      } else {
        toast({
          title: t("importQismanBajarildi", "Import qisman bajarildi"),
          description: `${data.imported}/${data.total} — ${data.failed} ${t("xato", "xato")}`,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({ title: t("Xatolik", "Xatolik"), description: error.message, variant: "destructive" });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResult(null);
    const selected = e.target.files?.[0];
    if (!selected) return;
    const ext = selected.name.split(".").pop()?.toLowerCase();
    if (ext === "xlsx" || ext === "xls") {
      setFile(selected);
    } else {
      toast({
        title: t("notoGriFaylFormati", "Noto'g'ri fayl formati"),
        description: t("faqatXlsxFayllarQabulQilinadi", "Faqat .xlsx fayllar qabul qilinadi"),
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px] p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-primary" />{t("kartalarniImportQilish", "Kartalarni import qilish")}
          </DialogTitle>
          <DialogDescription>
            {t("xlsxFaylOrqaliKopKartaYaratish", "Excel (.xlsx) fayl orqali bir nechta bo'lim/karta bir yo'la yaratiladi")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t(
                "importUstunlarYordam",
                "Ustunlar: name, nameRu, nodeType, parentId, code, tskp, tskpRu, description, otdeleniyeNo (birinchi qator = sarlavha). \"name\" majburiy.",
              )}
            </AlertDescription>
          </Alert>

          <div className="space-y-1">
            <Label htmlFor="import-nodes-file">{t("faylTanlash", "Fayl tanlash")} (.xlsx)</Label>
            <Input
              id="import-nodes-file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              data-testid="input-import-nodes-file"
            />
            {file && (
              <p className="text-sm text-muted-foreground">{t("tanlangan", "Tanlangan")}: {file.name}</p>
            )}
          </div>

          {result && (
            <div className="rounded-md border p-3 space-y-2 text-sm" data-testid="import-nodes-result">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  {result.imported}/{result.total} {t("importQilindi", "import qilindi")}
                </span>
                {result.failed > 0 && (
                  <span className="flex items-center gap-1 text-destructive">
                    <XCircle className="h-4 w-4" />{result.failed} {t("xato", "xato")}
                  </span>
                )}
              </div>
              {result.errors.length > 0 && (
                <ul className="space-y-0.5 max-h-40 overflow-y-auto">
                  {result.errors.map((err, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-destructive text-xs">
                      <XCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      {t("qator", "Qator")} {err.row}{err.field ? ` (${err.field})` : ""}: {err.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={uploadMutation.isPending}
            data-testid="button-cancel-import-nodes"
          >
            {t("cancel", "Bekor qilish")}
          </Button>
          <Button
            onClick={() => file && uploadMutation.mutate(file)}
            disabled={!file || uploadMutation.isPending}
            data-testid="button-upload-import-nodes"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploadMutation.isPending ? t("yuklanmoqda", "Yuklanmoqda...") : t("importQilish", "Import qilish")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
