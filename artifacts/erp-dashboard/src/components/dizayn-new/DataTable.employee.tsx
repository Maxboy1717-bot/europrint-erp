/**
 * @module DataTable.employee
 * @description EmployeeTable preset built on top of DataTableRedesign.
 *   Split out so the main DataTable file stays under 300 lines.
 */

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslation } from "@/lib/i18n";

import { DataTableRedesign } from "./DataTable";
import { StatusBadge } from "./DataTable.atoms";
import type { EmployeeRow, TableColumn } from "./DataTable.types";

export function EmployeeTable({
  data,
  onAdd,
  onRowAction,
}: {
  data: EmployeeRow[];
  onAdd?: () => void;
  onRowAction?: (id: string | number, action: string) => void;
}) {
  const { t } = useTranslation("common");
  const columns: TableColumn<EmployeeRow>[] = [
    {
      key: "name",
      label: "Ism Familiya",
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-2.5">
          <Avatar className="w-7 h-7 flex-shrink-0">
            {row.avatar && <AvatarImage src={row.avatar} alt={row.name} />}
            <AvatarFallback className="text-[10px] font-semibold bg-primary/10 text-primary">
              {row.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium text-foreground">{row.name}</span>
        </div>
      ),
    },
    { key: "position", label: "Lavozim", sortable: true },
    { key: "department", label: "Bo'lim", sortable: true },
    {
      key: "status",
      label: "Holat",
      render: (val) => <StatusBadge status={String(val)} />,
    },
  ];

  return (
    <DataTableRedesign
      title={t("xodimlar")}
      columns={columns}
      data={data}
      onAdd={onAdd}
      addLabel="+ Xodim qo'shish"
      onRowAction={onRowAction}
      searchPlaceholder="Xodim qidirish..."
    />
  );
}
