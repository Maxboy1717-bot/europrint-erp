/**
 * @module AnalyticsTypes
 * @description Shared types and constants for the Analytics page.
 */

export interface AnalyticsKpiItem {
  label: string;
  value: string | number;
  desc: string;
  accent: string;
  testId: string;
}

export const ANALYTICS_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  'hsl(var(--muted))',
];
