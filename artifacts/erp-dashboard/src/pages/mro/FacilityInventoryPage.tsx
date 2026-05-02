import { useQuery } from "@tanstack/react-query";
import { apiRequest, selectArray } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { DedicatedPageShell, KpiCard, Section } from "@/components/DedicatedPageShell";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Building, Box, MapPin } from "lucide-react";

interface FacilityRow {
  id: number;
  facilityCode: string;
  name: string;
  facilityType: "office" | "production" | "warehouse" | "canteen" | "outdoor";
  totalAreaSqm: number | null;
  itemsCount: number;
  responsibleEmployee: string | null;
  status: "active" | "renovation" | "closed";
}

const TYPE_CONFIG: Record<FacilityRow["facilityType"], { label: string; className: string }> = {
  office:     { label: "Ofis",        className: "bg-blue-100 text-blue-700" },
  production: { label: "Ishlab chiq.", className: "bg-purple-100 text-purple-700" },
  warehouse:  { label: "Ombor",       className: "bg-emerald-100 text-emerald-700" },
  canteen:    { label: "Oshxona",     className: "bg-orange-100 text-orange-700" },
  outdoor:    { label: "Tashqi",      className: "bg-slate-100 text-slate-700" },
};

export default function FacilityInventoryPage() {
  const { t } = useTranslation('mro' as 'admin');

  const { data, isLoading } = useQuery<{ items: FacilityRow[] }>({
    queryKey: ["/api/mro/facilities"],
    queryFn: () => apiRequest("GET", "/api/mro/facilities"),
  });

  const items = selectArray<FacilityRow>(data, "items");
  const totalArea = items.reduce((s, f) => s + (f.totalAreaSqm ?? 0), 0);
  const totalItems = items.reduce((s, f) => s + f.itemsCount, 0);
  const active = items.filter((f) => f.status === "active").length;

  return (
    <DedicatedPageShell
      title={t('facility.title', "Bino Inventari")}
      description={t('facility.description', "Korxona binolari, zonalari va ulardagi inventar")}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard label={t('facility.total', "Binolar")} value={items.length} icon={<Building className="h-4 w-4" />} />
        <KpiCard label={t('facility.active', "Faol")} value={active} icon={<Building className="h-4 w-4" />} variant="success" />
        <KpiCard label={t('facility.totalArea', "Jami maydon (m²)")} value={totalArea.toLocaleString()} icon={<MapPin className="h-4 w-4" />} />
        <KpiCard label={t('facility.totalItems', "Inventar")} value={totalItems} icon={<Box className="h-4 w-4" />} />
      </div>

      <Section title={t('facility.list', "Binolar ro'yxati")}>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{t('facility.empty', "Bino yo'q")}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {items.map((f) => {
              const cfg = TYPE_CONFIG[f.facilityType];
              return (
                <div key={f.id} className="border rounded-md p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">{f.name}</span>
                      <Badge variant="outline" className="text-xs">{f.facilityCode}</Badge>
                    </div>
                    <Badge className={cfg.className}>{cfg.label}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <span>Maydon: <strong>{f.totalAreaSqm?.toLocaleString() ?? '—'} m²</strong></span>
                    <span>Inventar: <strong>{f.itemsCount}</strong></span>
                    <span>Mas'ul: <strong>{f.responsibleEmployee ?? '—'}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </DedicatedPageShell>
  );
}
