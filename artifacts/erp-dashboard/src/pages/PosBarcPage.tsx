/**
 * @module PosBarcPage
 * @description React page component. Route-level UI — state + orchestration only.
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ModulePage } from "@/components/ui/module-page";
import { Barcode } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type ScanResult, type GenerateResult, type HistoryEntry } from "./PosBarcPageTypes";
import { ScanPanel, GeneratePanel } from "./PosBarcPageSections";
import { useTranslation } from '@/lib/i18n';

export default function PosBarcPage() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [scanInput, setScanInput]   = useState("");
  const [genPrefix, setGenPrefix]   = useState("200");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [genResult, setGenResult]   = useState<string | null>(null);
  const [copied, setCopied]         = useState<"scan" | "gen" | null>(null);
  const [history, setHistory]       = useState<HistoryEntry[]>([]);

  const scanMutation = useMutation({
    mutationFn: async (barcode: string) => {
      const res = await apiRequest("POST", "/api/pos/barcode/scan", { barcode });
      return res.json() as Promise<ScanResult>;
    },
    onSuccess: (data) => {
      setScanResult(data);
      const name =
        data.material?.name ??
        data.materialCard?.name ??
        (data.aiSuggestion ? `AI: ${data.aiSuggestion}` : "Topilmadi");
      setHistory(prev => [
        { barcode: scanInput, name, ts: new Date().toLocaleTimeString("uz-UZ") },
        ...prev.slice(0, 9),
      ]);
      if (!data.found && !data.material && !data.materialCard) {
        toast({ title: "Barcode topilmadi", description: scanInput, variant: "destructive" });
      }
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Barcode skanerlashda xatolik", variant: "destructive" });
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (prefix: string) => {
      const res = await apiRequest("POST", "/api/pos/barcode/generate-ean13", { prefix });
      return res.json() as Promise<GenerateResult>;
    },
    onSuccess: (data) => {
      setGenResult(data.barcode);
      toast({ title: "EAN-13 yaratildi", description: data.barcode });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Barcode yaratishda xatolik", variant: "destructive" });
    },
  });

  const handleScan = () => {
    const val = scanInput.trim();
    if (!val) return;
    setScanResult(null);
    scanMutation.mutate(val);
  };

  const handleCopy = (text: string, which: "scan" | "gen") => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(which);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleHistoryClick = (barcode: string) => {
    setScanInput(barcode);
    setScanResult(null);
  };

  return (
    <ModulePage
      module="pos"
      title={t("barcodeSkanerlash")}
      icon={<Barcode className="h-5 w-5" />}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ScanPanel
          scanInput={scanInput}
          scanResult={scanResult}
          scanPending={scanMutation.isPending}
          copied={copied}
          history={history}
          onInputChange={setScanInput}
          onScan={handleScan}
          onCopy={handleCopy}
          onHistoryClick={handleHistoryClick}
        />

        <GeneratePanel
          genPrefix={genPrefix}
          genResult={genResult}
          genPending={generateMutation.isPending}
          copied={copied}
          onPrefixChange={setGenPrefix}
          onGenerate={() => generateMutation.mutate(genPrefix)}
          onCopy={handleCopy}
        />
      </div>
    </ModulePage>
  );
}
