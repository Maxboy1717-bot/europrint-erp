/**
 * @module StockStatusBadge
 * @description React UI component.
 */

import { Badge } from "@/components/ui/badge";

export function StockStatusBadge({ status }: { status: string }) {
  if (status === "zero") return <Badge className="bg-gray-800 text-gray-100">Tugagan</Badge>;
  if (status === "critical") return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Kritik</Badge>;
  if (status === "low") return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Kam</Badge>;
  return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Normal</Badge>;
}
