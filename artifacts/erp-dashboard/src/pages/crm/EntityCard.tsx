/**
 * @module EntityCard
 * @description React page component. Route-level UI.
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/format";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import { cn } from "@/lib/utils";

import {
  hexToRgba, SHADOW_IDLE, SHADOW_HOVER, SHADOW_DRAGGING,
} from "./EntityCardTypes";
import type { EntityCardProps, QuickScore, Lead, Deal, Contact, Proposal, Invoice, EntityData } from "./EntityCardTypes";
import {
  TopBar, PriorityRow, AmountBadge, ContactRow,
  ProgressBar, AiScoreRow, AvatarFooter, CompanyRow,
} from "./EntityCardSections";

export function EntityCard({
  entity,
  entityType,
  isDragging = false,
  onClick,
  onAddTask,
  stageColor = "#A0AEC0",
  stageIndex = 0,
  totalStages = 7,
}: EntityCardProps) {
  const [quickScore, setQuickScore] = useState<QuickScore | null>(null);
  const [isLoadingScore, setIsLoadingScore] = useState(false);

  const {
    attributes, listeners, setNodeRef,
    transform, transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: entity.id });

  const style = { transform: CSS.Transform.toString(transform), transition };
  const isActuallyDragging = isDragging || isSortableDragging;

  useEffect(() => {
    if ((entityType === "leads" || entityType === "deals") && !quickScore && !isLoadingScore) {
      setIsLoadingScore(true);
      const param = entityType === "leads" ? "lead" : "deal";
      apiRequest<QuickScore>("GET", `/api/crm/ai/quick-score/${param}/${entity.id}`)
        .then((d) => setQuickScore(d))
        .catch(() => setQuickScore({ score: 50, churnRisk: "medium", hasIssues: false }))
        .finally(() => setIsLoadingScore(false));
    }
  }, [entityType, entity.id, quickScore, isLoadingScore]);

  // ── Ma'lumot extraction ──────────────────────────────────────────────────────

  const getTitle = (): string => {
    if (entityType === "leads")    return (entity as Lead).title ?? "";
    if (entityType === "deals")    return (entity as Deal).title ?? "";
    if (entityType === "contacts") {
      const c = entity as Contact;
      return [c.lastName, c.name, c.secondName].filter(Boolean).join(" ") || "Nomsiz kontakt";
    }
    if (entityType === "proposals") return (entity as Proposal).title ?? "";
    if (entityType === "invoices")  return (entity as Invoice).title ?? "";
    return (entity as { title?: string }).title ?? "";
  };

  const getPersonName = (): string => {
    const raw = entity as unknown as Record<string, unknown>;
    return (raw["contact_name"] as string) ?? (raw["assignedByName"] as string) ?? getTitle();
  };

  const getCompany = (): string | null => {
    if (entityType === "leads")    return (entity as Lead).companyTitle ?? null;
    if (entityType === "contacts") return (entity as Contact).companyTitle ?? null;
    const raw = entity as unknown as Record<string, unknown>;
    return (raw["companyTitle"] as string) ?? null;
  };

  const getPhone = (): string | null => {
    if ("phones" in entity && entity.phones?.[0]) return entity.phones[0].value;
    const raw = entity as unknown as Record<string, unknown>;
    return (raw["contact_phone"] as string) ?? null;
  };

  const getEmail = (): string | null => {
    if ("emails" in entity && entity.emails?.[0]) return entity.emails[0].value;
    const raw = entity as unknown as Record<string, unknown>;
    return (raw["contact_email"] as string) ?? null;
  };

  const getAmount = (): number | null => {
    if (entityType === "leads") {
      const lead = entity as Lead;
      const raw  = entity as unknown as Record<string, unknown>;
      const opp  =
        lead.opportunity ??
        (raw["opportunityAmount"] as number | undefined) ??
        (raw["budget"] as number | undefined) ??
        null;
      return opp && opp > 0 ? opp : null;
    }
    if (entityType === "deals")     return (entity as Deal).opportunity ?? null;
    if (entityType === "proposals") return (entity as Proposal).totalAmount ?? null;
    if (entityType === "invoices")  return (entity as Invoice).totalAmount ?? null;
    return null;
  };

  const getCurrency = (): string => {
    if (entityType === "deals") return (entity as Deal).currencyId ?? "UZS";
    if (entityType === "leads") return ((entity as unknown as Record<string, unknown>)["currencyId"] as string) ?? "UZS";
    return (entity as Proposal | Invoice).currency ?? "UZS";
  };

  const getDate = (): string => {
    const raw = entity as EntityData;
    const d   = raw.dateCreate ?? (raw as unknown as Record<string, unknown>)["createdAt"] as string;
    if (!d) return "—";
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? "—" : format(dt, "d.MM.yy", { locale: uz });
  };

  const getSource = (): string | null => {
    const raw = entity as unknown as Record<string, unknown>;
    return (raw["sourceId"] as string) ?? (raw["source"] as string) ?? null;
  };

  const getPriority = (): string | null => {
    const raw = entity as unknown as Record<string, unknown>;
    return (raw["priority"] as string) ?? null;
  };

  const getInitials = (): string => {
    const name = getPersonName() || getTitle() || "?";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const phone      = getPhone();
  const email      = getEmail();
  const amount     = getAmount();
  const title      = getTitle();
  const personName = getPersonName();
  const avatarBg   = hexToRgba(stageColor, 0.18);
  const progressPct = Math.round(((stageIndex + 1) / Math.max(totalStages, 1)) * 100);

  return (
    <motion.div
      ref={setNodeRef}
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.15 } }}
      transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={
        !isActuallyDragging
          ? { y: -2, boxShadow: SHADOW_HOVER, transition: { duration: 0.18 } }
          : {}
      }
      {...attributes}
      {...listeners}
      onClick={() => !isActuallyDragging && onClick?.(entity.id)}
      className={cn(
        "relative rounded-[16px] cursor-grab active:cursor-grabbing",
        "transition-colors duration-150 group select-none overflow-hidden",
      )}
      style={{
        ...style,
        background: "#FFFFFF",
        boxShadow: isActuallyDragging ? SHADOW_DRAGGING : SHADOW_IDLE,
        transform: isActuallyDragging ? "rotate(3deg) scale(1.03)" : undefined,
        opacity: isActuallyDragging ? 0.9 : 1,
        padding: "13px 13px 11px",
      }}
      data-testid={`card-${entityType}-${entity.id}`}
    >
      <TopBar
        stageColor={stageColor}
        source={getSource()}
        entityId={entity.id}
        onAddTask={onAddTask}
      />

      <div className="pt-1">
        <PriorityRow priority={getPriority()} />

        <h4
          className="font-semibold leading-snug line-clamp-2 pr-8 mb-1.5"
          style={{ fontSize: 13.5, color: "#2D3748" }}
        >
          {title || "—"}
        </h4>

        <CompanyRow company={getCompany()} />

        {amount !== null && (
          <AmountBadge
            amount={amount}
            currency={getCurrency()}
            stageColor={stageColor}
            formatCurrency={formatCurrency}
          />
        )}

        <ContactRow phone={phone} email={email} />

        <ProgressBar progressPct={progressPct} stageColor={stageColor} />

        {quickScore && (
          <AiScoreRow quickScore={quickScore} entityId={entity.id} />
        )}

        <div
          className="my-2"
          style={{ height: 1, background: "rgba(0,0,0,0.05)", borderRadius: 1 }}
        />

        <AvatarFooter
          initials={getInitials()}
          personName={personName}
          dateStr={getDate()}
          avatarBg={avatarBg}
          stageColor={stageColor}
        />
      </div>
    </motion.div>
  );
}
