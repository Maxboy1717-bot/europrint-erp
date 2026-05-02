import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/format";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Plus,
  Phone,
  Mail,
  Building2,
  DollarSign,
  FileText,
  Receipt,
  Bell,
  Target,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type {
  EntityCardProps,
  QuickScore,
  Lead,
  Deal,
  Contact,
  Company,
  Proposal,
  Invoice,
  EntityData,
} from "./crm-types";

export function EntityCard({ entity, entityType, isDragging = false, onClick, onAddTask }: EntityCardProps) {
  const [quickScore, setQuickScore] = useState<QuickScore | null>(null);
  const [isLoadingScore, setIsLoadingScore] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: entity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isActuallyDragging = isDragging || isSortableDragging;

  useEffect(() => {
    if ((entityType === "leads" || entityType === "deals") && !quickScore && !isLoadingScore) {
      setIsLoadingScore(true);
      const entityTypeParam = entityType === "leads" ? "lead" : "deal";
      apiRequest("GET", `/api/crm/ai/quick-score/${entityTypeParam}/${entity.id}`)
        .then(data => {
          setQuickScore(data);
        })
        .catch(() => {
          setQuickScore({ score: 50, churnRisk: "medium", hasIssues: false });
        })
        .finally(() => setIsLoadingScore(false));
    }
  }, [entityType, entity.id, quickScore, isLoadingScore]);

  const getScoreColor = (score: number) => {
    if (score >= 70) return "bg-green-500 text-white";
    if (score >= 40) return "bg-yellow-500 text-white";
    return "bg-red-500 text-white";
  };

  const getChurnRiskColor = (risk: string) => {
    if (risk === "low") return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    if (risk === "medium") return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  };

  const getChurnRiskLabel = (risk: string) => {
    if (risk === "low") return "Xavfsiz";
    if (risk === "medium") return "Kuzatuv";
    return "Xavfli";
  };

  const getTitle = () => {
    if (entityType === "leads") return (entity as Lead).title;
    if (entityType === "deals") return (entity as Deal).title;
    if (entityType === "contacts") {
      const c = entity as Contact;
      return ([c.lastName, c.name, c.secondName]).filter(Boolean).join(" ") || "Nomsiz kontakt";
    }
    if (entityType === "proposals") return (entity as Proposal).title;
    if (entityType === "invoices") return (entity as Invoice).title;
    return (entity as Company).title;
  };

  const getPhone = () => {
    if ("phones" in entity && entity.phones?.[0]) return entity.phones[0].value;
    return null;
  };

  const getEmail = () => {
    if ("emails" in entity && entity.emails?.[0]) return entity.emails[0].value;
    return null;
  };

  const getCompanyTitle = () => {
    if (entityType === "leads") return (entity as Lead).companyTitle;
    if (entityType === "deals") return null;
    if (entityType === "contacts") return null;
    return null;
  };

  const getSource = () => {
    if (entityType === "leads") {
      const lead = entity as Lead;
      const sources: Record<string, string> = {
        CALL: "Qo'ng'iroq",
        WEBFORM: "Sayt",
        EMAIL: "Email", 
        SOCIAL: "Ijtimoiy",
        RECOMMENDATION: "Tavsiya",
        PARTNER: "Hamkor",
        EXHIBITION: "Ko'rgazma",
      };
      return lead.sourceId ? sources[lead.sourceId] || lead.sourceId : null;
    }
    return null;
  };

  const getInitials = () => {
    const title = getTitle();
    return title.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const phone = getPhone();
  const email = getEmail();
  const companyTitle = getCompanyTitle();
  const source = getSource();

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => !isActuallyDragging && onClick?.(entity.id)}
      className={cn(
        "cursor-grab active:cursor-grabbing bg-card hover-elevate group relative",
        isActuallyDragging && "opacity-50 rotate-2"
      )}
      data-testid={`card-${entityType}-${entity.id}`}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {(phone || email) && (
              <div className="flex items-center gap-1">
                {phone && <Phone className="h-3.5 w-3.5 text-blue-500" />}
                {email && <Mail className="h-3.5 w-3.5 text-green-500" />}
              </div>
            )}
            <h4 className="font-medium text-sm truncate">{getTitle()}</h4>
          </div>
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarFallback className="text-xs bg-primary/10">{getInitials()}</AvatarFallback>
          </Avatar>
        </div>

        {entityType === "deals" && (
          <div className="flex items-center gap-2">
            <DollarSign className="h-3.5 w-3.5 text-green-600" />
            <span className="font-bold text-sm text-green-600">
              {formatCurrency((entity as Deal).opportunity, (entity as Deal).currencyId)}
            </span>
          </div>
        )}

        {entityType === "proposals" && (
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-purple-600" />
            <span className="font-bold text-sm text-purple-600">
              {formatCurrency((entity as Proposal).totalAmount, (entity as Proposal).currency)}
            </span>
          </div>
        )}

        {entityType === "invoices" && (
          <div className="flex items-center gap-2">
            <Receipt className="h-3.5 w-3.5 text-amber-600" />
            <span className="font-bold text-sm text-amber-600">
              {formatCurrency((entity as Invoice).totalAmount, (entity as Invoice).currency)}
            </span>
          </div>
        )}

        {companyTitle && (
          <div className="flex items-center gap-1.5">
            <Building2 className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground truncate">{companyTitle}</span>
          </div>
        )}

        {phone && (
          <div className="flex items-center gap-1.5">
            <Phone className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground truncate">{phone}</span>
          </div>
        )}

        {email && (
          <div className="flex items-center gap-1.5">
            <Mail className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground truncate">{email}</span>
          </div>
        )}

        {/* AI Indicators Row */}
        {(entityType === "leads" || entityType === "deals") && quickScore && (
          <div className="flex items-center gap-1.5 pt-1">
            <Badge 
              className={cn("text-[10px] h-4 px-1.5 font-bold", getScoreColor(quickScore.score))}
              data-testid={`badge-ai-score-${entity.id}`}
            >
              <Target className="h-2.5 w-2.5 mr-0.5" />
              {quickScore.score}
            </Badge>
            <Badge 
              className={cn("text-[10px] h-4 px-1.5", getChurnRiskColor(quickScore.churnRisk))}
              data-testid={`badge-churn-risk-${entity.id}`}
            >
              {quickScore.churnRisk === "high" && <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />}
              {getChurnRiskLabel(quickScore.churnRisk)}
            </Badge>
            {quickScore.hasIssues && (
              <Badge variant="outline" className="text-[10px] h-4 px-1 text-orange-500 border-orange-300">
                <Bell className="h-2.5 w-2.5" />
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-1 flex-wrap gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {format(new Date((entity as EntityData).dateCreate), "dd MMM", { locale: uz })}
            </span>
            {source && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                {source}
              </Badge>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onAddTask?.(entity.id);
            }}
            data-testid={`button-add-task-${entity.id}`}
          >
            <Plus className="h-3 w-3 mr-1" />
            Ish
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
