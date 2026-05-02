import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileCheck } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const STANDARD_TYPES = [
  { value: "iso", label: "ISO" },
  { value: "gost", label: "GOST" },
  { value: "uzst", label: "O'zDSt" },
  { value: "internal", label: "Ichki standart" }
];

export function QCCertificateGenerator() {
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
  <title>Sifat Sertifikati — ${certForm.batchNumber}</title>
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
    <h2>SIFAT SERTIFIKATI / СЕРТИФИКАТ КАЧЕСТВА</h2>
    <p style="margin:4px 0; font-size:13px; color:#555;">Sertifikat raqami: <strong>CERT-${certForm.batchNumber || "XXXX"}-${new Date().getFullYear()}</strong> &nbsp;|&nbsp; Sana: <strong>${dateStr}</strong></p>
    <div class="badge">${passText}</div>
  </div>

  <div class="section">Mahsulot va buyurtma ma'lumotlari</div>
  <table>
    <tr><th>Mahsulot nomi</th><td>${certForm.productName}</td><th>Partiya №</th><td>${certForm.batchNumber}</td></tr>
    <tr><th>Buyurtmachi</th><td>${certForm.customerName}</td><th>Buyurtma №</th><td>${certForm.orderNumber}</td></tr>
    <tr><th>Ishlab chiqarish sanasi</th><td>${certForm.productionDate}</td><th>Standart</th><td>${certForm.standard.toUpperCase()}</td></tr>
  </table>

  <div class="section">Fizik-mexanik ko'rsatkichlar</div>
  <table>
    <tr><th>Ko'rsatkich</th><th>O'lchov</th><th>O'lchov birligi</th><th>Baholash</th></tr>
    <tr><td>Grammatura (gram vazni)</td><td>${certForm.gramWeight || "—"}</td><td>g/m²</td><td>${certForm.gramWeight ? "✓ Normada" : "—"}</td></tr>
    <tr><td>Qalinlik</td><td>${certForm.thickness || "—"}</td><td>mm</td><td>${certForm.thickness ? "✓ Normada" : "—"}</td></tr>
    <tr><td>Namlik</td><td>${certForm.moisture || "—"}</td><td>%</td><td>${certForm.moisture ? "✓ Normada" : "—"}</td></tr>
    <tr><td>Yorilish mustahkamligi (BCT)</td><td>${certForm.burstingStrength || "—"}</td><td>kPa</td><td>${certForm.burstingStrength ? "✓ Normada" : "—"}</td></tr>
    <tr><td>Qirradan ezilish testi (ECT)</td><td>${certForm.edgeCrushTest || "—"}</td><td>kN/m</td><td>${certForm.edgeCrushTest ? "✓ Normada" : "—"}</td></tr>
  </table>

  ${certForm.notes ? `<div class="section">Izohlar</div><p style="font-size:13px; border:1px solid #ccc; padding:10px; border-radius:4px;">${certForm.notes}</p>` : ""}

  <div class="footer">
    <div>
      <div class="sign-box">Sifat muhandisi<br/>${certForm.inspector || "_______________"}</div>
    </div>
    <div>
      <div class="sign-box">QC Boshlig'i imzosi<br/>_______________</div>
    </div>
    <div>
      <div class="sign-box">Muhr<br/><br/></div>
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
          Sifat Sertifikati Yaratish
        </CardTitle>
        <CardDescription>Mahsulot partiyasi uchun sifat sertifikati to'ldiring va chop eting</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Partiya (Batch) raqami</label>
            <Input value={certForm.batchNumber} onChange={e => setCertForm(p => ({ ...p, batchNumber: e.target.value }))} placeholder="BATCH-2026-001" data-testid="cert-batch" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Mahsulot nomi</label>
            <Input value={certForm.productName} onChange={e => setCertForm(p => ({ ...p, productName: e.target.value }))} placeholder="Gofrokarton B flüt" data-testid="cert-product" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Buyurtmachi nomi</label>
            <Input value={certForm.customerName} onChange={e => setCertForm(p => ({ ...p, customerName: e.target.value }))} placeholder="Mijoz nomi" data-testid="cert-customer" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Buyurtma raqami</label>
            <Input value={certForm.orderNumber} onChange={e => setCertForm(p => ({ ...p, orderNumber: e.target.value }))} placeholder="ORD-2026-0512" data-testid="cert-order" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Ishlab chiqarish sanasi</label>
            <Input type="date" value={certForm.productionDate} onChange={e => setCertForm(p => ({ ...p, productionDate: e.target.value }))} data-testid="cert-date" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">QC inspektor (F.I.Sh.)</label>
            <Input value={certForm.inspector} onChange={e => setCertForm(p => ({ ...p, inspector: e.target.value }))} placeholder="Toshmatov B.S." data-testid="cert-inspector" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
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
            <label className="text-sm font-medium">Standart</label>
            <Select value={certForm.standard} onValueChange={v => setCertForm(p => ({ ...p, standard: v }))}>
              <SelectTrigger data-testid="cert-standard"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Array.isArray(STANDARD_TYPES) ? STANDARD_TYPES : []).map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Yakuniy natija</label>
            <Select value={certForm.result} onValueChange={v => setCertForm(p => ({ ...p, result: v }))}>
              <SelectTrigger data-testid="cert-result"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="passed">O'tgan ✓</SelectItem>
                <SelectItem value="failed">Yiqilgan ✗</SelectItem>
                <SelectItem value="conditional">Shartli o'tgan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Izohlar</label>
          <Textarea value={certForm.notes} onChange={e => setCertForm(p => ({ ...p, notes: e.target.value }))} placeholder="Qo'shimcha izoh yoki shartlar..." rows={2} data-testid="cert-notes" />
        </div>

        <div className="flex gap-3">
          <Button onClick={printCertificate} className="flex-1" data-testid="button-print-certificate">
            <FileCheck className="w-4 h-4 mr-2" />
            Sertifikat Chop Etish (PDF)
          </Button>
          <Button variant="outline" onClick={() => setCertForm({
            batchNumber: "", productName: "", customerName: "", orderNumber: "",
            productionDate: new Date().toISOString().split("T")[0],
            inspector: "", gramWeight: "", thickness: "", moisture: "",
            burstingStrength: "", edgeCrushTest: "", standard: "iso", notes: "", result: "passed",
          })} data-testid="button-cert-reset">
            Tozalash
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
