/**
 * @module LeadCard.test
 * @description Component tests for LeadCard — title, full name, phone display,
 * onClick callback, company info, dragging state.
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

import { LeadCard } from '../LeadCard';

const baseLead = {
  id: 101,
  title: 'New deal opportunity',
  name: 'Alisher',
  lastName: 'Karimov',
  companyTitle: 'EuroPrint LLC',
  statusId: 'NEW',
  phones: [{ value: '+998901234567', type: 'mobile' }],
  emails: [{ value: 'a@e.uz', type: 'work' }],
  sourceId: 'website',
  assignedById: 'u-1',
  dateCreate: '2025-05-01T10:00:00Z',
};

describe('LeadCard', () => {
  it('renders lead title when prop provided', () => {
    render(<LeadCard lead={baseLead} />, { wrapper: TestProviders });
    expect(screen.getByText('New deal opportunity')).toBeTruthy();
  });

  it('renders lead id badge when prop provided', () => {
    render(<LeadCard lead={baseLead} />, { wrapper: TestProviders });
    expect(screen.getByText('#101')).toBeTruthy();
  });

  it('shows joined full name when first and last name provided', () => {
    render(<LeadCard lead={baseLead} />, { wrapper: TestProviders });
    expect(screen.getByText('Alisher Karimov')).toBeTruthy();
  });

  it('shows primary phone when phones array has entry', () => {
    render(<LeadCard lead={baseLead} />, { wrapper: TestProviders });
    expect(screen.getByText('+998901234567')).toBeTruthy();
  });

  it('renders company title when present', () => {
    render(<LeadCard lead={baseLead} />, { wrapper: TestProviders });
    expect(screen.getByText('EuroPrint LLC')).toBeTruthy();
  });

  it('calls onClick with id when card is clicked', () => {
    const onClick = vi.fn();
    render(
      <LeadCard lead={baseLead} onClick={onClick} />,
      { wrapper: TestProviders },
    );
    fireEvent.click(screen.getByTestId('card-lead-101'));
    expect(onClick).toHaveBeenCalledWith(101);
  });

  it('does not call onClick when isDragging is true', () => {
    const onClick = vi.fn();
    render(
      <LeadCard lead={baseLead} onClick={onClick} isDragging={true} />,
      { wrapper: TestProviders },
    );
    fireEvent.click(screen.getByTestId('card-lead-101'));
    expect(onClick).not.toHaveBeenCalled();
  });
});
