import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest, getAuthHeaders } from "@/lib/queryClient";
import { CheckCircle, XCircle, Clock, Palette, Eye } from "lucide-react";

export default function DesignApproval() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<{
    id: string;
    papkaNo: string;
    mijozNomi: string;
    mahsulotNomi: string;
    tiraj: number | null;
    formatA: string | null;
    formatB: string | null;
    tayyorBolishSanasi: string | null;
  } | null>(null);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [comments, setComments] = useState("");

  const { data: rawOrders, isLoading } = useQuery<unknown>({
    queryKey: ["/api/papka-orders", { status: "pending_design" }],
    queryFn: async () => {
      const res = await fetch("/api/papka-orders?status=pending_design", { credentials: "include", headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed");
      const d = await res.json();
      return Array.isArray(d) ? d : (d.items ?? d.data ?? d.orders ?? []);
    }
  });
  const orders = (Array.isArray(rawOrders) ? rawOrders : []) as Array<{
    id: string;
    papkaNo: string;
    mijozNomi: string;
    mahsulotNomi: string;
    tiraj: number | null;
    formatA: string | null;
    formatB: string | null;
    tayyorBolishSanasi: string | null;
  }>;

  const approveMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return apiRequest("POST", `/api/design/${orderId}/approve`, { comments });
    },
    onSuccess: () => {
      toast({ title: "Muvaffaqiyat", description: "Dizayn tasdiqlandi" });
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
      return apiRequest("POST", `/api/design/${orderId}/reject`, { comments, reason: comments });
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
    <div className="flex-1 overflow-auto bg-surface p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-on-surface">
            Dizayn <span className="font-bold text-primary">Tasdiqlash</span>
          </h1>
          <p className="text-on-surface-variant">Dizayn bo'limi uchun tasdiqlash kutayotgan buyurtmalar</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="bg-primary-container text-on-primary-container rounded-full px-4 py-1 text-sm font-semibold flex items-center">
          <Clock className="h-4 w-4 mr-2" />
          Kutilmoqda: {orders.length}
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl p-6 text-center text-on-surface">
          <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
          <p className="text-lg font-medium">Tasdiqlash kutayotgan buyurtmalar yo'q</p>
          <p className="text-on-surface-variant">Barcha buyurtmalar ko'rib chiqilgan</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {(Array.isArray(orders) ? orders : []).map((order) => (
            <div key={order.id} className="bg-surface-container-lowest rounded-xl p-6" data-testid={`order-card-${order.id}`}>
              <div className="flex flex-row items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-on-surface">{order.papkaNo}</h3>
                  <p className="text-sm text-on-surface-variant">{order.mijozNomi}</p>
                </div>
                <span className="bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  Dizayn kutilmoqda
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Mahsulot</p>
                  <p className="font-medium text-on-surface">{order.mahsulotNomi}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Tiraj</p>
                  <p className="font-medium text-on-surface">{order.tiraj?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Format</p>
                  <p className="font-medium text-on-surface">{order.formatA} x {order.formatB}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Muddat</p>
                  <p className="font-medium text-on-surface">{order.tayyorBolishSanasi || "-"}</p>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => { setSelectedOrder(order); setViewDialog(true); }}
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
            </div>
          ))}
        </div>
      )}

      <Dialog open={viewDialog} onOpenChange={setViewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buyurtma tafsilotlari</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p><span className="font-semibold">Papka №:</span> {selectedOrder?.papkaNo || "—"}</p>
            <p><span className="font-semibold">Mijoz:</span> {selectedOrder?.mijozNomi || "—"}</p>
            <p><span className="font-semibold">Mahsulot:</span> {selectedOrder?.mahsulotNomi || "—"}</p>
            <p><span className="font-semibold">Tiraj:</span> {selectedOrder?.tiraj?.toLocaleString() || "—"}</p>
            <p><span className="font-semibold">Format:</span> {selectedOrder?.formatA && selectedOrder?.formatB ? `${selectedOrder.formatA} × ${selectedOrder.formatB}` : "—"}</p>
            <p><span className="font-semibold">Muddat:</span> {selectedOrder?.tayyorBolishSanasi || "—"}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialog(false)}>Yopish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={approvalDialog} onOpenChange={setApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dizaynni Tasdiqlash</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Buyurtma: <strong>{selectedOrder?.papkaNo}</strong></p>
            <Textarea
              placeholder="Izoh (ixtiyoriy)"
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
            <DialogTitle>Dizaynni Rad etish</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Buyurtma: <strong>{selectedOrder?.papkaNo}</strong></p>
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
