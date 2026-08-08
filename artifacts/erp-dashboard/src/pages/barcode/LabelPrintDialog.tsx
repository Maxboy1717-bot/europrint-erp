/**
 * @module LabelPrintDialog
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Printer, Download, Copy, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { BatchData } from "./barcode-types";
import { apiRequest } from '@/lib/queryClient';

type TranslationFn = (key: string, params?: Record<string, string | number>) => string;

interface LabelPrintResult {
  success: boolean;
  format: string;
  content?: string;
  sentToPrinter: boolean;
  message: string;
}

interface LabelPrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch: BatchData | null;
  t: TranslationFn;
}

export function LabelPrintDialog({
  open,
  onOpenChange,
  batch,
  t,
}: LabelPrintDialogProps) {
  const { toast } = useToast();
  const [format, setFormat] = useState<"ZPL" | "EPL" | "PDF">("ZPL");
  const [copies, setCopies] = useState(1);
  const [result, setResult] = useState<LabelPrintResult | null>(null);

  const printMutation = useMutation({
    mutationFn: async () => {
      if (!batch) throw new Error("Batch tanlanmagan");

      if (format === "PDF") {
        // eslint-disable-next-line no-restricted-globals -- raw fetch: PDF blob download; apiRequest() unwraps JSON and can't return Blob
        const res = await fetch(`/api/warehouse/label/print`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ batchId: batch.id, format: "PDF", copies }),
        });
        if (!res.ok) throw new Error("PDF yuklab olishda xatolik");

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `label-${batch.batchNumber}.pdf`;
        a.click();
        URL.revokeObjectURL(url);

        return {
          success: true,
          format: "PDF",
          sentToPrinter: false,
          message: t("pdfDownloaded"),
        } as LabelPrintResult;
      }

      return await apiRequest<LabelPrintResult>('POST', `/api/warehouse/label/print`, { batchId: batch.id, format, copies });
    },
    onSuccess: (data) => {
      setResult(data);
      if (data.sentToPrinter) {
        toast({
          title: t("labelSentToPrinter"),
          description: `${data.format} | ${t("labelCopyCount", { count: copies })}`,
        });
      } else {
        toast({
          title: t("labelReady"),
          description: String(data.message),
        });
      }
    },
    onError: (err: Error) => {
      toast({
        title: t("error"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({ title: t("copied") });
  };

  if (!batch) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setResult(null); }}>
      <DialogContent className="max-w-lg p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-primary" />
            {t("labelPrint")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="p-4 bg-muted/60 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("batchNumber")}:</span>
              <span className="font-mono font-bold">{batch.batchNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("material")}:</span>
              <span className="truncate ml-4 text-right">{batch.materialName ?? "-"}</span>
            </div>
            {batch.barcode && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("barcodeLabel")}:</span>
                <span className="font-mono text-xs">{batch.barcode}</span>
              </div>
            )}
            {batch.expiryDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("expiryDate")}:</span>
                <span className="text-orange-400">{batch.expiryDate}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
          <Label>{t("labelFormat")}</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as "ZPL" | "EPL" | "PDF")}>
                <SelectTrigger data-testid="select-label-format" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ZPL">
                    <div className="flex flex-col">
                      <span>ZPL</span>
                      <span className="text-xs text-muted-foreground">{t("zebraPrinters")}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="EPL">
                    <div className="flex flex-col">
                      <span>EPL</span>
                      <span className="text-xs text-muted-foreground">{t("eltronPrinters")}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="PDF">
                    <div className="flex flex-col">
                      <span>PDF</span>
                      <span className="text-xs text-muted-foreground">{t("previewPdfPrinter")}</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
          <Label>{t("labelCopies")}</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={copies}
                onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                data-testid="input-label-copies"
              />
            </div>
          </div>

          {format === "PDF" && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-blue-500/10 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4 text-blue-400 shrink-0" />
              <span>
                {t("pdfInfo")}
              </span>
            </div>
          )}

          {(format === "ZPL" || format === "EPL") && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-amber-500/10 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
              <span>
                {t("printerFormatInfo", { format })}
              </span>
            </div>
          )}

          {result && (
            <div className={`p-3 rounded-lg border text-sm ${result.success ? "border-green-500/30 bg-green-500/10" : "border-red-500/30 bg-red-500/10"}`}>
              <div className="flex items-center gap-2 mb-2">
                {result.sentToPrinter
                  ? <CheckCircle className="h-4 w-4 text-green-400" />
                  : result.success
                    ? <AlertCircle className="h-4 w-4 text-amber-400" />
                    : <XCircle className="h-4 w-4 text-red-400" />}
                <span className={result.sentToPrinter ? "text-green-400" : result.success ? "text-amber-400" : "text-red-400"}>
                  {result.message}
                </span>
              </div>

              {result.content && (result.format === "ZPL" || result.format === "EPL") && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{result.format}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {t("contentReady")}
                    </span>
                  </div>
                  <pre className="text-xs bg-black/30 p-2 rounded overflow-auto max-h-40 font-mono whitespace-pre">
                    {result.content.substring(0, 500)}{result.content.length > 500 ? "\n..." : ""}
                  </pre>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyContent(result.content ?? '')}
                    className="w-full"
                    data-testid="button-copy-label-content"
                  >
                    <Copy className="h-3 w-3 mr-2" />
                    {result.format === "ZPL" ? t("labelCopyZpl") : t("labelCopyEpl")}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("close")}
          </Button>
          <Button
            onClick={() => printMutation.mutate()}
            disabled={printMutation.isPending}
            data-testid="button-print-label"
          >
            {printMutation.isPending
              ? t("labelPrinting")
              : format === "PDF"
                ? (<><Download className="h-4 w-4 mr-2" />{t("labelDownloadPdf")}</>)
                : (<><Printer className="h-4 w-4 mr-2" />{t("print")}</>)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
