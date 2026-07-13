/**
 * @module OrgNodeDetail
 * @description React page component. Route-level UI.
 */

import { useLocation } from "wouter";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Building2, Users, Network, ChevronRight,
  UserX, Pencil, Trash2, CheckCircle, AlertCircle,
  MoveRight, History, FolderOpen, ClipboardList, Award, Activity, Sparkles, Target, GraduationCap, UserCheck,
  LayoutTemplate,
} from "lucide-react";
import { OrgNodePortretTab } from "./OrgNodePortretTab";
import { RazryadTab } from "@/components/hr/orgnode/RazryadTab";
import { FitTab } from "@/components/hr/orgnode/FitTab";
import { CkpTab } from "@/components/hr/orgnode/CkpTab";
import { DarslikTab } from "@/components/hr/orgnode/DarslikTab";
import { MentorTab } from "@/components/hr/orgnode/MentorTab";

// Sub-components
import { EditDialog } from "@/components/hr/orgnode/EditDialog";
import { MoveDialog } from "@/components/hr/orgnode/MoveDialog";
// VISION-3340 #26 — card-template CRUD + apply-template already existed on the backend
// (card-template.controller.ts) with zero FE consumer; surfaced here as "add a child karta
// from a template" (the current node becomes the new card's parent).
import { ApplyCardTemplateDialog } from "@/components/hr/org/ApplyCardTemplateDialog";
import { MainTab } from "@/components/hr/orgnode/MainTab";
import { EmployeesTab } from "@/components/hr/orgnode/EmployeesTab";
import { ChildrenTab } from "@/components/hr/orgnode/ChildrenTab";
import { FolderTab } from "@/components/hr/orgnode/FolderTab";
import { HistoryTab } from "@/components/hr/orgnode/HistoryTab";
import { StatsTab, VacantTab } from "@/components/hr/orgnode/ExtraTabs";
import { LifecycleTab } from "@/components/hr/orgnode/LifecycleTab";
import { useOrgNodeData } from "@/components/hr/orgnode/useOrgNodeData";
import { CARD_STATES, resolveCardState, resolveNodeTypeLabel, resolveTierColor } from "@/components/hr/orgnode/types";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

export default function OrgNodeDetail() {
  const { t, language } = useTranslation("common");
  const { nodeId, node, isLoading, isError, deleteMutation, onRefresh, navigate } = useOrgNodeData();
  const [tab, setTab] = useState("main");
  const [editOpen, setEditOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [applyTemplateOpen, setApplyTemplateOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (isError || !node) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">{t("nodeTopilmadi")}</p>
        <Button variant="outline" onClick={() => navigate("/org-structure/hierarchy")}>
          <ArrowLeft className="h-4 w-4 mr-1" />{t("ortga")}
        </Button>
      </div>
    );
  }

  const headerBg = node.color || resolveTierColor(node.nodeType, node.hierarchyLevel);
  const isVacant = !node.headUserName;
  const cardState = resolveCardState(node);
  const cardStateMeta = CARD_STATES[cardState];

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-3 border-b flex items-center gap-1 text-sm text-muted-foreground shrink-0 flex-wrap">
        <button className="hover:text-foreground transition-colors flex items-center gap-1" onClick={() => navigate("/org-structure/hierarchy")}>
          <Network className="h-3.5 w-3.5" />{t("tashkiliyTuzilma1")}
        </button>
        {node.parentId && (
          <>
            <ChevronRight className="h-3.5 w-3.5" />
            <button className="hover:text-foreground transition-colors truncate max-w-[160px]" onClick={() => navigate(`/org-structure/hierarchy/node/${node.parentId}`)} title={node.parentName || `#${node.parentId}`}>
              {node.parentName || `#${node.parentId}`}
            </button>
          </>
        )}
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium truncate max-w-xs">{node.name}</span>
      </div>

      <div className="px-6 py-5 shrink-0" style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${headerBg} 87%, transparent), color-mix(in srgb, ${headerBg} 60%, transparent))` }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="text-white">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge className="bg-white/25 text-white border-none">{resolveNodeTypeLabel(node.nodeType, language) ?? node.nodeType}</Badge>
              <span className="text-white/60 text-xs">#{node.id} · Daraja {node.hierarchyLevel}</span>
              {!node.isActive && <EPStatusPill tone="danger" className="text-xs">{t("inactive")}</EPStatusPill>}
              <EPStatusPill tone={cardStateMeta.tone} className="text-xs" data-testid="header-card-state">{t(`cardState_${cardState}`, cardStateMeta.label)}</EPStatusPill>
              {isVacant && cardState !== "vacant" && <Badge className="text-xs bg-[var(--ep-red)]/30 text-white border-none flex items-center gap-1"><UserX className="h-3 w-3" />{t("vakant")}</Badge>}
            </div>
            <h1 className="text-2xl font-bold">{node.name}</h1>
            {node.nameRu && <p className="text-white/70 text-sm mt-0.5">{node.nameRu}</p>}
            {node.tskp && <p className="text-white/80 text-sm mt-2 max-w-lg italic">"{node.tskp}"</p>}
          </div>
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <Button size="sm" variant="secondary" onClick={() => setEditOpen(true)} data-testid="button-edit-node"><Pencil className="h-3.5 w-3.5 mr-1" />{t("edit")}</Button>
            <Button size="sm" variant="secondary" onClick={() => setApplyTemplateOpen(true)} data-testid="button-apply-card-template"><LayoutTemplate className="h-3.5 w-3.5 mr-1" />{t("shablondanQoshish", "Shablondan qo'shish")}</Button>
            <Button size="sm" className="bg-primary text-primary-foreground hover:opacity-90" onClick={() => setMoveOpen(true)} data-testid="button-move-node"><MoveRight className="h-3.5 w-3.5 mr-1" />{t("move")}</Button>
            <Button size="sm" variant="destructive" onClick={() => setDeleteConfirmOpen(true)} disabled={deleteMutation.isPending} data-testid="button-delete-node"><Trash2 className="h-3.5 w-3.5 mr-1" />{t("delete")}</Button>
            <Button size="sm" variant="ghost" className="text-white hover:text-white hover:bg-white/20" onClick={() => navigate("/org-structure/hierarchy")}><ArrowLeft className="h-3.5 w-3.5 mr-1" />{t("ortga")}</Button>
          </div>
        </div>
        <div className="flex gap-5 mt-4 flex-wrap">
          {([
            { icon: <Users className="h-4 w-4" />, label: "Xodimlar", value: node.employeeCount },
            { icon: <Building2 className="h-4 w-4" />, label: "Farzandlar", value: node.childCount },
            { icon: isVacant ? <UserX className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />, label: "Rahbar", value: node.headUserName || "Vakant" },
          ]).map((s) => (
            <div key={s.label} className="flex items-center gap-2 text-white/90">
              {s.icon}
              <div><div className="text-xs text-white/60">{s.label}</div><div className="text-sm font-semibold">{s.value}</div></div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-4 flex-wrap h-auto gap-1">
            <TabsTrigger value="main">{t("primary")}</TabsTrigger>
            <TabsTrigger value="razryad" className="flex items-center gap-1"><Award className="h-3.5 w-3.5" />{t("razryad")}</TabsTrigger>
            <TabsTrigger value="ckp" className="flex items-center gap-1"><Target className="h-3.5 w-3.5" />{t("ckp", "ЦКП")}</TabsTrigger>
            <TabsTrigger value="fit" className="flex items-center gap-1"><Sparkles className="h-3.5 w-3.5" />{t("aiMoslik", "AI moslik")}</TabsTrigger>
            <TabsTrigger value="darslik" className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" />{t("darslik", "Darslik")}</TabsTrigger>
            <TabsTrigger value="mentor" className="flex items-center gap-1"><UserCheck className="h-3.5 w-3.5" />{t("mentor", "Mentor")}</TabsTrigger>
            <TabsTrigger value="lifecycle" className="flex items-center gap-1"><Activity className="h-3.5 w-3.5" />{t("holat", "Holat")}</TabsTrigger>
            <TabsTrigger value="employees">Xodimlar ({node.employeeCount})</TabsTrigger>
            <TabsTrigger value="children">Farzandlar ({node.childCount})</TabsTrigger>
            <TabsTrigger value="vacant">{t("vakant")}</TabsTrigger>
            <TabsTrigger value="folder" className="flex items-center gap-1"><FolderOpen className="h-3.5 w-3.5" />{t("papka3")}</TabsTrigger>
            <TabsTrigger value="stats">{t("statistika")}</TabsTrigger>
            <TabsTrigger value="portret" className="flex items-center gap-1"><ClipboardList className="h-3.5 w-3.5" />{t("portret")}</TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-1"><History className="h-3.5 w-3.5" />{t("tarix")}</TabsTrigger>
          </TabsList>

          <TabsContent value="main"><MainTab node={node} /></TabsContent>
          <TabsContent value="razryad"><RazryadTab node={node} /></TabsContent>
          <TabsContent value="ckp"><CkpTab node={node} /></TabsContent>
          <TabsContent value="fit"><FitTab node={node} /></TabsContent>
          <TabsContent value="darslik"><DarslikTab node={node} /></TabsContent>
          <TabsContent value="mentor"><MentorTab node={node} /></TabsContent>
          <TabsContent value="lifecycle"><LifecycleTab node={node} /></TabsContent>
          <TabsContent value="employees"><EmployeesTab node={node} /></TabsContent>
          <TabsContent value="children"><ChildrenTab node={node} /></TabsContent>
          <TabsContent value="vacant"><VacantTab node={node} /></TabsContent>
          <TabsContent value="folder"><FolderTab nodeId={nodeId!} /></TabsContent>
          <TabsContent value="stats"><StatsTab node={node} /></TabsContent>
          <TabsContent value="portret"><OrgNodePortretTab nodeId={node.id} nodeName={node.name} /></TabsContent>
          <TabsContent value="history"><HistoryTab nodeId={nodeId!} /></TabsContent>
        </Tabs>
      </div>

      {editOpen && <EditDialog node={node} open={editOpen} onClose={() => setEditOpen(false)} onSuccess={onRefresh} />}
      {moveOpen && <MoveDialog node={node} open={moveOpen} onClose={() => setMoveOpen(false)} onSuccess={onRefresh} />}
      {applyTemplateOpen && (
        <ApplyCardTemplateDialog
          open={applyTemplateOpen}
          onClose={() => setApplyTemplateOpen(false)}
          onSuccess={onRefresh}
          parentNodeId={node.id}
          parentNodeName={node.name}
        />
      )}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={t("bolimniOchirish")}
        description={`"${node.name}" bo'limini o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi.`}
        confirmText="O'chirish"
        variant="destructive"
        onConfirm={() => { deleteMutation.mutate(); setDeleteConfirmOpen(false); }}
      />
    </div>
  );
}
