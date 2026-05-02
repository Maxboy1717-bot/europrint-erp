import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Star, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";

interface SupplierRating {
  supplierId: string;
  supplierName: string;
  deliveryCount: number;
  avgQualityScore: number;
  avgPassRate: number;
}

export function QCSupplierQualityTab() {
  const { data: supplierRatings, isLoading: suppliersLoading } = useQuery<SupplierRating[]>({
    queryKey: ["/api/qc/supplier-quality/ratings"],
  });

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api"] })} className="sr-only" aria-label="Yangilash"><RefreshCw className="h-4 w-4" /></Button>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5" />
          Yetkazuvchi sifat reytingi
        </CardTitle>
        <CardDescription>Har yetkazuvchi bo'yicha material sifat ko'rsatkichlari</CardDescription>
      </CardHeader>
      <CardContent>
        {suppliersLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : !supplierRatings?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            Supplier ma'lumotlari yo'q. Material testlari qo'shilgandan keyin avtomatik hisoblanadi.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Yetkazuvchi</TableHead>
                <TableHead>Yetkazma soni</TableHead>
                <TableHead>O'tish foizi</TableHead>
                <TableHead>Sifat bali</TableHead>
                <TableHead>Reyting</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(supplierRatings) ? supplierRatings : []).map((s, i) => (
                <TableRow key={s.supplierId} data-testid={`row-supplier-${i}`}>
                  <TableCell className="font-medium">{s.supplierName}</TableCell>
                  <TableCell>{s.deliveryCount}</TableCell>
                  <TableCell>{s.avgPassRate}%</TableCell>
                  <TableCell>{s.avgQualityScore}/100</TableCell>
                  <TableCell>
                    <Badge variant={s.avgQualityScore >= 90 ? "default" : s.avgQualityScore >= 70 ? "secondary" : "destructive"}>
                      {s.avgQualityScore >= 90 ? "A — Yaxshi" : s.avgQualityScore >= 70 ? "B — O'rta" : "C — Yomon"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
    </>
  );
}
