/**
 * @module CRMActivitiesSections.test
 * @description Overdue-badge behavior for PendingActivitiesSection —
 *   VISION-3340 #30: activities whose scheduledAt is in the past and are
 *   not completed must render a red overdue badge; future / completed
 *   activities must not.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { UseMutationResult } from '@tanstack/react-query';
import { TestProviders } from '@/test/TestProviders';
import { PendingActivitiesSection } from '../CRMActivitiesSections';
import type { Activity } from '../CRMActivitiesTypes';

function makeMutation(): UseMutationResult<unknown, unknown, number> {
  return { isPending: false, mutate: vi.fn() } as unknown as UseMutationResult<
    unknown,
    unknown,
    number
  >;
}

const baseActivity: Activity = {
  id: 1,
  type: 'call',
  subject: 'Mijozga qo\'ng\'iroq',
  description: null,
  status: 'pending',
  priority: 'medium',
  dealId: null,
  contactId: null,
  companyId: null,
  assignedById: null,
  scheduledAt: null,
  completedAt: null,
  createdAt: new Date().toISOString(),
};

const PAST = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // yesterday
const FUTURE = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // tomorrow

describe('PendingActivitiesSection overdue badge', () => {
  it('renders a red overdue badge for a pending activity whose scheduledAt is in the past', () => {
    const activities: Activity[] = [
      { ...baseActivity, id: 101, status: 'pending', scheduledAt: PAST },
    ];
    render(
      <PendingActivitiesSection
        pendingActivities={activities}
        completeActivityMutation={makeMutation()}
        cancelActivityMutation={makeMutation()}
        t={(key) => key}
      />,
      { wrapper: TestProviders },
    );
    expect(screen.getByTestId('badge-overdue-101')).toBeTruthy();
  });

  it('does not render an overdue badge for a pending activity scheduled in the future', () => {
    const activities: Activity[] = [
      { ...baseActivity, id: 102, status: 'pending', scheduledAt: FUTURE },
    ];
    render(
      <PendingActivitiesSection
        pendingActivities={activities}
        completeActivityMutation={makeMutation()}
        cancelActivityMutation={makeMutation()}
        t={(key) => key}
      />,
      { wrapper: TestProviders },
    );
    expect(screen.queryByTestId('badge-overdue-102')).toBeNull();
  });

  it('does not render an overdue badge for a completed activity with a past scheduledAt', () => {
    const activities: Activity[] = [
      { ...baseActivity, id: 103, status: 'completed', scheduledAt: PAST },
    ];
    render(
      <PendingActivitiesSection
        pendingActivities={activities}
        completeActivityMutation={makeMutation()}
        cancelActivityMutation={makeMutation()}
        t={(key) => key}
      />,
      { wrapper: TestProviders },
    );
    expect(screen.queryByTestId('badge-overdue-103')).toBeNull();
  });

  it('does not render an overdue badge when scheduledAt is missing', () => {
    const activities: Activity[] = [
      { ...baseActivity, id: 104, status: 'pending', scheduledAt: null },
    ];
    render(
      <PendingActivitiesSection
        pendingActivities={activities}
        completeActivityMutation={makeMutation()}
        cancelActivityMutation={makeMutation()}
        t={(key) => key}
      />,
      { wrapper: TestProviders },
    );
    expect(screen.queryByTestId('badge-overdue-104')).toBeNull();
  });
});
