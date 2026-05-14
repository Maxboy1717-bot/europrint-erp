/**
 * @module MRODashboardSections
 * @description Items, Requests and Equipment tab sections for MRODashboard.
 * Utilities, Building, Cleaning and Uniforms tabs live in MRODashboardSections2.tsx.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { CheckCircle, Package, Wrench, Settings } from "lucide-react";
import type { MroItem, MroRequest, MroEquipment } from "./MRODashboardTypes";
import { EPStatusPill } from "@/components/ep";

// ── Shared table header helper ────────────────────────────────────────────────
export const TH = ({ children, rounded }: { children: React.ReactNode; rounded?: "left" | "right" }) => (
  <TableHead className={`bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6${rounded === "left" ? " rounded-l-lg" : rounded === "right" ? " rounded-r-lg" : ""}`}>
    {children}
  </TableHead>
);

// ── ItemsTab ──────────────────────────────────────────────────────────────────
export function ItemsTab({ items }: { items: MroItem[] | undefined }) {
  if ((items || []).length === 0) {
    return (
      <div className="text-center py-12 text-[13px] text-muted-foreground">
        <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Hali MRO buyum mavjud emas</p>
      </div>
    );
  }
  return (
    <div className="ep-table-scroll"><Table>
      <TableHeader>
        <TableRow className="border-none hover:bg-transparent">
          <TH rounded="left">Kod</TH>
          <TH>Nomi</TH>
          <TH>Kategoriya</TH>
          <TH>Zaxira</TH>
          <TH>Min</TH>
          <TH rounded="right">Holat</TH>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(items || []).map((item: MroItem) => (
          <TableRow key={item.id} data-testid={`row-item-${item.id}`} className="hover:bg-muted/40 transition-colors">
            <TableCell className="font-mono text-sm px-6 text-foreground">{item.itemCode}</TableCell>
            <TableCell className="px-6 text-foreground">{item.name}</TableCell>
            <TableCell className="px-6 text-foreground">
              <Badge variant="outline" className="border-border text-foreground bg-muted/60 rounded-full px-2 py-0.5 text-xs font-medium">{item.category}</Badge>
            </TableCell>
            <TableCell className="font-mono text-sm px-6 text-foreground">{item.currentStock} {item.unit}</TableCell>
            <TableCell className="font-mono text-sm px-6 text-muted-foreground">{item.minStock}</TableCell>
            <TableCell className="px-6">
              {Number(item.currentStock) <= Number(item.minStock)
                ? <EPStatusPill tone="danger">Kam</EPStatusPill>
                : <EPStatusPill tone="success">Normal</EPStatusPill>
              }
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table></div>
  );
}

// ── RequestsTab ───────────────────────────────────────────────────────────────
interface RequestsTabProps {
  requests: MroRequest[] | undefined;
  onApprove: (id: string, action: string) => void;
  isPending: boolean;
}

export function RequestsTab({ requests, onApprove, isPending }: RequestsTabProps) {
  if ((requests || []).length === 0) {
    return (
      <div className="text-center py-12 text-[13px] text-muted-foreground">
        <Wrench className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Hali so'rov mavjud emas</p>
      </div>
    );
  }
  return (
    <div className="ep-table-scroll"><Table>
      <TableHeader>
        <TableRow className="border-none hover:bg-transparent">
          <TH rounded="left">Raqam</TH>
          <TH>Buyum</TH>
          <TH>So'rovchi</TH>
          <TH>Miqdor</TH>
          <TH>Holat</TH>
          <TH rounded="right">Amal</TH>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(requests || []).map((r: MroRequest) => (
          <TableRow key={r.id} data-testid={`row-request-${r.id}`} className="hover:bg-muted/40 transition-colors">
            <TableCell className="font-mono text-sm px-6 text-foreground">{r.requestNumber}</TableCell>
            <TableCell className="px-6 text-foreground">{r.item?.name || "-"}</TableCell>
            <TableCell className="px-6 text-foreground">{r.requester?.fullName || "-"}</TableCell>
            <TableCell className="px-6 text-foreground">{r.requestedQuantity}</TableCell>
            <TableCell className="px-6">
              <Badge className={
                r.status === "pending"  ? "bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none" :
                r.status === "approved" ? "bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none" :
                "bg-muted/60 text-foreground rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none"
              }>
                {r.status}
              </Badge>
            </TableCell>
            <TableCell className="px-6">
              {r.status === "pending" && (
                <Button size="sm" variant="ghost" onClick={() => onApprove(r.id, "approve")} disabled={isPending}
                  data-testid={`button-approve-${r.id}`} className="hover:bg-green-50 text-[var(--ep-green)] h-8 w-8 p-0">
                  <CheckCircle className="w-4 h-4" />
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table></div>
  );
}

// ── EquipmentTab ──────────────────────────────────────────────────────────────
export function EquipmentTab({ equipment }: { equipment: MroEquipment[] | undefined }) {
  if ((equipment || []).length === 0) {
    return (
      <div className="text-center py-12 text-[13px] text-muted-foreground">
        <Settings className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Hali uskuna ma'lumoti mavjud emas</p>
      </div>
    );
  }
  return (
    <div className="ep-table-scroll"><Table>
      <TableHeader>
        <TableRow className="border-none hover:bg-transparent">
          <TH rounded="left">Uskuna</TH>
          <TH>Kod</TH>
          <TH>Turi</TH>
          <TH>Keyingi TA</TH>
          <TH rounded="right">Holat</TH>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(equipment || []).map((eq: MroEquipment) => {
          let rowClass = "hover:bg-muted/40 transition-colors border-none";
          if (["active", "completed", "ISHLAYAPTI"].includes(eq.status ?? "")) rowClass += " border-l-4 border-green-500";
          else if (["maintenance", "scheduled", "TA'MIR"].includes(eq.status ?? "")) rowClass += " border-l-4 border-amber-500";
          else if (["repair", "failed", "TA'MIRDA"].includes(eq.status ?? "")) rowClass += " border-l-4 border-error";
          return (
            <TableRow key={eq.id} data-testid={`row-equipment-${eq.id}`} className={rowClass}>
              <TableCell className="px-6 text-foreground font-medium">{eq.equipmentName}</TableCell>
              <TableCell className="font-mono text-sm px-6 text-muted-foreground">{eq.equipmentCode}</TableCell>
              <TableCell className="px-6">
                <Badge variant="outline" className="border-border text-foreground bg-muted/60 rounded-full px-2 py-0.5 text-xs font-medium">{eq.maintenanceType}</Badge>
              </TableCell>
              <TableCell className="px-6 text-muted-foreground">{eq.nextMaintenanceDate || "-"}</TableCell>
              <TableCell className="px-6">
                <Badge className={["completed", "active"].includes(eq.status ?? "")
                  ? "bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none"
                  : "bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-none border-none"
                }>
                  {eq.status}
                </Badge>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table></div>
  );
}
