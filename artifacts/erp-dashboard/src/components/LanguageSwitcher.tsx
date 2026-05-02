import { useLanguageSetter } from '@/lib/i18n';
import type { Language } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe, Check } from 'lucide-react';

const languages: { code: Language; label: string; shortCode: string }[] = [
  { code: 'uz', label: "O'zbekcha", shortCode: 'UZ' },
  { code: 'ru', label: 'Русский', shortCode: 'RU' },
];

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguageSetter();

  const currentLanguage = (languages ?? []).find((l) => l.code === language) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-2 px-2"
          data-testid="button-language-switcher"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLanguage.shortCode}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {(Array.isArray(languages) ? languages : []).map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className="gap-2 cursor-pointer"
            data-testid={`menu-item-language-${lang.code}`}
          >
            <span className="w-6 text-center font-medium text-muted-foreground">{lang.shortCode}</span>
            <span>{lang.label}</span>
            {language === lang.code && (
              <Check className="ml-auto h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
