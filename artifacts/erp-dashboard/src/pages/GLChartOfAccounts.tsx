/**
 * @module GLChartOfAccounts
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { BookOpen, Search, ChevronRight, ChevronDown, Plus } from "lucide-react";
import { safeArray } from "@/lib/queryClient";
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
import { apiRequest } from "@/lib/api-request";
import { useToast } from "@/hooks/use-toast";

interface GLAccount {
  id?: string | number;
  code: string;
  name: string;
  nameRu?: string;
  type: "asset" | "liability" | "equity" | "revenue" | "expense";
  parentCode?: string;
  balance?: number;
  isActive?: boolean;
  level?: number;
}

interface CreateAccountForm {
  code: string;
  name: string;
  type: "asset" | "liability" | "equity" | "revenue" | "expense";
  parentCode: string;
}

/**
 * Map a raw `/api/finance/gl-accounts` row to the FE GLAccount shape.
 * WHY: the API returns Drizzle field names (accountCode/accountName/accountType),
 * not the camelCase the table renders (code/name/type). Without this remap the
 * filter `a.code.includes(...)` dereferences undefined and crashes the page the
 * moment the DB has ≥1 account. Reads both shapes so the static fallback (which
 * already uses code/name/type) and the API both flow through unchanged.
 */
function toGLAccount(r: Record<string, unknown>): GLAccount {
  const parent = r.parentAccountId ?? r.parentCode;
  const hasParent = parent != null && String(parent).trim() !== "";
  return {
    id: r.id as GLAccount["id"],
    code: String(r.accountCode ?? r.code ?? ""),
    name: String(r.accountName ?? r.name ?? ""),
    nameRu: (r.accountNameRu ?? r.nameRu) as string | undefined,
    type: (r.accountType ?? r.type) as GLAccount["type"],
    parentCode: hasParent ? String(parent) : undefined,
    isActive: r.isActive as boolean | undefined,
    level: hasParent ? 2 : 1,
  };
}

const STATIC_GL_ACCOUNTS: GLAccount[] = [
  { code: "1000", name: "Naqd pul", nameRu: "Наличные деньги", type: "asset", level: 1 },
  { code: "1010", name: "Kassa", nameRu: "Касса", type: "asset", parentCode: "1000", level: 2 },
  { code: "1020", name: "Bank hisob-raqami", nameRu: "Банковский счет", type: "asset", parentCode: "1000", level: 2 },
  { code: "1200", name: "Debitorlik qarzlari", nameRu: "Дебиторская задолженность", type: "asset", level: 1 },
  { code: "1210", name: "Mijozlar qarzdorligi", nameRu: "Задолженность покупателей", type: "asset", parentCode: "1200", level: 2 },
  { code: "1040", name: "Tovar-moddiy zahiralar", nameRu: "Товарно-материальные запасы", type: "asset", level: 1 },
  { code: "1041", name: "Xomashyo", nameRu: "Сырьё", type: "asset", parentCode: "1040", level: 2 },
  { code: "1042", name: "Tayyor mahsulot", nameRu: "Готовая продукция", type: "asset", parentCode: "1040", level: 2 },
  { code: "1600", name: "Asosiy vositalar", nameRu: "Основные средства", type: "asset", level: 1 },
  { code: "1610", name: "Mashinalar va uskunalar", nameRu: "Машины и оборудование", type: "asset", parentCode: "1600", level: 2 },
  { code: "2000", name: "Kreditorlik qarzlari", nameRu: "Кредиторская задолженность", type: "liability", level: 1 },
  { code: "2010", name: "Yetkazib beruvchilar qarzi", nameRu: "Задолженность поставщикам", type: "liability", parentCode: "2000", level: 2 },
  { code: "2200", name: "Soliq majburiyatlari", nameRu: "Налоговые обязательства", type: "liability", level: 1 },
  { code: "2210", name: "QQS to'lash majburiyati", nameRu: "НДС к уплате", type: "liability", parentCode: "2200", level: 2 },
  { code: "2500", name: "Maosh to'lash majburiyati", nameRu: "Зарплата к выплате", type: "liability", level: 1 },
  { code: "3000", name: "Ustav kapitali", nameRu: "Уставный капитал", type: "equity", level: 1 },
  { code: "3100", name: "Taqsimlanmagan foyda", nameRu: "Нераспределённая прибыль", type: "equity", level: 1 },
  { code: "4000", name: "Sotuv daromadi", nameRu: "Выручка от продаж", type: "revenue", level: 1 },
  { code: "4010", name: "Mahsulot sotuv daromadi", nameRu: "Доход от продажи продукции", type: "revenue", parentCode: "4000", level: 2 },
  { code: "4020", name: "Xizmat ko'rsatish daromadi", nameRu: "Доход от услуг", type: "revenue", parentCode: "4000", level: 2 },
  { code: "5000", name: "Ishlab chiqarish xarajatlari", nameRu: "Производственные затраты", type: "expense", level: 1 },
  { code: "5100", name: "Maosh xarajatlari", nameRu: "Расходы на зарплату", type: "expense", parentCode: "5000", level: 2 },
  { code: "5200", name: "Xomashyo xarajatlari", nameRu: "Расходы на сырьё", type: "expense", parentCode: "5000", level: 2 },
  { code: "6000", name: "Umumiy boshqaruv xarajatlari", nameRu: "Общехозяйственные расходы", type: "expense", level: 1 },
  { code: "6100", name: "Ijara xarajatlari", nameRu: "Расходы на аренду", type: "expense", parentCode: "6000", level: 2 },
  { code: "6200", name: "Kommunal xizmatlar", nameRu: "Коммунальные услуги", type: "expense", parentCode: "6000", level: 2 },
  { code: "7000", name: "Moliyaviy xarajatlar", nameRu: "Финансовые расходы", type: "expense", level: 1 },
  { code: "7100", name: "Foiz xarajatlari", nameRu: "Процентные расходы", type: "expense", parentCode: "7000", level: 2 },
  { code: "8000", name: "Soliq xarajatlari", nameRu: "Налоговые расходы", type: "expense", level: 1 },
  { code: "8100", "name": "Daromad solig'i", nameRu: "Налог на прибыль", type: "expense", parentCode: "8000", level: 2 },
];

const TYPE_LABELS: Record<string, string> = {
  asset: "Aktiv",
  liability: "Passiv",
  equity: "Kapital",
  revenue: "Daromad",
  expense: "Xarajat",
};

const TYPE_COLORS: Record<string, string> = {
  asset: "bg-blue-100 text-blue-800",
  liability: "bg-red-100 text-red-800",
  equity: "bg-purple-100 text-purple-800",
  revenue: "bg-green-100 text-green-800",
  expense: "bg-orange-100 text-orange-800",
};

export default function GLChartOfAccounts() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(["asset", "liability", "equity", "revenue", "expense"])
  );

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<CreateAccountForm>({
    code: "",
    name: "",
    type: "asset",
    parentCode: "",
  });

  const { data: apiAccounts } = useQuery<GLAccount[]>({
    queryKey: ["/api/finance/gl-accounts"],
    select: (data) =>
      safeArray<Record<string, unknown>>(data, "accounts").map(toGLAccount),
  });

  const createMutation = useMutation({
    mutationFn: (body: { accountNumber: string; accountName: string; accountType?: string }) =>
      apiRequest("POST", "/api/gl/accounts", body),
    onSuccess: () => {
      toast({ title: "Hisob qo'shildi" });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/gl-accounts"] });
      setCreateOpen(false);
      setForm({ code: "", name: "", type: "asset", parentCode: "" });
    },
    onError: () => {
      toast({ title: "Xatolik yuz berdi", variant: "destructive" });
    },
  });

  const handleCreateSubmit = () => {
    const body: { accountNumber: string; accountName: string; accountType?: string } = {
      accountNumber: form.code,
      accountName: form.name,
      accountType: form.type,
    };
    createMutation.mutate(body);
  };

  const accounts =
    apiAccounts && (Array.isArray(apiAccounts) ? apiAccounts : []).length > 0
      ? (apiAccounts as GLAccount[])
      : STATIC_GL_ACCOUNTS;

  const filtered = (Array.isArray(accounts) ? accounts : []).filter(
    (a) =>
      a.code.includes(search) ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.nameRu?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  const grouped = (["asset", "liability", "equity", "revenue", "expense"]).map(
    (type) => ({
      type,
      items: (Array.isArray(filtered) ? filtered : []).filter((a) => a.type === type),
    })
  );

  function toggleGroup(type: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <div className="border-b border-border/50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-primary" />
          <h1 className="font-semibold text-base">{t("glHisoblarJadvali")}</h1>
          <EPStatusPill tone="neutral">{(Array.isArray(accounts) ? accounts : []).length} hisob</EPStatusPill>
        </div>
        <div className="flex gap-2">
          <div className="relative w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              className="pl-8 h-9 text-sm"
              placeholder={t("kodYokiNom")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-gl-search"
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setExpandedGroups(
                new Set(["asset", "liability", "equity", "revenue", "expense"])
              )
            }
          >
            {t("barchasiniYoy")}
          </Button>
          <Button
            size="sm"
            onClick={() => setCreateOpen(true)}
            data-testid="button-add-account"
          >
            <Plus className="h-4 w-4 mr-1" />
            Hisob qo'shish
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-4">
        {(Array.isArray(grouped) ? grouped : []).map(({ type, items }) => (
          <Card key={type} className="overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
              onClick={() => toggleGroup(type)}
              data-testid={`group-${type}`}
            >
              <div className="flex items-center gap-2">
                {expandedGroups.has(type) ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    TYPE_COLORS[type]
                  }`}
                >
                  {TYPE_LABELS[type]}
                </span>
                <span className="text-sm font-medium capitalize">{type}</span>
              </div>
              <EPStatusPill tone="neutral" className="text-xs">
                {items.length} ta
              </EPStatusPill>
            </button>

            {expandedGroups.has(type) && items.length > 0 && (
              <CardContent className="p-0">
                <div className="ep-table-scroll"><Table>
                  <TableHeader className="sticky top-0 z-10 bg-card">
                    <TableRow>
                      <TableHead className="w-20">{t("code")}</TableHead>
                      <TableHead>{t("nomiUz")}</TableHead>
                      <TableHead>{t("nomiRu")}</TableHead>
                      <TableHead>{t("tur")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(items) ? items : []).map((account) => (
                      <TableRow
                        key={account.code}
                        className={account.level === 2 ? "bg-muted/20" : ""}
                        data-testid={`gl-row-${account.code}`}
                      >
                        <TableCell className="font-mono font-semibold text-primary">
                          {account.level === 2 && (
                            <span className="text-muted-foreground mr-1">└</span>
                          )}
                          {account.code}
                        </TableCell>
                        <TableCell className={account.level === 2 ? "pl-4" : "font-medium"}>
                          {account.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {account.nameRu}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded ${TYPE_COLORS[account.type]}`}
                          >
                            {TYPE_LABELS[account.type]}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Create Account Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Hisob qo'shish</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="acc-code">{t("code")}</Label>
              <Input
                id="acc-code"
                placeholder="1000"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                data-testid="input-create-code"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="acc-name">{t("nomiUz")}</Label>
              <Input
                id="acc-name"
                placeholder="Hisob nomi..."
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                data-testid="input-create-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="acc-type">{t("tur")}</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm((f) => ({ ...f, type: v as CreateAccountForm["type"] }))}
              >
                <SelectTrigger id="acc-type" data-testid="select-create-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asset">Aktiv</SelectItem>
                  <SelectItem value="liability">Passiv</SelectItem>
                  <SelectItem value="equity">Kapital</SelectItem>
                  <SelectItem value="revenue">Daromad</SelectItem>
                  <SelectItem value="expense">Xarajat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="acc-parent">Ota hisob kodi (ixtiyoriy)</Label>
              <Input
                id="acc-parent"
                placeholder="1000"
                value={form.parentCode}
                onChange={(e) => setForm((f) => ({ ...f, parentCode: e.target.value }))}
                data-testid="input-create-parent"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={createMutation.isPending}>
              {t("tozalash")}
            </Button>
            <Button
              onClick={handleCreateSubmit}
              disabled={createMutation.isPending || !form.code || !form.name}
              data-testid="button-submit-create-account"
            >
              {createMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
