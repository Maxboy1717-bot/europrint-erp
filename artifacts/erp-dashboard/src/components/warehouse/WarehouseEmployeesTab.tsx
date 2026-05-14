/**
 * WarehouseEmployeesTab.tsx
 * Ombor xodimlari boshqaruvi — ERP `WarehouseHub12` ichidagi tab.
 */
import { useEffect, useState } from "react";
import { warehouseFeaturesApi } from "@/lib/api/warehouse-features";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

import { useTranslation } from '@/lib/i18n';
interface Employee {
  id: number; userId: number; username: string; fullName: string;
  role: string; isPrimary: boolean; assignedAt: string;
}

const ROLE_CONFIG: Record<string, { label: string; bg: string; emoji: string }> = {
  manager:      { label: "Menejer",        bg: "bg-amber-100 text-amber-800",  emoji: "👔" },
  staff:        { label: "Xodim",          bg: "bg-blue-100 text-blue-800",    emoji: "👷" },
  keeper:       { label: "Saqlovchi",      bg: "bg-emerald-100 text-emerald-800", emoji: "🔑" },
  qc_inspector: { label: "QC nazoratchi",  bg: "bg-green-100 text-green-800",  emoji: "🔬" },
  observer:     { label: "Kuzatuvchi",     bg: "bg-gray-100 text-gray-800",    emoji: "👁️" },
};

export function WarehouseEmployeesTab({ warehouseId, warehouseName, }: {
  warehouseId: string | number;
  warehouseName: string;
}) {
  const { t } = useTranslation('common');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const whIdNum = typeof warehouseId === "string" ? parseInt(warehouseId, 10) : warehouseId;
    if (!Number.isFinite(whIdNum)) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const r = await warehouseFeaturesApi.listEmployees(whIdNum);
        if (!cancelled) setEmployees(Array.isArray(r) ? (r as Employee[]) : []);
      } catch {
        if (!cancelled) setEmployees([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [warehouseId]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-[var(--ep-purple)]" />
          <CardTitle className="text-base">Xodimlar — {warehouseName}</CardTitle>
          <Badge variant="outline" className="ml-2 text-xs">{employees.length} ta</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Ushbu omborga biriktirilgan xodimlar (menejer, saqlovchi, QC nazoratchi va h.k.)
        </p>
      </CardHeader>
      <CardContent className="p-0">
        {loading && <div className="p-6 text-center text-sm text-muted-foreground">{t("yuklanmoqda")}</div>}

        {!loading && employees.length === 0 && (
          <div className="p-10 text-center">
            <div className="text-5xl">👥</div>
            <div className="mt-2 font-semibold">{t("xodimlarBiriktirilmagan")}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {t("buOmborgaHechQandayXodim")}
            </div>
          </div>
        )}

        {!loading && employees.length > 0 && (
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("foydalanuvchi")}</TableHead>
                <TableHead>{t('login1')}</TableHead>
                <TableHead>{t("role")}</TableHead>
                <TableHead>{t("primary")}</TableHead>
                <TableHead className="text-right">{t("biriktirilgan")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map(e => {
                const role = ROLE_CONFIG[e.role] ?? { label: e.role, bg: "bg-gray-100", emoji: "•" };
                return (
                  <TableRow key={e.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium">
                      {(e.fullName ?? "").trim() || `User #${e.userId}`}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{e.username}</TableCell>
                    <TableCell>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${role.bg}`}>
                        {role.emoji} {role.label}
                      </span>
                    </TableCell>
                    <TableCell>{e.isPrimary ? <Badge className="bg-amber-500">{t("asosiy")}</Badge> : "—"}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {e.assignedAt ? new Date(e.assignedAt).toLocaleDateString("uz-UZ") : "—"}
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
