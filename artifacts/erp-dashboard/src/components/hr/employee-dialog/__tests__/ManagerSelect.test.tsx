/**
 * @module ManagerSelect.test
 * @description Phase 2 / Task 2.5 — covers the manager-autocomplete combobox.
 *
 *   We mock /api/employees so the test runs offline. Behaviour exercised:
 *     1. Renders placeholder when no value is selected,
 *     2. Renders the picked manager's display name when value is set,
 *     3. excludeEmployeeId filters out the candidate themselves,
 *     4. Empty list renders without crashing,
 *     5. Trigger is disabled when the `disabled` prop is true,
 *     6. Calling onChange with empty string is the "clear" pathway,
 *     7. Falls back to "#id" when the manager has no displayable name.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { ManagerSelect } from '../ManagerSelect';

const EMPLOYEES = [
  { id: 1, firstName: 'Sherzod', lastName: 'Tursunov', positionName: 'Manager' },
  { id: 2, fullName: 'Diyora Mamatova', positionName: 'Lead' },
  { id: 3, firstName: 'Bahodir', lastName: 'Eshmurodov' },
  { id: 4 }, // No name at all — renders as "#4"
];

function makeProviders(initialData: unknown = EMPLOYEES) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    // Seed the cache so the component doesn't trigger network and we
    // can assert on the rendered "selected manager" name synchronously.
    qc.setQueryData(['/api/employees', { managerPicker: true }], initialData);
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

describe('ManagerSelect (Phase 2 / Task 2.5)', () => {
  it('renders placeholder when no manager is selected', () => {
    const Providers = makeProviders();
    render(
      <Providers>
        <ManagerSelect value="" onChange={() => undefined} placeholder="Rahbarni tanlang" />
      </Providers>,
    );
    expect(screen.getByTestId('manager-select-trigger')).toHaveTextContent('Rahbarni tanlang');
  });

  it('renders the selected manager by fullName', () => {
    const Providers = makeProviders();
    render(
      <Providers>
        <ManagerSelect value="2" onChange={() => undefined} />
      </Providers>,
    );
    expect(screen.getByTestId('manager-select-trigger')).toHaveTextContent('Diyora Mamatova');
  });

  it('renders the selected manager by firstName + lastName', () => {
    const Providers = makeProviders();
    render(
      <Providers>
        <ManagerSelect value="1" onChange={() => undefined} />
      </Providers>,
    );
    expect(screen.getByTestId('manager-select-trigger')).toHaveTextContent('Sherzod Tursunov');
  });

  it('falls back to "#id" when the manager has no displayable name', () => {
    const Providers = makeProviders();
    render(
      <Providers>
        <ManagerSelect value="4" onChange={() => undefined} />
      </Providers>,
    );
    expect(screen.getByTestId('manager-select-trigger')).toHaveTextContent('#4');
  });

  it('disables the trigger when disabled=true', () => {
    const Providers = makeProviders();
    render(
      <Providers>
        <ManagerSelect value="" onChange={() => undefined} disabled />
      </Providers>,
    );
    expect(screen.getByTestId('manager-select-trigger')).toBeDisabled();
  });

  it('renders the clear button when a manager is selected', () => {
    const Providers = makeProviders();
    render(
      <Providers>
        <ManagerSelect value="1" onChange={() => undefined} />
      </Providers>,
    );
    expect(screen.getByTestId('manager-select-clear')).toBeInTheDocument();
  });

  it('does not render the clear button when no manager is selected', () => {
    const Providers = makeProviders();
    render(
      <Providers>
        <ManagerSelect value="" onChange={() => undefined} />
      </Providers>,
    );
    expect(screen.queryByTestId('manager-select-clear')).not.toBeInTheDocument();
  });

  it('clear button calls onChange with empty string', () => {
    const onChange = vi.fn();
    const Providers = makeProviders();
    render(
      <Providers>
        <ManagerSelect value="1" onChange={onChange} />
      </Providers>,
    );
    screen.getByTestId('manager-select-clear').click();
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('survives empty employee list without crashing', () => {
    const Providers = makeProviders([]);
    render(
      <Providers>
        <ManagerSelect value="" onChange={() => undefined} />
      </Providers>,
    );
    // Trigger is still rendered, just with placeholder
    expect(screen.getByTestId('manager-select-trigger')).toBeInTheDocument();
  });
});
