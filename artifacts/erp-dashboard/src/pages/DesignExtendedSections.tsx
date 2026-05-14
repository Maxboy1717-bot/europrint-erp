/**
 * @module DesignExtendedSections
 * @description Tab content section components for DesignExtended.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Boxes, Scale, CheckCircle2, XCircle, Package, Palette,
} from "lucide-react";
import type { DesignOrder, BrandColor } from "./DesignExtendedTypes";
import { EPStatusPill } from "@/components/ep";

// ─── AI Review Tab ────────────────────────────────────────────────────────────

interface AiReviewTabProps {
  pendingReview: DesignOrder[];
  onOpenOrder: (id: number) => void;
}

export function AiReviewTab({ pendingReview, onOpenOrder }: AiReviewTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">Tekshiruv kutilayotgan</p>
          <p className="text-2xl font-bold">{pendingReview.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">Bugun tasdiqlangan</p>
          <p className="text-2xl font-bold text-[var(--ep-green)]">0</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">Rad etilgan</p>
          <p className="text-2xl font-bold text-[var(--ep-red)]">0</p>
        </CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">AI tekshiruv navbati</CardTitle></CardHeader>
        <CardContent>
          {pendingReview.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-12 h-12 text-[var(--ep-green)] mx-auto mb-3" />
              <p className="text-muted-foreground">Barcha dizaynlar tekshirilgan</p>
            </div>
          ) : (
            <div className="ep-table-scroll"><Table>
              <TableHeader><TableRow>
                <TableHead>Buyurtma</TableHead>
                <TableHead>Holat</TableHead>
                <TableHead>AI natija</TableHead>
                <TableHead></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {(Array.isArray(pendingReview) ? pendingReview : []).map((o) => (
                  <TableRow key={o.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell>{o.title || o.papkaNo}</TableCell>
                    <TableCell><EPStatusPill tone="neutral">{o.status}</EPStatusPill></TableCell>
                    <TableCell><Badge variant="outline">Kutilmoqda</Badge></TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => onOpenOrder(o.id)}>Tekshirish</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── 3D Mockup Tab ────────────────────────────────────────────────────────────

export function MockupTab() {
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Boxes className="w-5 h-5" />3D Quti Vizualizatsiya</CardTitle></CardHeader>
      <CardContent>
        <div className="border-2 border-dashed rounded-lg flex flex-col items-center justify-center min-h-64 gap-4 text-muted-foreground">
          <Package className="w-16 h-16 opacity-30" />
          <p className="text-sm">3D render uchun dizayn faylini yuklang</p>
          <Button variant="outline">Fayl yuklash (AI/PDF/DXF)</Button>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="p-3 rounded-md border">
            <p className="font-medium mb-1">Standart o'lchamlar</p>
            <p className="text-muted-foreground">F201: 300×200×150 mm</p>
            <p className="text-muted-foreground">F302: 150×100×100 mm</p>
          </div>
          <div className="p-3 rounded-md border">
            <p className="font-medium mb-1">So'nggi mockuplar</p>
            <p className="text-muted-foreground text-sm italic">Hali mockup yaratilmagan</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Brand Guidelines Tab ─────────────────────────────────────────────────────

interface BrandTabProps {
  colors: BrandColor[];
}

export function BrandTab({ colors }: BrandTabProps) {
  const doRules = ["Logoni kichraytirmang 32px dan past", "Fon bilan kontrast saqlang", "Logoni cho'zmang", "Rangli versiyadan foydalaning"];
  const dontRules = ["To'q fonda oq versiyani ishlating", "Logoni aylantirmang"];
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Korporativ ranglar</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {(Array.isArray(colors) ? colors : []).map((c, i) => (
              <div key={`k-${i}`} className="flex items-center gap-3 p-3 rounded-md border">
                <div className="w-10 h-10 rounded-md border shrink-0" style={{ backgroundColor: c.hex }} />
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{c.hex}</p>
                  <p className="text-xs text-muted-foreground">{c.usage}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Shriftlar</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="p-3 rounded-md border"><p className="text-xl font-bold">Inter Bold</p><p className="text-xs text-muted-foreground">Sarlavhalar uchun</p></div>
            <div className="p-3 rounded-md border"><p className="text-base">Inter Regular</p><p className="text-xs text-muted-foreground">Asosiy matn uchun</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Logo qoidalari</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {doRules.map((rule, i) => (
                <div key={`k-${i}`} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--ep-green)] shrink-0" /><span>{rule}</span>
                </div>
              ))}
              {dontRules.map((rule, i) => (
                <div key={`k-${i}`} className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-[var(--ep-red)] shrink-0" /><span className="text-muted-foreground">{rule}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Compare Tab ──────────────────────────────────────────────────────────────

export function CompareTab() {
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Scale className="w-5 h-5" />Variantlarni solishtirish</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(["A varianti", "B varianti"]).map((v, i) => (
            <div key={`k-${i}`} className="border-2 border-dashed rounded-lg flex flex-col items-center justify-center min-h-48 gap-3 text-muted-foreground">
              <Palette className="w-10 h-10 opacity-30" />
              <p className="text-sm font-medium">{v}</p>
              <Button variant="outline" size="sm">Yuklash</Button>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Ikkala dizaynni yuklab, yonma-yon solishtirishingiz mumkin
        </p>
      </CardContent>
    </Card>
  );
}

// TemplatesTab, ToolsTab, CostingTab, LibraryTab are in DesignExtendedSectionsMore.tsx
export { TemplatesTab, ToolsTab, CostingTab, LibraryTab } from "./DesignExtendedSectionsMore";
