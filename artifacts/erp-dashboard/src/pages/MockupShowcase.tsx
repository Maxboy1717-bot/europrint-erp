import { useTranslation } from '@/lib/i18n';
/**
 * MockupShowcase — barcha mockup komponentlarini ko'rsatadigan demo sahifa.
 *
 * URL: /mockup-showcase
 *
 * Ushbu sahifani:
 *   1. Dizayn tizim hujjati sifatida ishlatish
 *   2. Yangi modullar uchun shablon olish
 *   3. Style guide bo'yicha tekshirish
 */
import {
  Users, UserCheck, UserPlus, UserX, Briefcase,
  TrendingUp, Calendar, CheckCircle2, Clock,
} from "lucide-react";
import {
  WelcomeBanner, KpiCardMockup, StatusPill,
  JobTag, ScheduleCard, AvatarMockup, CardMockup,
} from "@/components/mockup";

export default function MockupShowcase() {
  const { t } = useTranslation('common');
  return (
    <div className="ep-content space-y-6">
      <div>
        <div className="text-xs text-[var(--ep-muted)] mb-1">Demo / Style Guide</div>
        <h1 className="text-xl font-semibold m-0">{t("mockupKomponentlarShowcase")}</h1>
        <p className="text-sm text-[var(--ep-muted)] mt-1">
          {t("smarthrMockupUslubidagiBarchaQayta")}
        </p>
      </div>

      {/* Welcome banner */}
      <section>
        <h2 className="text-sm font-semibold uppercase text-[var(--ep-muted)] mb-2">{t("k1WelcomeBanner")}</h2>
        <WelcomeBanner tasksToday={5} />
      </section>

      {/* KPI Cards */}
      <section>
        <h2 className="text-sm font-semibold uppercase text-[var(--ep-muted)] mb-2">2. KPI Cards (8 rang)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCardMockup icon={<Users className="h-5 w-5" />} iconColor="orange" label={t("xodimlar")} value={154} link="Ko'rish" />
          <KpiCardMockup icon={<UserCheck className="h-5 w-5" />} iconColor="green" label={t("active")} value={142} link="Ro'yxat" />
          <KpiCardMockup icon={<UserPlus className="h-5 w-5" />} iconColor="blue" label={t("yangi")} value={8} link="Onboarding" />
          <KpiCardMockup icon={<UserX className="h-5 w-5" />} iconColor="red" label={t("bugunYoq")} value={3} link="Davomat" />
          <KpiCardMockup icon={<Briefcase className="h-5 w-5" />} iconColor="purple" label={t("vakant")} value={12} link="Recruiting" />
          <KpiCardMockup icon={<TrendingUp className="h-5 w-5" />} iconColor="pink" label={t("attrition")} value="3.2%" link="Tahlil" />
          <KpiCardMockup icon={<Calendar className="h-5 w-5" />} iconColor="dark" label={t("tatil")} value={7} link="Approve" />
          <KpiCardMockup icon={<CheckCircle2 className="h-5 w-5" />} iconColor="green" label={t("smenada")} value={139} link="Smena" />
        </div>
      </section>

      {/* Status Pills */}
      <section>
        <h2 className="text-sm font-semibold uppercase text-[var(--ep-muted)] mb-2">{t('k3StatusPills')}</h2>
        <div className="flex flex-wrap gap-2">
          <StatusPill variant="success">{t("active")}</StatusPill>
          <StatusPill variant="danger">{t("bloklangan")}</StatusPill>
          <StatusPill variant="warning">{t("Kutilmoqda")}</StatusPill>
          <StatusPill variant="info">{t("yangi")}</StatusPill>
          <StatusPill variant="primary">{t("pagination.first")}</StatusPill>
          <StatusPill variant="purple">{t("premium")}</StatusPill>
          <StatusPill variant="pink">VIP</StatusPill>
          <StatusPill variant="dark">{t("arxiv")}</StatusPill>
        </div>
      </section>

      {/* Job Tags */}
      <section>
        <h2 className="text-sm font-semibold uppercase text-[var(--ep-muted)] mb-2">{t("k4JobTags")}</h2>
        <div className="flex flex-wrap gap-2">
          <JobTag variant="dark">{t("direktor")}</JobTag>
          <JobTag variant="blue">{t('manager')}</JobTag>
          <JobTag variant="purple">{t('designer')}</JobTag>
          <JobTag variant="pink">HR</JobTag>
          <JobTag variant="green">{t("mentor")}</JobTag>
          <JobTag variant="orange">{t("Operator")}</JobTag>
        </div>
      </section>

      {/* Avatars */}
      <section>
        <h2 className="text-sm font-semibold uppercase text-[var(--ep-muted)] mb-2">{t("k5Avatars")}</h2>
        <div className="flex items-end gap-4">
          <AvatarMockup name="Sardor Karimov" size="sm" color="orange" />
          <AvatarMockup name="Aziz Mirzayev" size="md" color="blue" showOnline />
          <AvatarMockup name="Madina Ali" size="lg" color="purple" />
          <AvatarMockup name="Bobur Toshev" size="xl" color="dark" showOnline />
          <div className="av-group">
            <AvatarMockup name="A B" size="sm" color="green" />
            <AvatarMockup name="C D" size="sm" color="pink" />
            <AvatarMockup name="E F" size="sm" color="orange" />
            <AvatarMockup name="+5" size="sm" color="dark" />
          </div>
        </div>
      </section>

      {/* Cards */}
      <section>
        <h2 className="text-sm font-semibold uppercase text-[var(--ep-muted)] mb-2">{t('k6CardWithHeader')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CardMockup
            title={t("yangiXodimlar")}
            action={<button className="text-xs text-[var(--ep-primary)]">{t("hammasiniKorish")}</button>}
          >
            <div className="space-y-3">
              {['Sardor Karimov', 'Aziz Mirzayev', 'Madina Ali'].map((name, i) => (
                <div key={i} className="flex items-center gap-3">
                  <AvatarMockup name={name} size="sm" color={i === 0 ? 'orange' : i === 1 ? 'blue' : 'purple'} />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{name}</div>
                    <div className="text-xs text-[var(--ep-muted)]">{t("k2KunOldinQoshildi")}</div>
                  </div>
                  <StatusPill variant="success">{t("active")}</StatusPill>
                </div>
              ))}
            </div>
          </CardMockup>

          <CardMockup title={t("bugungiSmena")}>
            <div className="space-y-2">
              <ScheduleCard
                tag="Ish"
                tagColor="orange"
                title={t("ofsetIshlabChiqarish")}
                time="08:00 - 17:00"
                location="Ofset sex"
                attendees={5}
              />
              <ScheduleCard
                tag="Mijoz"
                tagColor="blue"
                title={t("mijozUchrashuvi")}
                time="14:00 - 15:00"
                location="Konferens xona"
                attendees={3}
              />
            </div>
          </CardMockup>
        </div>
      </section>

      {/* Special Cards */}
      <section>
        <h2 className="text-sm font-semibold uppercase text-[var(--ep-muted)] mb-2">{t("k7SpecialGradientCards")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card-dark-grad">
            <div className="text-3xl font-bold">154</div>
            <div className="text-xs opacity-80 mt-1">{t("faolXodimlar1")}</div>
            <div className="text-xs mt-3 opacity-90">{t("europrintJamoasi")}</div>
          </div>
          <div className="card-yellow">
            <div className="text-3xl font-bold">8</div>
            <div className="text-xs opacity-80 mt-1">Yangi (30 kun)</div>
            <div className="text-xs mt-3">{t("onboardingDavomEtmoqda")}</div>
          </div>
          <div className="card-teal">
            <div className="text-3xl font-bold">12</div>
            <div className="text-xs opacity-80 mt-1">{t("vakantLavozim")}</div>
            <div className="text-xs mt-3 opacity-90">{t("recruitingFunnelniKoring")}</div>
          </div>
        </div>
      </section>

      {/* Performance highlight */}
      <section>
        <h2 className="text-sm font-semibold uppercase text-[var(--ep-muted)] mb-2">{t("k8PerformanceHighlight")}</h2>
        <div className="perf-highlight">
          <Clock className="h-5 w-5 text-[var(--ep-primary)]" />
          <div>
            <div className="font-semibold text-sm">{t("buOydaSamaradorlik")}</div>
            <div className="text-xs text-[var(--ep-muted)]">{t("k12OtganOygaNisbatan")}</div>
          </div>
          <div className="ml-auto text-2xl font-bold text-[var(--ep-primary)]">87%</div>
        </div>
      </section>

      {/* Pill buttons */}
      <section>
        <h2 className="text-sm font-semibold uppercase text-[var(--ep-muted)] mb-2">{t("k9PillButtons")}</h2>
        <div className="flex flex-wrap gap-2">
          <button className="pill-btn"><Calendar className="h-3 w-3" /> {t("today")}</button>
          <button className="pill-btn"><Calendar className="h-3 w-3" /> {t("hafta")}</button>
          <button className="pill-btn"><Calendar className="h-3 w-3" /> Oy</button>
          <button className="pill-btn">{t("hammasi")}</button>
        </div>
      </section>

      {/* Tabs */}
      <section>
        <h2 className="text-sm font-semibold uppercase text-[var(--ep-muted)] mb-2">{t('k10SubNavigation')}</h2>
        <div className="sub-nav">
          <button className="active">{t("umumiy")}</button>
          <button>{t("hujjatlar")}</button>
          <button>{t("tarix")}</button>
          <button>{t("settings")}</button>
        </div>
      </section>

      {/* Color palette */}
      <section>
        <h2 className="text-sm font-semibold uppercase text-[var(--ep-muted)] mb-2">{t("k11BrandColorPalette")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { name: 'Primary', value: '#FF902F', cssVar: 'var(--ep-primary)' },
            { name: 'Dark', value: '#1B2850', cssVar: 'var(--ep-dark)' },
            { name: 'Pink', value: '#FF6F91', cssVar: 'var(--ep-pink)' },
            { name: 'Purple', value: '#845EE6', cssVar: 'var(--ep-purple)' },
            { name: 'Cyan', value: '#28C9E8', cssVar: 'var(--ep-cyan)' },
            { name: 'Green', value: '#00C087', cssVar: 'var(--ep-green)' },
            { name: 'Yellow', value: '#FFC107', cssVar: 'var(--ep-yellow)' },
            { name: 'Red', value: '#FF5252', cssVar: 'var(--ep-red)' },
          ].map(c => (
            <div key={c.name} className="ep-card p-3 text-center">
              <div className="w-full h-12 rounded-md mb-2" style={{ background: c.cssVar }} />
              <div className="text-xs font-medium">{c.name}</div>
              <div className="text-[10px] text-[var(--ep-muted)]">{c.value}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
