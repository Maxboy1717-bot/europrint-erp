import { useState, useCallback, useEffect } from "react";
import uz from "./uz.json";
import ru from "./ru.json";

type Lang = "uz" | "ru";
type DeepRecord = { [key: string]: string | DeepRecord };

const TRANSLATIONS: Record<Lang, DeepRecord> = { uz, ru };

function getNestedValue(obj: DeepRecord, path: string): string {
  const parts = path.split(".");
  let current: string | DeepRecord = obj;
  for (const part of parts) {
    if (typeof current !== "object" || current === null) return path;
    current = (current as DeepRecord)[part];
    if (current === undefined) return path;
  }
  return typeof current === "string" ? current : path;
}

let _lang: Lang = "uz";
const _listeners: Set<() => void> = new Set();

export function setGlobalLang(lang: Lang): void {
  _lang = lang;
  try { localStorage.setItem("pos_lang", lang); } catch { /* noop */ }
  _listeners.forEach(fn => fn());
}

export function getGlobalLang(): Lang {
  try {
    const stored = localStorage.getItem("pos_lang") as Lang;
    if (stored === "uz" || stored === "ru") { _lang = stored; }
  } catch { /* noop */ }
  return _lang;
}

export function usePosI18n() {
  const [lang, setLang] = useState<Lang>(getGlobalLang);

  useEffect(() => {
    const sync = () => setLang(_lang);
    _listeners.add(sync);
    return () => { _listeners.delete(sync); };
  }, []);

  const toggleLang = useCallback(() => {
    const next: Lang = lang === "uz" ? "ru" : "uz";
    setGlobalLang(next);
  }, [lang]);

  const t = useCallback((key: string, vars?: Record<string, string | number>): string => {
    let val = getNestedValue(TRANSLATIONS[lang] as DeepRecord, key);
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        val = val.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      });
    }
    return val;
  }, [lang]);

  return { t, lang, toggleLang };
}
