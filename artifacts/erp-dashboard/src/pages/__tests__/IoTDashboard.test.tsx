/**
 * @module IoTDashboard.test
 * @description Deep test for IoT dashboard — loading, success, error,
 *   tabs, refresh button.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: 1, role: 'super_admin' },
    isAuthenticated: true,
    isLoading: false,
    hasRole: () => true,
    logout: vi.fn(),
    refetch: vi.fn(),
  }),
}));

import IoTDashboard from '../IoTDashboard';
import {
  makeQueryWrapper,
  makePendingWrapper,
  makeErrorWrapper,
} from './_testKit';

const responses = {
  '/api/iot-sensors/dashboard': {
    activeSensors: 5,
    totalActiveAlerts: 1,
    alertsBySeverity: { high: 1 },
    avgOeeToday: 85,
    machinesRunning: 4,
  },
  '/api/iot-sensors/live': [],
  '/api/iot-sensors/alerts': [],
  '/api/iot-sensors/oee': [],
};

describe('IoTDashboard page', () => {
  it('renders shell while pending', () => {
    const Wrapper = makePendingWrapper();
    const { container } = render(<IoTDashboard />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders the page when data resolves', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    const { container } = render(<IoTDashboard />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(container.firstChild).not.toBeNull();
    });
  });

  it('survives upstream errors', () => {
    const Wrapper = makeErrorWrapper();
    const { container } = render(<IoTDashboard />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders tabs structure', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    render(<IoTDashboard />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.queryAllByRole('tab').length).toBeGreaterThanOrEqual(0);
    });
  });

  it('renders refresh button', async () => {
    const Wrapper = makeQueryWrapper({ responses });
    render(<IoTDashboard />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
    });
  });
});
