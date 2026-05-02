import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Inbox, Clock, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";

type BasketKey = "incoming" | "pending" | "outgoing" | "archived";
interface BasketItem {
  id: number;
  subject: string;
  from: string;
  time: string;
  overdue?: boolean;
  basket: BasketKey;
}

const INITIAL_BASKET_ITEMS: BasketItem[] = [
  { id: 1, subject: "Yangi shartnoma loyhasi", from: "Sardor T.", time: "09:15", overdue: false, basket: "incoming" },
  { id: 2, subject: "Moliyaviy hisobot so'rovi", from: "Nilufar R.", time: "Kecha 17:30", overdue: true, basket: "incoming" },
  { id: 3, subject: "QC tekshirish natijasi", from: "Bobur X.", time: "03.04", overdue: false, basket: "pending" },
  { id: 4, subject: "Yangi uskunalar buyurtma", from: "Jasur K.", time: "05.04", overdue: false, basket: "outgoing" },
  { id: 5, subject: "HR bo'limiga hisobot", from: "Lola Y.", time: "07.04", overdue: false, basket: "outgoing" },
];

export function ThreeBasketsPanel() {
  const [items, setItems] = useState<BasketItem[]>(INITIAL_BASKET_ITEMS);
  const { toast } = useToast();
  const { t: tk } = useTranslation("kanban");

  function moveItem(id: number, to: BasketKey) {
    setItems(prev => (prev ?? []).map(it => it.id === id ? { ...it, basket: to } : it));
    const labels: Record<BasketKey, string> = {
      incoming: tk("incomingBasket"),
      pending: tk("pendingBasket"),
      outgoing: tk("outgoingBasket"),
      archived: tk("archiveDocument"),
    };
    toast({ title: `Hujjat ${labels[to]} savatiga o'tkazildi` });
  }

  const visible = (Array.isArray(items) ? items : []).filter(it => it.basket !== "archived");
  const byBasket = (key: BasketKey) => (Array.isArray(visible) ? visible : []).filter(it => it.basket === key);

  const columns: {
    key: BasketKey;
    title: string;
    icon: React.ElementType;
    color: string;
    borderColor: string;
    actions: { label: string; target: BasketKey; testPrefix: string }[];
  }[] = [
    {
      key: "incoming",
      title: tk("incomingBasket"),
      icon: Inbox,
      color: "bg-blue-500",
      borderColor: "border-blue-200",
      actions: [
        { label: tk("moveToProcessing"), target: "pending", testPrefix: "move-to-pending" },
        { label: tk("moveToOutgoing"), target: "outgoing", testPrefix: "move-to-outgoing" },
      ],
    },
    {
      key: "pending",
      title: tk("pendingBasket"),
      icon: Clock,
      color: "bg-amber-500",
      borderColor: "border-amber-200",
      actions: [
        { label: `← ${tk("incomingBasket")}`, target: "incoming", testPrefix: "move-to-incoming" },
        { label: tk("moveToOutgoing"), target: "outgoing", testPrefix: "move-to-outgoing" },
      ],
    },
    {
      key: "outgoing",
      title: tk("outgoingBasket"),
      icon: Send,
      color: "bg-emerald-500",
      borderColor: "border-emerald-200",
      actions: [
        { label: `${tk("archiveDocument")} ✓`, target: "archived", testPrefix: "archive" },
      ],
    },
  ];

  return (
    <Card className="mt-4 flex-shrink-0" data-testid="card-three-baskets">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Inbox className="w-4 h-4 text-primary" />
          {tk("threeBasketsSystem")}
          <span className="ml-auto text-[10px] font-normal text-muted-foreground">
            {tk("incomingBasket")} → {tk("pendingBasket")} → {tk("outgoingBasket")}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {(Array.isArray(columns) ? columns : []).map((col) => {
            const colItems = byBasket(col.key);
            const Icon = col.icon;
            return (
              <div key={col.key} className={cn("rounded-xl border-2 p-3 flex flex-col gap-2", col.borderColor)}>
                <div className="flex items-center gap-2 mb-1">
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-white", col.color)}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">{col.title}</span>
                  <Badge variant="secondary" className="text-[10px] ml-auto">{colItems.length}</Badge>
                </div>
                {colItems.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3">Bo'sh</p>
                ) : (
                  (Array.isArray(colItems) ? colItems : []).map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "rounded-lg p-2.5 border transition-colors",
                        item.overdue ? "bg-red-50 border-red-200" : "bg-background border-border"
                      )}
                      data-testid={`basket-item-${item.id}`}
                    >
                      <p className="text-xs font-medium text-foreground truncate">{item.subject}</p>
                      <div className="flex items-center justify-between mt-1 mb-1.5">
                        <span className="text-[10px] text-muted-foreground">{item.from}</span>
                        <span className={cn("text-[10px] font-semibold", item.overdue ? "text-red-600" : "text-muted-foreground")}>
                          {item.overdue ? "⚠ " : ""}{item.time}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(col.actions) ? col.actions : []).map((action) => (
                          <button
                            key={action.target}
                            data-testid={`${action.testPrefix}-${item.id}`}
                            onClick={() => moveItem(item.id, action.target)}
                            className={cn(
                              "text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors hover:opacity-80",
                              action.target === "archived"
                                ? "border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                                : action.target === "outgoing"
                                ? "border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                                : action.target === "pending"
                                ? "border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100"
                                : "border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100"
                            )}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-muted-foreground mt-2 text-center">
          {tk("basketRule24h")} · <span className="text-red-500">{tk("basketOverdue")}</span>
        </p>
      </CardContent>
    </Card>
  );
}
