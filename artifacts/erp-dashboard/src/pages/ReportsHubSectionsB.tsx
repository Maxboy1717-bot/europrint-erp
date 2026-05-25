/**
 * @module ReportsHubSectionsB
 * @description DefinitionsTable, RunsTable, and SubscriptionsTable for ReportsHub.
 */

import { Play, Bell, BellOff, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AiReportDefinition, AiReportRun, AiReportSubscription } from "@shared/schema";
import { type Translations } from "./ReportsHubTypes";
import { StatusBadge, scheduleLabel } from "./ReportsHubSectionsA";

import { EPLoader } from "@/components/ep";
// ---------------------------------------------------------------------------
// DefinitionsTable
// ---------------------------------------------------------------------------

interface DefinitionsTableProps {
  definitions: AiReportDefinition[];
  isLoading: boolean;
  lang: string;
  tr: Translations;
  isGenerating: boolean;
  isSubscribing: boolean;
  onBack: () => void;
  onGenerate: (id: number) => void;
  onSubscribe: (id: number) => void;
}

export function DefinitionsTable({
  definitions,
  isLoading,
  lang,
  tr,
  isGenerating,
  isSubscribing,
  onBack,
  onGenerate,
  onSubscribe,
}: DefinitionsTableProps) {
  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onBack} data-testid="button-back-categories">
        <ArrowLeft className="h-4 w-4 mr-2" />
        {tr.back}
      </Button>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <EPLoader size={24} tone="muted" />
        </div>
      ) : definitions.length > 0 ? (
        <Card>
          <div className="ep-table-scroll"><Table data-testid="table-definitions">
            <TableHeader>
              <TableRow>
                <TableHead>{tr.name}</TableHead>
                <TableHead>{tr.frequency}</TableHead>
                <TableHead>{tr.status}</TableHead>
                <TableHead className="text-right">{tr.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(definitions) ? definitions : []).map((def) => (
                <TableRow
                  key={def.id}
                  className="hover:bg-muted/40 transition-colors"
                  data-testid={`row-definition-${def.id}`}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium" data-testid={`text-def-name-${def.id}`}>
                        {lang === "ru" ? def.nameRu : def.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{def.code}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" data-testid={`badge-schedule-${def.id}`}>
                      {scheduleLabel(def.schedule, tr)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={def.isActive ? "default" : "secondary"}
                      data-testid={`badge-active-${def.id}`}
                    >
                      {def.isActive ? tr.active : tr.inactive}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        onClick={() => onGenerate(def.id)}
                        disabled={isGenerating}
                        data-testid={`button-generate-${def.id}`}
                      >
                        {isGenerating ? (
                          <EPLoader size={12} className="mr-1" />
                        ) : (
                          <Play className="h-3 w-3 mr-1" />
                        )}
                        {tr.generate}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onSubscribe(def.id)}
                        disabled={isSubscribing}
                        data-testid={`button-subscribe-${def.id}`}
                      >
                        <Bell className="h-3 w-3 mr-1" />
                        {tr.subscribe}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground" data-testid="text-no-reports">
            {tr.noReports}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// RunsTable
// ---------------------------------------------------------------------------

interface RunsTableProps {
  runs: AiReportRun[];
  isLoading: boolean;
  lang: string;
  tr: Translations;
}

export function RunsTable({ runs, isLoading, lang, tr }: RunsTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <EPLoader size={24} tone="muted" />
      </div>
    );
  }

  if (!runs.length) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground" data-testid="text-no-runs">
          {tr.noRuns}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <div className="ep-table-scroll"><Table data-testid="table-runs">
        <TableHeader>
          <TableRow>
            <TableHead>{tr.runId}</TableHead>
            <TableHead>{tr.report}</TableHead>
            <TableHead>{tr.status}</TableHead>
            <TableHead>{tr.startedAt}</TableHead>
            <TableHead>{tr.duration}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(Array.isArray(runs) ? runs : []).map((run) => (
            <TableRow key={run.id} data-testid={`row-run-${run.id}`} className="hover:bg-muted/40 transition-colors">
              <TableCell className="font-mono text-sm" data-testid={`text-run-id-${run.id}`}>
                #{run.id}
              </TableCell>
              <TableCell data-testid={`text-run-report-${run.id}`}>
                {run.reportId ? `Report #${run.reportId}` : "-"}
              </TableCell>
              <TableCell>
                <StatusBadge status={run.status} tr={tr} />
              </TableCell>
              <TableCell className="text-sm" data-testid={`text-run-started-${run.id}`}>
                {run.startedAt
                  ? new Date(run.startedAt).toLocaleString(lang === "ru" ? "ru-RU" : "uz-UZ")
                  : "-"}
              </TableCell>
              <TableCell className="text-sm" data-testid={`text-run-duration-${run.id}`}>
                {run.executionTimeMs ? `${(run.executionTimeMs / 1000).toFixed(1)}s` : "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table></div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// SubscriptionsTable
// ---------------------------------------------------------------------------

interface SubscriptionsTableProps {
  subscriptions: AiReportSubscription[];
  isLoading: boolean;
  tr: Translations;
  isUnsubscribing: boolean;
  onUnsubscribe: (id: number) => void;
}

export function SubscriptionsTable({
  subscriptions,
  isLoading,
  tr,
  isUnsubscribing,
  onUnsubscribe,
}: SubscriptionsTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <EPLoader size={24} tone="muted" />
      </div>
    );
  }

  if (!subscriptions.length) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground" data-testid="text-no-subs">
          {tr.noSubscriptions}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <div className="ep-table-scroll"><Table data-testid="table-subscriptions">
        <TableHeader>
          <TableRow>
            <TableHead>{tr.report}</TableHead>
            <TableHead>{tr.channel}</TableHead>
            <TableHead>{tr.schedule}</TableHead>
            <TableHead className="text-right">{tr.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(Array.isArray(subscriptions) ? subscriptions : []).map((sub) => (
            <TableRow key={sub.id} data-testid={`row-sub-${sub.id}`} className="hover:bg-muted/40 transition-colors">
              <TableCell data-testid={`text-sub-report-${sub.id}`}>
                Report #{sub.reportId}
              </TableCell>
              <TableCell>
                <Badge variant="outline" data-testid={`badge-sub-channel-${sub.id}`}>
                  {sub.deliveryChannel}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline" data-testid={`badge-sub-schedule-${sub.id}`}>
                  {scheduleLabel(sub.schedule, tr)}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onUnsubscribe(sub.id)}
                  disabled={isUnsubscribing}
                  data-testid={`button-unsubscribe-${sub.id}`}
                >
                  <BellOff className="h-3 w-3 mr-1" />
                  {tr.unsubscribe}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table></div>
    </Card>
  );
}
