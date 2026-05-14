/**
 * @module MentorsPage
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ModulePage } from "@/components/ui/module-page";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap, Search, Star } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { EPErrorState, EPStatusPill } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
interface Mentor {
  id: string | number;
  name?: string;
  full_name?: string;
  fullName?: string;
  specialization?: string;
  department?: string;
  rating?: number;
  mentee_count?: number;
  menteeCount?: number;
  status?: string;
  bio?: string;
  experience_years?: number;
  experienceYears?: number;
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
  active:   "default",
  inactive: "outline",
  busy:     "secondary",
};

export default function MentorsPage() {
  const { t } = useTranslation("common");
  const [specialization, setSpecialization] = useState("");

  const { data: rawData, isLoading, isError, refetch } = useQuery<
    Mentor[] | { data?: Mentor[] }
  >({
    queryKey: ["/api/mentors", specialization],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (specialization) params.set("specialization", specialization);
      const res = await apiRequest("GET", `/api/mentors?${params}`);
      return res.json();
    },
  });

  const mentors: Mentor[] = Array.isArray(rawData)
    ? rawData
    : (rawData as { data?: Mentor[] })?.data ?? [];

  if (isError) return <EPErrorState onRetry={refetch} />;

  return (
    <ModulePage
      module="hr"
      title={t("mentorlar")}
      icon={<GraduationCap className="h-5 w-5" />}
    >
      <div className="space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("ixtisoslikBoyichaQidirish")}
            value={specialization}
            onChange={e => setSpecialization(e.target.value)}
            className="pl-9"
            data-testid="input-search-mentors"
          />
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={`k-${i}`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-32 rounded-lg" />
                      <Skeleton className="h-3 w-24 rounded-lg" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-full rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : mentors.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {specialization ? "Qidiruv natijasi topilmadi" : "Mentorlar ro'yxati bo'sh"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mentors.map(m => {
              const name    = m.name ?? m.full_name ?? m.fullName ?? "—";
              const mentees = m.mentee_count ?? m.menteeCount ?? 0;
              const exp     = m.experience_years ?? m.experienceYears;
              return (
                <Card key={m.id} className="hover:shadow-md transition-shadow" data-testid={`card-mentor-${m.id}`}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <GraduationCap className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{name}</p>
                          {m.department && (
                            <p className="text-xs text-muted-foreground">{m.department}</p>
                          )}
                        </div>
                      </div>
                      {m.status && (
                        <Badge variant={STATUS_VARIANTS[m.status] ?? "outline"} className="text-xs shrink-0">
                          {m.status === "active" ? "Faol" : m.status === "busy" ? "Band" : m.status}
                        </Badge>
                      )}
                    </div>

                    {m.specialization && (
                      <EPStatusPill tone="neutral" className="text-xs">
                        {m.specialization}
                      </EPStatusPill>
                    )}

                    {m.bio && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{m.bio}</p>
                    )}

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {mentees > 0 && <span>👤 {mentees} mentee</span>}
                      {exp !== undefined && <span>📅 {exp} yil tajriba</span>}
                      {m.rating !== undefined && (
                        <span className="flex items-center gap-0.5">
                          <Star className="h-3 w-3 text-[var(--ep-yellow)]" />
                          {m.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </ModulePage>
  );
}
