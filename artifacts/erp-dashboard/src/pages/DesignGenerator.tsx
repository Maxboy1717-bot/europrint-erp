/**
 * @module DesignGenerator
 * @description React page component. Route-level UI.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import AIDesignGenerator from "./AIDesignGenerator";
import { useTranslation } from '@/lib/i18n';

export default function DesignGenerator() {
  const { t } = useTranslation("common");
  const [refreshKey, setRefreshKey] = useState(0);
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setRefreshKey(k => k + 1)}
        className="sr-only"
        aria-label={t("refresh")}
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
      <AIDesignGenerator key={refreshKey} />
    </>
  );
}
