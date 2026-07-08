/**
 * @module DetailSheetTabs.test
 * @description Overdue-badge behavior for HistoryTab — VISION-3340 #30:
 *   activities whose dueDate is in the past and are not done must render a
 *   red overdue badge; future / done activities must not.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TestProviders } from '@/test/TestProviders';
import { Tabs } from '@/components/ui/tabs';
import { HistoryTab } from './DetailSheetTabs';
import type { CrmActivity } from './DetailSheetTypes';

const PAST = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // yesterday
const FUTURE = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // tomorrow

// HistoryTab renders <TabsContent value="tarix">, which requires an ancestor
// <Tabs> for Radix's context — production code (DetailSheet.tsx) always
// renders it inside one, so the test must too.
function renderHistoryTab(activities: CrmActivity[]) {
  return render(
    <Tabs defaultValue="tarix">
      <HistoryTab activities={activities} historyData={[]} />
    </Tabs>,
    { wrapper: TestProviders },
  );
}

describe('HistoryTab overdue badge', () => {
  it('renders a red overdue badge for a not-done activity whose dueDate is in the past', () => {
    const activities: CrmActivity[] = [
      { id: 201, subject: 'Shartnoma yuborish', type: 'task', isDone: false, dueDate: PAST },
    ];
    renderHistoryTab(activities);
    expect(screen.getByTestId('badge-overdue-201')).toBeTruthy();
  });

  it('does not render an overdue badge for a not-done activity due in the future', () => {
    const activities: CrmActivity[] = [
      { id: 202, subject: 'Uchrashuv', type: 'meeting', isDone: false, dueDate: FUTURE },
    ];
    renderHistoryTab(activities);
    expect(screen.queryByTestId('badge-overdue-202')).toBeNull();
  });

  it('does not render an overdue badge for a done activity with a past dueDate', () => {
    const activities: CrmActivity[] = [
      { id: 203, subject: 'Qongiroq', type: 'call', isDone: true, dueDate: PAST },
    ];
    renderHistoryTab(activities);
    expect(screen.queryByTestId('badge-overdue-203')).toBeNull();
  });

  it('does not render an overdue badge when dueDate is missing', () => {
    const activities: CrmActivity[] = [
      { id: 204, subject: 'Email', type: 'email', isDone: false, dueDate: null },
    ];
    renderHistoryTab(activities);
    expect(screen.queryByTestId('badge-overdue-204')).toBeNull();
  });
});
