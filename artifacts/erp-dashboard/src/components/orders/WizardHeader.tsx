import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { Language, Translation } from "./types";

interface WizardHeaderProps {
  t: Translation;
  lang: Language;
  setLang: (lang: Language) => void;
  onSaveDraft: () => void;
}

export function WizardHeader({ t, lang, setLang, onSaveDraft }: WizardHeaderProps) {
  const [titleFirst, ...titleRest] = t.title.split(' ');
  
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant pb-6">
      <div>
        <h1 className="text-4xl font-light tracking-tight text-on-surface">
          {titleFirst} <span className="font-bold text-primary">{titleRest.join(' ')}</span>
        </h1>
        <p className="text-on-surface-variant mt-1">Sotuv va ishlab chiqarish - yangi buyurtma yaratish ustasi</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex bg-surface-container-low p-1 rounded-lg border border-outline-variant/30">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLang("uz")} 
            className={`rounded-md px-3 ${lang === "uz" ? "bg-primary text-white" : "text-on-surface-variant"}`} 
            data-testid="button-lang-uz"
          >
            UZ
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLang("ru")} 
            className={`rounded-md px-3 ${lang === "ru" ? "bg-primary text-white" : "text-on-surface-variant"}`} 
            data-testid="button-lang-ru"
          >
            RU
          </Button>
        </div>
        <Button variant="outline" onClick={onSaveDraft} className="rounded-lg border-outline-variant text-on-surface">
          <Save className="h-4 w-4 mr-2" />
          {t.saveDraft}
        </Button>
      </div>
    </div>
  );
}
