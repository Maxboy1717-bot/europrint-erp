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
import { Upload, FileSpreadsheet, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslation } from '@/lib/i18n';

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
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => apiRequest<unknown>('POST', "/api/employees/import", formData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Muvaffaqiyatli",
        description: `${(data as { imported?: number })?.imported ?? 0} ta xodim import qilindi`,
      });
      setFile(null);
      onOpenChange(false);
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
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const extension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (extension === 'xlsx' || extension === 'xls' || extension === 'csv') {
        setFile(selectedFile);
      } else {
        toast({
          title: "Noto'g'ri fayl formati",
          description: "Faqat Excel (.xlsx, .xls) yoki CSV fayllar qabul qilinadi",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpload = () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    uploadMutation.mutate(formData);
  };

  const handleDownloadTemplate = () => {
    // Create CSV template
    const headers = [
      "employeeId",
      "fullName",
      "birthDate",
      "hireDate",
      "address",
      "phone",
      "attestationDate",
      "departmentId",
      "positionId",
    ];
    
    const sampleData = [
      "EP-2024-001",
      "Alisher Karimov",
      "1990-01-15",
      "2020-03-01",
      "Toshkent, Chilonzor",
      "+998901234567",
      "2025-03-01",
      "",
      "",
    ];

    const csv = [headers.join(","), sampleData.join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "xodimlar_shablon.csv";
    link.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          <Label htmlFor="file">{t("faylTanlash")}</Label>
            <Input
              id="file"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              data-testid="input-import-file"
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                Tanlangan fayl: {file.name}
              </p>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
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
              {uploadMutation.isPending ? "Yuklanmoqda..." : "Import qilish"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
