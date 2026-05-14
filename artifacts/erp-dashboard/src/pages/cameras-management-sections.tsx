/**
 * @module cameras-management-sections
 * @description Section/panel components for the Cameras Management page:
 *   - CameraStatsCards  — summary stat cards (total / active)
 *   - CameraTable       — scrollable data table with inline status toggle
 */

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import {
  Camera,
  Edit,
  MapPin,
  Settings,
  CheckCircle,
  XCircle,
  Wifi,
  WifiOff,
} from "lucide-react";
import type { CameraData, WorkCenter, Translations, Language } from "./cameras-management-types";

// ---------------------------------------------------------------------------
// CameraStatsCards
// ---------------------------------------------------------------------------

interface CameraStatsCardsProps {
  total: number;
  active: number;
  t: Translations;
}

export function CameraStatsCards({ total, active, t }: CameraStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="bg-card border-none rounded-lg p-5">
        <div className="flex flex-row items-center justify-between gap-2 mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t.totalCameras}
          </span>
          <Camera className="h-5 w-5 text-primary" />
        </div>
        <div className="text-4xl font-bold tracking-tight text-foreground">{total}</div>
      </Card>

      <Card className="bg-card border-none rounded-lg p-5">
        <div className="flex flex-row items-center justify-between gap-2 mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t.activeCameras}
          </span>
          <CheckCircle className="h-5 w-5 text-[var(--ep-green)]" />
        </div>
        <div className="text-4xl font-bold tracking-tight text-[var(--ep-green)]">{active}</div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CameraTable
// ---------------------------------------------------------------------------

interface CameraTableProps {
  cameras: CameraData[];
  workCenters: WorkCenter[] | undefined;
  language: Language;
  t: Translations;
  isDeletePending: boolean;
  onEdit: (camera: CameraData) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, isActive: boolean) => void;
}

export function CameraTable({
  cameras,
  workCenters,
  language,
  t,
  isDeletePending,
  onEdit,
  onDelete,
  onToggleStatus,
}: CameraTableProps) {
  const HEAD_CLASS =
    "bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6";

  return (
    <Card className="bg-card border-none rounded-lg overflow-hidden shadow-none">
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className={HEAD_CLASS}>{t.code}</TableHead>
                <TableHead className={HEAD_CLASS}>{t.name}</TableHead>
                <TableHead className={HEAD_CLASS}>{t.location}</TableHead>
                <TableHead className={HEAD_CLASS}>{t.ipAddress}</TableHead>
                <TableHead className={HEAD_CLASS}>{t.status}</TableHead>
                <TableHead className={`${HEAD_CLASS} text-right`}>{t.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cameras.length > 0 ? (
                cameras.map((camera) => (
                  <CameraRow
                    key={camera.id}
                    camera={camera}
                    workCenters={workCenters}
                    language={language}
                    t={t}
                    isDeletePending={isDeletePending}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleStatus={onToggleStatus}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 text-[13px] text-muted-foreground">
                    <Camera className="h-16 w-16 mx-auto mb-4 opacity-10" />
                    <p className="font-bold uppercase tracking-widest text-sm">{t.noCameras}</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table></div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// CameraRow (internal helper)
// ---------------------------------------------------------------------------

interface CameraRowProps {
  camera: CameraData;
  workCenters: WorkCenter[] | undefined;
  language: Language;
  t: Translations;
  isDeletePending: boolean;
  onEdit: (camera: CameraData) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, isActive: boolean) => void;
}

function CameraRow({
  camera,
  workCenters,
  language,
  t,
  isDeletePending,
  onEdit,
  onDelete,
  onToggleStatus,
}: CameraRowProps) {
  const displayName = language === "uz" ? camera.name : (camera.nameRu ?? camera.name);
  const linkedCenter = workCenters?.find((wc) => wc.id === camera.workCenterId);

  return (
    <TableRow
      className="hover:bg-muted/40 transition-colors border-none"
      data-testid={`row-camera-${camera.id}`}
    >
      {/* Code */}
      <TableCell className="font-bold text-foreground py-4 px-6">{camera.code}</TableCell>

      {/* Name + work-center */}
      <TableCell className="py-4 px-6">
        <p className="font-bold text-foreground">{displayName}</p>
        {camera.workCenterId && (
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mt-1">
            <Settings className="h-3 w-3" />
            {linkedCenter?.name ?? "—"}
          </p>
        )}
      </TableCell>

      {/* Location */}
      <TableCell className="py-4 px-6">
        <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {camera.location ?? "—"}
        </div>
      </TableCell>

      {/* IP address */}
      <TableCell className="py-4 px-6">
        {camera.ipAddress ? (
          <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
            <Wifi className="h-3.5 w-3.5 text-[var(--ep-green)]" />
            {camera.ipAddress}
          </div>
        ) : (
          <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground/50">
            <WifiOff className="h-3.5 w-3.5" />
            —
          </div>
        )}
      </TableCell>

      {/* Status toggle + badge */}
      <TableCell className="py-4 px-6">
        <div className="flex items-center gap-3">
          <Switch
            checked={camera.isActive}
            onCheckedChange={(checked) => onToggleStatus(camera.id, checked)}
            data-testid={`switch-status-${camera.id}`}
            className="data-[state=checked]:bg-primary"
          />
          <Badge
            variant={camera.isActive ? "default" : "secondary"}
            className={`${
              camera.isActive
                ? "bg-green-100 text-green-800"
                : "bg-muted/60 text-muted-foreground"
            } border-none rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider`}
          >
            {camera.isActive ? (
              <><CheckCircle className="h-3 w-3 mr-1" />{t.active}</>
            ) : (
              <><XCircle className="h-3 w-3 mr-1" />{t.inactive}</>
            )}
          </Badge>
        </div>
      </TableCell>

      {/* Actions */}
      <TableCell className="text-right py-4 px-6">
        <div className="flex items-center justify-end gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onEdit(camera)}
            className="rounded-lg hover:bg-muted text-muted-foreground"
            data-testid={`button-edit-${camera.id}`}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <DeleteConfirmDialog
            title="Kamerani o'chirishni tasdiqlaysizmi?"
            description="Kamera va unga bog'liq barcha ma'lumotlar o'chiriladi."
            onConfirm={() => onDelete(camera.id)}
            isPending={isDeletePending}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}
