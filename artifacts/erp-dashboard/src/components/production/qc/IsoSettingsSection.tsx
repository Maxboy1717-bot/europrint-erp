/**
 * @module IsoSettingsSection
 * @description React UI component.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Settings as SettingsIcon } from "lucide-react";

export function IsoSettingsSection({ type }: { type: "iso" | "settings" }) {
  if (type === "iso") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Shield className="h-6 w-6 text-[var(--ep-blue)]" />
          </div>
          <div>
            <h2 className="text-xl font-bold">ISO Standartlari va Audit</h2>
            <p className="text-sm text-muted-foreground">Sifatni boshqarish tizimi hujjatlari (ISO 9001:2015)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-sm">Joriy Standartlar</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {([
                { name: "ISO 9001:2015", desc: "Sifat menejmenti tizimi", status: "Faol" },
                { name: "ISO 14001:2015", desc: "Ekologik menejment", status: "Jarayonda" },
                { name: "ISO 45001:2018", desc: "Mehnat muhofazasi", status: "Rejada" },
              ]).map((s, i) => (
                <div key={`k-${i}`} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-semibold text-sm">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.desc}</div>
                  </div>
                  <Badge variant={s.status === "Faol" ? "default" : "outline"}>{s.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Audit Rejasi (Q4 2024)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {([
                { name: "Ichki audit (Gofra)", date: "15.11.2024", type: "Internal" },
                { name: "Tashqi sertifikatlash", date: "22.12.2024", type: "External" },
              ]).map((a, i) => (
                <div key={`k-${i}`} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-semibold text-sm">{a.name}</div>
                    <div className="text-xs text-muted-foreground">Sana: {a.date}</div>
                  </div>
                  <Badge variant="secondary">{a.type}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
          <SettingsIcon className="h-6 w-6 text-slate-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Sifat Normalari Sozlamalari</h2>
          <p className="text-sm text-muted-foreground">Materiallar va mahsulotlar uchun ruxsat etilgan og'ishlar</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Avtomatik Bildirishnomalar</CardTitle>
          <CardDescription>Sifat ko'rsatkichlari normadan chetganda kimga xabar yuborish</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(["Sifat menejeri", "Ishlab chiqarish boshlig'i", "Laboratoriya mudiri"]).map((s, i) => (
            <div key={`k-${i}`} className="flex items-center justify-between py-2 border-b last:border-0">
              <span className="text-sm">{s}</span>
              <Badge variant="default" className="cursor-pointer">Yoqiq</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
