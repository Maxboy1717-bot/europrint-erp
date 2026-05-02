import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Clock, Briefcase, ChevronDown, ChevronUp, Users, Star, Send, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3005";

const stats = [
  { icon: Users, label: "400+", sub: "Xodim" },
  { icon: Star,  label: "15+",  sub: "Yil bozorda" },
  { icon: Star,  label: "4.5★", sub: "Xodim reytingi" },
];

const TYPE_LABELS: Record<string, string> = {
  STANDARD:       "To'liq stavka",
  INTERNAL:       "Ichki",
  COMPLEX:        "Yuqori malaka",
  TOP_MANAGEMENT: "Top Menejment",
};

// Vacancy interface matches public API contract:
// GET /api/hr/recruitment/vacancy?status=open&public=true
// Returns normalized public-safe fields only (no raw DB internals)
interface Vacancy {
  id: number;
  title: string;
  department: string | null;
  type: string | null;
  location: string | null;
  salary_range: string | null;
  description: string | null;
  requirements: string | null;
  publish_date: string | null;
  closing_date: string | null;
  telegram_deep_link: string;
}

export default function Careers() {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [filter, setFilter] = useState("Barchasi");

  const { data, isLoading, isError } = useQuery<{ data: Vacancy[] }>({
    queryKey: ["public-vacancies"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/hr/recruitment/vacancy?status=open&public=true`);
      if (!res.ok) throw new Error("Yuklanmadi");
      return res.json() as Promise<{ data: Vacancy[] }>;
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const vacancies: Vacancy[] = data?.data ?? [];

  const departments = [
    "Barchasi",
    ...Array.from(new Set((vacancies ?? []).map(v => v.department ?? "").filter(Boolean))),
  ];

  const filtered = filter === "Barchasi"
    ? (Array.isArray(vacancies) ? vacancies : [])
    : (Array.isArray(vacancies) ? vacancies : []).filter(v => v.department === filter);

  const handleApply = (job: Vacancy) => {
    // Use backend-computed telegram_deep_link (per spec: backend provides the link)
    const telegramUrl = job.telegram_deep_link ?? `https://t.me/europrint_careers_bot?start=${job.id}`;
    window.open(telegramUrl, "_blank", "noopener,noreferrer");
    toast({
      title: "Telegram orqali ariza topshiring!",
      description: `${job.title} bo'yicha ariza topshirish uchun Telegram botimizga o'tdingiz.`,
    });
  };

  return (
    <div className="min-h-screen bg-background">

      {/* Page Header */}
      <div className="bg-[#1a1a2e] py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <span className="inline-block bg-primary/15 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-5 border border-primary/25">
            Jamoamizga qo'shiling
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">Bo'sh Ish O'rinlari</h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            EuroPrint jamoasiga qo'shiling! Biz iqtidorli va qiziquvchi mutaxassislarni qidiryapmiz.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {(stats ?? []).map(({ icon: Icon, label, sub }) => (
            <div key={sub} className="bg-card border border-border rounded-xl p-5 text-center">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="text-2xl font-bold text-primary">{label}</div>
              <div className="text-sm text-muted-foreground">{sub}</div>
            </div>
          ))}
        </div>

        {/* Loading / Error */}
        {isLoading && (
          <div className="flex flex-col items-center py-16 gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-sm">Vakansiyalar yuklanmoqda...</span>
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center py-12 gap-3 text-muted-foreground">
            <AlertCircle className="w-8 h-8 text-destructive" />
            <span className="text-sm">Ma'lumotlarni yuklashda xatolik yuz berdi.</span>
          </div>
        )}

        {!isLoading && !isError && (
          <>
            {/* Filter tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {(departments ?? []).map((dept) => (
                <button
                  key={dept}
                  onClick={() => setFilter(dept)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                    filter === dept
                      ? "bg-primary text-white border-primary"
                      : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Hozirda bu bo'limda bo'sh ish o'rinlari yo'q.</p>
              </div>
            )}

            {/* Job cards */}
            <div className="space-y-4">
              {(filtered ?? []).map((job) => {
                const typeLabel = TYPE_LABELS[job.type ?? "STANDARD"] ?? "To'liq stavka";
                const reqLines = job.requirements
                  ? job.requirements.split("\n").filter(Boolean)
                  : [];

                return (
                  <div key={job.id} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div
                      className="p-5 cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => setExpanded(expanded === job.id ? null : job.id)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground">{job.title}</h3>
                          <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                            {job.department && (
                              <span className="flex items-center gap-1">
                                <Briefcase className="w-3 h-3" />{job.department}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />{job.location ?? "Toshkent"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />{typeLabel}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {job.salary_range && (
                            <Badge className="bg-green-100 text-green-700 border-0 text-xs">{job.salary_range}</Badge>
                          )}
                          {expanded === job.id
                            ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                            : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          }
                        </div>
                      </div>
                    </div>

                    {expanded === job.id && (
                      <div className="px-5 pb-5 border-t border-border">
                        {job.description && (
                          <p className="text-sm text-muted-foreground mt-4 mb-4">{job.description}</p>
                        )}
                        {reqLines.length > 0 && (
                          <>
                            <h4 className="text-sm font-semibold text-foreground mb-2">Talablar:</h4>
                            <ul className="space-y-1 mb-4">
                              {(reqLines ?? []).map((req) => (
                                <li key={req} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <span className="text-primary mt-0.5">•</span> {req}
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                        {job.closing_date && (
                          <p className="text-xs text-muted-foreground mb-3">
                            Muddati: <span className="font-medium">{new Date(job.closing_date).toLocaleDateString("uz-UZ")}</span>
                          </p>
                        )}
                        <Button
                          className="bg-primary hover:bg-primary/90 text-white"
                          onClick={() => handleApply(job)}
                        >
                          <Send className="w-4 h-4 mr-2" /> Telegram orqali ariza yuborish
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Open application CTA */}
        <div className="mt-10 bg-[#1a1a2e] rounded-2xl p-8 text-white text-center">
          <h2 className="text-xl font-bold mb-2">O'zingizga mos lavozim topa olmadingizmi?</h2>
          <p className="text-slate-400 text-sm mb-4">Rezyume yuboring, mos vakansiya chiqqanda xabardor qilamiz</p>
          <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
            <Send className="w-4 h-4 mr-2" /> Rezyume yuborish
          </Button>
        </div>
      </div>
    </div>
  );
}
