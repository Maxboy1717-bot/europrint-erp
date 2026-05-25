/**
 * @module RACIMatrixPageSections
 * @description Major section components for RACIMatrixPage: RACI task list, business stages, crises.
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Grid3X3,
  Users,
  AlertTriangle,
  Heart,
  Activity,
  TrendingUp,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { RACITask, BusinessStage, Crisis, roleBadgeVariant, roleLabel } from "./RACIMatrixPageTypes";
import { EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// RACI tab section
// ---------------------------------------------------------------------------

interface RACITaskListProps {
  tasks: RACITask[];
  expandedTasks: Set<string>;
  onToggleTask: (id: string) => void;
}

export function RACITaskList({ tasks, expandedTasks, onToggleTask }: RACITaskListProps) {
  const { t } = useTranslation("common");
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12" data-testid="empty-tasks">
        <Grid3X3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">{t("raciVazifalariMavjudEmas")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2" data-testid="raci-task-list">
      {(Array.isArray(tasks) ? tasks : []).map((task) => {
        const isExpanded = expandedTasks.has(task.id);
        return (
          <Card key={task.id} data-testid={`card-task-${task.id}`}>
            <div
              className="flex items-center gap-3 p-4 cursor-pointer hover-elevate rounded-md"
              onClick={() => onToggleTask(task.id)}
              data-testid={`task-toggle-${task.id}`}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <span className="font-medium text-sm flex-1" data-testid={`text-task-name-${task.id}`}>
                {task.taskName}
              </span>
              <EPStatusPill tone="neutral" data-testid={`badge-category-${task.id}`}>
                {task.category}
              </EPStatusPill>
            </div>

            {isExpanded && task.assignments && task.assignments.length > 0 && (
              <CardContent className="pt-0 pb-4" data-testid={`task-assignments-${task.id}`}>
                <div className="ep-table-scroll"><Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("role")}</TableHead>
                      <TableHead>{t("xodim1")}</TableHead>
                      <TableHead>{t("lavozim1")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Array.isArray(task.assignments) ? task.assignments : []).map((assignment, idx) => (
                      <TableRow key={idx} data-testid={`row-assignment-${task.id}-${idx}`} className="hover:bg-muted/40 transition-colors">
                        <TableCell>
                          <Badge variant={roleBadgeVariant(assignment.role)}>
                            {assignment.role} - {roleLabel(assignment.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>{assignment.employeeName}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {assignment.position || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>
              </CardContent>
            )}

            {isExpanded && (!task.assignments || task.assignments.length === 0) && (
              <CardContent className="pt-0 pb-4">
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t("tayinlanmalarMavjudEmas")}
                </p>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Business stages section
// ---------------------------------------------------------------------------

interface BusinessStagesListProps {
  stages: BusinessStage[];
}

export function BusinessStagesList({ stages }: BusinessStagesListProps) {
  const { t } = useTranslation("common");
  if (stages.length === 0) {
    return (
      <div className="text-center py-12" data-testid="empty-stages">
        <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">{t("biznesBosqichlarMavjudEmas")}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="stages-list">
      {(Array.isArray(stages) ? stages : []).map((stage) => (
        <Card key={stage.id} data-testid={`card-stage-${stage.id}`}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-[14px] font-semibold">{stage.name}</CardTitle>
              <Badge variant="outline" data-testid={`badge-stage-number-${stage.id}`}>
                #{stage.stageNumber}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {(stage.employeeMin !== undefined || stage.employeeMax !== undefined) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span data-testid={`text-employee-range-${stage.id}`}>
                  {stage.employeeMin || 0} - {stage.employeeMax || "..."} xodim
                </span>
              </div>
            )}

            {stage.keyChallenges && stage.keyChallenges.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">{t("asosiyMuammolar")}</p>
                <ul className="space-y-1">
                  {(Array.isArray(stage.keyChallenges) ? stage.keyChallenges : []).map((challenge, idx) => (
                    <li
                      key={idx}
                      className="text-sm flex items-start gap-2"
                      data-testid={`text-challenge-${stage.id}-${idx}`}
                    >
                      <AlertTriangle className="h-3 w-3 mt-0.5 text-[var(--ep-yellow)] shrink-0" />
                      {challenge}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Crises section
// ---------------------------------------------------------------------------

interface CrisesListProps {
  crises: Crisis[];
}

export function CrisesList({ crises }: CrisesListProps) {
  const { t } = useTranslation("common");
  if (crises.length === 0) {
    return (
      <div className="text-center py-12" data-testid="empty-crises">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">{t("krizisTurlariMavjudEmas")}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="crises-list">
      {(Array.isArray(crises) ? crises : []).map((crisis) => (
        <Card key={crisis.id} data-testid={`card-crisis-${crisis.id}`}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-[14px] font-semibold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                {crisis.name}
              </CardTitle>
              <EPStatusPill tone="danger" data-testid={`badge-crisis-type-${crisis.id}`}>
                {crisis.type}
              </EPStatusPill>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {crisis.symptoms && crisis.symptoms.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  {t("simptomlar")}
                </p>
                <ul className="space-y-1">
                  {(Array.isArray(crisis.symptoms) ? crisis.symptoms : []).map((symptom, idx) => (
                    <li
                      key={idx}
                      className="text-sm flex items-start gap-2"
                      data-testid={`text-symptom-${crisis.id}-${idx}`}
                    >
                      <Heart className="h-3 w-3 mt-0.5 text-[var(--ep-red)] shrink-0" />
                      {symptom}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {crisis.solutions && crisis.solutions.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {t("yechimlar")}
                </p>
                <ul className="space-y-1">
                  {(Array.isArray(crisis.solutions) ? crisis.solutions : []).map((solution, idx) => (
                    <li
                      key={idx}
                      className="text-sm flex items-start gap-2"
                      data-testid={`text-solution-${crisis.id}-${idx}`}
                    >
                      <span className="text-[var(--ep-green)] shrink-0">+</span>
                      {solution}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
