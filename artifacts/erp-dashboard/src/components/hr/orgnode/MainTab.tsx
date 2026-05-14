/**
 * @module MainTab
 * @description React UI component.
 */

import { Users, User, CheckCircle, UserX, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { NodeDetail, NODE_TYPE_LABELS } from "./types";

interface MainTabProps {
  node: NodeDetail;
}

export function MainTab({ node }: MainTabProps) {
  const isVacant = !node.headUserName;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Building2 className="h-4 w-4" />Asosiy ma'lumot
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {([
            { label: "ID", value: node.id },
            { label: "Nom (UZ)", value: node.name },
            { label: "Nom (RU)", value: node.nameRu || "—" },
            { label: "Turi", value: NODE_TYPE_LABELS[node.nodeType] || node.nodeType },
            { label: "Daraja", value: node.hierarchyLevel },
            { label: "Ota node", value: node.parentId ? `#${node.parentId}` : "Ildiz" },
            { label: "Holat", value: node.isActive ? "Faol" : "Nofaol" },
          ]).map((row) => (
            <div key={row.label} className="flex justify-between gap-2">
              <span className="text-muted-foreground shrink-0">{row.label}</span>
              <span className="font-medium text-right">{String(row.value)}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="h-4 w-4" />Rahbar
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {node.headUserName ? (
            <div className="space-y-2">
              <p className="font-semibold text-base">{node.headUserName}</p>
              {node.headUserEmployeeId && (
                <p className="text-muted-foreground">ID: {node.headUserEmployeeId}</p>
              )}
              <Badge className="bg-green-500/20 text-[var(--ep-green)] border-none">
                <CheckCircle className="h-3 w-3 mr-1" />Tayinlangan
              </Badge>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <UserX className="h-4 w-4 text-[var(--ep-red)]" />
                <span>Rahbar tayinlanmagan (vakant)</span>
              </div>
              <Badge variant="destructive" className="w-fit">Vakant lavozim</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {(node.tskp || node.tskpRu) && (
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">QYaM / ЦКП</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            {node.tskp && <p className="text-muted-foreground">{node.tskp}</p>}
            {node.tskpRu && <p className="text-muted-foreground italic">{node.tskpRu}</p>}
          </CardContent>
        </Card>
      )}

      {node.description && (
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tavsif</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {node.description}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
