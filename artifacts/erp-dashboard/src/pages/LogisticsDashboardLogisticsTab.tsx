/**
 * @module LogisticsDashboardLogisticsTab
 * @description React page component. Route-level UI.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from '@/lib/i18n';
import {
  Package, MapPin, Navigation, User, DollarSign, FileText, CheckCircle, Plus,
} from "lucide-react";

export interface Delivery {
  id: string;
  orderNo?: string;
  customerName?: string;
  address?: string;
  driverName?: string;
  plateNumber?: string;
  status: string;
  estimatedArrival?: string;
  weight?: number;
  cost?: number;
}

export interface VehicleLocation {
  id: string;
  vehicleId?: string;
  plateNumber?: string;
  latitude?: number;
  longitude?: number;
  speed?: number;
  status?: string;
  recordedAt?: string;
}

export interface DriverExpense {
  id: string;
  vehicleId?: string;
  plateNumber?: string;
  driverName?: string;
  expenseType?: string;
  amount?: number;
  expenseDate?: string;
  notes?: string;
  createdAt?: string;
}

export interface VendorInvoice {
  id: string;
  vendorId: string;
  vendorName?: string;
  purchaseOrderId?: string;
  goodsReceiptId?: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  totalAmount: number;
  taxAmount?: number;
  currency: string;
  status: string;
  matchStatus?: string;
  matchScore?: number;
  priceVariance?: number;
  quantityVariance?: number;
  createdAt?: string;
}

const statusLabel: Record<string, string> = {
  active: "Tayyor", on_route: "Yo'lda", maintenance: "Ta'mirda", idle: "Dam olmoqda", retired: "Hisobdan chiqarilgan",
  in_transit: "Yo'lda", delivered: "Yetkazildi", planned: "Rejalashtirilgan", failed: "Bajarilmadi", cancelled: "Bekor qilindi",
  completed: "Bajarildi", in_progress: "Jarayonda",
};

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "secondary", on_route: "default", maintenance: "destructive", idle: "outline", retired: "outline",
  in_transit: "default", delivered: "secondary", planned: "outline", failed: "destructive", cancelled: "outline",
};

interface Props {
  deliveries: Delivery[];
  gpsLocations: VehicleLocation[];
  driverExpenses: DriverExpense[];
  vendorInvoiceList: VendorInvoice[];
  dLoading: boolean;
  gpsLoading: boolean;
  driversLoading: boolean;
  viLoading: boolean;
  onAddDelivery: () => void;
  onUpdateDeliveryStatus: (id: string, status: string) => void;
  isUpdatingDelivery: boolean;
  onApproveInvoice: (id: string) => void;
  onMatchInvoice: (id: string) => void;
  isApprovingInvoice: boolean;
  isMatchingInvoice: boolean;
}

export function LogisticsDashboardLogisticsTab({deliveries, gpsLocations, driverExpenses, vendorInvoiceList,
  dLoading, gpsLoading, driversLoading, viLoading,
  onAddDelivery, onUpdateDeliveryStatus, isUpdatingDelivery,
  onApproveInvoice, onMatchInvoice, isApprovingInvoice, isMatchingInvoice,
}: Props) {
  const { t } = useTranslation('common');
  return (
    <>
      {/* YETKAZISHLAR */}
      <TabsContent value="deliveries">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="flex items-center gap-2"><Package className="w-5 h-5" />{t("yetkazishJadvali")}</CardTitle>
                <CardDescription>{t("faolVaRejalashtirilganYetkazishlar")}</CardDescription>
              </div>
              <Button onClick={onAddDelivery} data-testid="button-add-delivery">
                <Plus className="w-4 h-4 mr-2" />{t("yetkazishQosh")}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {dLoading ? (
              <div className="p-4 space-y-2">{([...Array(3)]).map((_, i) => <Skeleton key={`k-${i}`} className="h-10 w-full rounded-lg" />)}</div>
            ) : deliveries.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>{t("haliYetkazishQoshilmagan")}</p>
              </div>
            ) : (
              <div className="ep-table-scroll"><Table>
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
                        {d.address ? <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{d.address}</span> : "—"}
                      </TableCell>
                      <TableCell>{d.driverName || "—"}</TableCell>
                      <TableCell className="font-mono text-sm">{d.plateNumber || "—"}</TableCell>
                      <TableCell className="text-sm">{d.estimatedArrival ? new Date(d.estimatedArrival).toLocaleDateString("uz-UZ") : "—"}</TableCell>
                      <TableCell>{d.weight ? `${(d.weight / 1000).toFixed(1)} t` : "—"}</TableCell>
                      <TableCell><Badge variant={statusVariant[d.status] || "secondary"}>{statusLabel[d.status] || d.status}</Badge></TableCell>
                      <TableCell>
                        {d.status === "planned" && (
                          <Button size="sm" variant="outline" onClick={() => onUpdateDeliveryStatus(d.id, "in_transit")} disabled={isUpdatingDelivery} data-testid={`button-start-delivery-${d.id}`}>
                            {t("yolgaChiq")}
                          </Button>
                        )}
                        {d.status === "in_transit" && (
                          <Button size="sm" variant="secondary" onClick={() => onUpdateDeliveryStatus(d.id, "delivered")} disabled={isUpdatingDelivery} data-testid={`button-complete-delivery-${d.id}`}>
                            {t("Yetkazildi")}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* GPS MONITORING */}
      <TabsContent value="gps">
        <Card className="bg-card border-none rounded-xl">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Navigation className="w-5 h-5 text-primary" />
                {t("gpsMonitoringJonliJoylashuv")}
              </CardTitle>
              <Badge className="bg-primary/10 text-primary rounded-full px-3 py-0.5 text-xs border-none">
                {gpsLocations.length} mashina
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {gpsLoading ? (
              <div className="p-4 space-y-2">{([...Array(4)]).map((_, i) => <Skeleton key={`k-${i}`} className="h-10 w-full rounded-lg" />)}</div>
            ) : gpsLocations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="font-medium">{t("gpsMalumotlariMavjudEmas")}</p>
                <p className="text-sm mt-1 opacity-70">{t("mashinalarGpsQurilmasiOrqaliUlanganda")}</p>
              </div>
            ) : (
              <div className="ep-table-scroll"><Table>
                <TableHeader>
                  <TableRow className="bg-muted/60 hover:bg-muted/60 border-none">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("mashina")}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("width")}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("length")}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("tezlik")}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("status28")}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("time")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(gpsLocations) ? gpsLocations : []).map(loc => (
                    <TableRow key={loc.id} data-testid={`row-gps-${loc.id}`} className="hover:bg-muted/40 transition-colors border-none">
                      <TableCell className="py-3 px-6 font-mono font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${loc.status === "moving" ? "bg-primary" : loc.status === "idle" ? "bg-amber-500" : "bg-on-surface-variant"}`} />
                          {loc.plateNumber || loc.vehicleId || "—"}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-6 font-mono text-sm text-foreground">{loc.latitude?.toFixed(6) || "—"}</TableCell>
                      <TableCell className="py-3 px-6 font-mono text-sm text-foreground">{loc.longitude?.toFixed(6) || "—"}</TableCell>
                      <TableCell className="py-3 px-6 text-foreground">{loc.speed != null ? `${loc.speed} km/h` : "—"}</TableCell>
                      <TableCell className="py-3 px-6">
                        <Badge className={loc.status === "moving" ? "bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold border-none" : "bg-muted/60 text-foreground rounded-full px-2.5 py-0.5 text-xs font-semibold border-none"}>
                          {loc.status === "moving" ? "Harakatda" : loc.status === "idle" ? "To'xtagan" : loc.status || "Noma'lum"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 px-6 text-sm text-muted-foreground">
                        {loc.recordedAt ? new Date(loc.recordedAt).toLocaleTimeString("uz-UZ") : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* HAYDOVCHI XARAJATLARI */}
      <TabsContent value="drivers">
        <Card className="bg-card border-none rounded-xl">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                {t("haydovchiXarajatlari")}
              </CardTitle>
              <div className="text-sm font-semibold text-muted-foreground">
                Jami: {((Array.isArray(driverExpenses) ? driverExpenses : []).reduce((s, e) => s + (Number(e.amount) || 0), 0)).toLocaleString()} so'm
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {driversLoading ? (
              <div className="p-4 space-y-2">{([...Array(4)]).map((_, i) => <Skeleton key={`k-${i}`} className="h-10 w-full rounded-lg" />)}</div>
            ) : driverExpenses.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="font-medium">{t("haydovchiXarajatlariYoq")}</p>
                <p className="text-sm mt-1 opacity-70">{t("haydovchilarXarajatlariQaydEtilmagan")}</p>
              </div>
            ) : (
              <div className="ep-table-scroll"><Table>
                <TableHeader>
                  <TableRow className="bg-muted/60 hover:bg-muted/60 border-none">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("haydovchi")}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("mashina")}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("xarajatTuri")}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("quantity")}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("date")}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("Izoh")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(driverExpenses) ? driverExpenses : []).map(exp => (
                    <TableRow key={exp.id} data-testid={`row-driver-expense-${exp.id}`} className="hover:bg-muted/40 transition-colors border-none">
                      <TableCell className="py-3 px-6 font-medium text-foreground">{exp.driverName || "—"}</TableCell>
                      <TableCell className="py-3 px-6 font-mono text-sm text-foreground">{exp.plateNumber || exp.vehicleId || "—"}</TableCell>
                      <TableCell className="py-3 px-6">
                        <Badge className="bg-muted/60 text-foreground rounded-full px-2.5 py-0.5 text-xs font-semibold border-none">
                          {exp.expenseType || "Boshqa"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 px-6 font-mono font-medium text-foreground">{exp.amount ? `${Number(exp.amount).toLocaleString()} so'm` : "—"}</TableCell>
                      <TableCell className="py-3 px-6 text-sm text-foreground">{exp.expenseDate || (exp.createdAt ? new Date(exp.createdAt).toLocaleDateString("uz-UZ") : "—")}</TableCell>
                      <TableCell className="py-3 px-6 text-sm text-muted-foreground">{exp.notes || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* VENDOR FAKTURALARI */}
      <TabsContent value="invoices">
        <Card className="bg-card border-none rounded-xl">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {t("vendorFakturalari3WayMatch")}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">{t("poGrFakturaMoslikTekshiruvi")}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {viLoading ? (
              <div className="p-4 space-y-2">{([...Array(4)]).map((_, i) => <Skeleton key={`k-${i}`} className="h-10 w-full rounded-lg" />)}</div>
            ) : vendorInvoiceList.length === 0 ? (
              <div className="text-center py-12 text-[13px] text-muted-foreground">{t("vendorFakturalarTopilmadi")}</div>
            ) : (
              <div className="ep-table-scroll"><Table>
                <TableHeader>
                  <TableRow className="bg-muted/60 hover:bg-muted/60 border-none">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("faktura1")}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("yetkazuvchi")}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("date")}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("summa")}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t('status13')}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("match")}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("Amallar")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(vendorInvoiceList) ? vendorInvoiceList : []).map(inv => (
                    <TableRow key={inv.id} data-testid={`row-invoice-${inv.id}`} className="hover:bg-muted/40 transition-colors border-none">
                      <TableCell className="py-3 px-6 font-mono font-medium text-foreground">{inv.invoiceNumber}</TableCell>
                      <TableCell className="py-3 px-6 text-foreground">{inv.vendorName || inv.vendorId}</TableCell>
                      <TableCell className="py-3 px-6 text-sm text-muted-foreground">{inv.invoiceDate}</TableCell>
                      <TableCell className="py-3 px-6 font-medium text-foreground">
                        {Number(inv.totalAmount).toLocaleString()} {inv.currency}
                      </TableCell>
                      <TableCell className="py-3 px-6">
                        <Badge className={
                          inv.status === "approved" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-none rounded-full text-xs px-2.5 py-0.5" :
                          inv.status === "rejected" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-none rounded-full text-xs px-2.5 py-0.5" :
                          "bg-muted/60 text-muted-foreground border-none rounded-full text-xs px-2.5 py-0.5"
                        }>
                          {inv.status === "approved" ? "Tasdiqlangan" : inv.status === "rejected" ? "Rad etilgan" : "Kutilmoqda"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 px-6">
                        <Badge className={
                          inv.matchStatus === "matched" ? "bg-primary/10 text-primary border-none rounded-full text-xs px-2.5 py-0.5" :
                          inv.matchStatus === "partial" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-none rounded-full text-xs px-2.5 py-0.5" :
                          "bg-muted/60 text-muted-foreground border-none rounded-full text-xs px-2.5 py-0.5"
                        }>
                          {inv.matchStatus === "matched" ? "Mos" : inv.matchStatus === "partial" ? "Qisman" : "Tekshirilmagan"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 px-6">
                        <div className="flex items-center gap-2">
                          {inv.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onApproveInvoice(inv.id)}
                              disabled={isApprovingInvoice}
                              data-testid={`button-approve-invoice-${inv.id}`}
                            >
                              <CheckCircle className="w-3.5 h-3.5 mr-1" />
                              {t("verify")}
                            </Button>
                          )}
                          {inv.purchaseOrderId && inv.matchStatus !== "matched" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onMatchInvoice(inv.id)}
                              disabled={isMatchingInvoice}
                              data-testid={`button-match-invoice-${inv.id}`}
                            >
                              {t("k3WayMatch")}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </>
  );
}
