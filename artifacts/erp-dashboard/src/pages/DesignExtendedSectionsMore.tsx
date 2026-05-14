/**
 * @module DesignExtendedSectionsMore
 * @description Additional tab sections for DesignExtended: Templates, Tools, Costing, Library.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DesignTool, DesignTemplate, CostRow } from "./DesignExtendedTypes";
import { toolStatusMap } from "./DesignExtendedTypes";

// ─── Templates Tab ────────────────────────────────────────────────────────────

interface TemplatesTabProps {
  templates: DesignTemplate[];
}

export function TemplatesTab({ templates }: TemplatesTabProps) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Tayyor qoliplar</CardTitle></CardHeader>
      <CardContent>
        {templates.length === 0 ? (
          <div className="text-center py-12 text-[13px] text-muted-foreground">Shablonlar mavjud emas</div>
        ) : (
          <div className="ep-table-scroll"><Table>
            <TableHeader><TableRow>
              <TableHead>Shablon raqami</TableHead>
              <TableHead>Nomi</TableHead>
              <TableHead>Toifa</TableHead>
              <TableHead>Brend</TableHead>
              <TableHead className="text-right">Ishlatilgan</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {(Array.isArray(templates) ? templates : []).map((t) => (
                <TableRow key={t.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-mono text-sm text-muted-foreground">{t.templateNumber || "—"}</TableCell>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>{t.category ? <Badge variant="outline">{t.category}</Badge> : "—"}</TableCell>
                  <TableCell className="text-sm">{t.brandName || "—"}</TableCell>
                  <TableCell className="text-right text-sm">{t.usageCount ?? 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Tools Tab ────────────────────────────────────────────────────────────────

interface ToolsTabProps {
  tools: DesignTool[];
}

export function ToolsTab({ tools }: ToolsTabProps) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Bosma asboblar inventari</CardTitle></CardHeader>
      <CardContent>
        {tools.length === 0 ? (
          <div className="text-center py-12 text-[13px] text-muted-foreground">Uskunalar ro'yxati bo'sh</div>
        ) : (
          <div className="ep-table-scroll"><Table>
            <TableHeader><TableRow>
              <TableHead>Asbob nomi</TableHead>
              <TableHead>Tur</TableHead>
              <TableHead>Holat</TableHead>
              <TableHead>So'nggi TO</TableHead>
              <TableHead>Keyingi TO</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {(Array.isArray(tools) ? tools : []).map((t) => {
                const statusLabel = t.status ? (toolStatusMap[t.status] || t.status) : "—";
                const isOverdue = t.status === "overdue";
                return (
                  <TableRow key={t.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium">{t.equipmentName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.maintenanceType}</TableCell>
                    <TableCell>
                      <Badge variant={t.status === "completed" ? "default" : t.status === "overdue" ? "destructive" : "secondary"}>
                        {statusLabel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{t.lastMaintenanceDate || "—"}</TableCell>
                    <TableCell className="text-sm">
                      <span className={isOverdue ? "text-[var(--ep-red)]" : ""}>{t.nextMaintenanceDate || "—"}</span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table></div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Costing Tab ──────────────────────────────────────────────────────────────

interface CostingTabProps {
  costData: CostRow[];
  totalCost: number;
}

export function CostingTab({ costData, totalCost }: CostingTabProps) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Dizayn xarajat kalkulyatori</CardTitle></CardHeader>
      <CardContent>
        <div className="ep-table-scroll"><Table>
          <TableHeader><TableRow>
            <TableHead>Komponent</TableHead>
            <TableHead className="text-right">Birlik narxi</TableHead>
            <TableHead className="text-right">Jami</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {(Array.isArray(costData) ? costData : []).map((c, i) => (
              <TableRow key={`k-${i}`} className="hover:bg-muted/40 transition-colors">
                <TableCell>{c.component}</TableCell>
                <TableCell className="text-right text-muted-foreground text-sm">{c.rate.toLocaleString()} so'm</TableCell>
                <TableCell className="text-right font-medium">{c.total.toLocaleString()} so'm</TableCell>
              </TableRow>
            ))}
            <TableRow className="border-t-2 hover:bg-muted/40 transition-colors">
              <TableCell colSpan={2} className="font-bold">Jami dizayn tannarxi</TableCell>
              <TableCell className="text-right font-bold text-primary">{totalCost.toLocaleString()} so'm</TableCell>
            </TableRow>
          </TableBody>
        </Table></div>
        <p className="text-xs text-muted-foreground mt-3">
          * Narxlar taxminiy. Haqiqiy narx buyurtma xususiyatlariga qarab farq qiladi.
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Library Tab ──────────────────────────────────────────────────────────────

export function LibraryTab() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <CardTitle className="text-base">Dizayn asset kutubxonasi</CardTitle>
          <Button size="sm" variant="outline">Yangi asset qo'shish</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-[13px] text-muted-foreground">
          Brend kutubxonasi fayllari mavjud emas. Administrator tomonidan qo'shilishi kerak.
        </div>
      </CardContent>
    </Card>
  );
}
