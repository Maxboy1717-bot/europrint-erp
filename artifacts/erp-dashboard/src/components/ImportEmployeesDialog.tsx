/**
 * @module ImportEmployeesDialog
 * @description React UI component.
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslation } from '@/lib/i18n';

// CSV template columns — matches employees table (first_name/last_name, no legacy dept/pos)
const TEMPLATE_HEADERS = [
  "employee_code",
  "first_name",
  "last_name",
  "birth_date",
  "hire_date",
  "address",
  "phone",
];

const TEMPLATE_SAMPLE = [
  "EP-2024-001",
  "Alisher",
  "Karimov",
  "1990-01-15",
  "2020-03-01",
  "Toshkent, Chilonzor 5-uy",
  "+998901234567",
];

/** Parse a CSV text string into an array of row objects keyed by headers. */
function parseCsv(text: string): Record<string, string>[] {
  const lines = text
    .trim()
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      if (h) row[h] = values[i] ?? "";
    });
    return row;
  });
}

interface ImportResult {
  imported: number;
  total: number;
  errors: string[];
}

interface ImportEmployeesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportEmployeesDialog({
  open,
  onOpenChange,
}: ImportEmployeesDialogProps) {
  const { t } = useTranslation("common");
  const [file, setFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (csvFile: File): Promise<ImportResult> => {
      const text = await csvFile.text();
      const employees = parseCsv(text);
      if (employees.length === 0) {
        throw new Error("CSV fayl bo'sh yoki noto'g'ri format");
      }
      return apiRequest<ImportResult>("POST", "/api/employees/import", { employees });
    },
    onSuccess: (data) => {
      setImportResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      if ((data.errors ?? []).length === 0) {
        toast({
          title: "Muvaffaqiyatli",
          description: `${data.imported} ta xodim import qilindi`,
        });
        setFile(null);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Xatolik",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportResult(null);
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    const extension = selectedFile.name.split(".").pop()?.toLowerCase();
    if (extension === "csv") {
      setFile(selectedFile);
    } else {
      toast({
        title: "Noto'g'ri fayl formati",
        description: "Faqat CSV fayllar qabul qilinadi",
        variant: "destructive",
      });
    }
  };

  const handleDownloadTemplate = () => {
    const csv = [TEMPLATE_HEADERS.join(","), TEMPLATE_SAMPLE.join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "xodimlar_shablon.csv";
    link.click();
  };

  const handleUpload = () => {
    if (!file) return;
    uploadMutation.mutate(file);
  };

  const handleClose = () => {
    setFile(null);
    setImportResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] p-6">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">{t("xodimlarniImportQilish")}</DialogTitle>
          <DialogDescription>
            {t("excelYokiCsvFaylOrqali")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t("shablonFaylniYuklabOlibMalumotlarni")}
            </AlertDescription>
          </Alert>

          <Button
            variant="outline"
            onClick={handleDownloadTemplate}
            className="w-full gap-2"
            data-testid="button-download-template"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {t("shablonFaylniYuklabOlish")}
          </Button>

          <div className="space-y-1">
            <Label htmlFor="file">{t("faylTanlash")} (.csv)</Label>
            <Input
              id="file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              data-testid="input-import-file"
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                {t("tanlangan")}: {file.name}
              </p>
            )}
          </div>

          {/* Import result summary */}
          {importResult && (
            <div className="rounded-md border p-3 space-y-1.5 text-sm">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                {importResult.imported} / {importResult.total} ta xodim import qilindi
              </div>
              {importResult.errors.length > 0 && (
                <ul className="space-y-0.5 mt-1">
                  {importResult.errors.map((err, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-destructive text-xs">
                      <XCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      {err}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={uploadMutation.isPending}
              data-testid="button-cancel-import"
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || uploadMutation.isPending}
              data-testid="button-upload-import"
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploadMutation.isPending ? t("yuklanmoqda") : t("importQilish")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
