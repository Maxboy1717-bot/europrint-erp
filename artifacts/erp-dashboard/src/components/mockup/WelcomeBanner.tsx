/**
 * WelcomeBanner — SmartHR mockup style.
 *
 * Foydalanish:
 *   <WelcomeBanner userName="Sardor" tasksToday={5} />
 */
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from '@/lib/i18n';

export function WelcomeBanner({
  userName,
  tasksToday,
}: {
  userName?: string;
  tasksToday?: number;
}) {
  const { t } = useTranslation("common");
  const { user } = useAuth();
  const displayName = userName ?? user?.fullName ?? user?.username ?? "Foydalanuvchi";
  const initials = displayName
    .split(/\s+/)
    .map((s: string) => s[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Xayrli tong";
    if (h < 18) return "Xayrli kun";
    return "Xayrli oqshom";
  })();

  return (
    <div className="welcome-banner">
      <div className="flex items-center gap-3.5">
        <div className="wba">{initials || "?"}</div>
        <div>
          <h5 className="m-0 font-semibold flex items-center gap-1.5">
            {greeting}, {displayName.split(" ")[0]}! 👋
          </h5>
          <div className="text-xs text-muted-foreground mt-0.5">
            {tasksToday !== undefined && tasksToday > 0 ? (
              <>
                {t("bugunSizda")}<strong className="text-[hsl(var(--primary))] underline">{tasksToday} ta vazifa</strong> bor
              </>
            ) : (
              "Bugun sizga muvaffaqiyatlar tilaymiz"
            )}
          </div>
        </div>
      </div>
      <button className="px-4 py-2 rounded-lg bg-[hsl(var(--primary))] text-white text-sm font-medium hover:opacity-90">
        {t("yangiVazifa")}
      </button>
    </div>
  );
}
