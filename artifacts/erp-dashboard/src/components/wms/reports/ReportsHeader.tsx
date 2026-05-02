import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Lang, TranslationType } from "./types";

interface ReportsHeaderProps {
  t: TranslationType;
  lang: Lang;
  setLang: (lang: Lang) => void;
  onExport: () => void;
}

export function ReportsHeader({ t, lang, setLang, onExport }: ReportsHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-muted-foreground text-sm">{t.subtitle}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-muted/50 rounded-md p-1">
          <Button
            size="sm"
            variant={lang === "uz" ? "default" : "ghost"}
            onClick={() => setLang("uz")}
            data-testid="button-lang-uz"
          >
            UZ
          </Button>
          <Button
            size="sm"
            variant={lang === "ru" ? "default" : "ghost"}
            onClick={() => setLang("ru")}
            data-testid="button-lang-ru"
          >
            RU
          </Button>
        </div>
        <Button onClick={onExport} variant="outline" data-testid="button-export">
          <Download className="w-4 h-4 mr-2" />
          {t.common.export}
        </Button>
      </div>
    </div>
  );
}
