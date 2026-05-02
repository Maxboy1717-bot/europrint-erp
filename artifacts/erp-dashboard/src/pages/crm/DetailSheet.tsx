import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Phone,
  Mail,
  Bot,
  Clock,
  FileText,
  Package,
  MessageSquare,
  History,
  Sparkles,
  Zap,
  CheckCircle,
  XCircle,
  ShoppingCart,
  TrendingUp,
  User,
  Building2,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { StageProgressBar } from "@/components/crm/StageProgressBar";
import { BitrixActivityPanel } from "@/components/crm/BitrixActivityPanel";
import { AIAnalysisPanel } from "./AIAnalysisPanel";
import { ExtendedAIPanel } from "./ExtendedAIPanel";
import type {
  DetailSheetProps,
  Lead,
  Deal,
  Contact,
  Company,
  Proposal,
  Invoice,
  EntityData,
} from "./crm-types";
import { PROPOSAL_STATUS_MAP, INVOICE_STATUS_MAP } from "./crm-types";

interface CrmActivity { id: number; subject: string; type: string; isDone: boolean; dueDate: string | null }
interface SdOrder { id: number; documentNumber: string; overallStatus: string }

export function DetailSheet({ entityId, entityType, open, onClose, stages }: DetailSheetProps) {
  const [activeTab, setActiveTab] = useState("umumiy");
  const { toast } = useToast();

  const endpoint = entityType === "leads" ? "/api/crm/leads" :
    entityType === "deals" ? "/api/crm/deals" :
    entityType === "contacts" ? "/api/crm/contacts" :
    entityType === "companies" ? "/api/crm/companies" :
    entityType === "proposals" ? "/api/crm-bitrix/proposals" :
    entityType === "invoices" ? "/api/crm-bitrix/invoices" : "/api/crm/leads";

  const { data: entity, isLoading } = useQuery<EntityData>({
    queryKey: [endpoint, entityId],
    enabled: !!entityId && open,
  });

  const { data: historyData = [] } = useQuery({
    queryKey: ["/api/crm/history", entityId, entityType],
    queryFn: () => apiRequest("GET", `/api/crm/history?entityType=${entityType === "leads" ? "lead" : entityType === "deals" ? "deal" : entityType}&entityId=${entityId}`).catch(() => []),
    enabled: !!entityId && open,
  });

  const { data: activities = [] } = useQuery<CrmActivity[]>({
    queryKey: ["/api/crm/followup-activities", entityId, entityType],
    queryFn: () => apiRequest("GET", `/api/crm/followup-activities?entityType=${entityType === "leads" ? "lead" : entityType === "deals" ? "deal" : entityType}&entityId=${entityId}`).catch(() => []),
    enabled: !!entityId && open,
  });

  const { data: proposals = [] } = useQuery<Proposal[]>({
    queryKey: ["/api/crm/proposals", entityId],
    queryFn: () => apiRequest("GET", `/api/crm/proposals?dealId=${entityId}`).catch(() => []),
    enabled: !!entityId && open && entityType === "deals",
  });

  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["/api/crm/invoices", entityId],
    queryFn: () => apiRequest("GET", `/api/crm/invoices?dealId=${entityId}`).catch(() => []),
    enabled: !!entityId && open && entityType === "deals",
  });

  const { data: sdOrders = [] } = useQuery<SdOrder[]>({
    queryKey: ["/api/sd/orders", entityId, entityType],
    queryFn: () => apiRequest("GET", `/api/sd/orders?crmDealId=${entityId}`).catch(() => []),
    enabled: !!entityId && open && entityType === "deals",
  });

  const updateStageMutation = useMutation({
    mutationFn: async (stageId: string) => {
      const field = entityType === "leads" ? "statusId" : "stageId";
      return apiRequest("PATCH", `${endpoint}/${entityId}/stage`, { [field]: stageId });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [endpoint] });
      queryClient.invalidateQueries({ queryKey: [endpoint, entityId] });
      if (data?.autoOrder) {
        toast({
          title: "SD Buyurtma yaratildi!",
          description: `Buyurtma: ${data.autoOrder.documentNumber}`,
        });
      } else {
        toast({ title: "Bosqich yangilandi" });
      }
    },
  });

  const getTitle = (): string => {
    if (!entity) return "Yuklanmoqda...";
    if (entityType === "leads" || entityType === "deals") return (entity as Lead | Deal).title;
    if (entityType === "contacts") {
      const c = entity as Contact;
      return ([c.lastName, c.name, c.secondName]).filter(Boolean).join(" ") || "Nomsiz";
    }
    if (entityType === "proposals") return (entity as Proposal).title || `Taklif #${(entity as Proposal).number}`;
    if (entityType === "invoices") return (entity as Invoice).title || `Faktura #${(entity as Invoice).number}`;
    return (entity as Company).title;
  };

  const getCurrentStageId = (): string => {
    if (!entity) return "";
    if (entityType === "leads") return (entity as Lead).statusId;
    if (entityType === "deals") return (entity as Deal).stageId;
    if (entityType === "proposals") return PROPOSAL_STATUS_MAP[(entity as Proposal).status] || (entity as Proposal).status;
    if (entityType === "invoices") return INVOICE_STATUS_MAP[(entity as Invoice).status] || (entity as Invoice).stageId || (entity as Invoice).status;
    return "";
  };

  const getPhone = (): string => {
    if (!entity || !("phones" in entity)) return "";
    return entity.phones?.[0]?.value || "";
  };
  const getEmail = (): string => {
    if (!entity || !("emails" in entity)) return "";
    return entity.emails?.[0]?.value || "";
  };

  const stagesForProgressBar = (Array.isArray(stages) ? stages : []).map(s => ({
    id: s.stageId,
    name: s.name,
    color: s.color || undefined,
    sort: s.sort,
  }));

  const showStages = entityType === "leads" || entityType === "deals" || entityType === "proposals" || entityType === "invoices";

  const HISTORY_ACTION_LABELS: Record<string, string> = {
    created: "Yaratildi",
    updated: "Yangilandi",
    stage_changed: "Bosqich o'zgardi",
    deleted: "O'chirildi",
  };

  const PROPOSAL_STATUS_LABELS: Record<string, string> = {
    draft: "Qoralama",
    sent: "Yuborildi",
    viewed: "Ko'rildi",
    approved: "Tasdiqlandi",
    declined: "Rad etildi",
    calculated: "Hisoblandi",
    revised: "Qayta ko'rildi",
  };

  const INVOICE_STATUS_LABELS: Record<string, string> = {
    draft: "Qoralama",
    sent: "Yuborildi",
    partial: "Qisman to'landi",
    paid: "To'landi",
    overdue: "Kechikdi",
    cancelled: "Bekor qilindi",
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-4xl overflow-hidden p-0" side="right">
        <div className="flex flex-col h-full">
          <SheetHeader className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <SheetTitle data-testid="text-detail-title" className="text-lg font-semibold">
                {getTitle()}
              </SheetTitle>
              <div className="flex items-center gap-2">
                {entityType === "deals" && entity && (
                  <Badge className="bg-green-100 text-green-800 font-bold text-sm">
                    {formatCurrency((entity as Deal).opportunity, (entity as Deal).currencyId)}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">#{entityId}</Badge>
              </div>
            </div>

            {showStages && entity && (
              <div className="mt-4">
                <StageProgressBar
                  stages={stagesForProgressBar}
                  currentStageId={getCurrentStageId()}
                  onChange={(stageId) => updateStageMutation.mutate(stageId)}
                  entityType={entityType === "leads" ? "lead" : entityType === "proposals" ? "proposal" : entityType === "invoices" ? "invoice" : "deal"}
                />
              </div>
            )}
          </SheetHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="border-b px-4">
              <TabsList className="h-10 bg-transparent gap-1">
                <TabsTrigger value="umumiy" className="text-xs data-[state=active]:bg-blue-500 data-[state=active]:text-white" data-testid="tab-detail-general">
                  <FileText className="h-3.5 w-3.5 mr-1" />
                  Umumiy
                </TabsTrigger>
                {entityType === "deals" && (
                  <TabsTrigger value="tovarlar" className="text-xs data-[state=active]:bg-blue-500 data-[state=active]:text-white" data-testid="tab-detail-products">
                    <Package className="h-3.5 w-3.5 mr-1" />
                    Takliflar
                  </TabsTrigger>
                )}
                {(entityType === "contacts" || entityType === "companies") && (
                  <TabsTrigger value="360" className="text-xs data-[state=active]:bg-purple-500 data-[state=active]:text-white" data-testid="tab-detail-360">
                    <TrendingUp className="h-3.5 w-3.5 mr-1" />
                    Mijoz 360°
                  </TabsTrigger>
                )}
                <TabsTrigger value="tarix" className="text-xs data-[state=active]:bg-blue-500 data-[state=active]:text-white" data-testid="tab-detail-history">
                  <History className="h-3.5 w-3.5 mr-1" />
                  Tarix
                </TabsTrigger>
                <TabsTrigger value="ai" className="text-xs data-[state=active]:bg-violet-500 data-[state=active]:text-white" data-testid="tab-detail-ai">
                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                  AI Tahlil
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden">
              <div className="flex h-full">
                <div className="flex-1 overflow-y-auto p-6 border-r" style={{ width: "55%" }}>
                  {/* ============= UMUMIY TAB ============= */}
                  <TabsContent value="umumiy" className="m-0 space-y-6">
                    {isLoading ? (
                      <div className="space-y-4">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Nomi</label>
                            <div className="font-medium">{getTitle()}</div>
                          </div>
                          {entityType === "deals" && entity && (
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">Summa</label>
                              <div className="font-bold text-green-600 text-lg">
                                {formatCurrency((entity as Deal).opportunity, (entity as Deal).currencyId)}
                              </div>
                              {(entity as Deal).probability !== undefined && (
                                <div className="text-xs text-muted-foreground">
                                  Ehtimollik: {(entity as Deal).probability}%
                                </div>
                              )}
                            </div>
                          )}
                          {entityType === "leads" && entity && (
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">Holati</label>
                              <Badge style={{
                                backgroundColor: {
                                  NEW: "#4CAF50", IN_PROGRESS: "#2196F3", ANALYSIS: "#FF9800",
                                  FINAL: "#9C27B0", CONVERTED: "#22C55E", WON: "#16A34A", LOST: "#EF4444"
                                }[(entity as Lead).statusId] || "#888",
                                color: "white"
                              }}>
                                {(entity as Lead).statusId}
                              </Badge>
                            </div>
                          )}
                          {(entityType === "proposals") && entity && (
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">Summa</label>
                              <div className="font-bold text-purple-600">
                                {formatCurrency((entity as Proposal).totalAmount, (entity as Proposal).currency)}
                              </div>
                            </div>
                          )}
                          {(entityType === "invoices") && entity && (
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">To'lov holati</label>
                              <div>
                                <div className="font-bold text-amber-600">
                                  {formatCurrency((entity as Invoice).paidAmount, (entity as Invoice).currency)} / {formatCurrency((entity as Invoice).totalAmount, (entity as Invoice).currency)}
                                </div>
                                <Badge variant="outline" className="text-xs mt-1">
                                  {INVOICE_STATUS_LABELS[(entity as Invoice).status] || (entity as Invoice).status}
                                </Badge>
                              </div>
                            </div>
                          )}
                        </div>

                        {getPhone() && (
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Telefon</label>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-blue-500" />
                              <a href={`tel:${getPhone()}`} className="text-blue-600 hover:underline">{getPhone()}</a>
                            </div>
                          </div>
                        )}

                        {getEmail() && (
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Email</label>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-green-500" />
                              <a href={`mailto:${getEmail()}`} className="text-green-600 hover:underline">{getEmail()}</a>
                            </div>
                          </div>
                        )}

                        {entityType === "contacts" && entity && (entity as Contact).post && (
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Lavozim</label>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>{(entity as Contact).post}</span>
                            </div>
                          </div>
                        )}

                        {entityType === "companies" && entity && (entity as Company).industry && (
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Soha</label>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span>{(entity as Company).industry}</span>
                            </div>
                          </div>
                        )}

                        {entityType === "companies" && entity && (entity as Company).address && (
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Manzil</label>
                            <div className="text-sm">{(entity as Company).address}</div>
                          </div>
                        )}

                        {entity?.dateCreate && (
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Yaratilgan</label>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>{format(new Date(entity.dateCreate), "dd MMMM yyyy, HH:mm", { locale: uz })}</span>
                            </div>
                          </div>
                        )}

                        {/* SD Orders for deals */}
                        {entityType === "deals" && sdOrders.length > 0 && (
                          <div className="space-y-2 border-t pt-4">
                            <label className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                              <ShoppingCart className="h-3.5 w-3.5" />
                              SD Buyurtmalar ({sdOrders.length})
                            </label>
                            <div className="space-y-2">
                              {(Array.isArray(sdOrders) ? sdOrders : []).map((order) => (
                                <div key={order.id} className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200 text-sm">
                                  <span className="font-medium text-green-700">{order.documentNumber}</span>
                                  <Badge variant="outline" className="text-xs">{order.overallStatus}</Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Activities count */}
                        {activities.length > 0 && (
                          <div className="space-y-1 border-t pt-4">
                            <label className="text-xs text-muted-foreground">Faoliyatlar</label>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{(Array.isArray(activities) ? activities : []).filter((a) => !a.isDone).length} ta aktiv</Badge>
                              <Badge variant="outline">{(Array.isArray(activities) ? activities : []).filter((a) => a.isDone).length} ta bajarilgan</Badge>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>

                  {/* ============= TAKLIFLAR TAB (for deals) ============= */}
                  <TabsContent value="tovarlar" className="m-0 space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold mb-3">Takliflar</h3>
                      {proposals.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground text-sm">
                          <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                          Takliflar yo'q
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {(Array.isArray(proposals) ? proposals : []).map((p) => (
                            <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <p className="font-medium text-sm">{p.title || p.number}</p>
                                <p className="text-xs text-muted-foreground">{p.number}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-purple-600">{formatCurrency(p.totalAmount, p.currency)}</p>
                                <Badge variant="outline" className="text-xs">
                                  {PROPOSAL_STATUS_LABELS[p.status] || p.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="text-sm font-semibold mb-3">Fakturalar</h3>
                      {invoices.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground text-sm">
                          <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
                          Fakturalar yo'q
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {(Array.isArray(invoices) ? invoices : []).map((inv) => (
                            <div key={inv.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <p className="font-medium text-sm">{inv.title || inv.number}</p>
                                <p className="text-xs text-muted-foreground">{inv.number}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-amber-600">{formatCurrency(inv.totalAmount, inv.currency)}</p>
                                <Badge variant="outline" className="text-xs">
                                  {INVOICE_STATUS_LABELS[inv.status] || inv.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* ============= MIJOZ 360° TAB ============= */}
                  <TabsContent value="360" className="m-0 space-y-4">
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <h3 className="font-semibold text-purple-800 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Mijoz 360° Ko'rinishi
                      </h3>
                      <p className="text-xs text-purple-600 mt-1">To'liq mijoz ma'lumotlari va tarix</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-blue-50 rounded-lg text-center">
                        <p className="text-2xl font-bold text-blue-600">{sdOrders.length || 0}</p>
                        <p className="text-xs text-muted-foreground">Buyurtmalar</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg text-center">
                        <p className="text-2xl font-bold text-green-600">{activities.length || 0}</p>
                        <p className="text-xs text-muted-foreground">Faoliyatlar</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg text-center">
                        <p className="text-2xl font-bold text-purple-600">{proposals.length || 0}</p>
                        <p className="text-xs text-muted-foreground">Takliflar</p>
                      </div>
                      <div className="p-3 bg-amber-50 rounded-lg text-center">
                        <p className="text-2xl font-bold text-amber-600">{historyData.length || 0}</p>
                        <p className="text-xs text-muted-foreground">Amallar</p>
                      </div>
                    </div>

                    {/* Recent activities */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Oxirgi faoliyatlar</h4>
                      {activities.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-3">Faoliyatlar yo'q</p>
                      ) : (
                        <div className="space-y-2">
                          {activities.slice(0, 5).map((act) => (
                            <div key={act.id} className="flex items-start gap-2 p-2 border rounded text-sm">
                              {act.isDone ? (
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                              )}
                              <div>
                                <p className="font-medium">{act.subject}</p>
                                <p className="text-xs text-muted-foreground">
                                  {act.type} • {act.dueDate ? format(new Date(act.dueDate), "dd.MM.yyyy") : "—"}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Contact/Company info */}
                    {entityType === "contacts" && entity && (
                      <div className="border-t pt-4">
                        <h4 className="text-sm font-semibold mb-2">Kontakt ma'lumotlari</h4>
                        <div className="space-y-2 text-sm">
                          {(entity as Contact).post && (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>{(entity as Contact).post}</span>
                            </div>
                          )}
                          {(entity as Contact).phones?.map((p, i) => (
                            <div key={`k-${i}`} className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-blue-500" />
                              <span>{p.value}</span>
                            </div>
                          ))}
                          {(entity as Contact).emails?.map((e, i) => (
                            <div key={`k-${i}`} className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-green-500" />
                              <span>{e.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {entityType === "companies" && entity && (
                      <div className="border-t pt-4">
                        <h4 className="text-sm font-semibold mb-2">Kompaniya ma'lumotlari</h4>
                        <div className="space-y-2 text-sm">
                          {(entity as Company).industry && (
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span>{(entity as Company).industry}</span>
                            </div>
                          )}
                          {(entity as Company).address && (
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">📍</span>
                              <span>{(entity as Company).address}</span>
                            </div>
                          )}
                          {(entity as Company).phones?.map((p, i) => (
                            <div key={`k-${i}`} className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-blue-500" />
                              <span>{p.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* ============= TARIX TAB ============= */}
                  <TabsContent value="tarix" className="m-0">
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {/* Activities */}
                        {activities.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Faoliyatlar</h4>
                            {(Array.isArray(activities) ? activities : []).map((act) => (
                              <div key={act.id} className="flex items-start gap-3 mb-2 p-2 border-l-2 border-blue-200 pl-3">
                                {act.isDone ? (
                                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                ) : (
                                  <Clock className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                                )}
                                <div>
                                  <p className="text-sm font-medium">{act.subject}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {act.type} • {act.dueDate ? format(new Date(act.dueDate), "dd.MM.yyyy HH:mm") : "Muddat yo'q"}
                                    {act.isDone && <span className="ml-1 text-green-600">✓ Bajarildi</span>}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* History */}
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">O'zgarishlar tarixi</h4>
                          {Array.isArray(historyData) && historyData.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">Tarix bo'sh</p>
                          ) : (
                            Array.isArray(historyData) && historyData.map((h) => (
                              <div key={h.id} className="flex items-start gap-3 mb-2 p-2 border-l-2 border-gray-200 pl-3">
                                <div>
                                  <p className="text-sm font-medium">
                                    {HISTORY_ACTION_LABELS[h.action] || h.action}
                                    {h.action === "stage_changed" && ` (${h.oldStageId} → ${h.newStageId})`}
                                    {h.fieldName && ` [${h.fieldName}]`}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {h.user?.fullName || "Tizim"} • {format(new Date(h.createdAt), "dd.MM.yyyy HH:mm")}
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  {/* ============= AI TAHLIL TAB ============= */}
                  <TabsContent value="ai" className="m-0">
                    <div className="space-y-6">
                      <AIAnalysisPanel entityType={entityType} entityId={entityId || 0} />
                      <div className="border-t pt-4">
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <Zap className="h-4 w-4 text-primary" />
                          Kengaytirilgan AI funksiyalari
                        </h3>
                        <ExtendedAIPanel entityType={entityType} entityId={entityId || 0} />
                      </div>
                    </div>
                  </TabsContent>
                </div>

                {/* Right panel - BitrixActivityPanel */}
                <div className="overflow-y-auto" style={{ width: "45%" }}>
                  {entityId && (
                    <BitrixActivityPanel
                      entityType={entityType === "leads" ? "lead" : entityType === "deals" ? "deal" : entityType === "contacts" ? "contact" : "company"}
                      entityId={entityId}
                      phone={getPhone()}
                      email={getEmail()}
                    />
                  )}
                </div>
              </div>
            </div>
          </Tabs>

          <div className="border-t p-4 flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>Yopish</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
