import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
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
  const [selectedOrder, setSelectedOrder] = useState<PapkaOrderData | null>(null);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [comments, setComments] = useState("");

  const { data: orders = [], isLoading } = useQuery<PapkaOrderData[]>({
    queryKey: ["/api/papka-orders", "approved"],
    queryFn: async () => {
      const res = await fetch("/api/papka-orders?status=approved", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch orders");
      const d = await res.json();
      return Array.isArray(d) ? d : (d.items ?? d.data ?? d.orders ?? []);
    }
  });

  const approveMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return apiRequest("POST", `/api/qc/approve/finance/${orderId}`, { comments });
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
      return apiRequest("POST", `/api/qc/reject/${orderId}`, { stage: "finance", rejectionReason: comments, comments });
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
    return <div className="p-6">Yuklanmoqda...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <DollarSign className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Moliya Tasdiqlash</h1>
          <p className="text-muted-foreground">Moliya bo'limi - avans, qarzdorlik va kredit limitini tekshirish</p>
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
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <p className="text-lg font-medium">Tasdiqlash kutayotgan buyurtmalar yo'q</p>
            <p className="text-muted-foreground">Barcha buyurtmalar ko'rib chiqilgan</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {(Array.isArray(orders) ? orders : []).map((order: PapkaOrderData) => (
            <Card key={order.id} data-testid={`order-card-${order.id}`}>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">{order.papkaNo}</CardTitle>
                  <p className="text-sm text-muted-foreground">{order.mijozNomi}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">
                    <Clock className="h-3 w-3 mr-1" />
                    Moliya kutilmoqda
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Mahsulot</p>
                    <p className="font-medium">{order.mahsulotNomi}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tiraj</p>
                    <p className="font-medium">{order.tiraj?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Format</p>
                    <p className="font-medium">{order.formatA} x {order.formatB}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Muddat</p>
                    <p className="font-medium">{order.tayyorBolishSanasi || "-"}</p>
                  </div>
                </div>

                <div className="bg-muted/50 p-3 rounded-md mb-4">
                  <p className="text-sm font-medium mb-2">Moliyaviy ma'lumotlar:</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Kredit limiti</p>
                        <p className="font-medium">-</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Qarzdorlik</p>
                        <p className="font-medium">-</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Avans</p>
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
                    Ko'rish
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => { setSelectedOrder(order); setRejectDialog(true); }}
                    data-testid={`btn-reject-${order.id}`}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Rad etish
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => { setSelectedOrder(order); setApprovalDialog(true); }}
                    data-testid={`btn-approve-${order.id}`}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Tasdiqlash
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
            <DialogTitle>Moliya Tasdiqlash</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Buyurtma: <strong>{selectedOrder?.papkaNo}</strong></p>
            
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">Oxirgi bosqich</p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Tasdiqlangandan so'ng buyurtma AI rejalashtirishga yuboriladi.
                </p>
              </div>
            </div>

            <Textarea
              placeholder="Moliyaviy izoh (ixtiyoriy)"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              data-testid="input-comments"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialog(false)}>Bekor qilish</Button>
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
            <DialogTitle>Moliya Rad etish</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Buyurtma: <strong>{selectedOrder?.papkaNo}</strong></p>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Rad etish sababini ko'rsating: qarzdorlik, kredit limiti oshgan yoki avans yo'q.
                </p>
              </div>
            </div>

            <Textarea
              placeholder="Rad etish sababi (majburiy)"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              required
              data-testid="input-reject-reason"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(false)}>Bekor qilish</Button>
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
