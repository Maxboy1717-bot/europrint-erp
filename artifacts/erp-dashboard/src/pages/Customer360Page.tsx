/**
 * Customer 360 sahifasi — /crm/customer/:id va /sd/customers/:id
 */
import { useRoute, useLocation } from "wouter";
import { Customer360View } from "@/components/sd/Customer360View";
import { Card } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from '@/lib/i18n';

export default function Customer360Page() {
  const { t } = useTranslation("common");
  const [, crmParams] = useRoute("/crm/customer/:id");
  const [, sdParams] = useRoute("/sd/customers/:id");
  const [, setLocation] = useLocation();
  const rawId = crmParams?.id ?? sdParams?.id;
  const customerId = rawId ? parseInt(rawId, 10) : null;

  if (!customerId || isNaN(customerId)) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Card className="p-12 text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-[var(--ep-yellow)]" />
          <p className="text-muted-foreground">{t("mijozIdNotogri")}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Customer360View customerId={customerId} onBack={() => setLocation("/sd/customers")} />
    </div>
  );
}
