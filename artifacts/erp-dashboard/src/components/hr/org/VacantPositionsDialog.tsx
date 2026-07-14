/**
 * @module VacantPositionsDialog
 * @description Real list view for "Vakant lavozimlar" — owner 2026-07-14: "Vakant lavozimlar
 *   bosganda bu tab ochilib ko'rsatishi kerak" (clicking it should open a tab/view that shows
 *   the vacancies, not just a toast). Replaces OrgStructureHierarchy.tsx's old
 *   notifyMutation.onSuccess toast-only feedback with an actual table of vacant org cards,
 *   each row navigating straight to that karta's detail page.
 */
import { useLocation } from "wouter";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { UserX } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export interface VacantNodeRow {
  id: string;
  name: string;
}

export function VacantPositionsDialog({
  open,
  onClose,
  nodes,
}: {
  open: boolean;
  onClose: () => void;
  nodes: VacantNodeRow[];
}) {
  const { t } = useTranslation("common");
  const [, navigate] = useLocation();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserX className="h-4 w-4 text-[var(--ep-red)]" />
            {t("vakantlar")} ({nodes.length})
          </DialogTitle>
        </DialogHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>{t("nomiUz")}</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {nodes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                  {t("vakantLavozimYoq", "Hozircha vakant lavozim yo'q")}
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
                      data-testid={`button-view-vacant-${n.id}`}
                      onClick={() => {
                        onClose();
                        navigate(`/org-structure/hierarchy/node/${n.id}`);
                      }}
                    >
                      {t("korish", "Ko'rish")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}
