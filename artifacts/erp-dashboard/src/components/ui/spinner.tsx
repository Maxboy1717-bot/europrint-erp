/**
 * @module spinner
 * @description React UI component.
 */

import { Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"

import { useTranslation } from '@/lib/i18n';
function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  const { t } = useTranslation('common');
  return (
    <Loader2Icon
      role="status"
      aria-label={t('loading1')}
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export { Spinner }
