/**
 * @module SuppliersTab
 * @description React UI component.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fmtMoney, fmtDate, type SuppliersInfo, type BasicInfo } from "./types";

export function SuppliersTab({ suppliers, basic }: { suppliers: SuppliersInfo; basic: BasicInfo }) {
  return (
    <div className="space-y-4">
      {suppliers.primarySupplier ? (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Asosiy yetkazib beruvchi</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {([["Nomi", suppliers.primarySupplier.name], ["Joriy narx", fmtMoney(suppliers.primarySupplier.currentPrice, suppliers.primarySupplier.currency || "UZS")], ["Oxirgi xarid", fmtDate(suppliers.primarySupplier.lastPurchaseDate)]]).map(([l, v]) => (
              <div key={l} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{l}</span>
                <span className="font-medium">{v}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">Yetkazib beruvchi ma'lumoti kiritilmagan</CardContent></Card>
      )}
      {(suppliers.allSuppliers || []).length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Barcha yetkazib beruvchilar</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>{(["Nom", "Narx", "Oxirgi xarid"]).map(h => <th key={h} className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">{h}</th>)}</tr>
              </thead>
              <tbody>
                {suppliers.allSuppliers?.map((s, i) => (
                  <tr key={`k-${i}`} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-2 font-medium">{s.name}</td>
                    <td className="px-4 py-2">{fmtMoney(s.currentPrice, "UZS")}</td>
                    <td className="px-4 py-2 text-muted-foreground">{fmtDate(s.lastPurchaseDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
      <span className="hidden">{basic.unitOfMeasure}</span>
    </div>
  );
}
