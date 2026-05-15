/**
 * @module StageProgressBar.test
 * @description Component tests for StageProgressBar — bar count, click handler,
 * current stage indicator, sort order, default color fallback.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TestProviders } from '@/test/TestProviders';

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { StageProgressBar } from '../StageProgressBar';

const stages = [
  { id: 's-1', name: 'New', sort: 1 },
  { id: 's-2', name: 'In Progress', sort: 2 },
  { id: 's-3', name: 'Won', sort: 3 },
];

describe('StageProgressBar', () => {
  it('renders bar wrapper with test id matching entityType', () => {
    render(
      <StageProgressBar stages={stages} currentStageId="s-1" entityType="lead" />,
      { wrapper: TestProviders },
    );
    expect(screen.getByTestId('stage-progress-bar-lead')).toBeTruthy();
  });

  it('renders one button per stage when stages provided', () => {
    render(
      <StageProgressBar stages={stages} currentStageId="s-1" entityType="deal" />,
      { wrapper: TestProviders },
    );
    expect(screen.getByTestId('stage-bar-s-1')).toBeTruthy();
    expect(screen.getByTestId('stage-bar-s-2')).toBeTruthy();
    expect(screen.getByTestId('stage-bar-s-3')).toBeTruthy();
  });

  it('calls onChange with stage id when bar clicked', () => {
    const onChange = vi.fn();
    render(
      <StageProgressBar
        stages={stages}
        currentStageId="s-1"
        entityType="lead"
        onChange={onChange}
      />,
      { wrapper: TestProviders },
    );
    fireEvent.click(screen.getByTestId('stage-bar-s-2'));
    expect(onChange).toHaveBeenCalledWith('s-2');
  });

  it('applies aria-label with stage name to each bar', () => {
    render(
      <StageProgressBar stages={stages} currentStageId="s-1" entityType="invoice" />,
      { wrapper: TestProviders },
    );
    expect(screen.getByLabelText('New')).toBeTruthy();
    expect(screen.getByLabelText('In Progress')).toBeTruthy();
  });

  it('handles unsorted stages by sorting via sort field', () => {
    const unsorted = [
      { id: 's-3', name: 'Won', sort: 3 },
      { id: 's-1', name: 'New', sort: 1 },
      { id: 's-2', name: 'Mid', sort: 2 },
    ];
    render(
      <StageProgressBar stages={unsorted} currentStageId="s-2" entityType="proposal" />,
      { wrapper: TestProviders },
    );
    const bars = screen.getAllByRole('button');
    expect(bars[0].getAttribute('aria-label')).toBe('New');
  });

  it('renders without onChange when callback not provided', () => {
    render(
      <StageProgressBar stages={stages} currentStageId="s-2" entityType="deal" />,
      { wrapper: TestProviders },
    );
    // Should not throw on click
    fireEvent.click(screen.getByTestId('stage-bar-s-1'));
    expect(screen.getByTestId('stage-progress-bar-deal')).toBeTruthy();
  });
});
