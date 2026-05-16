/**
 * @module FinanceApproval
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest, fetchWithAuth } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle, XCircle, Clock, DollarSign, Eye, AlertTriangle, CreditCard, Receipt } from "lucide-react";

interface PapkaOrderData {
  id: string;
  papkaNo: string;
  mijozNomi: string;
  mahsulotNomi: string;
  tiraj: number;
  formatA: number;
  formatB: number;
  tayyorBolishSanasi: string | null;
  status: string;
}

export default function FinanceApproval() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<PapkaOrderData | null>(null);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [comments, setComments] = useState("");

  const { data: orders = [], isLoading } = useQuery<PapkaOrderData[]>({
    queryKey: ["/api/papka-orders", "approved"],
    enabled: isAuthenticated,
    queryFn: async () => {
      const d = await fetchWithAuth("/api/papka-orders?status=approved");
      const arr = Array.isArray(d) ? d : ((d as Record<string, unknown>)?.items ?? (d as Record<string, unknown>)?.data ?? (d as Record<string, unknown>)?.orders ?? []);
      return arr as PapkaOrderData[];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return apiRequest("PATCH", `/api/qc/approve/finance/${orderId}`, { comments });
    },
    onSuccess: () => {
      toast({ title: "Muvaffaqiyat", description: "Moliya tasdiqladi - buyurtma AI rejalashtirishga yuborildi" });
      queryClient.invalidateQueries({ queryKey: ["/api/papka-orders"] });
      setApprovalDialog(false);
      setSelectedOrder(null);
      setComments("");
    },
    onError: (error: Error) => {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return apiRequest("PATCH", `/api/qc/reject/${orderId}`, { stage: "finance", rejectionReason: comments, comments });
    },
    onSuccess: () => {
      toast({ title: "Rad etildi", description: "Buyurtma qaytarildi" });
      queryClient.invalidateQueries({ queryKey: ["/api/papka-orders"] });
      setRejectDialog(false);
      setSelectedOrder(null);
      setComments("");
    },
    onError: (error: Error) => {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    }
  });

  if (isLoading) {
    return <div className="p-6">{t("Yuklanmoqda...")}</div>;
  }

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="flex items-center gap-3">
        <DollarSign className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">{t("moliyaTasdiqlash")}</h1>
          <p className="text-muted-foreground">{t("moliyaBolimiAvansQarzdorlikVa")}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-lg px-4 py-2">
          <Clock className="h-4 w-4 mr-2" />
          Kutilmoqda: {orders.length}
        </Badge>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-[var(--ep-green)] mb-4" />
            <p className="text-lg font-medium">{t("tasdiqlashKutayotganBuyurtmalarYoq")}</p>
            <p className="text-muted-foreground">{t("barchaBuyurtmalarKoribChiqilgan")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {(Array.isArray(orders) ? orders : []).map((order: PapkaOrderData) => (
            <Card key={order.id} data-testid={`order-card-${order.id}`}>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-[14px] font-semibold">{order.papkaNo}</CardTitle>
                  <p className="text-sm text-muted-foreground">{order.mijozNomi}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">
                    <Clock className="h-3 w-3 mr-1" />
                    {t("moliyaKutilmoqda")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("Mahsulot")}</p>
                    <p className="font-medium">{order.mahsulotNomi}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("Tiraj")}</p>
                    <p className="font-medium">{order.tiraj?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("format")}</p>
                    <p className="font-medium">{order.formatA} x {order.formatB}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("muddat")}</p>
                    <p className="font-medium">{order.tayyorBolishSanasi || "-"}</p>
                  </div>
                </div>

                <div className="bg-muted/50 p-3 rounded-md mb-4">
                  <p className="text-sm font-medium mb-2">{t("moliyaviyMalumotlar1")}</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t("kreditLimiti")}</p>
                        <p className="font-medium">-</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t("qarzdorlik")}</p>
                        <p className="font-medium">-</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t("avans")}</p>
                        <p className="font-medium">-</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => { setSelectedOrder(order); setApprovalDialog(true); }}
                    data-testid={`btn-view-${order.id}`}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {t("view")}
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => { setSelectedOrder(order); setRejectDialog(true); }}
                    data-testid={`btn-reject-${order.id}`}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    {t("reject")}
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => { setSelectedOrder(order); setApprovalDialog(true); }}
                    data-testid={`btn-approve-${order.id}`}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {t("verify")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={approvalDialog} onOpenChange={setApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">{t("moliyaTasdiqlash")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>{t("buyurtma3")}<strong>{selectedOrder?.papkaNo}</strong></p>
            
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-[var(--ep-green)] mt-0.5" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">{t("oxirgiBosqich")}</p>
                <p className="text-sm text-[var(--ep-green)] dark:text-green-300">
                  {t("tasdiqlangandanSongBuyurtmaAiRejalashtirishga")}
                </p>
              </div>
            </div>

            <Textarea
              placeholder={t("moliyaviyIzohIxtiyoriy")}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              data-testid="input-comments"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialog(false)}>{t("cancel")}</Button>
            <Button 
              onClick={() => selectedOrder && approveMutation.mutate(selectedOrder.id)}
              disabled={approveMutation.isPending}
              data-testid="btn-confirm-approve"
            >
              {approveMutation.isPending ? "Yuklanmoqda..." : "Tasdiqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">{t("moliyaRadEtish")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>{t("buyurtma3")}<strong>{selectedOrder?.papkaNo}</strong></p>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-[var(--ep-yellow)] mt-0.5" />
              <div>
                <p className="text-sm text-[var(--ep-yellow)] dark:text-yellow-300">
                  {t("radEtishSababiniKorsatingQarzdorlik")}
                </p>
              </div>
            </div>

            <Textarea
              placeholder={t("radEtishSababiMajburiy")}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              required
              data-testid="input-reject-reason"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(false)}>{t("cancel")}</Button>
            <Button 
              variant="destructive"
              onClick={() => selectedOrder && rejectMutation.mutate(selectedOrder.id)}
              disabled={rejectMutation.isPending || !comments.trim()}
              data-testid="btn-confirm-reject"
            >
              {rejectMutation.isPending ? "Yuklanmoqda..." : "Rad etish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
