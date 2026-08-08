/**
 * @module GenerateScannerContent
 * @description React page component. Route-level UI.
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  QrCode,
  ScanLine,
  Copy,
  Printer,
  Archive,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import type { ScanResult } from "./barcode-types";
import { STATUS_COLORS } from "./barcode-types";

type TranslationFn = (key: string, params?: Record<string, string | number>) => string;

const ENTITY_TYPE_KEYS: Record<string, string> = {
  batch: "typeBatch",
  material: "typeMaterial",
  bin: "typeBin",
  kit: "typeKit",
};

const STATUS_KEYS: Record<string, string> = {
  active: "statusActive",
  depleted: "statusDepleted",
  blocked: "statusBlocked",
  expired: "statusExpired",
};

interface GenerateScannerContentProps {
  lang: "uz" | "ru";
  t: TranslationFn;
  generateType: string;
  onGenerateTypeChange: (val: string) => void;
  generateEntityId: string;
  onGenerateEntityIdChange: (val: string) => void;
  generatedBarcode: string;
  onGenerateBarcode: () => void;
  isGenerating: boolean;
  entityOptions: { id: string; label: string }[];
  onCopyToClipboard: (text: string) => void;
  onPrintToast: () => void;
  scanInput: string;
  onScanInputChange: (val: string) => void;
  scanAction: string;
  onScanActionChange: (val: string) => void;
  scanResult: ScanResult | null;
  onScan: () => void;
  isScanning: boolean;
  onScanActionToast: (info: { uz: string; ru: string }) => void;
}

export function GenerateScannerContent({
  lang,
  t,
  generateType,
  onGenerateTypeChange,
  generateEntityId,
  onGenerateEntityIdChange,
  generatedBarcode,
  onGenerateBarcode,
  isGenerating,
  entityOptions,
  onCopyToClipboard,
  onPrintToast,
  scanInput,
  onScanInputChange,
  scanAction,
  onScanActionChange,
  scanResult,
  onScan,
  isScanning,
  onScanActionToast,
}: GenerateScannerContentProps) {
  return (
    <>
      <TabsContent value="generate" className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                {t("generate")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
          <Label>{t("entityType")}</Label>
                <Select value={generateType} onValueChange={(v) => { onGenerateTypeChange(v); onGenerateEntityIdChange(""); }}>
                  <SelectTrigger data-testid="select-entity-type" className="h-9">
                    <SelectValue placeholder={t("entityType")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="material">{t("typeMaterial")}</SelectItem>
                    <SelectItem value="batch">{t("typeBatch")}</SelectItem>
                    <SelectItem value="bin">{t("typeBin")}</SelectItem>
                    <SelectItem value="kit">{t("typeKit")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {generateType && (
                <div className="space-y-1">
          <Label>{t("selectEntity")}</Label>
                  <Select value={generateEntityId} onValueChange={onGenerateEntityIdChange}>
                    <SelectTrigger data-testid="select-entity-id" className="h-9">
                      <SelectValue placeholder={t("selectEntity")} />
                    </SelectTrigger>
                    <SelectContent>
                      {(Array.isArray(entityOptions) ? entityOptions : []).map((opt) => (
                        <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button
                onClick={onGenerateBarcode}
                disabled={!generateType || !generateEntityId || isGenerating}
                className="w-full gap-2"
                data-testid="button-generate-barcode"
              >
                <QrCode className="h-4 w-4" />
                {t("generateBtn")}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("barcodeGenerated")}</CardTitle>
            </CardHeader>
            <CardContent>
              {generatedBarcode ? (
                <div className="space-y-4">
                  <div className="p-6 bg-muted rounded-lg text-center">
                    <div className="font-mono text-2xl tracking-wider mb-2">{generatedBarcode}</div>
                    <div className="flex justify-center gap-1 h-12">
                      {generatedBarcode.split("").map((char, i) => (
                        <div
                          key={`k-${i}`}
                          className="bg-foreground"
                          style={{ width: char.match(/[0-9]/) ? `${(parseInt(char) + 1) * 2}px` : "3px" }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => onCopyToClipboard(generatedBarcode)}
                      data-testid="button-copy-barcode"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      {t("copy")}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={onPrintToast}
                      data-testid="button-print-barcode"
                    >
                      <Printer className="h-4 w-4" />
                      {t("print")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-[13px] text-muted-foreground">
                  <QrCode className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>{t("selectToGenerate")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="scanner" className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScanLine className="h-4 w-4" />
                {t("scanner")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
          <Label>{t("scanInput")}</Label>
                <Input
                  value={scanInput}
                  onChange={(e) => onScanInputChange(e.target.value)}
                  placeholder={"BAT-xxxxxxxx-xxxx"}
                  className="font-mono"
                  onKeyDown={(e) => e.key === "Enter" && onScan()}
                  data-testid="input-scan-barcode"
                />
              </div>

              <div className="space-y-1">
          <Label>{t("actionType")}</Label>
                <Select value={scanAction} onValueChange={onScanActionChange}>
                  <SelectTrigger data-testid="select-scan-action" className="h-9">
                    <SelectValue placeholder={t("actionType")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receive">{t("receive")}</SelectItem>
                    <SelectItem value="issue">{t("issue")}</SelectItem>
                    <SelectItem value="move">{t("move")}</SelectItem>
                    <SelectItem value="count">{t("count")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={onScan}
                disabled={!scanInput || isScanning}
                className="w-full gap-2"
                data-testid="button-scan"
              >
                <ScanLine className="h-4 w-4" />
                {t("scan")}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("lookupResult")}</CardTitle>
            </CardHeader>
            <CardContent>
              {scanResult ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-sm">
                      {t(ENTITY_TYPE_KEYS[scanResult.entityType] ?? "") || scanResult.entityType}
                    </Badge>
                    <span className="font-mono text-sm">{scanResult.barcode}</span>
                  </div>

                  {scanResult.entityType === "batch" && (
                    <div className="space-y-3 p-4 bg-muted rounded-lg">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("batchNumber")}:</span>
                        <span className="font-medium">{scanResult.entityData.batchNumber as string}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("material")}:</span>
                        <span>{(scanResult.entityData.materialName as string) || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("remaining")}:</span>
                        <span>{(scanResult.entityData.remainingQuantity as number)?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("status")}:</span>
                        <Badge className={STATUS_COLORS[(scanResult.entityData.status as string) || "active"]}>
                          {t(STATUS_KEYS[scanResult.entityData.status as string] ?? "")}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {scanResult.entityType === "material" && (
                    <div className="space-y-3 p-4 bg-muted rounded-lg">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("code")}:</span>
                        <span className="font-medium">{scanResult.entityData.kod as string}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("material")}:</span>
                        <span>{scanResult.entityData.xomAshyo as string}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("stockRemaining")}:</span>
                        <span>{(scanResult.entityData.currentStock as number)?.toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {Object.entries(scanResult.suggestedActions).map(([action, info]) => (
                      <Button
                        key={action}
                        variant={info.enabled ? "outline" : "ghost"}
                        size="sm"
                        disabled={!info.enabled}
                        onClick={() => onScanActionToast(info)}
                        data-testid={`button-action-${action}`}
                      >
                        {action === "receive" && <Archive className="h-4 w-4 mr-1" />}
                        {action === "issue" && <ArrowRight className="h-4 w-4 mr-1" />}
                        {action === "move" && <ArrowRight className="h-4 w-4 mr-1" />}
                        {action === "count" && <CheckCircle2 className="h-4 w-4 mr-1" />}
                        {info[lang]}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-[13px] text-muted-foreground">
                  <ScanLine className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>{t("scanBarcodePrompt")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </>
  );
}