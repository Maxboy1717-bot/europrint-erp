/**
 * @module QCReclamationsTab
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquareWarning, Plus } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { EPLoader } from "@/components/ep";
interface Reclamation {
  id: string;
  reclamationNumber: string;
  clientName: string;
  claimDate: string;
  issueType: string;
  description: string;
  status: string;
  defectQuantity: number;
}

export function QCReclamationsTab() {
  const { toast } = useToast();
  const [reclamationDialogOpen, setReclamationDialogOpen] = useState(false);

  const { data: reclamationsData, isLoading: reclamationsLoading } = useQuery<Reclamation[]>({
    queryKey: ["/api/qc/reclamations"],
  });

  const createReclamationMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/qc/reclamations", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/qc/reclamations"] });
      setReclamationDialogOpen(false);
      toast({ title: "Reklamatsiya qayd etildi" });
    },
    onError: () => toast({ title: "Xatolik", variant: "destructive" }),
  });

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquareWarning className="w-5 h-5" />
                Reklamatsiyalar boshqaruvi
              </CardTitle>
              <CardDescription>Mijoz shikoyatlari va sifat reklamatsiyalari</CardDescription>
            </div>
            <Button onClick={() => setReclamationDialogOpen(true)} data-testid="button-add-reclamation">
              <Plus className="w-4 h-4 mr-2" />
              Reklamatsiya qo'shish
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {reclamationsLoading ? (
            <div className="flex justify-center py-8"><EPLoader className="w-6 h-6" /></div>
          ) : !reclamationsData?.length ? (
            <div className="text-center py-8 text-[13px] text-muted-foreground">Reklamatsiyalar yo'q</div>
          ) : (
            <div className="ep-table-scroll"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Raqam</TableHead>
                  <TableHead>Mijoz</TableHead>
                  <TableHead>Sana</TableHead>
                  <TableHead>Muammo turi</TableHead>
                  <TableHead>Miqdor</TableHead>
                  <TableHead>Holat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(reclamationsData) ? reclamationsData : []).map(r => (
                  <TableRow key={r.id} data-testid={`row-reclamation-${r.id}`} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono text-sm">{r.reclamationNumber}</TableCell>
                    <TableCell>{r.clientName}</TableCell>
                    <TableCell>{r.claimDate}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{r.issueType.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell>{r.defectQuantity} dona</TableCell>
                    <TableCell>
                      <Badge variant={r.status === "resolved" ? "default" : r.status === "new" ? "destructive" : "secondary"}>
                        {r.status === "new" ? "Yangi" : r.status === "investigating" ? "Tekshirilmoqda" : r.status === "resolved" ? "Hal qilindi" : "Rad etildi"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          )}
        </CardContent>
      </Card>

      <Dialog open={reclamationDialogOpen} onOpenChange={setReclamationDialogOpen}>
        <DialogContent className="max-w-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">Yangi Reklamatsiya</DialogTitle>
            <DialogDescription>Mijoz shikoyatini qayd eting</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Mijoz nomi *</label>
                <Input id="rcl-client" placeholder="Mijoz nomi" data-testid="input-reclamation-client" />
              </div>
              <div>
                <label className="text-sm font-medium">Sana *</label>
                <Input id="rcl-date" type="date" defaultValue={new Date().toISOString().split("T")[0]} data-testid="input-reclamation-date" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Muammo turi *</label>
              <Select onValueChange={(v) => { const el = document.getElementById("rcl-type-hidden") as HTMLInputElement; if(el) el.value = v; }}>
                <SelectTrigger data-testid="select-reclamation-type" className="h-9">
                  <SelectValue placeholder="Muammo turi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="print_quality">Chop sifati</SelectItem>
                  <SelectItem value="size_mismatch">O'lcham mos emas</SelectItem>
                  <SelectItem value="moisture">Namlik</SelectItem>
                  <SelectItem value="damage">Shikast</SelectItem>
                  <SelectItem value="other">Boshqa</SelectItem>
                </SelectContent>
              </Select>
              <input type="hidden" id="rcl-type-hidden" defaultValue="other" />
            </div>
            <div>
              <label className="text-sm font-medium">Nuqsonli miqdor</label>
              <Input id="rcl-qty" type="number" placeholder="0" defaultValue="0" data-testid="input-reclamation-qty" />
            </div>
            <div>
              <label className="text-sm font-medium">Tavsif *</label>
              <Input id="rcl-desc" placeholder="Muammo tavsifi" data-testid="input-reclamation-desc" />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReclamationDialogOpen(false)}>Bekor</Button>
              <Button
                data-testid="button-submit-reclamation"
                disabled={createReclamationMutation.isPending}
                onClick={() => {
                  const clientName = (document.getElementById("rcl-client") as HTMLInputElement)?.value;
                  const claimDate = (document.getElementById("rcl-date") as HTMLInputElement)?.value;
                  const issueType = (document.getElementById("rcl-type-hidden") as HTMLInputElement)?.value || "other";
                  const defectQuantity = parseInt((document.getElementById("rcl-qty") as HTMLInputElement)?.value || "0");
                  const description = (document.getElementById("rcl-desc") as HTMLInputElement)?.value;
                  if (!clientName || !claimDate || !description) {
                    toast({ title: "Barcha majburiy maydonlarni to'ldiring", variant: "destructive" });
                    return;
                  }
                  createReclamationMutation.mutate({ clientName, claimDate, issueType, defectQuantity, description });
                }}
              >
                {createReclamationMutation.isPending && <EPLoader className="w-4 h-4 mr-2" />}
                Saqlash
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
