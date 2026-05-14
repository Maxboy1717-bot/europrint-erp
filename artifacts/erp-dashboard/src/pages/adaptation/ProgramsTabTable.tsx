/** @module ProgramsTabTable @description ProgramsTable component — renders the adaptation programs data table with edit/delete action buttons. */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Trash2, BookOpen } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import type { AdaptationProgram } from "@shared/schema";
import type { DepartmentItem, PositionItem } from "./ProgramsTabTypes";
import { EPStatusPill } from "@/components/ep";

interface ProgramsTableProps {
  programs: AdaptationProgram[];
  departments: DepartmentItem[];
  positions: PositionItem[];
  onEdit: (program: AdaptationProgram) => void;
  onDelete: (id: string) => void;
}

export function ProgramsTable({
  programs,
  departments,
  positions,
  onEdit,
  onDelete,
}: ProgramsTableProps) {
  return (
    <div className="ep-table-scroll"><Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nomi</TableHead>
          <TableHead>Davomiyligi</TableHead>
          <TableHead>Bo'lim</TableHead>
          <TableHead>Lavozim</TableHead>
          <TableHead>Vazifalar</TableHead>
          <TableHead>Mentor</TableHead>
          <TableHead>Holat</TableHead>
          <TableHead>Amallar</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {programs.length === 0 && (
          <TableRow>
            <TableCell colSpan={8}>
              <EmptyState
                icon={BookOpen}
                title="Dasturlar topilmadi"
                description="Hozircha hech qanday adaptatsiya dasturi mavjud emas. Yangi dastur yaratish uchun yuqoridagi tugmani bosing."
              />
            </TableCell>
          </TableRow>
        )}
        {(Array.isArray(programs) ? programs : []).map((program: AdaptationProgram) => {
          const dept = (Array.isArray(departments) ? departments : []).find(
            (d: DepartmentItem) => d.id === program.departmentId,
          );
          const pos = (Array.isArray(positions) ? positions : []).find(
            (p: PositionItem) => p.id === program.positionId,
          );
          const taskCount = Array.isArray(program.tasks) ? program.tasks.length : 0;
          const cpCount = Array.isArray(program.checkpoints)
            ? program.checkpoints.length
            : 0;

          return (
            <TableRow key={program.id} className="hover:bg-muted/40 transition-colors">
              <TableCell className="font-medium">{program.title}</TableCell>
              <TableCell>
                {program.duration}{" "}
                {program.durationType === "day"
                  ? "kun"
                  : program.durationType === "week"
                    ? "hafta"
                    : "oy"}
              </TableCell>
              <TableCell>
                {dept ? (
                  <Badge variant="outline">{dept.name}</Badge>
                ) : (
                  <span className="text-muted-foreground">Hammasi</span>
                )}
              </TableCell>
              <TableCell>
                {pos ? (
                  <Badge variant="outline">{pos.name}</Badge>
                ) : (
                  <span className="text-muted-foreground">Hammasi</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-1 flex-wrap">
                  <EPStatusPill tone="neutral" className="text-xs">
                    {taskCount} vazifa
                  </EPStatusPill>
                  <Badge variant="outline" className="text-xs">
                    {cpCount} nuqta
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                {program.mentorRequired ? (
                  <Badge>Kerak</Badge>
                ) : (
                  <EPStatusPill tone="neutral">Kerak emas</EPStatusPill>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={program.status === "active" ? "default" : "secondary"}>
                  {program.status === "active" ? "Faol" : "Arxivlangan"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(program)}
                    data-testid={`button-edit-program-${program.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => onDelete(program.id)}
                    data-testid={`button-delete-program-${program.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table></div>
  );
}
