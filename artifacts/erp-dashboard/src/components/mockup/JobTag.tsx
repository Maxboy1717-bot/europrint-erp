/**
 * @module JobTag
 * @description React UI component.
 */

import type { ReactNode } from "react";

type JobTagVariant = 'dark' | 'blue' | 'pink' | 'purple' | 'green' | 'orange';

export function JobTag({
  variant = 'orange',
  children,
}: {
  variant?: JobTagVariant;
  children: ReactNode;
}) {
  return <span className={`job-tag jt-${variant}`}>{children}</span>;
}
