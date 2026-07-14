/**
 * @module VacantOrgCardsPanel
 * @description Owner 2026-07-14: "yo'llash kanban rekruter sahifasida bular jadval bo'lib
 *   ko'rishi kerak" — the org-chart's vacant cards (org_departments rows with no head_user_id)
 *   should also be visible, as a table, on the Recruiting/Kanban page.
 *
 *   This is a SEPARATE concept from the recruiting funnel's own `vacancies` table (a job
 *   posting/candidate-pipeline entity) — there is no FK link between the two today, so this
 *   panel is a second, read-only table sourced from the SAME endpoint the org-sxema page's
 *   "Vakant lavozimlar" button already uses (POST /api/org-departments/notify-vacancies —
 *   a real SELECT under the hood, see resources.service.ts getVacantDepartments; reused as-is
 *   rather than adding a new backend route).
 */
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Network, UserX } from "lucide-react";
import { tLabel } from "@/lib/i18n/tLabel";

interface VacantOrgNode {
  id: string;
  name: string;
}

export function VacantOrgCardsPanel() {
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery<{ vacantCount: number; vacantNodes: VacantOrgNode[] }>({
    queryKey: ["/api/org-departments/notify-vacancies"],
    queryFn: () => apiRequest("POST", "/api/org-departments/notify-vacancies"),
    staleTime: 60_000,
  });
  const nodes = Array.isArray(data?.vacantNodes) ? data.vacantNodes : [];

  return (
    <Card className="mb-4">
      <CardHeader
        className="pb-2 flex flex-row items-center justify-between cursor-pointer select-none"
        onClick={() => setOpen((v) => !v)}
        data-testid="button-toggle-vacant-org-cards"
      >
        <CardTitle className="text-sm flex items-center gap-2">
          <Network className="h-4 w-4 text-[var(--ep-red)]" />
          {tLabel("recruiting.vacant_org_cards.title", "Tashkiliy tuzilmadagi vakant kartalar")}
          {!isLoading && <span className="text-muted-foreground font-normal">({nodes.length})</span>}
        </CardTitle>
        <Button variant="ghost" size="sm">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CardHeader>
      {open && (
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>{tLabel("recruiting.vacant_org_cards.name", "Karta nomi")}</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                    {tLabel("recruiting.vacant_org_cards.loading", "Yuklanmoqda...")}
                  </TableCell>
                </TableRow>
              ) : nodes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                    <UserX className="h-4 w-4 inline mr-1.5 opacity-50" />
                    {tLabel("recruiting.vacant_org_cards.empty", "Hozircha vakant karta yo'q")}
                  </TableCell>
                </TableRow>
              ) : (
                nodes.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell className="text-muted-foreground">#{n.id}</TableCell>
                    <TableCell className="font-medium">{n.name}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        data-testid={`button-view-vacant-org-card-${n.id}`}
                        onClick={() => navigate(`/org-structure/hierarchy/node/${n.id}`)}
                      >
                        {tLabel("recruiting.vacant_org_cards.view", "Ko'rish")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      )}
    </Card>
  );
}
