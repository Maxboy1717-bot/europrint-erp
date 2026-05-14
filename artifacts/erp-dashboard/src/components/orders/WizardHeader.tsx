/**
 * @module WizardHeader
 * @description React UI component.
 */

import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { Language, Translation } from "./types";
import { useTranslation } from '@/lib/i18n';

interface WizardHeaderProps {
  t: Translation;
  lang: Language;
  setLang: (lang: Language) => void;
  onSaveDraft: () => void;
}

export function WizardHeader({ t, lang, setLang, onSaveDraft }: WizardHeaderProps) {
  const { t } = useTranslation("common");
  const [titleFirst, ...titleRest] = t.title.split(' ');
  
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
      <div>
        <h1 className="ep-h1 text-foreground">
          {titleFirst} <span className="font-bold text-primary">{titleRest.join(' ')}</span>
        </h1>
        <p className="text-muted-foreground mt-1">{t("sotuvVaIshlabChiqarishYangi")}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex bg-muted/40 p-1 rounded-lg border border-border/30">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLang("uz")} 
            className={`rounded-md px-3 ${lang === "uz" ? "bg-primary text-white" : "text-muted-foreground"}`} 
            data-testid="button-lang-uz"
          >
            UZ
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLang("ru")} 
            className={`rounded-md px-3 ${lang === "ru" ? "bg-primary text-white" : "text-muted-foreground"}`} 
            data-testid="button-lang-ru"
          >
            RU
          </Button>
        </div>
        <Button variant="outline" onClick={onSaveDraft} className="rounded-lg border-border text-foreground gap-2">
          <Save className="h-4 w-4" />
          {t.saveDraft}
        </Button>
      </div>
    </div>
  );
}
