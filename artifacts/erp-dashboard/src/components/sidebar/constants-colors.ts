/** @module constants-colors @description Module colour maps (background, text, active, border, accent) and permission key mapping for all sidebar modules. */

export const moduleColors: Record<string, { bg: string; text: string; activeBg: string; border: string }> = {
  tz01: { bg: "bg-blue-500/10 hover:bg-[var(--ep-blue)]/90/20",     text: "text-[var(--ep-blue)] dark:text-blue-400",     activeBg: "bg-[var(--ep-blue)] text-white",    border: "border-blue-500/30" },
  tz02: { bg: "bg-orange-500/10 hover:bg-[var(--ep-primary)]/90/20", text: "text-[var(--ep-primary)] dark:text-orange-400", activeBg: "bg-[var(--ep-primary)] text-white",  border: "border-orange-500/30" },
  tz03: { bg: "bg-pink-500/10 hover:bg-pink-500/20",     text: "text-pink-600 dark:text-pink-400",     activeBg: "bg-pink-500 text-white",    border: "border-pink-500/30" },
  tz04: { bg: "bg-teal-500/10 hover:bg-[var(--ep-cyan)]/90/20",     text: "text-[var(--ep-cyan)] dark:text-teal-400",     activeBg: "bg-[var(--ep-cyan)] text-white",    border: "border-teal-500/30" },
  tz05: { bg: "bg-lime-500/10 hover:bg-[var(--ep-green)]/90/20",     text: "text-[var(--ep-green)] dark:text-lime-400",     activeBg: "bg-[var(--ep-green)] text-white",    border: "border-lime-500/30" },
  tz06: { bg: "bg-amber-500/10 hover:bg-[var(--ep-yellow)]/90/20",   text: "text-[var(--ep-yellow)] dark:text-amber-400",   activeBg: "bg-[var(--ep-yellow)] text-white",   border: "border-amber-500/30" },
  tz07: { bg: "bg-purple-500/10 hover:bg-[var(--ep-purple)]/90/20", text: "text-[var(--ep-purple)] dark:text-purple-400", activeBg: "bg-[var(--ep-purple)] text-white",  border: "border-purple-500/30" },
  tz08: { bg: "bg-emerald-500/10 hover:bg-[var(--ep-green)]/90/20", text: "text-[var(--ep-green)] dark:text-emerald-400", activeBg: "bg-[var(--ep-green)] text-white", border: "border-emerald-500/30" },
  tz09: { bg: "bg-green-500/10 hover:bg-[var(--ep-green)]/90/20",   text: "text-[var(--ep-green)] dark:text-green-400",   activeBg: "bg-[var(--ep-green)] text-white",   border: "border-green-500/30" },
  tz10: { bg: "bg-indigo-500/10 hover:bg-[var(--ep-blue)]/90/20", text: "text-[var(--ep-blue)] dark:text-indigo-400", activeBg: "bg-[var(--ep-blue)] text-white",  border: "border-indigo-500/30" },
  tz11: { bg: "bg-rose-500/10 hover:bg-[var(--ep-red)]/90/20",     text: "text-[var(--ep-red)] dark:text-rose-400",     activeBg: "bg-[var(--ep-red)] text-white",    border: "border-rose-500/30" },
  tz12: { bg: "bg-violet-500/10 hover:bg-[var(--ep-purple)]/90/20", text: "text-[var(--ep-purple)] dark:text-violet-400", activeBg: "bg-[var(--ep-purple)] text-white",  border: "border-violet-500/30" },
  tz13: { bg: "bg-red-500/10 hover:bg-[var(--ep-red)]/90/20",       text: "text-[var(--ep-red)] dark:text-red-400",       activeBg: "bg-[var(--ep-red)] text-white",     border: "border-red-500/30" },
  tz14: { bg: "bg-stone-500/10 hover:bg-stone-500/20",   text: "text-stone-600 dark:text-stone-400",   activeBg: "bg-stone-500 text-white",   border: "border-stone-500/30" },
  tz15: { bg: "bg-cyan-500/10 hover:bg-[var(--ep-cyan)]/90/20",     text: "text-[var(--ep-cyan)] dark:text-cyan-400",     activeBg: "bg-[var(--ep-cyan)] text-white",    border: "border-cyan-500/30" },
  tz16: { bg: "bg-yellow-500/10 hover:bg-[var(--ep-yellow)]/90/20", text: "text-[var(--ep-yellow)] dark:text-yellow-400", activeBg: "bg-[var(--ep-yellow)] text-white",  border: "border-yellow-500/30" },
  tz17: { bg: "bg-slate-500/10 hover:bg-slate-500/20",   text: "text-slate-600 dark:text-slate-400",   activeBg: "bg-slate-600 text-white",   border: "border-slate-500/30" },
  kanban:      { bg: "bg-fuchsia-500/10 hover:bg-[var(--ep-purple)]/90/20", text: "text-[var(--ep-purple)] dark:text-fuchsia-400", activeBg: "bg-[var(--ep-purple)] text-white", border: "border-fuchsia-500/30" },
  coordination: { bg: "bg-sky-500/10 hover:bg-[var(--ep-blue)]/90/20",   text: "text-[var(--ep-blue)] dark:text-sky-400",   activeBg: "bg-[var(--ep-blue)] text-white",  border: "border-sky-500/30" },
  chat:        { bg: "bg-blue-500/10 hover:bg-[var(--ep-blue)]/90/20",  text: "text-[var(--ep-blue)] dark:text-blue-400",  activeBg: "bg-[var(--ep-blue)] text-white", border: "border-blue-500/30" },
  hidden:      { bg: "bg-gray-500/10 hover:bg-gray-500/20",            text: "text-gray-600 dark:text-gray-400",          activeBg: "bg-gray-600 text-white",         border: "border-gray-500/30" },
};

export const MODULE_PERMISSION_KEYS: Record<string, string> = {
  tz01: "CRM",
  tz02: "MARKETING",
  tz03: "DESIGN",
  tz04: "QC",
  tz05: "PRODUCTION",
  tz06: "PRODUCTION",
  tz07: "PRODUCTION",
  tz08: "WAREHOUSE",
  tz09: "LOGISTICS",
  tz10: "FINANCE",
  tz11: "HR",
  tz12: "LMS",
  tz13: "SECURITY",
  tz14: "MRO",
  tz15: "IOT",
  tz16: "REPORTS",
  tz17: "USERS",
  kanban:       "OKR",
  coordination: "DIRECTOR",
  chat:         "CHAT",
  // 'hidden' module is admin-only — kept out of permission map so only admins see it.
};

export const moduleAccentColors: Record<string, string> = {
  tz01: "bg-blue-700",    tz02: "bg-orange-600",  tz03: "bg-pink-600",
  tz04: "bg-teal-600",    tz05: "bg-lime-600",    tz06: "bg-amber-600",
  tz07: "bg-purple-700",  tz08: "bg-emerald-600", tz09: "bg-green-600",
  tz10: "bg-indigo-700",  tz11: "bg-rose-600",    tz12: "bg-violet-700",
  tz13: "bg-red-600",     tz14: "bg-stone-600",   tz15: "bg-cyan-600",
  tz16: "bg-yellow-600",  tz17: "bg-slate-600",   kanban: "bg-fuchsia-700",
  coordination: "bg-sky-600", chat: "bg-blue-600", hidden: "bg-gray-600",
};
