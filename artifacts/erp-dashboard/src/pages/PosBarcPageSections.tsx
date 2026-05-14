/**
 * @module PosBarcPageSections
 * @description Barcode scanner UI, product result panels, and scan history for PosBarcPage.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Barcode, Search, Wand2, Copy, CheckCheck, Package, Hash,
} from "lucide-react";
import { type ScanResult, type HistoryEntry } from "./PosBarcPageTypes";
import { EPStatusPill } from "@/components/ep";

// ─── ScanPanel ────────────────────────────────────────────────────────────

interface ScanPanelProps {
  scanInput: string;
  scanResult: ScanResult | null;
  scanPending: boolean;
  copied: "scan" | "gen" | null;
  history: HistoryEntry[];
  onInputChange: (val: string) => void;
  onScan: () => void;
  onCopy: (text: string, which: "scan" | "gen") => void;
  onHistoryClick: (barcode: string) => void;
}

export function ScanPanel({
  scanInput,
  scanResult,
  scanPending,
  copied,
  history,
  onInputChange,
  onScan,
  onCopy,
  onHistoryClick,
}: ScanPanelProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4" />
            Barcode Skanerlash
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>EAN-13 / QR barcode</Label>
            <div className="flex gap-2">
              <Input
                value={scanInput}
                onChange={e => onInputChange(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") onScan(); }}
                placeholder="Barcode skanerlang yoki kiriting..."
                className="font-mono"
                data-testid="input-barcode-scan"
              />
              <Button
                onClick={onScan}
                disabled={!scanInput.trim() || scanPending}
                data-testid="button-scan-barcode"
              >
                {scanPending ? "..." : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {scanResult && (
            <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Barcode className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-sm font-medium">{scanInput}</span>
                  {scanResult.cached && (
                    <EPStatusPill tone="neutral" className="text-xs">Cache</EPStatusPill>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => onCopy(scanInput, "scan")}
                  data-testid="button-copy-scanned"
                >
                  {copied === "scan"
                    ? <CheckCheck className="h-3.5 w-3.5 text-[var(--ep-green)]" />
                    : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>

              {(scanResult.material ?? scanResult.materialCard) ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">
                      {scanResult.material?.name ?? scanResult.materialCard?.name}
                    </span>
                    <EPStatusPill tone="success" className="text-xs">Topildi</EPStatusPill>
                  </div>
                  {(scanResult.material?.code ?? scanResult.materialCard?.code) && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Hash className="h-3 w-3" />
                      {scanResult.material?.code ?? scanResult.materialCard?.code}
                    </div>
                  )}
                  {scanResult.material?.unit && (
                    <p className="text-xs text-muted-foreground">Birlik: {scanResult.material.unit}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <EPStatusPill tone="danger" className="text-xs">Topilmadi</EPStatusPill>
                  </div>
                  {scanResult.aiSuggestion && (
                    <p className="text-xs text-muted-foreground">
                      AI taklif: {scanResult.aiSuggestion}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">So'nggi skanlar</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {history.map((h, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-4 py-2 text-sm hover:bg-muted/40 cursor-pointer"
                  onClick={() => onHistoryClick(h.barcode)}
                  data-testid={`history-item-${i}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-xs text-muted-foreground shrink-0">{h.barcode}</span>
                    <Separator orientation="vertical" className="h-3" />
                    <span className="truncate text-xs">{h.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">{h.ts}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── GeneratePanel ────────────────────────────────────────────────────────

interface GeneratePanelProps {
  genPrefix: string;
  genResult: string | null;
  genPending: boolean;
  copied: "scan" | "gen" | null;
  onPrefixChange: (val: string) => void;
  onGenerate: () => void;
  onCopy: (text: string, which: "scan" | "gen") => void;
}

export function GeneratePanel({
  genPrefix,
  genResult,
  genPending,
  copied,
  onPrefixChange,
  onGenerate,
  onCopy,
}: GeneratePanelProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Wand2 className="h-4 w-4" />
          EAN-13 Generatsiya
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label>Prefiks (2-7 raqam)</Label>
          <Input
            value={genPrefix}
            onChange={e => onPrefixChange(e.target.value.replace(/\D/g, "").slice(0, 7))}
            placeholder="200"
            className="font-mono"
            maxLength={7}
            data-testid="input-ean13-prefix"
          />
          <p className="text-xs text-muted-foreground">
            GS1 algoritmiga asosan to'liq 13 raqamli EAN-13 generatsiya qilinadi
          </p>
        </div>

        <Button
          className="w-full gap-2"
          onClick={onGenerate}
          disabled={!genPrefix || genPending}
          data-testid="button-generate-ean13"
        >
          <Wand2 className="h-4 w-4" />
          {genPending ? "Yaratilmoqda..." : "EAN-13 Yaratish"}
        </Button>

        {genResult && (
          <div className="rounded-lg border p-4 bg-muted/30 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Yaratilgan EAN-13</p>
                <p className="font-mono text-2xl font-bold tracking-widest">{genResult}</p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9"
                onClick={() => onCopy(genResult, "gen")}
                data-testid="button-copy-generated"
              >
                {copied === "gen"
                  ? <CheckCheck className="h-4 w-4 text-[var(--ep-green)]" />
                  : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            <div className="flex items-end gap-px justify-center py-2 px-4 bg-white rounded border">
              {genResult.split("").map((digit, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div
                    className="bg-black"
                    style={{
                      width: 2 + (parseInt(digit) % 3),
                      height: 40 + (i % 2 === 0 ? 8 : 0),
                    }}
                  />
                </div>
              ))}
            </div>
            <p className="text-center font-mono text-xs text-muted-foreground tracking-widest">
              {genResult}
            </p>
          </div>
        )}

        <Separator />

        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">EAN-13 haqida:</p>
          <p>• 13 raqamdan iborat xalqaro barcode standarti</p>
          <p>• Oxirgi raqam — tekshirish raqami (avtomatik hisoblanadi)</p>
          <p>• 200-299 prefiksi — mahalliy ishlatish uchun</p>
        </div>
      </CardContent>
    </Card>
  );
}
