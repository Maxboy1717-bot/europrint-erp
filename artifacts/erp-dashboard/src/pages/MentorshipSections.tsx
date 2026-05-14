/**
 * @module MentorshipSections
 * @description Section UI components for the Mentorship page.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Trash2, BookOpen, Calendar, Percent } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { useTranslation } from "@/lib/i18n";
import { EmptyState } from "@/components/EmptyState";
import type { MentorshipRecord } from "./MentorshipTypes";

interface StatCardsProps {
  total: number;
  active: number;
  uniqueMentors: number;
  uniqueMentees: number;
}

export function MentorshipStatCards({ total, active, uniqueMentors, uniqueMentees }: StatCardsProps) {
  const { t } = useTranslation('lms');
  const { t: tHr } = useTranslation('hr');
  const { t: tCommon } = useTranslation('common');
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-card rounded-lg p-5" data-testid="card-total-mentorships">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{tCommon('total')}</p>
        <p className="text-4xl font-bold tracking-tight text-foreground">{total}</p>
      </div>
      <div className="bg-card rounded-lg p-5" data-testid="card-active-mentorships">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{tCommon('active')}</p>
        <p className="text-4xl font-bold tracking-tight text-foreground">{active}</p>
      </div>
      <div className="bg-card rounded-lg p-5" data-testid="card-unique-mentors">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t('mentors')}</p>
        <p className="text-4xl font-bold tracking-tight text-foreground">{uniqueMentors}</p>
      </div>
      <div className="bg-card rounded-lg p-5" data-testid="card-unique-mentees">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{t('students')}</p>
        <p className="text-4xl font-bold tracking-tight text-foreground">{uniqueMentees}</p>
      </div>
    </div>
  );
}

interface MentorshipTableProps {
  mentorships: MentorshipRecord[] | undefined;
  isLoading: boolean;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onCreateClick: () => void;
}

export function MentorshipTable({ mentorships, isLoading, onStatusChange, onDelete, onCreateClick }: MentorshipTableProps) {
  const { t } = useTranslation('lms');

  return (
    <Card className="bg-card border-border shadow-none">
      <CardHeader>
        <CardTitle className="text-foreground">{"Barchasi"}</CardTitle>
        <CardDescription className="text-muted-foreground">{t('mentors')}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-32 rounded-lg" />
              <Skeleton className="h-10 w-48 rounded-lg" />
            </div>
            {([1, 2, 3, 4, 5]).map((i) => (
              <div key={`k-${i}`} className="flex items-center gap-4 py-3">
                <Skeleton className="h-12 w-40 rounded-lg" />
                <Skeleton className="h-12 w-40 rounded-lg" />
                <Skeleton className="h-8 w-32 rounded-lg" />
                <Skeleton className="h-8 w-24 rounded-lg" />
                <Skeleton className="h-6 w-16 rounded-lg" />
                <Skeleton className="h-8 w-28 rounded-lg" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            ))}
          </div>
        ) : !mentorships?.length ? (
          <EmptyState
            icon={<Users className="h-8 w-8" />}
            title={"Ma'lumot topilmadi"}
            description={"Natija topilmadi"}
            actionLabel={"Yaratish"}
            onAction={onCreateClick}
          />
        ) : (
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 rounded-l-lg">{t('mentor')}</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t("mentee")}</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t('course')}</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{t('deadline')}</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{"Bonus"}</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6">{"Holat"}</TableHead>
                <TableHead className="bg-muted/60 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3 px-6 text-right rounded-r-lg">{"Harakatlar"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mentorships?.map((mentorship) => (
                <TableRow key={mentorship.id} data-testid={`row-mentorship-${mentorship.id}`} className="border-none hover:bg-muted/40 transition-colors">
                  <TableCell data-testid={`text-mentor-${mentorship.id}`} className="px-6">
                    <div>
                      <div className="font-medium text-foreground">{mentorship.mentorName || "Ma'lumot topilmadi"}</div>
                      <div className="text-sm text-muted-foreground">{mentorship.mentorEmployeeId}</div>
                    </div>
                  </TableCell>
                  <TableCell data-testid={`text-mentee-${mentorship.id}`} className="px-6">
                    <div>
                      <div className="font-medium text-foreground">{mentorship.menteeName || "Ma'lumot topilmadi"}</div>
                      <div className="text-sm text-muted-foreground">{mentorship.menteeEmployeeId}</div>
                    </div>
                  </TableCell>
                  <TableCell data-testid={`text-course-${mentorship.id}`} className="px-6 text-foreground">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{mentorship.courseTitle || "Ma'lumot topilmadi"}</span>
                    </div>
                  </TableCell>
                  <TableCell data-testid={`text-deadline-${mentorship.id}`} className="px-6 text-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {mentorship.deadline ? format(new Date(mentorship.deadline), "dd.MM.yyyy") : "—"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell data-testid={`text-bonus-${mentorship.id}`} className="px-6">
                    <Badge variant="outline" className="border-border text-foreground">
                      <Percent className="h-3 w-3 mr-1" />
                      {mentorship.bonusPercentage || 0}%
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6">
                    <Select
                      value={mentorship.status}
                      onValueChange={(value) => onStatusChange(mentorship.id, value)}
                    >
                      <SelectTrigger className="w-36 bg-muted/40 border-border h-9" data-testid={`select-status-${mentorship.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="active">{"Faol"}</SelectItem>
                        <SelectItem value="paused">{"Kutilmoqda"}</SelectItem>
                        <SelectItem value="completed">{"Tugallangan"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(mentorship.id)}
                      data-testid={`button-delete-${mentorship.id}`}
                      className="hover:bg-muted text-foreground"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        )}
      </CardContent>
    </Card>
  );
}
