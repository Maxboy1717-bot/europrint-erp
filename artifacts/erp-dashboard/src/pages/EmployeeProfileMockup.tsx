/**
 * EmployeeProfileMockup — SmartHR mockup uslubidagi xodim profili.
 *
 * Mockup'dagi `#page-hr` sahifasini aynan ko'chiradi.
 * URL: /employees/:id (yoki /employee-profile/:id)
 */
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import {
  Download, Home, ChevronRight, Phone, Mail,
  Briefcase, Clock, History as ClockHistory, Calendar as CalendarIcon,
  Timer as Stopwatch, ArrowUp, ArrowDown, Info, X, Fingerprint,
  Cake, Plus,
} from "lucide-react";
import { useState } from "react";
import { StatusPill, AvatarMockup } from "@/components/mockup";
import { useTranslation } from '@/lib/i18n';

const ClockHistoryIconAlias = ClockHistory; // re-export for clarity
void ClockHistoryIconAlias;

interface EmployeeProfile {
  id: string;
  fullName: string;
  positionName?: string;
  departmentName?: string;
  status?: string;
  phone?: string;
  email?: string;
  managerName?: string;
  hireDate?: string;
  profileImageUrl?: string;
}

const ClockHistoryIcon = ClockHistory; // already imported

export default function EmployeeProfileMockup() {
  const { t } = useTranslation("common");
  const { id } = useParams<{ id: string }>();
  const [alertVisible, setAlertVisible] = useState(true);

  const { data, isLoading } = useQuery<EmployeeProfile>({
    queryKey: [`/api/hr/employees/${id ?? "1"}`],
    enabled: !!id,
  });

  const emp: EmployeeProfile = data ?? {
    id: id ?? "1",
    fullName: "Sardor Karimov",
    positionName: "Bosma operator",
    status: "Faol",
    phone: "+998 91 234 56 78",
    email: "s.karimov@europrint.uz",
    managerName: "Akmal Tursunov",
    hireDate: "02 iyun 2020",
  };

  const initials = (emp.fullName ?? "")
    .split(/\s+/)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("") || "?";

  return (
    <div className="space-y-3">
      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
        <div>
          <h2 className="text-xl font-semibold m-0">{t("xodimPaneli")}</h2>
          <div className="text-xs text-[var(--ep-muted)] mt-1 flex items-center gap-1.5">
            <Home className="h-3.5 w-3.5" />
            <a href="/" className="text-[var(--ep-muted)] no-underline hover:text-[var(--ep-primary)]">{t("home")}</a>
            <ChevronRight className="h-2.5 w-2.5" />
            <span>HR</span>
            <ChevronRight className="h-2.5 w-2.5" />
            <span>{emp.fullName}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="pill-btn"><Download className="h-3 w-3" /> {t("export")}</button>
          <button className="pill-btn"><CalendarIcon className="h-3 w-3" /> 01-05-2026</button>
        </div>
      </div>

      {/* Alert */}
      {alertVisible && (
        <div className="flex items-center justify-between p-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
          <span className="flex items-center gap-2 text-sm">
            <Info className="h-4 w-4 text-[var(--ep-primary)]" />
            {t("sizning")}<strong>{t("k24Aprel2026")}</strong> {t("tatilArizangizTasdiqlandi")}
          </span>
          <button
            onClick={() => setAlertVisible(false)}
            className="text-[var(--ep-muted)] hover:text-[var(--ep-text)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-8 text-[var(--ep-muted)]">{t("Yuklanmoqda...")}</div>
      )}

      {/* Top row: Profile card + 2 ta info card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
        {/* Profile card */}
        <div className="rounded-[10px] overflow-hidden border border-[hsl(var(--border))]">
          <div
            className="p-[18px]"
            style={{ background: 'linear-gradient(135deg, #1B2850 0%, #0f1830 100%)', color: '#fff' }}
          >
            <div className="flex items-center gap-3">
              <AvatarMockup name={emp.fullName} size="lg" color="orange" />
              <div>
                <div className="font-semibold text-[15px]">{emp.fullName}</div>
                <div className="text-[11px] opacity-70 flex items-center gap-1.5">
                  {emp.positionName ?? '—'}
                  <span className="inline-block w-2 h-2 rounded-full ml-1.5" style={{ background: 'var(--ep-green)' }} />
                  {emp.status ?? 'Faol'}
                </div>
              </div>
            </div>
          </div>
          <div className="p-[18px] bg-[hsl(var(--card))] space-y-3">
            <div>
              <div className="text-xs text-[var(--ep-muted)] flex items-center gap-1.5"><Phone className="h-3 w-3" /> {t("telefonRaqami")}</div>
              <div className="font-semibold mt-0.5 text-sm">{emp.phone ?? '—'}</div>
            </div>
            <div>
              <div className="text-xs text-[var(--ep-muted)] flex items-center gap-1.5"><Mail className="h-3 w-3" /> {t("email1")}</div>
              <div className="font-semibold mt-0.5 text-sm">{emp.email ?? '—'}</div>
            </div>
            <div>
              <div className="text-xs text-[var(--ep-muted)] flex items-center gap-1.5"><Briefcase className="h-3 w-3" /> {t("hisobotBeradi")}</div>
              <div className="font-semibold mt-0.5 text-sm">{emp.managerName ?? '—'}</div>
            </div>
            <div>
              <div className="text-xs text-[var(--ep-muted)] flex items-center gap-1.5"><CalendarIcon className="h-3 w-3" /> {t("ishBoshlagan")}</div>
              <div className="font-semibold mt-0.5 text-sm">{emp.hireDate ?? '—'}</div>
            </div>
          </div>
        </div>

        {/* Ta'til tafsilotlari (left) */}
        <div className="ep-card h-full">
          <div className="ep-card-header">
            <h6>{t("davomatStatistikasi")}</h6>
            <span className="pill-btn">2026</span>
          </div>
          <div className="ep-card-body">
            <div className="space-y-2 text-sm">
              <div><span className="ldot" style={{ background: 'var(--ep-primary)', display: 'inline-block', width: 8, height: 8, borderRadius: '50%', marginRight: 8 }} /><strong>1254</strong> kunda keldi</div>
              <div><span className="ldot" style={{ background: 'var(--ep-yellow)', display: 'inline-block', width: 8, height: 8, borderRadius: '50%', marginRight: 8 }} /><strong>32</strong> {t("kechQoldi")}</div>
              <div><span className="ldot" style={{ background: 'var(--ep-purple)', display: 'inline-block', width: 8, height: 8, borderRadius: '50%', marginRight: 8 }} /><strong>658</strong> {t("uydanIsh")}</div>
              <div><span className="ldot" style={{ background: 'var(--ep-red)', display: 'inline-block', width: 8, height: 8, borderRadius: '50%', marginRight: 8 }} /><strong>14</strong> {t("yoq")}</div>
              <div><span className="ldot" style={{ background: 'var(--ep-green)', display: 'inline-block', width: 8, height: 8, borderRadius: '50%', marginRight: 8 }} /><strong>68</strong> kasallik</div>
            </div>
            <div className="text-xs text-[var(--ep-muted)] mt-3 flex items-center gap-2">
              <input type="checkbox" defaultChecked className="rounded" />
              {t("xodimlarning")}<strong className="text-[var(--ep-primary)]">85%</strong> idan yaxshiroq
            </div>
          </div>
        </div>

        {/* Ta'til tafsilotlari (grid) */}
        <div className="ep-card h-full">
          <div className="ep-card-header">
            <h6>{t("tatilTafsilotlari")}</h6>
            <span className="pill-btn">2026</span>
          </div>
          <div className="ep-card-body">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-center">
              <div>
                <div className="text-xs text-[var(--ep-muted)]">{t("jamiTatil")}</div>
                <h3 className="m-0 text-2xl font-bold">16</h3>
              </div>
              <div>
                <div className="text-xs text-[var(--ep-muted)]">{t("olingan")}</div>
                <h3 className="m-0 text-2xl font-bold">10</h3>
              </div>
              <div>
                <div className="text-xs text-[var(--ep-muted)]">{t("no")}</div>
                <h3 className="m-0 text-2xl font-bold">2</h3>
              </div>
              <div>
                <div className="text-xs text-[var(--ep-muted)]">{t("sorov")}</div>
                <h3 className="m-0 text-2xl font-bold">0</h3>
              </div>
              <div>
                <div className="text-xs text-[var(--ep-muted)]">{t("ishlagan")}</div>
                <h3 className="m-0 text-2xl font-bold">240</h3>
              </div>
              <div>
                <div className="text-xs text-[var(--ep-muted)]">{t("tolovsiz")}</div>
                <h3 className="m-0 text-2xl font-bold">2</h3>
              </div>
            </div>
            <button
              className="w-full mt-3 py-2.5 rounded-lg font-medium text-sm text-white"
              style={{ background: 'var(--ep-dark)' }}
            >
              <Plus className="h-3.5 w-3.5 inline mr-1" />
              {t("yangiTatilSorash")}
            </button>
          </div>
        </div>
      </div>

      {/* Punch & Hours row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
        {/* Punch card */}
        <div
          className="ep-card h-full"
          style={{ background: 'rgba(255,144,47,0.04)', borderColor: 'rgba(255,144,47,0.3)' }}
        >
          <div className="ep-card-body text-center">
            <div className="text-xs text-[var(--ep-muted)]">{t("davomat")}</div>
            <div className="font-semibold mb-3 text-sm">{t("k0835Am1May2026")}</div>
            <div
              className="relative mx-auto mb-3"
              style={{ width: 140, height: 140, borderRadius: '50%', background: 'conic-gradient(var(--ep-primary) 0% 65%, hsl(var(--muted)) 65% 100%)' }}
            >
              <div className="absolute inset-2 rounded-full bg-[hsl(var(--card))] flex flex-col items-center justify-center">
                <div className="text-xs text-[var(--ep-muted)]">{t("jamiSoat")}</div>
                <strong className="text-lg">5:45:32</strong>
              </div>
            </div>
            <div className="mb-3">
              <StatusPill variant="dark">{t("ishlabChiq345Soat")}</StatusPill>
            </div>
            <div className="text-xs text-[var(--ep-muted)] mb-3 flex items-center justify-center gap-1.5">
              <Fingerprint className="h-3.5 w-3.5 text-[var(--ep-primary)]" />
              {t("punchIn1000Am")}
            </div>
            <button
              className="w-full py-2.5 rounded-lg font-medium text-sm text-white"
              style={{ background: 'var(--ep-primary)' }}
            >
              {t("punchOut")}
            </button>
          </div>
        </div>

        {/* Hours KPI grid */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="kpi-card-mockup">
            <span className="kpi-icon-sq ki-orange"><Clock className="h-5 w-5" /></span>
            <div className="kpi-label">{t("bugungiSoatlar")}</div>
            <div className="kpi-value">8.36 / 9</div>
            <a href="#" className="kpi-link" onClick={(e) => e.preventDefault()}>
              <ArrowUp className="h-3 w-3 inline text-[var(--ep-green)]" /> {t("k5BuHafta")}
            </a>
          </div>
          <div className="kpi-card-mockup">
            <span className="kpi-icon-sq ki-darker"><ClockHistoryIcon className="h-5 w-5" /></span>
            <div className="kpi-label">{t("haftaSoatlari")}</div>
            <div className="kpi-value">10 / 40</div>
            <a href="#" className="kpi-link" onClick={(e) => e.preventDefault()}>
              <ArrowUp className="h-3 w-3 inline text-[var(--ep-green)]" /> {t("k7OldingiHafta")}
            </a>
          </div>
          <div className="kpi-card-mockup">
            <span className="kpi-icon-sq ki-blue"><CalendarIcon className="h-5 w-5" /></span>
            <div className="kpi-label">{t("oySoatlari")}</div>
            <div className="kpi-value">75 / 98</div>
            <a href="#" className="kpi-link" onClick={(e) => e.preventDefault()}>
              <ArrowDown className="h-3 w-3 inline text-[var(--ep-red)]" /> {t("k8OldingiOy")}
            </a>
          </div>
          <div className="kpi-card-mockup">
            <span className="kpi-icon-sq ki-pink"><Stopwatch className="h-5 w-5" /></span>
            <div className="kpi-label">{t("qoshimchaVaqt")}</div>
            <div className="kpi-value">16 / 28</div>
            <a href="#" className="kpi-link" onClick={(e) => e.preventDefault()}>
              <ArrowDown className="h-3 w-3 inline text-[var(--ep-red)]" /> {t("k6OldingiOy")}
            </a>
          </div>

          {/* Time bar */}
          <div className="md:col-span-2 ep-card">
            <div className="ep-card-body">
              <div className="flex gap-3 mb-2 text-xs flex-wrap">
                <span><span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: '#888' }} /> {t("total")}</span>
                <span><span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: 'var(--ep-green)' }} /> {t("samarali8s36d")}</span>
                <span><span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: 'var(--ep-yellow)' }} /> {t("tanaffus22d")}</span>
                <span><span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: '#3B82F6' }} /> {t("qoshimcha2s15d")}</span>
              </div>
              <div className="flex h-6 rounded-md overflow-hidden">
                <div style={{ background: 'var(--ep-green)', width: '35%' }} />
                <div style={{ background: 'var(--ep-yellow)', width: '5%' }} />
                <div style={{ background: 'var(--ep-green)', width: '25%' }} />
                <div style={{ background: 'var(--ep-yellow)', width: '8%' }} />
                <div style={{ background: 'var(--ep-green)', width: '18%' }} />
                <div style={{ background: 'var(--ep-yellow)', width: '3%' }} />
                <div style={{ background: '#3B82F6', width: '6%' }} />
              </div>
              <div className="flex justify-between text-xs text-[var(--ep-muted)] mt-2">
                <span>06:00</span><span>09:00</span><span>12:00</span><span>15:00</span><span>18:00</span><span>21:00</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance + Skills row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
        {/* Performance */}
        <div className="ep-card h-full">
          <div className="ep-card-header">
            <h6>{t("samaradorlik")}</h6>
            <span className="pill-btn">2026</span>
          </div>
          <div className="ep-card-body">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="m-0 text-3xl font-bold">98%</h2>
              <StatusPill variant="success">
                <ArrowUp className="h-3 w-3 inline" /> {t("k12OtganYil")}
              </StatusPill>
            </div>
            <div className="text-xs text-[var(--ep-muted)] py-12 text-center bg-[hsl(var(--muted)/0.3)] rounded">
              📊 Performance chart (oylar bo'yicha)
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="ep-card h-full">
          <div className="ep-card-header">
            <h6>{t("meningKonikmalarim")}</h6>
            <span className="pill-btn">2026</span>
          </div>
          <div className="ep-card-body">
            {[
              { name: 'Heidelberg operatsiya', date: '15 may 2025', percent: 95, color: 'var(--ep-primary)' },
              { name: 'CMYK rang nazorati', date: '12 may 2025', percent: 85, color: 'var(--ep-cyan)' },
              { name: 'Komori sozlash', date: '12 may 2025', percent: 70, color: 'var(--ep-purple)' },
              { name: 'Bobst die-cutting', date: '15 may 2025', percent: 61, color: 'var(--ep-pink)' },
              { name: 'PrePress (Adobe)', date: '08 may 2025', percent: 50, color: 'var(--ep-green)' },
            ].map((s) => (
              <div key={s.name} className="skill-row">
                <div className="bar-strip" style={{ background: s.color }} />
                <div className="flex-1">
                  <div className="font-semibold text-sm">{s.name}</div>
                  <div className="text-xs text-[var(--ep-muted)]">Yangilangan: {s.date}</div>
                </div>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold relative"
                  style={{ background: `conic-gradient(${s.color} 0% ${s.percent}%, hsl(var(--muted)) ${s.percent}% 100%)` }}
                >
                  <span className="absolute inset-1.5 rounded-full bg-[hsl(var(--card))] flex items-center justify-center">
                    {s.percent}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Birthday card */}
        <div className="ep-card h-full">
          <div className="ep-card-header">
            <h6 className="flex items-center gap-2"><Cake className="h-4 w-4 text-[var(--ep-primary)]" /> {t("tugilganKunlar1")}</h6>
            <span className="pill-btn">{t("may")}</span>
          </div>
          <div className="ep-card-body space-y-2">
            {[
              { name: 'Aziz Mirzayev', date: '5 may', dept: 'Marketing' },
              { name: 'Madina Olimova', date: '8 may', dept: 'HR' },
              { name: 'Bobur Tursunov', date: '12 may', dept: 'Sotuvlar' },
              { name: 'Sevara Yusupova', date: '18 may', dept: 'Buxgalteriya' },
            ].map((b) => (
              <div key={b.name} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[hsl(var(--muted)/0.4)]">
                <AvatarMockup name={b.name} size="sm" color="orange" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{b.name}</div>
                  <div className="text-xs text-[var(--ep-muted)]">{b.dept} · {b.date}</div>
                </div>
                <button
                  className="text-xs px-2 py-1 border rounded-md text-[var(--ep-text)] hover:bg-[var(--ep-primary)] hover:text-white hover:border-[var(--ep-primary)]"
                  style={{ borderColor: 'hsl(var(--border))' }}
                >
                  {t("tabriklash")}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
