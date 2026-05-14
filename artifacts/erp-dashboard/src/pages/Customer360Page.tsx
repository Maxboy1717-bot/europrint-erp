/**
 * Customer 360 sahifasi — /crm/customer/:id
 */
import { useRoute } from "wouter";
import { CustomerCard } from "@/components/crm/CustomerCard";
import { Card } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function Customer360Page() {
  const [, params] = useRoute("/crm/customer/:id");
  const customerId = params?.id ? parseInt(params.id, 10) : null;

  if (!customerId || isNaN(customerId)) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Card className="p-12 text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-[var(--ep-yellow)]" />
          <p className="text-muted-foreground">Mijoz ID noto'g'ri</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <CustomerCard customerId={customerId} />
    </div>
  );
}
