/**
 * @module DealsTab
 * @description React UI component.
 */

import { DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Deal, formatAmount } from "./types";

interface DealsTabProps {
  deals: Deal[];
}

export function DealsTab({ deals }: DealsTabProps) {
  return (
    <div className="mt-4">
      {deals.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Bitimlar yo'q</p>
        </div>
      ) : (
        <div className="ep-table-scroll"><Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nomi</TableHead>
              <TableHead>Summa</TableHead>
              <TableHead>Bosqich</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(Array.isArray(deals) ? deals : []).map((deal) => (
              <TableRow key={deal.id} className="hover:bg-muted/40 transition-colors">
                <TableCell className="font-medium text-sm">{deal.title}</TableCell>
                <TableCell className="text-sm">
                  {deal.opportunity ? `${formatAmount(deal.opportunity)} UZS` : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">{deal.stageId}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table></div>
      )}
    </div>
  );
}
