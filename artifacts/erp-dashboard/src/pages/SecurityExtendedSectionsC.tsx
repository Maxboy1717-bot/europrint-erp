/**
 * @module SecurityExtendedSectionsC
 * @description HazmatSection, EvacuationSection, and RatingSection components for SecurityExtended.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle } from "lucide-react";
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

// ─── HazmatSection ────────────────────────────────────────────────────────

export function HazmatSection() {
  const { t } = useTranslation("common");
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{t("xavfliModdalarNazorati")}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {([
          { l: "Kuzatilayotgan moddalar", v: "—", c: "text-[var(--ep-primary)]" },
          { l: "Bugungi sarflov",         v: "—", c: "text-[var(--ep-green)]" },
          { l: "Muddati o'tayotgan",      v: "—", c: "text-[var(--ep-red)]" },
        ]).map(s => (
          <Card key={s.l}><CardContent className="pt-4 pb-3">
            <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
          </CardContent></Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("modda")}</TableHead>
                <TableHead>CAS №</TableHead>
                <TableHead>{t("xavfDarajasi")}</TableHead>
                <TableHead>{t("miqdori")}</TableHead>
                <TableHead>{t("saqlashJoyi")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {([
                { name: "UV Lak (izosiyanat)",    cas: "101-68-8",  level: "Yuqori", qty: "150 kg", loc: "Kimyo ombori-A" },
                { name: "IPA Spirt (%99)",         cas: "67-63-0",   level: "O'rta",  qty: "80 L",   loc: "Kimyo ombori-B" },
                { name: "CMYK Bo'yoq",             cas: "Aralash",   level: "Past",   qty: "200 kg", loc: "Bosma sexi" },
                { name: "Kontsentrat tozalagich",  cas: "1310-73-2", level: "Yuqori", qty: "45 L",   loc: "Kimyo ombori-A" },
              ]).map((h, i) => (
                <TableRow key={`k-${i}`} data-testid={`row-hazmat-${i}`} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium text-sm">{h.name}</TableCell>
                  <TableCell className="font-mono text-xs">{h.cas}</TableCell>
                  <TableCell>
                    <Badge variant={h.level === "Yuqori" ? "destructive" : h.level === "O'rta" ? "secondary" : "outline"}>{h.level}</Badge>
                  </TableCell>
                  <TableCell>{h.qty}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{h.loc}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── EvacuationSection ────────────────────────────────────────────────────

export function EvacuationSection() {
  const { t } = useTranslation("common");
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{t("evakuatsiyaProtokoli")}</h2>
      <div className="p-4 rounded-md bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-[var(--ep-yellow)] shrink-0 mt-0.5" />
        <div>
          <div className="font-medium text-yellow-800 dark:text-yellow-300">{t("oxirgiMashq15Mart2026")}</div>
          <div className="text-sm text-[var(--ep-yellow)] dark:text-yellow-400 mt-0.5">{t("evakuatsiyaVaqti4Daqiqa12")}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {([
          { l: "Evakuatsiya chiziqlari", v: "—", c: "text-primary" },
          { l: "Yig'ilish punktlari",    v: "—", c: "text-[var(--ep-green)]" },
          { l: "Yangilangan EYP",        v: "—", c: "text-[var(--ep-blue)]" },
          { l: "So'nggi mashq natijasi", v: "—", c: "text-[var(--ep-green)]" },
        ]).map(s => (
          <Card key={s.l}><CardContent className="pt-4 pb-3">
            <div className={`text-lg font-bold ${s.c}`}>{s.v}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
          </CardContent></Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">{t("masulXodimlar")}</CardTitle></CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground text-sm" data-testid="text-evacuation-empty">
            {t("masulXodimlarRoyxatiHrTizimida")}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── RatingSection ────────────────────────────────────────────────────────

interface RatingSectionProps {
  violationsCount: number;
}

export function RatingSection({ violationsCount }: RatingSectionProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{t("xavfsizlikReytingiVaKpi")}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {([
          { l: "Umumiy xavfsizlik bali",  v: "—",             c: "text-[var(--ep-green)]" },
          { l: "Baxtsiz hodisasiz kunlar", v: "—",             c: "text-primary" },
          { l: "Bu oy ogohlantirishlar",   v: violationsCount, c: "text-[var(--ep-primary)]" },
        ]).map(s => (
          <Card key={s.l}><CardContent className="pt-4 pb-3">
            <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
          </CardContent></Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">{t("bolimlarBoyichaXavfsizlikReytingi")}</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {([
              { dept: "QC Laboratoriya",        score: 98, incidents: 0 },
              { dept: "Ofis bo'limi",            score: 96, incidents: 0 },
              { dept: "Tayyor mahsulot ombori",  score: 91, incidents: 1 },
              { dept: "Bosma sexi",              score: 84, incidents: 2 },
              { dept: "Xom ashyo ombori",        score: 79, incidents: 3 },
            ]).map((r, i) => (
              <div key={`k-${i}`} className="space-y-1.5" data-testid={`row-rating-${i}`}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{r.dept}</span>
                  <div className="flex items-center gap-2">
                    {r.incidents > 0 && (
                      <EPStatusPill tone="danger" className="text-xs">{r.incidents} hodisa</EPStatusPill>
                    )}
                    <span className={`font-bold ${r.score >= 90 ? "text-[var(--ep-green)]" : r.score >= 80 ? "text-[var(--ep-yellow)]" : "text-[var(--ep-red)]"}`}>{r.score}</span>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded">
                  <div className={`h-2 rounded ${r.score >= 90 ? "bg-green-500" : r.score >= 80 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${r.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
