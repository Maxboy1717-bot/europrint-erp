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
import { ShoppingCart, Search, GitBranch, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { tLabel } from "@/lib/i18n/tLabel";
import { procurementApi, type ApprovalStep } from "@/lib/api/procurement.api";

export default function ProcurementPage() {
  const { toast } = useToast();
  const [empId, setEmpId] = useState("");
  const [chain, setChain] = useState<ApprovalStep[] | null>(null);
  const [reqId, setReqId] = useState("");
  const [request, setRequest] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

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
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
