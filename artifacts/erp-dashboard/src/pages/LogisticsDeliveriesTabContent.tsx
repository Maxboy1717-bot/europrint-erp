/**
 * @module LogisticsDeliveriesTabContent
 * @description Deliveries tab content for LogisticsDashboard.
 * Split from LogisticsDashboardLogisticsTab.tsx (Rule 16).
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from '@/lib/i18n';
import { Package, MapPin, Plus } from "lucide-react";
import type { Delivery } from "./LogisticsDashboardLogisticsTab";

const statusLabel: Record<string, string> = {
  in_transit: "Yo'lda", delivered: "Yetkazildi", planned: "Rejalashtirilgan",
  failed: "Bajarilmadi", cancelled: "Bekor qilindi",
  completed: "Bajarildi", in_progress: "Jarayonda",
};

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  in_transit: "default", delivered: "secondary", planned: "outline",
  failed: "destructive", cancelled: "outline",
};

interface Props {
  deliveries: Delivery[];
  dLoading: boolean;
  onAddDelivery: () => void;
  onUpdateDeliveryStatus: (id: string, status: string) => void;
  isUpdatingDelivery: boolean;
}

export function LogisticsDeliveriesTabContent({
  deliveries, dLoading, onAddDelivery, onUpdateDeliveryStatus, isUpdatingDelivery,
}: Props) {
  const { t } = useTranslation('common');
  return (
    <TabsContent value="deliveries">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />{t("yetkazishJadvali")}
              </CardTitle>
              <CardDescription>{t("faolVaRejalashtirilganYetkazishlar")}</CardDescription>
            </div>
            <Button onClick={onAddDelivery} data-testid="button-add-delivery">
              <Plus className="w-4 h-4 mr-2" />{t("yetkazishQosh")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {dLoading ? (
            <div className="p-4 space-y-2">
              {[...Array(3)].map((_, i) => <Skeleton key={`k-${i}`} className="h-10 w-full rounded-lg" />)}
            </div>
          ) : deliveries.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>{t("haliYetkazishQoshilmagan")}</p>
            </div>
          ) : (
            <div className="ep-table-scroll">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("Buyurtma")}</TableHead>
                    <TableHead>{t("mijoz1")}</TableHead>
                    <TableHead>{t("address")}</TableHead>
                    <TableHead>{t("haydovchi")}</TableHead>
                    <TableHead>{t("mashina")}</TableHead>
                    <TableHead>ETA</TableHead>
                    <TableHead>{t("weight")}</TableHead>
                    <TableHead>{t("status28")}</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(deliveries) ? deliveries : []).map(d => (
                    <TableRow key={d.id} data-testid={`row-delivery-${d.id}`} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-mono">{d.orderNo || "—"}</TableCell>
                      <TableCell className="font-medium">{d.customerName}</TableCell>
                      <TableCell className="text-sm">
                        {d.address
                          ? <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{d.address}</span>
                          : "—"}
                      </TableCell>
                      <TableCell>{d.driverName || "—"}</TableCell>
                      <TableCell className="font-mono text-sm">{d.plateNumber || "—"}</TableCell>
                      <TableCell className="text-sm">
                        {d.estimatedArrival ? new Date(d.estimatedArrival).toLocaleDateString("uz-UZ") : "—"}
                      </TableCell>
                      <TableCell>{d.weight ? `${(d.weight / 1000).toFixed(1)} t` : "—"}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[d.status] ?? "secondary"}>
                          {statusLabel[d.status] ?? d.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {d.status === "planned" && (
                          <Button
                            size="sm" variant="outline"
                            onClick={() => onUpdateDeliveryStatus(d.id, "in_transit")}
                            disabled={isUpdatingDelivery}
                            data-testid={`button-start-delivery-${d.id}`}
                          >
                            {t("yolgaChiq")}
                          </Button>
                        )}
                        {d.status === "in_transit" && (
                          <Button
                            size="sm" variant="secondary"
                            onClick={() => onUpdateDeliveryStatus(d.id, "delivered")}
                            disabled={isUpdatingDelivery}
                            data-testid={`button-complete-delivery-${d.id}`}
                          >
                            {t("Yetkazildi")}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
