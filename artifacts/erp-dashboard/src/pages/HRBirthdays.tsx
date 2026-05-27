/**
 * @module HRBirthdays
 * @description Employee birthdays page. Route: /hr/birthdays
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Avatar, AvatarFallback, AvatarImage,
} from "@/components/ui/avatar";
import { Cake, CalendarDays, Users } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface BirthdayPerson {
  id: string | number;
  full_name: string;
  department?: string;
  birth_date?: string;
  age?: number;
  photo_url?: string;
}

type TabValue = "today" | "7" | "30";

const TABS: { value: TabValue; label: string }[] = [
  { value: "today", label: "Bugun" },
  { value: "7",     label: "7 kun" },
  { value: "30",    label: "30 kun" },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatBirthDate(dateStr?: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr.slice(0, 10);
  return d.toLocaleDateString("uz-UZ", { day: "numeric", month: "long" });
}

function BirthdayCardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-5 pb-4 flex flex-col items-center gap-3">
        <Skeleton className="h-14 w-14 rounded-full" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </CardContent>
    </Card>
  );
}

function BirthdayCard({ person, isToday }: { person: BirthdayPerson; isToday: boolean }) {
  const initials = getInitials(person.full_name || "?");
  return (
    <Card
      className={
        isToday
          ? "border-amber-300 bg-amber-50 dark:bg-amber-950/20"
          : "hover:shadow-sm transition-shadow"
      }
    >
      <CardContent className="pt-5 pb-4 flex flex-col items-center gap-2 text-center relative">
        {isToday && (
          <span className="absolute top-2 right-2">
            <Badge variant="warning" className="text-[10px] px-1.5 py-0.5">
              Bugun!
            </Badge>
          </span>
        )}
        <Avatar className="h-14 w-14">
          {person.photo_url && <AvatarImage src={person.photo_url} alt={person.full_name} />}
          <AvatarFallback className={isToday ? "bg-amber-200 text-amber-800 font-bold" : ""}>
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-sm leading-tight">{person.full_name}</p>
          {person.department && (
            <p className="text-xs text-muted-foreground mt-0.5">{person.department}</p>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
          <Cake className="h-3 w-3" />
          <span>{formatBirthDate(person.birth_date)}</span>
          {person.age != null && (
            <span className="ml-1 font-medium text-foreground">{person.age} yosh</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function HRBirthdays() {
  const { t } = useTranslation("common");
  const [tab, setTab] = useState<TabValue>("today");

  const { data: rawToday, isLoading: loadingToday } = useQuery<BirthdayPerson[]>({
    queryKey: ["/api/hr/birthdays/today"],
  });

  const { data: raw7, isLoading: loading7 } = useQuery<BirthdayPerson[]>({
    queryKey: ["/api/hr/birthdays/upcoming", 7],
  });

  const { data: raw30, isLoading: loading30 } = useQuery<BirthdayPerson[]>({
    queryKey: ["/api/hr/birthdays/upcoming", 30],
  });

  const todayList  = Array.isArray(rawToday) ? rawToday : [];
  const list7      = Array.isArray(raw7)     ? raw7     : [];
  const list30     = Array.isArray(raw30)    ? raw30    : [];

  const currentList: BirthdayPerson[] =
    tab === "today" ? todayList : tab === "7" ? list7 : list30;

  const isLoading =
    tab === "today" ? loadingToday : tab === "7" ? loading7 : loading30;

  const isCurrentToday = tab === "today";
  const bgClass = isCurrentToday
    ? "bg-amber-50/60 dark:bg-amber-950/10 rounded-lg p-4"
    : "";

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      {/* Header */}
      <div className="border-b border-border/50 px-1 pb-4 flex items-center gap-3">
        <Cake className="h-5 w-5 text-amber-500" />
        <h1 className="font-semibold text-base">Tug&apos;ilgan Kunlar</h1>
      </div>

      <div className="flex-1 overflow-auto space-y-5">
        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3 flex items-center gap-3">
              <div className="rounded-full bg-amber-100 p-2.5">
                <Cake className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-600">{todayList.length}</div>
                <div className="text-xs text-muted-foreground">Bugun</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2.5">
                <CalendarDays className="h-4 w-4 text-[var(--ep-blue)]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[var(--ep-blue)]">{list7.length}</div>
                <div className="text-xs text-muted-foreground">Bu hafta</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
          <TabsList>
            {TABS.map((tabItem) => (
              <TabsTrigger key={tabItem.value} value={tabItem.value}>
                {tabItem.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Grid */}
        <div className={bgClass}>
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <BirthdayCardSkeleton key={i} />
              ))}
            </div>
          ) : currentList.length === 0 ? (
            <Card>
              <CardContent className="py-14 flex flex-col items-center gap-3 text-muted-foreground">
                <Users className="h-10 w-10 opacity-25" />
                <p className="text-sm font-medium">
                  {tab === "today"
                    ? "Bugun tug'ilgan kun yo'q"
                    : tab === "7"
                    ? "Keyingi 7 kunda tug'ilgan kun yo'q"
                    : "Keyingi 30 kunda tug'ilgan kun yo'q"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {(Array.isArray(currentList) ? currentList : []).map((person) => (
                <BirthdayCard
                  key={person.id}
                  person={person}
                  isToday={isCurrentToday}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
