/**
 * @module MarketingSocialInboxHelpers
 * @description Small, stateless UI helper components for MarketingSocialInbox.
 */

import { Badge } from "@/components/ui/badge";
import { platformConfig } from "./MarketingSocialInboxTypes";

export function PlatformIcon({ platform, className }: { platform: string; className?: string }) {
  const config = platformConfig[platform] || platformConfig.telegram;
  const Icon = config.icon;
  return <Icon className={className || "h-4 w-4"} />;
}

export function PlatformBadge({ platform }: { platform: string }) {
  const config = platformConfig[platform] || platformConfig.telegram;
  return (
    <Badge variant="secondary" className={config.color} data-testid={`badge-platform-${platform}`}>
      <PlatformIcon platform={platform} className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}
