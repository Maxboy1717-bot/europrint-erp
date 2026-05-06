import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePermission } from "@/hooks/usePermission";
import type { Permission } from "@/lib/permissions";

/**
 * PermissionButton — ruxsat (permission) bilan birlashtirilgan tugma.
 *
 * Foydalanish:
 *   <PermissionButton permission="employee.delete" onClick={...}>
 *     O'chirish
 *   </PermissionButton>
 *
 * - Foydalanuvchida ruxsat bo'lmasa: tugma `disabled`, hover'da Tooltip ko'rsatadi.
 * - Tooltip+disabled birga ishlaydi (pointer-events:none ni hal qiladi).
 * - "Ruxsat yo'q" o'rniga maxsus matn berishingiz mumkin: `tooltipText` prop.
 *
 * Audit #12: Permission'larda Tooltip + disabled birga bo'lishi shart.
 */
export interface PermissionButtonProps extends ButtonProps {
  /** Talab qilinadigan ruxsat (yoki ruxsatlar massivi — birortasi yetarli) */
  permission?: Permission | Permission[];
  /** Barcha ruxsatlar talab qilinishi (default: birortasi) */
  requireAll?: boolean;
  /** Ruxsat yo'q bo'lganida ko'rsatiladigan matn */
  tooltipText?: string;
  /** Qo'shimcha disabled holat (permission'dan tashqari) */
  disabled?: boolean;
  /** Disabled bo'lgan paytda ham tooltip ko'rsatish (default: true) */
  showTooltipWhenDisabled?: boolean;
  /** Disabled bo'lgan boshqa sabab uchun tooltip matn */
  disabledReason?: string;
}

export const PermissionButton = React.forwardRef<
  HTMLButtonElement,
  PermissionButtonProps
>(function PermissionButton(
  {
    permission,
    requireAll = false,
    tooltipText,
    disabled,
    showTooltipWhenDisabled = true,
    disabledReason,
    children,
    ...rest
  },
  ref,
) {
  const { can, canAny, canAll } = usePermission();

  const hasAccess = React.useMemo(() => {
    if (!permission) return true;
    if (Array.isArray(permission)) {
      return requireAll ? canAll(permission) : canAny(permission);
    }
    return can(permission);
  }, [permission, requireAll, can, canAny, canAll]);

  const isDisabled = disabled || !hasAccess;
  const tooltipMessage = !hasAccess
    ? tooltipText ?? "Ushbu amalni bajarish uchun sizda ruxsat yo'q"
    : disabledReason;

  // Tooltip kerak emas bo'lsa — oddiy tugma qaytaramiz
  if (!isDisabled || !tooltipMessage || !showTooltipWhenDisabled) {
    return (
      <Button ref={ref} disabled={isDisabled} {...rest}>
        {children}
      </Button>
    );
  }

  // Disabled tugmaning hover/pointer eventlarini qo'lga kiritish uchun
  // wrapper span ishlatamiz (Radix Tooltip + disabled muammosini hal qiladi).
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex" tabIndex={0} aria-disabled="true">
            <Button
              ref={ref}
              disabled
              {...rest}
              className={`${rest.className ?? ""} cursor-not-allowed`.trim()}
              style={{
                ...(rest.style ?? {}),
                pointerEvents: "none",
              }}
            >
              {children}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" align="center">
          {tooltipMessage}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

PermissionButton.displayName = "PermissionButton";
