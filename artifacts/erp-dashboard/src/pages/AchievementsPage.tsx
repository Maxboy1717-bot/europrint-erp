/**
 * @module AchievementsPage
 * @description React page component. Route-level UI.
 */

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ModulePage } from "@/components/ui/module-page";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Star, Award, BookOpen, Target, Zap } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { EPErrorState } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
interface Achievement {
  id: string | number;
  title?: string;
  name?: string;
  description?: string;
  type?: string;
  category?: string;
  badge_icon?: string;
  badgeIcon?: string;
  earned_at?: string;
  earnedAt?: string;
  points?: number;
  employee_name?: string;
  employeeName?: string;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  course:      <BookOpen className="h-5 w-5" />,
  target:      <Target   className="h-5 w-5" />,
  performance: <Star     className="h-5 w-5" />,
  streak:      <Zap      className="h-5 w-5" />,
  default:     <Trophy   className="h-5 w-5" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  course:      "bg-blue-100 text-[var(--ep-blue)]",
  target:      "bg-green-100 text-[var(--ep-green)]",
  performance: "bg-amber-100 text-[var(--ep-yellow)]",
  streak:      "bg-purple-100 text-[var(--ep-purple)]",
  default:     "bg-rose-100 text-[var(--ep-red)]",
};

export default function AchievementsPage() {
  const { t } = useTranslation("common");
  const { data: rawData, isLoading, isError, refetch } = useQuery<Achievement[] | { data?: Achievement[]; achievements?: Achievement[] }>({
    queryKey: ["/api/achievements"],
    queryFn: async () => {
      return await apiRequest("GET", "/api/achievements");
    },
  });

  const achievements: Achievement[] = Array.isArray(rawData)
    ? rawData
    : (rawData as { data?: Achievement[] })?.data
      ?? (rawData as { achievements?: Achievement[] })?.achievements
      ?? [];

  if (isError) return <EPErrorState onRetry={refetch} />;

  const totalPoints = achievements.reduce((sum, a) => sum + (a.points ?? 0), 0);

  return (
    <ModulePage
      module="hr"
      title={t("yutuqlar")}
      icon={<Trophy className="h-5 w-5" />}
    >
      <div className="space-y-6">
        {/* Summary */}
        {!isLoading && achievements.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">{achievements.length}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("jamiYutuqlar")}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-[var(--ep-yellow)]">{totalPoints}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("jamiBall")}</p>
              </CardContent>
            </Card>
            <Card className="col-span-2 sm:col-span-1">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-[var(--ep-green)]">
                  {new Set(achievements.map(a => a.category ?? a.type ?? "default")).size}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{t("toifalar")}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Achievements list */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {([1, 2, 3, 4, 5, 6]).map(i => (
              <Card key={`k-${i}`}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-11 w-11 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32 rounded-lg" />
                      <Skeleton className="h-3 w-full rounded-lg" />
                      <Skeleton className="h-3 w-20 rounded-lg" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : achievements.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Award className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-lg mb-1">{t("haliYutuqlarYoq")}</p>
              <p className="text-xs text-muted-foreground">
                {t("kurslarniTugatibKpiMaqsadlarigaEring")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map(a => {
              const category = a.category ?? a.type ?? "default";
              const icon     = CATEGORY_ICONS[category] ?? CATEGORY_ICONS.default;
              const colorCls = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.default;
              const title    = a.title ?? a.name ?? "Yutuq";
              const earnedAt = a.earned_at ?? a.earnedAt;
              return (
                <Card
                  key={a.id}
                  className="hover:shadow-md transition-shadow"
                  data-testid={`card-achievement-${a.id}`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className={`h-11 w-11 rounded-full flex items-center justify-center shrink-0 ${colorCls}`}>
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{title}</p>
                        {a.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {a.points !== undefined && a.points > 0 && (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <Star className="h-2.5 w-2.5" />
                              {a.points} ball
                            </Badge>
                          )}
                          {earnedAt && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(earnedAt).toLocaleDateString("uz-UZ")}
                            </span>
                          )}
                          {(a.employee_name ?? a.employeeName) && (
                            <span className="text-xs text-muted-foreground truncate">
                              {a.employee_name ?? a.employeeName}
                            </span>
                          )}
                        </div>
                      </div>
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
