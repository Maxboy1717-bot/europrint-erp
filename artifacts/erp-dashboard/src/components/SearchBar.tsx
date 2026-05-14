/**
 * @module SearchBar
 * @description React UI component.
 */

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useTranslation } from '@/lib/i18n';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function SearchBar({ placeholder, value, onChange, className }: SearchBarProps) {
  const { t } = useTranslation("common");
  const ph = placeholder ?? t("qidirish");
  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder={ph}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={`pl-10${className ? ` ${className}` : ""}`}
        data-testid="input-search"
      />
    </div>
  );
}
