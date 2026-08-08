/**
 * @module QCCertificateGenerator
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileCheck, Save } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from '@/lib/i18n';
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const escHtml = (v: unknown): string =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const STANDARD_TYPES = [
  { value: "iso", label: "ISO" },
  { value: "gost", label: "GOST" },
  { value: "uzst", label: "O'zDSt" },
  { value: "internal", label: "Ichki standart" }
];

export function QCCertificateGenerator() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const [certForm, setCertForm] = useState({
    batchNumber: "",
    productName: "",
    customerName: "",
    orderNumber: "",
    productionDate: new Date().toISOString().split("T")[0],
    inspector: "",
    gramWeight: "",
    thickness: "",
    moisture: "",
    burstingStrength: "",
    edgeCrushTest: "",
    standard: "iso",
    notes: "",
    result: "passed",
  });

  const year = new Date().getFullYear();

  const saveCertMutation = useMutation({
    mutationFn: (d: {
      certNumber: string;
      orderId?: number;
      productName?: string;
      issuedDate?: string;
      status: string;
      notes?: string;
      issuedBy?: string;
    }) => apiRequest("POST", "/api/qc/certificates", d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/qc/certificates"] });
      toast({ title: "Sertifikat saqlandi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  function handleSave() {
    const certNumber = "CERT-" + (certForm.batchNumber || "XXXX") + "-" + year;
    const certStatus = certForm.result === "passed" ? "active" : "draft";
    saveCertMutation.mutate({
      certNumber,
      orderId: certForm.orderNumber ? parseInt(certForm.orderNumber, 10) : undefined,
      productName: certForm.productName || undefined,
      issuedDate: certForm.productionDate || undefined,
      status: certStatus,
      notes: certForm.notes || undefined,
      issuedBy: certForm.inspector || undefined,
    });
  }

  function printCertificate() {
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    const dateStr = new Date().toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric" });
    const passColor = certForm.result === "passed" ? "#16a34a" : "#dc2626";
    const passText = certForm.result === "passed" ? "O'TGAN ✓" : "YIQILGAN ✗";
    win.document.write(`
<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8"/>
  <title>Sifat Sertifikati — ${escHtml(certForm.batchNumber)}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #111; }
    .header { text-align: center; border-bottom: 3px solid #1e40af; padding-bottom: 16px; margin-bottom: 24px; }
    .logo { font-size: 24px; font-weight: bold; color: #1e40af; letter-spacing: 2px; }
    h2 { font-size: 18px; margin: 4px 0; }
    .badge { display: inline-block; padding: 4px 16px; border-radius: 4px; font-weight: bold; font-size: 18px; color: #fff; background: ${passColor}; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; font-size: 13px; }
    th { background: #eff6ff; font-weight: bold; }
    .section { font-weight: bold; font-size: 14px; margin: 16px 0 6px; border-left: 4px solid #1e40af; padding-left: 8px; }
    .footer { margin-top: 40px; display: flex; justify-content: space-between; }
    .sign-box { width: 200px; border-top: 1px solid #333; text-align: center; padding-top: 4px; font-size: 12px; color: #555; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">EUROPRINT</div>
    <h2>{t("sifatSertifikati")}</h2>
    <p style="margin:4px 0; font-size:13px; color:#555;">{t("sertifikatRaqami")}<strong>CERT-${escHtml(certForm.batchNumber) || "XXXX"}-${new Date().getFullYear()}</strong> &nbsp;|&nbsp; Sana: <strong>${escHtml(dateStr)}</strong></p>
    <div class="badge">${passText}</div>
  </div>

  <div class="section">{t("mahsulotVaBuyurtmaMalumotlari")}</div>
  <table>
    <tr><th>{t("mahsulotNomi")}</th><td>${escHtml(certForm.productName)}</td><th>{t("partiya")}</th><td>${escHtml(certForm.batchNumber)}</td></tr>
    <tr><th>{t("buyurtmachi")}</th><td>${escHtml(certForm.customerName)}</td><th>{t("buyurtma4")}</th><td>${escHtml(certForm.orderNumber)}</td></tr>
    <tr><th>{t("ishlabChiqarishSanasi")}</th><td>${escHtml(certForm.productionDate)}</td><th>{t("standart")}</th><td>${escHtml(certForm.standard.toUpperCase())}</td></tr>
  </table>

  <div class="section">{t("fizikMexanikKorsatkichlar")}</div>
  <table>
    <tr><th>{t("korsatkich")}</th><th>{t("olchov1")}</th><th>{t("olchovBirligi")}</th><th>{t("baholash")}</th></tr>
    <tr><td>{t("grammaturaGramVazni")}</td><td>${escHtml(certForm.gramWeight) || "—"}</td><td>g/m²</td><td>${certForm.gramWeight ? "✓ Normada" : "—"}</td></tr>
    <tr><td>{t("qalinlik")}</td><td>${escHtml(certForm.thickness) || "—"}</td><td>mm</td><td>${certForm.thickness ? "✓ Normada" : "—"}</td></tr>
    <tr><td>{t("namlik")}</td><td>${escHtml(certForm.moisture) || "—"}</td><td>%</td><td>${certForm.moisture ? "✓ Normada" : "—"}</td></tr>
    <tr><td>{t("yorilishMustahkamligiBct")}</td><td>${escHtml(certForm.burstingStrength) || "—"}</td><td>kPa</td><td>${certForm.burstingStrength ? "✓ Normada" : "—"}</td></tr>
    <tr><td>{t("qirradanEzilishTestiEct")}</td><td>${escHtml(certForm.edgeCrushTest) || "—"}</td><td>kN/m</td><td>${certForm.edgeCrushTest ? "✓ Normada" : "—"}</td></tr>
  </table>

  ${certForm.notes ? `<div class="section">{t("notes")}</div><p style="font-size:13px; border:1px solid #ccc; padding:10px; border-radius:4px;">${escHtml(certForm.notes)}</p>` : ""}

  <div class="footer">
    <div>
      <div class="sign-box">{t("sifatMuhandisi")}<br/>${escHtml(certForm.inspector) || "_______________"}</div>
    </div>
    <div>
      <div class="sign-box">{t("qcBoshligiImzosi")}<br/>_______________</div>
    </div>
    <div>
      <div class="sign-box">{t("muhr")}<br/><br/></div>
    </div>
  </div>
</body>
</html>`);
    win.document.close();
    setTimeout(() => win.print(), 400);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCheck className="w-5 h-5" />
          {t("sifatSertifikatiYaratish")}
        </CardTitle>
        <CardDescription>{t("mahsulotPartiyasiUchunSifatSertifikati")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">{t("partiyaBatchRaqami")}</label>
            <Input value={certForm.batchNumber} onChange={e => setCertForm(p => ({ ...p, batchNumber: e.target.value }))} placeholder="BATCH-2026-001" data-testid="cert-batch" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">{t("mahsulotNomi")}</label>
            <Input value={certForm.productName} onChange={e => setCertForm(p => ({ ...p, productName: e.target.value }))} placeholder={t("gofrokartonBFlT")} data-testid="cert-product" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">{t("buyurtmachiNomi")}</label>
            <Input value={certForm.customerName} onChange={e => setCertForm(p => ({ ...p, customerName: e.target.value }))} placeholder={t("mijozNomi")} data-testid="cert-customer" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">{t("buyurtmaRaqami")}</label>
            <Input value={certForm.orderNumber} onChange={e => setCertForm(p => ({ ...p, orderNumber: e.target.value }))} placeholder="ORD-2026-0512" data-testid="cert-order" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">{t("ishlabChiqarishSanasi")}</label>
            <Input type="date" value={certForm.productionDate} onChange={e => setCertForm(p => ({ ...p, productionDate: e.target.value }))} data-testid="cert-date" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">{t("qcInspektorFISh")}</label>
            <Input value={certForm.inspector} onChange={e => setCertForm(p => ({ ...p, inspector: e.target.value }))} placeholder={t("toshmatovBS")} data-testid="cert-inspector" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {([
            { label: "Grammatura (g/m²)", key: "gramWeight", ph: "130" },
            { label: "Qalinlik (mm)", key: "thickness", ph: "3.5" },
            { label: "Namlik (%)", key: "moisture", ph: "8.5" },
            { label: "BCT (kPa)", key: "burstingStrength", ph: "450" },
            { label: "ECT (kN/m)", key: "edgeCrushTest", ph: "6.5" },
          ]).map(field => (
            <div key={field.key} className="space-y-1">
              <label className="text-xs font-medium">{field.label}</label>
              <Input
                type="number"
                value={(certForm as Record<string, string>)[field.key]}
                onChange={e => setCertForm(p => ({ ...p, [field.key]: e.target.value }))}
                placeholder={field.ph}
                data-testid={`cert-${field.key}`}
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">{t("standart")}</label>
            <Select value={certForm.standard} onValueChange={v => setCertForm(p => ({ ...p, standard: v }))}>
              <SelectTrigger data-testid="cert-standard" className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Array.isArray(STANDARD_TYPES) ? STANDARD_TYPES : []).map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">{t("yakuniyNatija")}</label>
            <Select value={certForm.result} onValueChange={v => setCertForm(p => ({ ...p, result: v }))}>
              <SelectTrigger data-testid="cert-result" className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="passed">{t("otgan")}</SelectItem>
                <SelectItem value="failed">{t("yiqilgan")}</SelectItem>
                <SelectItem value="conditional">{t("shartliOtgan")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">{t("notes")}</label>
          <Textarea value={certForm.notes} onChange={e => setCertForm(p => ({ ...p, notes: e.target.value }))} placeholder={t("qoshimchaIzohYokiShartlar")} rows={2} data-testid="cert-notes" />
        </div>

        <div className="flex gap-3">
          <Button onClick={printCertificate} className="flex-1 gap-2" data-testid="button-print-certificate">
            <FileCheck className="w-4 h-4" />
            Sertifikat Chop Etish (PDF)
          </Button>
          <Button
            variant="default"
            onClick={handleSave}
            disabled={saveCertMutation.isPending}
            className="gap-2"
            data-testid="button-save-certificate"
          >
            <Save className="w-4 h-4" />
            {saveCertMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
          <Button variant="outline" onClick={() => setCertForm({
            batchNumber: "", productName: "", customerName: "", orderNumber: "",
            productionDate: new Date().toISOString().split("T")[0],
            inspector: "", gramWeight: "", thickness: "", moisture: "",
            burstingStrength: "", edgeCrushTest: "", standard: "iso", notes: "", result: "passed",
          })} data-testid="button-cert-reset">
            {t("tozalash")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
