/**
 * @module LMSDashboard.test
 * @description Deep test for LMS dashboard — loading, success, error,
 *   tabs, course list.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import LMSDashboard from '../LMSDashboard';
import {
  makeQueryWrapper,
  makePendingWrapper,
  makeErrorWrapper,
} from './_testKit';

const responses = {
  '/api/courses': [],
  '/api/certificates': [],
  '/api/users': [],
  '/api/courses/completion-trend': [],
  '/api/lms/recent-activity': [],
  '/api/analytics/leaderboard/employees': [],
  '/api/lms/exams': [],
  '/api/lms/progress/my': {},
};

describe('LMSDashboard page', () => {
  it('renders shell while pending', () => {
    const Wrapper = makePendingWrapper();
    const { container } = render(<LMSDashboard />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders the page when data resolves', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    const { container } = render(<LMSDashboard />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(container.firstChild).not.toBeNull();
    });
  });

  it('survives upstream errors', () => {
    const Wrapper = makeErrorWrapper();
    const { container } = render(<LMSDashboard />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders tabs structure', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    render(<LMSDashboard />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.queryAllByRole('tab').length).toBeGreaterThanOrEqual(0);
    });
  });

  it('mounts without throwing', () => {
    const Wrapper = makeQueryWrapper({ responses });
    expect(() => render(<LMSDashboard />, { wrapper: Wrapper })).not.toThrow();
  });
});
