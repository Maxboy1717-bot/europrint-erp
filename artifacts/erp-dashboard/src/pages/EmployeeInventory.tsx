/**
 * EmployeeInventory.tsx
 * ERP — Xodimning shaxsiy invertar balansi.
 * URL: /wms/employee-inventory
 */
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { User, Backpack } from "lucide-react";

import { useTranslation } from '@/lib/i18n';
interface InventoryItem {
  id: number;
  materialCardId: number;
  materialName?: string;
  materialCode?: string;
  issuedQuantity: number;
  returnedQuantity: number;
  currentBalance: number;
  totalValue: number;
  status: string;
  lastMovementAt: string | null;
}

export default function EmployeeInventory() {
  const { t } = useTranslation('common');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<{ id: number; fullName: string; username: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [meR, invR] = await Promise.all([
        apiRequest<{ id: number; firstName?: string; lastName?: string; username: string }>("GET", "/api/auth/me").catch(() => null),
        apiRequest<InventoryItem[]>("GET", "/api/pos/employees/me/inventory").catch(() => []),
      ]);
      if (meR) setMe({
        id: meR.id,
        fullName: `${meR.firstName ?? ""} ${meR.lastName ?? ""}`.trim() || meR.username,
        username: meR.username,
      });
      setItems(Array.isArray(invR) ? invR : []);
    } catch { /* noop */ }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const totalValue = items.reduce((s, i) => s + (i.totalValue ?? 0), 0);
  const activeItems = items.filter(i => i.status === "ACTIVE" || (i.currentBalance ?? 0) > 0);

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="flex items-center gap-3 mb-6">
        <Backpack className="h-8 w-8 text-[var(--ep-yellow)]" />
        <div className="flex-1">
          <div className="text-xs text-gray-500 font-semibold">MENING INVENTARIM</div>
          <h1 className="text-2xl font-bold">{me ? me.fullName : "Foydalanuvchi"}</h1>
          {me && <p className="text-sm text-gray-500">@{me.username}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card><CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-[var(--ep-blue)]" />
            <div className="text-xs text-gray-500">JAMI INVENTAR</div>
          </div>
          <div className="text-3xl font-bold mt-2">{items.length}</div>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="text-xs text-gray-500">FAOL</div>
          <div className="text-3xl font-bold mt-2 text-[var(--ep-green)]">{activeItems.length}</div>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="text-xs text-gray-500">JAMI QIYMAT</div>
          <div className="text-3xl font-bold mt-2 text-[var(--ep-yellow)]">
            {totalValue.toLocaleString("uz-UZ", { maximumFractionDigits: 0 })} UZS
          </div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Menga berilgan materiallar</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-10 text-center text-gray-500">⏳ Yuklanmoqda...</div>
          ) : items.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              <Backpack className="h-10 w-10 mx-auto mb-2 opacity-50" />
              Sizga hech narsa berilmagan
            </div>
          ) : (
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Material')}</TableHead>
                  <TableHead>Kod</TableHead>
                  <TableHead className="text-right">Berilgan</TableHead>
                  <TableHead className="text-right">Qaytarilgan</TableHead>
                  <TableHead className="text-right">Joriy balans</TableHead>
                  <TableHead className="text-right">Qiymat</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead>Oxirgi harakat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(it => (
                  <TableRow key={it.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium">{it.materialName ?? `#${it.materialCardId}`}</TableCell>
                    <TableCell className="font-mono text-xs">{it.materialCode ?? "—"}</TableCell>
                    <TableCell className="text-right font-mono">{Number(it.issuedQuantity ?? 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono text-gray-500">{Number(it.returnedQuantity ?? 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      {Number(it.currentBalance ?? 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-[var(--ep-green)]">
                      {Number(it.totalValue ?? 0).toLocaleString("uz-UZ", { maximumFractionDigits: 0 })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={it.status === "ACTIVE" ? "default" : "secondary"}>
                        {it.status === "ACTIVE" ? "Faol" : it.status === "RETURNED" ? "Qaytarilgan" : it.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {it.lastMovementAt ? new Date(it.lastMovementAt).toLocaleDateString("uz-UZ") : "—"}
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
