/**
 * HR (tz11) sidebar i18n: maps each HR menu item to a flat translation key
 * registered in locales/{uz,ru}/navigation.json.
 *
 * Phase 3, Task T3.3: wires HR sidebar items through `t()` so titles render
 * in the active language. Other modules still ship hardcoded UZ titles; they
 * will be migrated incrementally in later phases.
 *
 * Key naming: flat `hr*` keys (e.g. "hrDashboard", "hrSectionRecruiting"). The
 * project's i18n loader does not support nested key paths, hence the flat form.
 */
import type { MenuGroup, MenuItem } from "./types";

/**
 * Section separator UZ title -> flat i18n key.
 * Separators have empty url, so we key by their UZ title.
 */
export const HR_NAV_SECTION_KEYS: Record<string, string> = {
  "TASHKILOT":        "hrSectionOrganization",
  "REKRUTING":        "hrSectionRecruiting",
  "360° PROFIL":      "hrSectionProfile",
  "DAVOMAT VA SMENA": "hrSectionAttendance",
  "MAOSH":            "hrSectionPayroll",
  "BAHOLASH":         "hrSectionEvaluation",
  "ONBOARDING":       "hrSectionOnboarding",
  "OFFBOARDING":      "hrSectionOffboarding",
  "NAZORAT":          "hrSectionControl",
  "HR V2 TIZIMI":     "hrSectionHrV2",
  "YANGI TIZIMLAR":   "hrSectionNewSystems",
  "HR BREND":         "hrSectionHrBrand",
  "HAFTALIK REJA":    "hrSectionWeeklyPlan",
};

/**
 * Navigation url -> flat i18n key.
 */
export const HR_NAV_URL_KEYS: Record<string, string> = {
  "hr-dashboard":                "hrDashboard",
  "departments":                 "hrDepartments",
  "positions":                   "hrPositions",
  "org-chart":                   "hrOrgChart",
  "org-structure/hierarchy":     "hrOrgStructure",
  "seven-functions":             "hrSevenFunctions",
  "raci-matrix":                 "hrRaciMatrix",
  "hr-map":                      "hrMap",
  "hr/recruiting":               "hrRecruitingFunnel",
  "ai-hr/interviews":            "hrAiInterview",
  "employees":                   "hrEmployees",
  "adaptation":                  "hrAdaptation",
  "ai-hr/dashboard":             "hrAiDashboard",
  "goals":                       "hrGoals",
  "shift-schedule":              "hrShiftSchedule",
  "questionnaire":               "hrQuestionnaire",
  "questionnaire-templates":     "hrQuestionnaireTemplates",
  "settings/notifications":      "hrNotifications",
  "assets":                      "hrAssets",
  "hr/vacation-sick":            "hrVacationSick",
  "discipline":                  "hrDiscipline",
  "integration/employee-rating": "hrEmployeeRating",
  "skills-matrix":               "hrSkillsMatrix",
  "mentorship":                  "hrMentorship",
  "hr/succession":               "hrSuccession",
  "hr/onboarding":               "hrOnboarding",
  "hr/offboarding":              "hrOffboarding",
  "hr/alumni":                   "hrAlumni",
  "hr/health-monitoring":        "hrHealthMonitoring",
  "hr/conflict":                 "hrConflict",
  "hr/career-path":              "hrCareerPath",
  "hr/safety":                   "hrSafety",
  "hr/documents":                "hrDocuments",
  "hr/gamification":             "hrGamification",
  "hr/daily-reports":            "hrDailyReports",
  "hr/pip":                      "hrPip",
  "hr/enps":                     "hrEnps",
  "hr/reception":                "hrReception",
  "hr/peer-review":              "hrPeerReview",
  "hr/referrals":                "hrReferrals",
  "hr/milestones":               "hrMilestones",
  "hr/birthdays":                "hrBirthdays",
  "hr/brand":                    "hrBrand",
  "weekly-plan":                 "hrWeeklyPlan",
};

/**
 * Look up a translation; if the i18n loader returns the key itself (missing
 * translation), fall back to the provided UZ string so legacy items keep
 * working until the full sidebar migration lands.
 */
export function translateOrFallback(
  t: (key: string) => string,
  key: string,
  fallback: string
): string {
  const value = t(key);
  return value === key ? fallback : value;
}

function translateHrItem(t: (key: string) => string, item: MenuItem): MenuItem {
  if (item.separator) {
    const key = HR_NAV_SECTION_KEYS[item.title];
    if (!key) return item;
    return { ...item, title: translateOrFallback(t, key, item.title) };
  }
  const key = HR_NAV_URL_KEYS[item.url];
  if (!key) return item;
  // url "discipline" appears twice with different titles ("Intizom" and
  // "Intizom V2"); disambiguate by checking the original UZ title.
  const resolvedKey = item.title === "Intizom V2" ? "hrDisciplineV2" : key;
  return { ...item, title: translateOrFallback(t, resolvedKey, item.title) };
}

/**
 * Returns a copy of the HR module (tz11) with all visible labels translated.
 */
export function translateHrModule(
  t: (key: string) => string,
  hrModule: MenuGroup
): MenuGroup {
  return {
    ...hrModule,
    title: translateOrFallback(t, "hrModuleTitle", hrModule.title),
    items: (Array.isArray(hrModule.items) ? hrModule.items : []).map((item) =>
      translateHrItem(t, item)
    ),
  };
}
