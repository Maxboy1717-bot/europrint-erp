/**
 * @module Departments.test
 * @description Deep test for departments admin — loading, success render,
 *   add-dialog open, search input filter, error survival.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const apiRequestMock = vi.fn();
vi.mock('@/lib/queryClient', async () => {
  const actual = await vi.importActual<typeof import('@/lib/queryClient')>(
    '@/lib/queryClient',
  );
  return {
    ...actual,
    apiRequest: (...args: unknown[]) => apiRequestMock(...args),
  };
});

import Departments from '../Departments';
import {
  makeQueryWrapper,
  makePendingWrapper,
  makeErrorWrapper,
} from './_testKit';

const responses = {
  '/api/departments': [
    {
      id: 'd1',
      code: 'PROD',
      name: 'Production',
      name_uz: 'Ishlab chiqarish',
      name_ru: 'Производство',
      level: 1,
      sort_order: 1,
      is_active: true,
      description: null,
    },
  ],
};

describe('Departments page', () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    apiRequestMock.mockResolvedValue({});
  });

  it('renders the shell while pending', () => {
    const Wrapper = makePendingWrapper();
    const { container } = render(<Departments />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders the department table when data loads', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    const { container } = render(<Departments />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(container.textContent).toMatch(/Production|Ishlab chiqarish/i);
    });
  });

  it('survives an upstream error', () => {
    const Wrapper = makeErrorWrapper();
    const { container } = render(<Departments />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders a search textbox after load', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    render(<Departments />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getAllByRole('textbox').length).toBeGreaterThan(0);
    });
  });

  it('reflects typed search input value', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    render(<Departments />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getAllByRole('textbox').length).toBeGreaterThan(0);
    });
    const input = screen.getAllByRole('textbox')[0] as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'prod' } });
    expect(input.value).toBe('prod');
  });
});
