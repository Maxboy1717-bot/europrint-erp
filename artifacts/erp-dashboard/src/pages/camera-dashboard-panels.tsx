/**
 * @module camera-dashboard-panels
 * @description Camera status grid card and module-link navigation grid for
 * the Camera AI Monitoring dashboard.  Pure presentational components — no
 * data fetching.
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  Camera,
  CheckCircle,
  MapPin,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import { Link } from "wouter";
import type { CameraInfo } from "./camera-dashboard-types";

type Lang = "uz" | "ru";

// ---------------------------------------------------------------------------
// CameraStatusSection
// ---------------------------------------------------------------------------

interface CameraStatusSectionProps {
  cameras: CameraInfo[];
  camerasLoading: boolean;
  totalCount: number;
  language: Lang;
  t: (key: string) => string;
}

/** Camera status grid card. */
export function CameraStatusSection({
  cameras,
  camerasLoading,
  totalCount,
  language,
  t,
}: CameraStatusSectionProps) {
  return (
    <Card
      className="bg-card border-none rounded-lg overflow-hidden shadow-none"
      data-testid="card-camera-grid"
    >
      <CardHeader className="bg-muted/40/50 flex flex-row items-center justify-between gap-2 py-4">
        <div>
          <CardTitle className="text-[14px] font-semibold font-bold flex items-center gap-2 text-foreground">
            <Camera className="h-5 w-5 text-primary" />
            {language === "uz" ? "Kameralar holati" : "Статус камер"}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {totalCount} {language === "uz" ? "kameralar" : "камеры"}
          </CardDescription>
        </div>
        <Link href="/cameras">
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg font-semibold"
            data-testid="link-manage-cameras"
          >
            <Settings className="h-4 w-4 mr-1" />
            {language === "uz" ? "Boshqarish" : "Управление"}
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="p-4">
        {camerasLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={`k-${i}`} className="h-24 rounded-lg" />
            ))}
          </div>
        ) : cameras.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {cameras.slice(0, 10).map((camera) => (
              <div
                key={camera.id}
                className={`p-4 rounded-lg border-2 transition-all group ${
                  camera.isActive
                    ? "bg-background border-border hover:border-green-500"
                    : "bg-muted/40 border-transparent opacity-60"
                }`}
                data-testid={`camera-card-${camera.id}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    {camera.code}
                  </span>
                  <div
                    className={`h-2 w-2 rounded-full ${
                      camera.isActive ? "bg-green-500 animate-pulse" : "bg-[var(--ep-red)]"
                    }`}
                  />
                </div>
                <p className="font-bold text-foreground truncate mb-1">
                  {language === "uz" ? camera.name : (camera.nameRu || camera.name)}
                </p>
                <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">
                  <MapPin className="h-3 w-3" />
                  {camera.location}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Camera className="h-12 w-12 mb-4 opacity-20" />
            <p className="font-bold">{t("noResults")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// ModuleLinksGrid
// ---------------------------------------------------------------------------

interface ModuleLinksGridProps {
  language: Lang;
}

/** 4-card module navigation grid at the bottom of the dashboard. */
export function ModuleLinksGrid({ language }: ModuleLinksGridProps) {
  const modules = [
    {
      href:   "/camera-safety",
      icon:   <Shield className="h-10 w-10 text-[var(--ep-primary)] mb-3 group-hover:scale-110 transition-transform" />,
      label:  language === "uz" ? "Xavfsizlik Nazorati" : "Контроль безопасности",
      testId: "link-safety-module",
    },
    {
      href:   "/camera-quality",
      icon:   <CheckCircle className="h-10 w-10 text-[var(--ep-blue)] mb-3 group-hover:scale-110 transition-transform" />,
      label:  language === "uz" ? "Sifat Nazorati" : "Контроль качества",
      testId: "link-quality-module",
    },
    {
      href:   "/camera-employees",
      icon:   <Users className="h-10 w-10 text-[var(--ep-green)] mb-3 group-hover:scale-110 transition-transform" />,
      label:  language === "uz" ? "Xodim Kuzatuvi" : "Мониторинг сотрудников",
      testId: "link-employees-module",
    },
    {
      href:   "/europrint/camera-ai-analytics",
      icon:   <Activity className="h-10 w-10 text-[var(--ep-purple)] mb-3 group-hover:scale-110 transition-transform" />,
      label:  language === "uz" ? "AI Analitika" : "AI Аналитика",
      testId: "link-ai-analytics",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {modules.map((mod) => (
        <Link key={mod.href} href={mod.href}>
          <Card
            className="bg-card hover:bg-muted border-none rounded-lg transition-all cursor-pointer overflow-hidden group shadow-none"
            data-testid={mod.testId}
          >
            <CardContent className="flex flex-col items-center justify-center py-8">
              {mod.icon}
              <span className="font-bold text-foreground text-center">{mod.label}</span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
