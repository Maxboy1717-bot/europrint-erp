/**
 * @module DealCard.test
 * @description Component tests for DealCard — title, id badge, opportunity
 * amount, contact info, onClick, dragging suppresses click.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TestProviders } from '@/test/TestProviders';

vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: () => undefined,
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}));

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

import { DealCard } from '../DealCard';

const baseDeal = {
  id: 42,
  title: 'Big paper order',
  stageId: 'in_progress',
  opportunity: '1500000',
  currencyId: 'UZS',
  contactId: 7,
  companyId: 3,
  assignedById: 'u-2',
  dateCreate: '2025-05-01T10:00:00Z',
  dateModify: '2025-05-02T10:00:00Z',
};

describe('DealCard', () => {
  it('renders deal title when prop provided', () => {
    render(<DealCard deal={baseDeal} />, { wrapper: TestProviders });
    expect(screen.getByText('Big paper order')).toBeTruthy();
  });

  it('renders id badge when prop provided', () => {
    render(<DealCard deal={baseDeal} />, { wrapper: TestProviders });
    expect(screen.getByText('#42')).toBeTruthy();
  });

  it('renders opportunity amount with currency when provided', () => {
    render(<DealCard deal={baseDeal} />, { wrapper: TestProviders });
    expect(screen.getByText(/UZS/)).toBeTruthy();
  });

  it('renders contact reference when contactId present', () => {
    render(<DealCard deal={baseDeal} />, { wrapper: TestProviders });
    expect(screen.getByText(/Kontakt #7/)).toBeTruthy();
  });

  it('renders company reference when companyId present', () => {
    render(<DealCard deal={baseDeal} />, { wrapper: TestProviders });
    expect(screen.getByText(/Kompaniya #3/)).toBeTruthy();
  });

  it('calls onClick with id when card clicked', () => {
    const onClick = vi.fn();
    render(<DealCard deal={baseDeal} onClick={onClick} />, { wrapper: TestProviders });
    fireEvent.click(screen.getByTestId('card-deal-42'));
    expect(onClick).toHaveBeenCalledWith(42);
  });

  it('does not call onClick when dragging is true', () => {
    const onClick = vi.fn();
    render(
      <DealCard deal={baseDeal} onClick={onClick} isDragging={true} />,
      { wrapper: TestProviders },
    );
    fireEvent.click(screen.getByTestId('card-deal-42'));
    expect(onClick).not.toHaveBeenCalled();
  });
});
