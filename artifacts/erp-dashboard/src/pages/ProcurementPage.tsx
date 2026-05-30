/**
 * @module ProcurementPage
 * @description P2P xarid-to'lov — org-sxema tasdiq zanjiri + xarid so'rovi ko'rish.
 *   Toza UI (EP/ui komponentlar + semantic token; raw rang yo'q). BE: /api/pos/procurement.
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Search, GitBranch, FileText, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { tLabel } from "@/lib/i18n/tLabel";
import { procurementApi, type ApprovalStep } from "@/lib/api/procurement.api";
import { warehouseApi, type WarehouseRow } from "@/lib/api/warehouse.api";

export default function ProcurementPage() {
  const { toast } = useToast();
  const [empId, setEmpId] = useState("");
  const [chain, setChain] = useState<ApprovalStep[] | null>(null);
  const [reqId, setReqId] = useState("");
  const [request, setRequest] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [cTitle, setCTitle] = useState("");
  const [cEmp, setCEmp] = useState("");
  const [cDesc, setCDesc] = useState("");
  const [cQty, setCQty] = useState("1");
  const [cPrice, setCPrice] = useState("");
  const [created, setCreated] = useState<Record<string, unknown> | null>(null);
  const [wlApprover, setWlApprover] = useState("");
  const [worklist, setWorklist] = useState<Record<string, unknown>[] | null>(null);
  const [chekAmt, setChekAmt] = useState("");
  const [received, setReceived] = useState<Record<string, unknown> | null>(null);
  const [whOptions, setWhOptions] = useState<WarehouseRow[]>([]);
  const [selectedWh, setSelectedWh] = useState("");

  const loadChain = async () => {
    const id = parseInt(empId, 10);
    if (!id) { toast({ title: tLabel("common.procurement.enterEmpId", "Xodim ID kiriting"), variant: "destructive" }); return; }
    setLoading(true);
    try {
      setChain(await procurementApi.approvalChain(id));
    } catch (e) {
      toast({ title: tLabel("common.procurement.error", "Xato"), description: String((e as Error).message), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadRequest = async () => {
    const id = parseInt(reqId, 10);
    if (!id) { toast({ title: tLabel("common.procurement.enterReqId", "So'rov ID kiriting"), variant: "destructive" }); return; }
    setLoading(true);
    try {
      const req = await procurementApi.getRequest(id);
      setRequest(req);
      setReceived(null);
      setSelectedWh("");
      const whType = req?.["target_warehouse_type"] ? String(req["target_warehouse_type"]) : undefined;
      setWhOptions(await warehouseApi.warehouses(whType));
    } catch (e) {
      toast({ title: tLabel("common.procurement.error", "Xato"), description: String((e as Error).message), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const createReq = async () => {
    const emp = parseInt(cEmp, 10);
    if (!cTitle.trim() || !emp || !cDesc.trim()) {
      toast({ title: tLabel("common.procurement.fillRequired", "Sarlavha, xodim ID va material kiriting"), variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await procurementApi.createRequest({
        title: cTitle,
        requesterEmployeeId: emp,
        items: [{ description: cDesc, quantity: Number(cQty) || 1, estimatedPrice: Number(cPrice) || 0 }],
      });
      setCreated(res);
      toast({ title: tLabel("common.procurement.created", "So'rov yaratildi") });
    } catch (e) {
      toast({ title: tLabel("common.procurement.error", "Xato"), description: String((e as Error).message), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadWorklist = async () => {
    const appr = parseInt(wlApprover, 10);
    if (!appr) { toast({ title: tLabel("common.procurement.enterApprover", "Rahbar user ID kiriting"), variant: "destructive" }); return; }
    setLoading(true);
    try {
      setWorklist(await procurementApi.list({ pendingApproverUserId: appr, status: "pending_approval" }));
    } catch (e) {
      toast({ title: tLabel("common.procurement.error", "Xato"), description: String((e as Error).message), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const approve = async (id: number) => {
    const appr = parseInt(wlApprover, 10);
    setLoading(true);
    try {
      await procurementApi.decide(id, { approverUserId: appr, action: "approve" });
      toast({ title: tLabel("common.procurement.approved", "Tasdiqlandi") });
      await loadWorklist();
    } catch (e) {
      toast({ title: tLabel("common.procurement.error", "Xato"), description: String((e as Error).message), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const reject = async (id: number) => {
    const appr = parseInt(wlApprover, 10);
    setLoading(true);
    try {
      await procurementApi.decide(id, { approverUserId: appr, action: "reject" });
      toast({ title: tLabel("common.procurement.rejected", "Rad etildi") });
      await loadWorklist();
    } catch (e) {
      toast({ title: tLabel("common.procurement.error", "Xato"), description: String((e as Error).message), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const doReceive = async (id: number) => {
    setLoading(true);
    try {
      const res = await procurementApi.receive(id, {
        chekAmount: Number(chekAmt) || undefined,
        warehouseId: selectedWh || undefined,
      });
      setReceived(res);
      toast({ title: tLabel("common.procurement.received", "Qabul qilindi, podotchet yopildi") });
      setRequest(await procurementApi.getRequest(id));
    } catch (e) {
      toast({ title: tLabel("common.procurement.error", "Xato"), description: String((e as Error).message), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <ShoppingCart className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-semibold">{tLabel("common.procurement.title", "Xarid-to'lov (P2P)")}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4" /> {tLabel("common.procurement.newRequest", "Yangi xarid so'rovi")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label htmlFor="cTitle">{tLabel("common.procurement.cTitle", "Sarlavha")}</Label>
              <Input id="cTitle" value={cTitle} onChange={(e) => setCTitle(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="cEmp">{tLabel("common.procurement.requesterEmp", "Ta'minotchi (xodim ID)")}</Label>
              <Input id="cEmp" value={cEmp} onChange={(e) => setCEmp(e.target.value)} placeholder="masalan 5" />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="cDesc">{tLabel("common.procurement.material", "Material (nima olinadi)")}</Label>
              <Input id="cDesc" value={cDesc} onChange={(e) => setCDesc(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="cQty">{tLabel("common.procurement.qty", "Miqdor")}</Label>
              <Input id="cQty" value={cQty} onChange={(e) => setCQty(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="cPrice">{tLabel("common.procurement.price", "Taxminiy narx")}</Label>
              <Input id="cPrice" value={cPrice} onChange={(e) => setCPrice(e.target.value)} />
            </div>
          </div>
          <Button onClick={createReq} disabled={loading}>
            <Plus className="mr-1 h-4 w-4" /> {tLabel("common.procurement.create", "So'rov yaratish")}
          </Button>
          {created && (
            <div className="space-y-1 rounded-md border p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{String(created["requestNumber"] ?? "—")}</span>
                <Badge>{String(created["status"] ?? "—")}</Badge>
              </div>
              <p className="text-muted-foreground">
                {tLabel("common.procurement.approvers", "Tasdiqlovchilar")}: {String(created["approvalSteps"] ?? 0)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GitBranch className="h-4 w-4" /> {tLabel("common.procurement.worklist", "Tasdiqlash kerak (rahbar)")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label htmlFor="wlApprover">{tLabel("common.procurement.approverUser", "Rahbar (user ID)")}</Label>
              <Input id="wlApprover" value={wlApprover} onChange={(e) => setWlApprover(e.target.value)} placeholder="masalan 35" />
            </div>
            <Button onClick={loadWorklist} disabled={loading}>
              <Search className="mr-1 h-4 w-4" /> {tLabel("common.procurement.view", "Ko'rish")}
            </Button>
          </div>
          {worklist && (worklist.length === 0 ? (
            <p className="text-sm text-muted-foreground">{tLabel("common.procurement.noWorklist", "Tasdiq kutayotgan so'rov yo'q.")}</p>
          ) : (
            <ul className="space-y-2">
              {worklist.map((r) => (
                <li key={String(r["id"])} className="flex items-center justify-between rounded-md border p-2 text-sm">
                  <span>
                    <span className="font-medium">{String(r["request_number"])}</span>
                    <span className="text-muted-foreground"> · {String(r["title"])} · {String(r["total_amount"])} {String(r["currency"])}</span>
                  </span>
                  <div className="flex gap-1">
                    <Button size="sm" onClick={() => approve(Number(r["id"]))} disabled={loading}>
                      {tLabel("common.procurement.approve", "Tasdiqlash")}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => reject(Number(r["id"]))} disabled={loading}>
                      {tLabel("common.procurement.reject", "Rad etish")}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GitBranch className="h-4 w-4" /> {tLabel("common.procurement.approvalChain", "Tasdiq zanjiri (org-sxema)")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label htmlFor="empId">{tLabel("common.procurement.employeeId", "Xodim ID")}</Label>
                <Input id="empId" value={empId} onChange={(e) => setEmpId(e.target.value)} placeholder={tLabel("common.procurement.egEmp", "masalan 5")} />
              </div>
              <Button onClick={loadChain} disabled={loading}>
                <Search className="mr-1 h-4 w-4" /> {tLabel("common.procurement.view", "Ko'rish")}
              </Button>
            </div>
            {chain && (chain.length === 0 ? (
              <p className="text-sm text-muted-foreground">{tLabel("common.procurement.noChain", "Tasdiq zanjiri topilmadi (org-bo'lim/rahbar yo'q).")}</p>
            ) : (
              <ol className="space-y-2">
                {chain.map((s) => (
                  <li key={s.depth} className="flex items-center justify-between rounded-md border p-2 text-sm">
                    <span className="flex items-center gap-2">
                      <Badge variant="secondary">{s.depth + 1}</Badge>
                      {s.departmentName}
                    </span>
                    <span className="text-muted-foreground">{tLabel("common.procurement.manager", "rahbar")} #{s.approverUserId}</span>
                  </li>
                ))}
              </ol>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" /> {tLabel("common.procurement.request", "Xarid so'rovi")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label htmlFor="reqId">{tLabel("common.procurement.requestId", "So'rov ID")}</Label>
                <Input id="reqId" value={reqId} onChange={(e) => setReqId(e.target.value)} placeholder={tLabel("common.procurement.egReq", "masalan 1")} />
              </div>
              <Button onClick={loadRequest} disabled={loading}>
                <Search className="mr-1 h-4 w-4" /> {tLabel("common.procurement.view", "Ko'rish")}
              </Button>
            </div>
            {request && (
              <div className="space-y-1 rounded-md border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{String(request["request_number"] ?? "—")}</span>
                  <Badge>{String(request["status"] ?? "—")}</Badge>
                </div>
                <p className="text-muted-foreground">{String(request["title"] ?? "")}</p>
                <p>{tLabel("common.procurement.amount", "Summa")}: {String(request["total_amount"] ?? 0)} {String(request["currency"] ?? "UZS")}</p>
                {String(request["status"]) === "approved" && (
                  <div className="space-y-2 pt-2">
                    <div className="space-y-1">
                      <Label htmlFor="recvWh">{tLabel("common.procurement.targetWarehouse", "Maqsadli ombor")}</Label>
                      <select
                        id="recvWh"
                        value={selectedWh}
                        onChange={(e) => setSelectedWh(e.target.value)}
                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="">{tLabel("common.procurement.autoWarehouse", "Avto (tur bo'yicha)")}</option>
                        {whOptions.map((w) => (
                          <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <Label htmlFor="chekAmt">{tLabel("common.procurement.chekAmount", "Chek summasi")}</Label>
                        <Input id="chekAmt" value={chekAmt} onChange={(e) => setChekAmt(e.target.value)} placeholder={String(request["total_amount"] ?? "")} />
                      </div>
                      <Button size="sm" onClick={() => doReceive(Number(request["id"]))} disabled={loading}>
                        {tLabel("common.procurement.receive", "Qabul qilish")}
                      </Button>
                    </div>
                  </div>
                )}
                {received && (
                  <div className="space-y-0.5 pt-1 text-muted-foreground">
                    <p>{tLabel("common.procurement.podotchetClosed", "Podotchet yopildi")} ✓</p>
                    {received["warehouseEntry"] != null && (
                      <p>
                        {tLabel("common.procurement.stockedIn", "Omborga kirdi")}:{" "}
                        {String((received["warehouseEntry"] as Record<string, unknown>)["warehouseCode"] ?? "")} — {String((received["warehouseEntry"] as Record<string, unknown>)["lineCount"] ?? 0)} {tLabel("common.procurement.lines", "qator")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
